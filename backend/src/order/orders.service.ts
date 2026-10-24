import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { CreateOrderDto } from "../../../src/orders/dto/create-order.dto";
import { PricingService } from "./pricing.service";
import { assertTransition, OrderState } from "./order-logic";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  // Tạo đơn hàng và lưu các món trong cùng một transaction.
  async create(userId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;

      const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      for (const item of dto.items) {
        const result = await this.pricingService.calculateItem(tx, item);

        subtotal += result.lineTotal;

        orderItems.push({
          product: {
            connect: { id: result.product.id },
          },
          size: item.size,
          qty: item.qty,
          unitPrice: result.unitPrice,
          lineTotal: result.lineTotal,
          toppings: {
            create: result.toppings.map((topping) => ({
              topping: {
                connect: { id: topping.id },
              },
              price: topping.price,
            })),
          },
        });
      }

      if (!Number.isSafeInteger(subtotal) || subtotal < 0) {
        throw new BadRequestException("Tổng tiền không hợp lệ");
      }

      const order = await tx.order.create({
        data: {
          user: {
            connect: { id: userId },
          },
          subtotal,
          discountAmount: 0,
          total: subtotal,
          status: "PENDING",
          orderItems: {
            create: orderItems,
          },
        },
        select: {
          id: true,
          orderCode: true,
          status: true,
          total: true,
        },
      });

      return {
        orderCode: order.orderCode,
        status: order.status,
        total: Number(order.total),
      };
    });
  }

  // Lấy đơn hàng của người dùng đang đăng nhập.
  async mine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: {
            product: true,
            toppings: {
              include: {
                topping: true,
              },
            },
          },
        },
      },
    });
  }

  // Cập nhật trạng thái đơn hàng.
  async changeStatus(
    orderId: string,
    newStatus: "PREPARING" | "READY" | "COMPLETED",
    role: string,
  ) {
    if (role !== "ADMIN" && role !== "STAFF") {
      throw new ForbiddenException(
        "Bạn không có quyền cập nhật trạng thái đơn hàng",
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Không tìm thấy đơn hàng");
    }

    try {
      assertTransition(order.status as OrderState, newStatus);
    } catch {
      throw new BadRequestException(
        `Không thể chuyển trạng thái ${order.status} → ${newStatus}`,
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
  }

  // Người dùng chỉ được hủy đơn thuộc về mình.
  async cancel(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      throw new NotFoundException("Không tìm thấy đơn hàng");
    }

    try {
      assertTransition(order.status as OrderState, "CANCELLED");
    } catch {
      throw new BadRequestException("Đơn hàng hiện tại không thể hủy");
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  }
}
