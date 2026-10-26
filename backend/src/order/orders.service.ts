import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ProductsService } from '../products/products.service';
import type { CreateOrderDto, OrderItemDto } from './orders.controller';
import { assertTransition } from './order-state';


@Injectable()
export class PricingService {
    async calculateItem(tx: Prisma.TransactionClient, item: OrderItemDto) {
        if (!Number.isInteger(item.qty) || item.qty < 1) {
            throw new BadRequestException('Số lượng phải lớn hơn 0');
        }

        const product = await tx.product.findUnique({
            where: { id: item.productId },
        });
        if (!product || !product.isActive) {
            throw new BadRequestException('Sản phẩm không tồn tại hoặc ngừng bán');
        }

        const variant = await tx.productSizePrice.findUnique({
            where: {
                productId_size: { productId: item.productId, size: item.size },
            },
        });
        if (!variant) {
            throw new BadRequestException('Sản phẩm không hỗ trợ size này');
        }

        const toppingIds = item.toppingIds ?? [];
        if (new Set(toppingIds).size !== toppingIds.length) {
            throw new BadRequestException('Topping không được lặp lại');
        }

        const toppings = await tx.topping.findMany({
            where: { id: { in: toppingIds }, isActive: true },
        });
        if (toppings.length !== toppingIds.length) {
            throw new BadRequestException('Topping không tồn tại hoặc đã ngừng bán');
        }

        // Giá của product_size_prices là GIÁ ĐẦY ĐỦ, không phải phụ phí.
        const unitPrice = Number(variant.price) + toppings.reduce(
            (sum, topping) => sum + Number(topping.price), 0,
        );
        const lineTotal = unitPrice * item.qty;

        if (!Number.isSafeInteger(unitPrice) || !Number.isSafeInteger(lineTotal) || unitPrice < 0) {
            throw new BadRequestException('Giá sản phẩm không hợp lệ');
        }

        return { product, toppings, unitPrice, lineTotal };
    }
}

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pricingService: PricingService,
        private readonly productsService: ProductsService,
    ) {}

    async create(userId: string, dto: CreateOrderDto) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                let subtotal = 0;
                const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

                for (const item of dto.items) {
                    const result = await this.pricingService.calculateItem(tx, item);
                    await this.productsService.decreaseStock(item.productId, item.qty, tx);
                    subtotal += result.lineTotal;

                    orderItems.push({
                        product: { connect: { id: result.product.id } },
                        size: item.size,
                        qty: item.qty,
                        unitPrice: result.unitPrice,
                        lineTotal: result.lineTotal,
                        toppings: {
                            create: result.toppings.map((topping) => ({
                                topping: { connect: { id: topping.id } },
                                price: topping.price,
                            })),
                        },
                    });
                }

                if (!Number.isSafeInteger(subtotal) || subtotal <= 0) {
                    throw new BadRequestException('Tổng tiền không hợp lệ');
                }

                let couponId: string | undefined;
                let discountAmount = 0;
                if (dto.couponCode?.trim()) {
                    const coupon = await tx.coupon.findUnique({
                        where: { code: dto.couponCode.trim().toUpperCase() },
                    });
                    const now = new Date();
                    if (!coupon || !coupon.isActive ||
                        coupon.usedCount >= coupon.maxUses ||
                        coupon.validFrom > now || coupon.validTo <= now ||
                        subtotal < Number(coupon.minOrderValue)) {
                        throw new BadRequestException('Mã giảm giá không hợp lệ');
                    }
                    // Voucher đổi bằng điểm chỉ thuộc về đúng người đã đổi.
                    const ownedVoucher = await tx.userVoucher.findUnique({where: {couponId: coupon.id}});
                    if (ownedVoucher && (ownedVoucher.userId !== userId || ownedVoucher.usedAt)) {
                        throw new BadRequestException('Voucher không thuộc tài khoản hoặc đã sử dụng');
                    }
                    couponId = coupon.id;
                    discountAmount = coupon.discountType === 'PERCENT'
                        ? Math.round(subtotal * Number(coupon.discountValue) / 100)
                        : Number(coupon.discountValue);
                    discountAmount = Math.min(discountAmount, subtotal);
                }

                const pointsUsed = dto.pointsToUse ?? 0;
                if (!Number.isInteger(pointsUsed) || pointsUsed < 0) {
                    throw new BadRequestException('Số điểm không hợp lệ');
                }
                if (pointsUsed > 0) {
                    const user = await tx.user.findUnique({ where: { id: userId } });
                    if (!user || user.loyaltyPoints < pointsUsed) {
                        throw new BadRequestException('Không đủ điểm tích lũy');
                    }
                }

                // Quy ước demo nhất quán UI: 1 điểm = 500 đồng.
                const pointsDiscount = pointsUsed * 500;
                if (discountAmount + pointsDiscount > subtotal) {
                    throw new BadRequestException('Số tiền giảm vượt quá tiền hàng');
                }

                const order = await tx.order.create({
                    data: {
                        user: { connect: { id: userId } },
                        ...(couponId ? { coupon: { connect: { id: couponId } } } : {}),
                        subtotal,
                        discountAmount,
                        pointsUsed,
                        pointsDiscount,
                        total: subtotal - discountAmount - pointsDiscount,
                        status: OrderStatus.PENDING,
                        statusHistory: { create: { toStatus: OrderStatus.PENDING } },
                        orderItems: { create: orderItems },
                    },
                    select: { id: true, orderCode: true, status: true, total: true },
                });



                return {
                    id: order.id,
                    orderCode: order.orderCode,
                    status: order.status,
                    total: Number(order.total),
                };
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error: any) {
            if (error?.code === 'P2034') {
                throw new ConflictException('Có đơn đặt cùng lúc, vui lòng thử lại');
            }
            throw error;
        }
    }

    async mine(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { fullName: true, phone: true } },
                coupon: { select: { code: true } },
                payments: {
                    orderBy: { createdAt: 'desc' },
                },
                statusHistory: { orderBy: { changedAt: 'asc' } },
                orderItems: {
                    include: {
                        product: true,
                        toppings: { include: { topping: true } },
                    },
                },
            },
        });
    }

    async changeStatus(
        orderId: string,
        newStatus: 'PREPARING' | 'READY' | 'COMPLETED',
        role: string,
    ) {
        if (role !== 'ADMIN' && role !== 'STAFF') {
            throw new ForbiddenException('Bạn không có quyền cập nhật đơn hàng');
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({ where: { id: orderId } });
                if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
                assertTransition(order.status, newStatus);

                const updated = await tx.order.updateMany({
                    where: { id: orderId, status: order.status },
                    data: { status: newStatus },
                });
                if (updated.count !== 1) {
                    throw new ConflictException('Trạng thái đơn đã bị thay đổi');
                }

                await tx.orderStatusHistory.create({
                    data: { orderId, fromStatus: order.status, toStatus: newStatus },
                });
                return tx.order.findUniqueOrThrow({ where: { id: orderId } });
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error: any) {
            if (error?.code === 'P2034') {
                throw new ConflictException('Đơn đã thay đổi, vui lòng thử lại');
            }
            throw error;
        }
    }

    async cancel(orderId: string, userId: string) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const order = await tx.order.findFirst({ where: { id: orderId, userId } });
                if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

                // Hủy sau thanh toán cần mock-refund; chưa tự động hoàn tiền.
                if (order.status !== OrderStatus.PENDING &&
                    order.status !== OrderStatus.PAYMENT_FAILED) {
                    throw new BadRequestException('Đơn đã thanh toán cần xử lý hoàn tiền riêng');
                }
                assertTransition(order.status, OrderStatus.CANCELLED);

                const updated = await tx.order.updateMany({
                    where: { id: orderId, userId, status: order.status },
                    data: { status: OrderStatus.CANCELLED },
                });
                if (updated.count !== 1) {
                    throw new ConflictException('Trạng thái đơn đã bị thay đổi');
                }

                const items = await tx.orderItem.findMany({ where: { orderId } });
                for (const item of items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { increment: item.qty },
                            version: { increment: 1 },
                        },
                    });
                }

                await tx.orderStatusHistory.create({
                    data: { orderId, fromStatus: order.status, toStatus: OrderStatus.CANCELLED },
                });
                return tx.order.findUniqueOrThrow({ where: { id: orderId } });
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error: any) {
            if (error?.code === 'P2034') {
                throw new ConflictException('Đơn đang được xử lý, vui lòng thử lại');
            }
            throw error;
        }
    }
}
