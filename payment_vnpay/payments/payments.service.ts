import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { assertTransition } from "../order/order-state";
import type { PaymentDto } from "./payments.controller";
import { VnpayService } from "./vnpay.service";
import { randomUUID } from "node:crypto";
import { Request } from "express";

// Kiểu dữ liệu trả về khi lấy Payment kèm Order.
type PaymentWithOrder = Prisma.PaymentGetPayload<{
  include: { order: true };
}>;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vnpayService: VnpayService,
  ) {}

  // Cùng Idempotency-Key chỉ được dùng cho cùng một yêu cầu thanh toán.
  private getReplay(
    payment: PaymentWithOrder,
    userId: string,
    dto: PaymentDto,
  ) {
    const expectedStatus =
      dto.simulateFailure === true
        ? PaymentStatus.FAILED
        : PaymentStatus.SUCCESS;
    if (
      payment.orderId !== dto.orderId ||
      payment.order.userId !== userId ||
      payment.method !== dto.method ||
      payment.status !== expectedStatus
    ) {
      throw new ConflictException(
        "Idempotency-Key đã sử dụng cho yêu cầu khác",
      );
    }
    return { replay: true, order: payment.order, payment };
  }

  async pay(userId: string, key: string | undefined, dto: PaymentDto) {
    const idempotencyKey = key?.trim();
    if (
      !idempotencyKey ||
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 128
    ) {
      throw new BadRequestException("Idempotency-Key phải dài 8–128 ký tự");
    }

    // Request lặp: trả giao dịch đã lưu, không cộng/trừ điểm lần hai.
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: { order: true },
    });
    if (existing) return this.getReplay(existing, userId, dto);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // Kiểm tra lại bên trong transaction để tránh xử lý trùng.
          const replay = await tx.payment.findUnique({
            where: { idempotencyKey },
            include: { order: true },
          });
          if (replay) return this.getReplay(replay, userId, dto);

          const order = await tx.order.findUnique({
            where: { id: dto.orderId },
          });
          if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
          if (order.userId !== userId) {
            throw new ForbiddenException(
              "Không thể thanh toán đơn của người khác",
            );
          }
          if (order.expiresAt.getTime() <= Date.now()) {
            throw new BadRequestException(
              "Đơn hàng đã hết thời gian thanh toán",
            );
          }

          const targetStatus =
            dto.simulateFailure === true
              ? OrderStatus.PAYMENT_FAILED
              : OrderStatus.PAID;
          let currentStatus = order.status;

          // Trả về PENDING trước khi thử thanh toán lại.
          if (currentStatus === OrderStatus.PAYMENT_FAILED) {
            assertTransition(currentStatus, OrderStatus.PENDING);
            const retry = await tx.order.updateMany({
              where: { id: order.id, status: currentStatus },
              data: { status: OrderStatus.PENDING },
            });
            if (retry.count !== 1) {
              throw new ConflictException("Đơn hàng đã thay đổi trạng thái");
            }
            await tx.orderStatusHistory.create({
              data: {
                orderId: order.id,
                fromStatus: currentStatus,
                toStatus: OrderStatus.PENDING,
              },
            });
            currentStatus = OrderStatus.PENDING;
          }

          if (currentStatus === OrderStatus.CANCELLED) {
            throw new ConflictException("Đơn đã hủy, không thể thanh toán");
          }
          if (
            currentStatus === OrderStatus.PAID ||
            currentStatus === OrderStatus.PREPARING ||
            currentStatus === OrderStatus.READY ||
            currentStatus === OrderStatus.COMPLETED
          ) {
            throw new ConflictException(
              "Đơn đã thanh toán, không thể thanh toán lần hai",
            );
          }

          assertTransition(currentStatus, targetStatus);
          const updated = await tx.order.updateMany({
            where: { id: order.id, status: currentStatus },
            data: { status: targetStatus },
          });
          if (updated.count !== 1) {
            throw new ConflictException("Đơn hàng đã được xử lý");
          }
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: currentStatus,
              toStatus: targetStatus,
            },
          });

          if (targetStatus === OrderStatus.PAID && order.couponId) {
            const coupon = await tx.coupon.findUniqueOrThrow({
              where: { id: order.couponId },
            });
            const now = new Date();
            const used = await tx.coupon.updateMany({
              where: {
                id: coupon.id,
                isActive: true,
                usedCount: { lt: coupon.maxUses },
                validFrom: { lte: now },
                validTo: { gt: now },
                minOrderValue: { lte: order.subtotal },
              },
              data: { usedCount: { increment: 1 } },
            });
            if (used.count !== 1) {
              throw new ConflictException(
                "Mã giảm giá đã hết hạn hoặc hết lượt",
              );
            }

            const owned = await tx.userVoucher.findUnique({
              where: {
                userId_couponId: {
                  userId,
                  couponId: coupon.id,
                },
              },
            });

            if (owned) {
              const consumed = await tx.userVoucher.updateMany({
                where: {
                  id: owned.id,
                  userId,
                  usedAt: null,
                  usedOrderId: null,
                },
                data: {
                  usedAt: now,
                  usedOrderId: order.id,
                },
              });

              if (consumed.count !== 1) {
                throw new ConflictException("Voucher đã được sử dụng");
              }
            } else {
              // Không cho dùng voucher cá nhân của người khác.
              const privateVoucher = await tx.userVoucher.findFirst({
                where: { couponId: coupon.id },
                select: { id: true },
              });

              if (privateVoucher) {
                throw new ForbiddenException("Voucher không thuộc tài khoản");
              }
            }
          }

          // Điểm chỉ trừ sau khi thanh toán THÀNH CÔNG.
          if (targetStatus === OrderStatus.PAID && order.pointsUsed > 0) {
            const deducted = await tx.user.updateMany({
              where: { id: userId, loyaltyPoints: { gte: order.pointsUsed } },
              data: { loyaltyPoints: { decrement: order.pointsUsed } },
            });
            if (deducted.count !== 1) {
              throw new ConflictException("Không đủ điểm thưởng để thanh toán");
            }
            await tx.loyaltyTransaction.create({
              data: {
                userId,
                orderId: order.id,
                points: order.pointsUsed,
                type: "REDEEM",
              },
            });
          }

          const payment = await tx.payment.create({
            data: {
              orderId: order.id,
              idempotencyKey,
              amount: order.total,
              method: dto.method,
              status:
                dto.simulateFailure === true
                  ? PaymentStatus.FAILED
                  : PaymentStatus.SUCCESS,
            },
          });

          // EARN chỉ ghi khi đơn chuyển READY -> COMPLETED
          // trong OrdersService.changeStatus().

          const savedOrder = await tx.order.findUniqueOrThrow({
            where: { id: order.id },
          });
          return { replay: false, order: savedOrder, payment, earnedPoints: 0 };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error: any) {
      // Nếu request khác đã commit cùng key, trả kết quả cũ.
      if (error?.code === "P2002" || error?.code === "P2034") {
        const replay = await this.prisma.payment.findUnique({
          where: { idempotencyKey },
          include: { order: true },
        });
        if (replay) return this.getReplay(replay, userId, dto);
        throw new ConflictException(
          "Thanh toán đang được xử lý, vui lòng thử lại",
        );
      }
      throw error;
    }
  }

  // ====================================================
  // CREATE VNPAY PAYMENT
  // ====================================================

  async createVnpay(
    userId: string,
    key: string | undefined,
    orderId: string,
    req: Request,
  ) {
    const idempotencyKey = key?.trim();

    if (
      !idempotencyKey ||
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 128
    ) {
      throw new BadRequestException("Idempotency-Key phải dài 8–128 ký tự");
    }

    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: { order: true },
    });

    if (existing) {
      if (
        existing.orderId !== orderId ||
        existing.order.userId !== userId ||
        existing.method !== "VNPAY"
      ) {
        throw new ConflictException(
          "Idempotency-Key đã sử dụng cho yêu cầu khác",
        );
      }

      if (existing.status === PaymentStatus.SUCCESS) {
        throw new ConflictException("Đơn đã thanh toán");
      }

      if (existing.status === PaymentStatus.FAILED) {
        throw new ConflictException(
          "Giao dịch đã thất bại, hãy tạo key mới để thanh toán lại",
        );
      }

      // Payment PENDING đã có: dùng lại txnRef.
      return {
        paymentId: existing.id,
        orderId: existing.orderId,
        amount: Number(existing.amount),
        status: existing.status,
        paymentUrl: this.vnpayService.createPaymentUrl({
          txnRef: existing.providerRef!,
          amount: Number(existing.amount),
          orderInfo: `Thanh toan don ${existing.orderId}`,
          ipAddress: this.getClientIp(req),
        }),
      };
    }

    const payment = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
        });

        if (!order) {
          throw new NotFoundException("Không tìm thấy đơn hàng");
        }

        if (order.userId !== userId) {
          throw new ForbiddenException(
            "Không thể thanh toán đơn của người khác",
          );
        }

        if (order.expiresAt.getTime() <= Date.now()) {
          throw new BadRequestException("Đơn hàng đã hết thời gian thanh toán");
        }

        if (
          order.status !== OrderStatus.PENDING &&
          order.status !== OrderStatus.PAYMENT_FAILED
        ) {
          throw new ConflictException(
            "Trạng thái đơn không cho phép thanh toán",
          );
        }

        // Không cho phép đơn có giao dịch SUCCESS trước đó.
        const successfulPayment = await tx.payment.findFirst({
          where: {
            orderId,
            status: PaymentStatus.SUCCESS,
          },
        });

        if (successfulPayment) {
          throw new ConflictException(
            "Đơn đã có giao dịch thanh toán thành công",
          );
        }

        // PAYMENT_FAILED -> PENDING khi khách thử lại.
        if (order.status === OrderStatus.PAYMENT_FAILED) {
          assertTransition(order.status, OrderStatus.PENDING);

          await tx.order.updateMany({
            where: {
              id: order.id,
              status: OrderStatus.PAYMENT_FAILED,
            },
            data: {
              status: OrderStatus.PENDING,
            },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId,
              fromStatus: OrderStatus.PAYMENT_FAILED,
              toStatus: OrderStatus.PENDING,
            },
          });
        }

        // Mã tham chiếu duy nhất của VNPay.
        const txnRef = paymentTxnRef();

        return tx.payment.create({
          data: {
            orderId,
            idempotencyKey,
            amount: order.total,
            method: "VNPAY",
            status: PaymentStatus.PENDING,
            providerRef: txnRef,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    const paymentUrl = this.vnpayService.createPaymentUrl({
      txnRef: payment.providerRef!,
      amount: Number(payment.amount),
      orderInfo: `Thanh toan don ${payment.orderId}`,
      ipAddress: this.getClientIp(req),
    });

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: Number(payment.amount),
      status: payment.status,
      paymentUrl,
    };
  }

  private getClientIp(req: { ip?: string; headers: Record<string, any> }) {
    const forwarded = req.headers["x-forwarded-for"];

    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }

    return req.ip?.replace("::ffff:", "") || "127.0.0.1";
  }

  // ====================================================
  // VNPAY IPN
  // ====================================================

  async handleVnpayIpn(params: Record<string, string>) {
    // 1. Xác thực chữ ký trước khi đọc dữ liệu nghiệp vụ.
    if (!this.vnpayService.verifySignature(params)) {
      return {
        RspCode: "97",
        Message: "Invalid signature",
      };
    }

    const txnRef = params.vnp_TxnRef;
    const transactionNo = params.vnp_TransactionNo;
    const responseCode = params.vnp_ResponseCode;
    const amount = Number(params.vnp_Amount);

    if (!txnRef || !transactionNo || !responseCode) {
      return {
        RspCode: "99",
        Message: "Invalid request",
      };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { providerRef: txnRef },
      include: { order: true },
    });

    if (!payment || payment.method !== "VNPAY") {
      return {
        RspCode: "01",
        Message: "Order not found",
      };
    }

    // 2. Kiểm tra số tiền VNPay gửi về.
    const expectedAmount = Math.round(Number(payment.amount) * 100);

    if (amount !== expectedAmount) {
      return {
        RspCode: "04",
        Message: "Invalid amount",
      };
    }

    // 3. IPN lặp: không xử lý nghiệp vụ lần hai.
    if (payment.status === PaymentStatus.SUCCESS) {
      return {
        RspCode: "00",
        Message: "Confirm Success",
      };
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return {
        RspCode: "02",
        Message: "Payment already processed",
      };
    }

    // VNPay xác nhận giao dịch thất bại.
    if (responseCode !== "00") {
      await this.prisma.$transaction(
        async (tx) => {
          const current = await tx.payment.findUnique({
            where: { id: payment.id },
            include: { order: true },
          });

          if (!current || current.status !== PaymentStatus.PENDING) {
            return;
          }

          await tx.payment.update({
            where: { id: current.id },
            data: {
              status: PaymentStatus.FAILED,
              vnpResponseCode: responseCode,
              vnpTransactionNo: transactionNo,
              bankCode: params.vnp_BankCode ?? null,
            },
          });

          if (current.order.status === OrderStatus.PENDING) {
            assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED);

            await tx.order.update({
              where: { id: current.orderId },
              data: {
                status: OrderStatus.PAYMENT_FAILED,
              },
            });

            await tx.orderStatusHistory.create({
              data: {
                orderId: current.orderId,
                fromStatus: OrderStatus.PENDING,
                toStatus: OrderStatus.PAYMENT_FAILED,
              },
            });
          }
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        RspCode: "00",
        Message: "Confirm Success",
      };
    }

    try {
      await this.prisma.$transaction(
        async (tx) => {
          const currentPayment = await tx.payment.findUnique({
            where: { id: payment.id },
            include: { order: true },
          });

          if (!currentPayment) {
            throw new NotFoundException("Payment not found");
          }

          // Kiểm tra lại trong transaction để chống race condition.
          if (currentPayment.status === PaymentStatus.SUCCESS) {
            return;
          }

          if (currentPayment.status !== PaymentStatus.PENDING) {
            throw new ConflictException(
              "Payment không còn ở trạng thái PENDING",
            );
          }

          const order = currentPayment.order;

          if (
            order.status !== OrderStatus.PENDING &&
            order.status !== OrderStatus.PAYMENT_FAILED
          ) {
            throw new ConflictException("Order không thể chuyển sang PAID");
          }

          // Nếu đơn PAYMENT_FAILED, khôi phục PENDING trước.
          if (order.status === OrderStatus.PAYMENT_FAILED) {
            assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING);

            await tx.order.update({
              where: { id: order.id },
              data: { status: OrderStatus.PENDING },
            });

            await tx.orderStatusHistory.create({
              data: {
                orderId: order.id,
                fromStatus: OrderStatus.PAYMENT_FAILED,
                toStatus: OrderStatus.PENDING,
              },
            });
          }

          assertTransition(OrderStatus.PENDING, OrderStatus.PAID);

          // 4. Chuyển Payment SUCCESS.
          await tx.payment.update({
            where: { id: currentPayment.id },
            data: {
              status: PaymentStatus.SUCCESS,
              vnpTransactionNo: transactionNo,
              vnpResponseCode: responseCode,
              bankCode: params.vnp_BankCode ?? null,
              paidAt: new Date(),
            },
          });

          // 5. Chuyển Order PAID.
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.PAID },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: OrderStatus.PENDING,
              toStatus: OrderStatus.PAID,
            },
          });

          // 6. Coupon / voucher.
          // Giữ nguyên logic của PaymentsService.pay().
          if (order.couponId) {
            const coupon = await tx.coupon.findUniqueOrThrow({
              where: { id: order.couponId },
            });

            const now = new Date();

            const used = await tx.coupon.updateMany({
              where: {
                id: coupon.id,
                isActive: true,
                usedCount: { lt: coupon.maxUses },
                validFrom: { lte: now },
                validTo: { gt: now },
                minOrderValue: { lte: order.subtotal },
              },
              data: {
                usedCount: { increment: 1 },
              },
            });

            if (used.count !== 1) {
              throw new ConflictException(
                "Mã giảm giá đã hết hạn hoặc hết lượt",
              );
            }

            const owned = await tx.userVoucher.findUnique({
              where: {
                userId_couponId: {
                  userId: order.userId,
                  couponId: coupon.id,
                },
              },
            });

            if (owned) {
              const consumed = await tx.userVoucher.updateMany({
                where: {
                  id: owned.id,
                  userId: order.userId,
                  usedAt: null,
                  usedOrderId: null,
                },
                data: {
                  usedAt: now,
                  usedOrderId: order.id,
                },
              });

              if (consumed.count !== 1) {
                throw new ConflictException("Voucher đã được sử dụng");
              }
            } else {
              const privateVoucher = await tx.userVoucher.findFirst({
                where: { couponId: coupon.id },
                select: { id: true },
              });

              if (privateVoucher) {
                throw new ForbiddenException("Voucher không thuộc tài khoản");
              }
            }
          }

          // 7. Trừ loyalty points.
          if (order.pointsUsed > 0) {
            const deducted = await tx.user.updateMany({
              where: {
                id: order.userId,
                loyaltyPoints: {
                  gte: order.pointsUsed,
                },
              },
              data: {
                loyaltyPoints: {
                  decrement: order.pointsUsed,
                },
              },
            });

            if (deducted.count !== 1) {
              throw new ConflictException("Không đủ điểm thưởng để thanh toán");
            }

            await tx.loyaltyTransaction.create({
              data: {
                userId: order.userId,
                orderId: order.id,
                points: order.pointsUsed,
                type: "REDEEM",
              },
            });
          }
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        RspCode: "00",
        Message: "Confirm Success",
      };
    } catch (error) {
      console.error("VNPay IPN error:", error);

      return {
        RspCode: "99",
        Message: "Unknown error",
      };
    }
  }

  // ====================================================
  // VNPAY RETURN
  // ====================================================

  async handleVnpayReturn(params: Record<string, string>) {
    if (!this.vnpayService.verifySignature(params)) {
      return {
        valid: false,
        message: "Chữ ký VNPay không hợp lệ",
      };
    }

    const payment = await this.prisma.payment.findUnique({
      where: {
        providerRef: params.vnp_TxnRef,
      },
      select: {
        orderId: true,
        status: true,
        amount: true,
      },
    });

    if (!payment) {
      return {
        valid: false,
        message: "Không tìm thấy giao dịch",
      };
    }

    return {
      valid: true,
      orderId: payment.orderId,
      amount: Number(payment.amount),
      paymentStatus: payment.status,
      vnpResponseCode: params.vnp_ResponseCode,
      message:
        payment.status === PaymentStatus.SUCCESS
          ? "Thanh toán thành công"
          : "Đang xác nhận hoặc thanh toán thất bại",
    };
  }

  // ====================================================
  // VNPAY STATUS
  // ====================================================

  async getVnpayStatus(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        payments: {
          where: {
            method: "VNPAY",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException("Không tìm thấy đơn hàng");
    }

    return {
      orderId: order.id,
      orderStatus: order.status,
      payment: order.payments[0] ?? null,
    };
  }
}

function paymentTxnRef() {
  return randomUUID().replace(/-/g, "");
}
