import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { OrderStatus, Prisma } from "@prisma/client";

import { PrismaService } from "../prisma.service";
import { assertTransition } from "../orders/order-logic";
import type { PaymentDto } from "./payments.controller";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async pay(userId: string, key: string, dto: PaymentDto) {
    // BƯỚC 1: Kiểm tra Idempotency-Key.
    if (!key || key.length < 8 || key.length > 128) {
      throw new BadRequestException("Idempotency-Key phải dài 8–128 ký tự");
    }

    // BƯỚC 2: Kiểm tra xem khóa đã được sử dụng chưa.
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: key },
      include: { order: true },
    });

    if (existing) {
      const sameRequest =
        existing.orderId === dto.orderId &&
        existing.order.userId === userId &&
        existing.method === dto.method &&
        existing.status === (dto.simulateFailure ? "FAILED" : "SUCCESS");

      if (!sameRequest) {
        throw new ConflictException(
          "Idempotency-Key đã dùng cho một yêu cầu khác",
        );
      }

      // Yêu cầu giống lần trước: trả kết quả cũ.
      return {
        replay: true,
        order: existing.order,
        payment: existing,
      };
    }

    try {
      // BƯỚC 3: Thực hiện các thao tác DB trong một transaction.
      return await this.prisma.$transaction(
        async (tx) => {
          // Kiểm tra lại khóa bên trong transaction để
          // hạn chế việc hai request cùng xử lý một khóa.
          const replay = await tx.payment.findUnique({
            where: { idempotencyKey: key },
            include: { order: true },
          });

          if (replay) {
            const sameRequest =
              replay.orderId === dto.orderId &&
              replay.order.userId === userId &&
              replay.method === dto.method &&
              replay.status === (dto.simulateFailure ? "FAILED" : "SUCCESS");

            if (!sameRequest) {
              throw new ConflictException(
                "Idempotency-Key đã dùng cho một yêu cầu khác",
              );
            }

            return {
              replay: true,
              order: replay.order,
              payment: replay,
            };
          }

          // BƯỚC 4: Tìm đơn hàng cần thanh toán.
          const order = await tx.order.findUnique({
            where: { id: dto.orderId },
          });

          if (!order) {
            throw new NotFoundException("Không tìm thấy đơn");
          }

          // BƯỚC 5: Đảm bảo người dùng sở hữu đơn hàng.
          if (order.userId !== userId) {
            throw new ForbiddenException(
              "Không thể thanh toán đơn của người khác",
            );
          }

          // BƯỚC 6: Xác định trạng thái sau khi thanh toán.
          const targetStatus = dto.simulateFailure
            ? OrderStatus.PAYMENT_FAILED
            : OrderStatus.PAID;

          let currentStatus = order.status;

          // Cho phép thử thanh toán lại khi lần trước thất bại.
          if (currentStatus === OrderStatus.PAYMENT_FAILED) {
            assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING);

            const retry = await tx.order.updateMany({
              where: {
                id: order.id,
                status: OrderStatus.PAYMENT_FAILED,
              },
              data: {
                status: OrderStatus.PENDING,
              },
            });

            if (retry.count !== 1) {
              throw new ConflictException("Đơn đã thay đổi trạng thái");
            }

            currentStatus = OrderStatus.PENDING;
          }

          // Kiểm tra chuyển trạng thái có hợp lệ không.
          try {
            assertTransition(currentStatus, targetStatus);
          } catch {
            throw new BadRequestException(
              `Không thể thanh toán đơn đang ở trạng thái ${order.status}`,
            );
          }

          // Cập nhật có điều kiện để tránh hai request
          // cùng chuyển trạng thái của một đơn.
          const changed = await tx.order.updateMany({
            where: {
              id: order.id,
              status: currentStatus,
            },
            data: {
              status: targetStatus,
            },
          });

          if (changed.count !== 1) {
            throw new ConflictException("Đơn đã được xử lý, vui lòng tải lại");
          }

          // BƯỚC 7: Nếu thanh toán thành công,
          // ghi nhận lượt sử dụng voucher.
          if (targetStatus === OrderStatus.PAID && order.couponId) {
            const coupon = await tx.coupon.findUniqueOrThrow({
              where: { id: order.couponId },
            });

            const now = new Date();

            const result = await tx.coupon.updateMany({
              where: {
                id: coupon.id,
                isActive: true,
                usedCount: { lt: coupon.maxUses },
                validFrom: { lte: now },
                validTo: { gt: now },
              },
              data: {
                usedCount: { increment: 1 },
              },
            });

            if (result.count !== 1) {
              throw new ConflictException(
                "Voucher hết hạn hoặc đã hết lượt sử dụng",
              );
            }
          }

          // BƯỚC 8: Lưu bản ghi thanh toán.
          const payment = await tx.payment.create({
            data: {
              orderId: order.id,
              idempotencyKey: key,
              amount: order.total,
              method: dto.method,
              status: dto.simulateFailure ? "FAILED" : "SUCCESS",
            },
          });

          // BƯỚC 9: Cộng điểm nếu thanh toán thành công.
          const earnedPoints =
            targetStatus === OrderStatus.PAID
              ? Math.floor(Number(order.total) / 10000)
              : 0;

          if (earnedPoints > 0) {
            await tx.user.update({
              where: { id: userId },
              data: {
                loyaltyPoints: {
                  increment: earnedPoints,
                },
              },
            });

            await tx.loyaltyTransaction.create({
              data: {
                userId,
                orderId: order.id,
                points: earnedPoints,
                type: "EARN",
              },
            });
          }

          // BƯỚC 10: Lấy đơn sau khi cập nhật để trả về.
          const updatedOrder = await tx.order.findUniqueOrThrow({
            where: { id: order.id },
          });

          return {
            replay: false,
            order: updatedOrder,
            payment,
            earnedPoints,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error: any) {
      // P2002: vi phạm unique constraint.
      // P2034: transaction gặp xung đột cần xử lý lại.
      if (error?.code === "P2002" || error?.code === "P2034") {
        const replay = await this.prisma.payment.findUnique({
          where: { idempotencyKey: key },
          include: { order: true },
        });

        // Nếu request khác đã lưu thanh toán bằng khóa này,
        // chỉ trả lại kết quả khi đó thực sự là cùng yêu cầu.
        if (replay) {
          const sameRequest =
            replay.orderId === dto.orderId &&
            replay.order.userId === userId &&
            replay.method === dto.method &&
            replay.status === (dto.simulateFailure ? "FAILED" : "SUCCESS");

          if (!sameRequest) {
            throw new ConflictException("Khóa thanh toán không khớp yêu cầu");
          }

          return {
            replay: true,
            order: replay.order,
            payment: replay,
          };
        }

        throw new ConflictException(
          "Thanh toán đang được xử lý, vui lòng thử lại với cùng khóa",
        );
      }

      // Lỗi khác: chuyển tiếp cho NestJS xử lý.
      throw error;
    }
  }
}
