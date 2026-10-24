import {
    BadRequestException, ConflictException, ForbiddenException,
    Injectable, NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { CreateOrderDto } from './orders.controller';
import { PricingService } from './pricing.service';
import { assertTransition, OrderState } from './order-logic';

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pricing: PricingService,
    ) {}

    async create(userId: string, dto: CreateOrderDto) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                let subtotal = 0;
                const items: {
                    productId: string; size: 'S' | 'M' | 'L'; qty: number;
                    unitPrice: number; lineTotal: number;
                    toppings: { id: string; price: number }[];
                }[] = [];

                for (const item of dto.items) {
                    const price = await this.pricing.calculateItem(tx, item);
                    // Chống 2 khách cùng mua vượt tồn kho (optimistic locking).
                    const result = await tx.product.updateMany({
                        where: {
                            id: price.product.id,
                            version: price.product.version,
                            stock: { gte: item.qty },
                        },
                        data: {
                            stock: { decrement: item.qty },
                            version: { increment: 1 },
                        },
                    });
                    if (result.count !== 1) {
                        throw new ConflictException('Hết hàng hoặc tồn kho vừa thay đổi');
                    }
                    subtotal += price.lineTotal;
                    items.push({
                        productId: price.product.id,
                        size: item.size,
                        qty: item.qty,
                        unitPrice: price.unitPrice,
                        lineTotal: price.lineTotal,
                        toppings: price.toppings.map((t) => ({ id: t.id, price: Number(t.price) })),
                    });
                }

                let discountAmount = 0;
                let couponId: string | undefined;
                if (dto.voucherCode?.trim()) {
                    const coupon = await tx.coupon.findUnique({
                        where: { code: dto.voucherCode.trim().toUpperCase() },
                    });
                    const now = new Date();
                    if (!coupon || !coupon.isActive || coupon.validFrom > now ||
                        coupon.validTo <= now || coupon.usedCount >= coupon.maxUses) {
                        throw new BadRequestException('Mã giảm giá không còn hợp lệ');
                    }
                    // Mã thưởng là tài sản của người đổi; không được dùng voucher của người khác.
                    const owned = await tx.rewardRedemption.findUnique({ where: { couponId: coupon.id } });
                    if (owned && owned.userId !== userId) throw new ForbiddenException('Voucher không thuộc tài khoản của bạn');
                    if (subtotal < Number(coupon.minOrderValue)) {
                        throw new BadRequestException('Đơn chưa đạt giá trị tối thiểu của voucher');
                    }
                    const requestedDiscount = coupon.discountType === 'PERCENT'
                        ? Math.floor(subtotal * Number(coupon.discountValue) / 100)
                        : Number(coupon.discountValue);
                    discountAmount = Math.min(subtotal, requestedDiscount);
                    couponId = coupon.id;
                }

                return tx.order.create({
                    data: {
                        user: { connect: { id: userId } },
                        ...(couponId ? { coupon: { connect: { id: couponId } } } : {}),
                        subtotal,
                        discountAmount,
                        total: subtotal - discountAmount,
                        orderItems: {
                            create: items.map((i) => ({
                                product: { connect: { id: i.productId } },
                                size: i.size,
                                qty: i.qty,
                                unitPrice: i.unitPrice,
                                lineTotal: i.lineTotal,
                                toppings: {
                                    create: i.toppings.map((t) => ({
                                        topping: { connect: { id: t.id } },
                                        price: t.price,
                                    })),
                                },
                            })),
                        },
                    },
                    include: {
                        orderItems: { include: { product: true, toppings: { include: { topping: true } } } },
                        payments: true,
                        user: { select: { fullName: true, phone: true } },
                    },
                });
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (e: any) {
            if (e?.code === 'P2034') {
                throw new ConflictException('Có người đặt cùng lúc, vui lòng thử lại');
            }
            throw e;
        }
    }

    mine(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            include: {
                orderItems: { include: { product: true, toppings: { include: { topping: true } } } },
                payments: true,
                user: { select: { fullName: true, phone: true } },
                coupon: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findMine(userId: string, id: string) {
        //id không phải UUID hợp lệ => coi như không tìm thấy.
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
            throw new NotFoundException('Không tìm thấy đơn');
        }
        const order = await this.prisma.order.findFirst({
            //Lọc theo userId.
            where: { id, userId },
            include: {
                orderItems: { include: { product: true, toppings: { include: { topping: true } } } },
                payments: true,
                user: { select: { fullName: true, phone: true } },
                coupon: true,
            },
        });
        if (!order) throw new NotFoundException('Không tìm thấy đơn');
        return order;
    }

    async changeStatus(id: string, next: OrderState, role: string) {
        if (!['STAFF', 'ADMIN'].includes(role)) {
            throw new ForbiddenException('Chỉ nhân viên được cập nhật');
        }
        return this.prisma.$transaction(async (tx) => {
            const old = await tx.order.findUnique({ where: { id } });
            if (!old) throw new NotFoundException('Không tìm thấy đơn');
            try { assertTransition(old.status, next); }
            catch (e: any) { throw new BadRequestException(e.message); }
            const changed = await tx.order.updateMany({
                where: { id, status: old.status },
                data: { status: next as OrderStatus },
            });
            if (changed.count !== 1) throw new ConflictException('Trạng thái đã thay đổi');
            return tx.order.findUniqueOrThrow({ where: { id } });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }

    async cancel(id: string, userId: string) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const old = await tx.order.findUnique({
                    where: { id }, include: { orderItems: true, loyaltyTransactions: true },
                });
                if (!old) throw new NotFoundException('Không tìm thấy đơn');
                if (old.userId !== userId) throw new ForbiddenException('Không phải đơn của bạn');
                try { assertTransition(old.status, 'CANCELLED'); }
                catch (e: any) { throw new BadRequestException(e.message); }
                // Với PAID chỉ hoàn tác thanh toán mô phỏng khi quầy chưa bắt đầu chế biến.
                // Tránh số dư âm nếu điểm vừa cộng từ đơn đã bị tiêu ở đơn khác.
                if (old.status === 'PAID') {
                    const earned = old.loyaltyTransactions
                        .filter(t => t.type === 'EARN')
                        .reduce((sum, t) => sum + t.points, 0);
                    if (earned > 0) {
                        const reversed = await tx.user.updateMany({
                            where: { id: userId, loyaltyPoints: { gte: earned } },
                            data: { loyaltyPoints: { decrement: earned } }
                        });
                        if (reversed.count !== 1) throw new ConflictException('Điểm tích từ đơn đã được sử dụng, không thể hủy tự động');
                        // Ghi bút toán đảo điểm để lịch sử vẫn minh bạch.
                        await tx.loyaltyTransaction.create({ data: { userId, orderId: id, points: earned, type: 'REDEEM' } });
                    }
                    if (old.couponId) {
                        await tx.coupon.update({ where: { id: old.couponId }, data: { usedCount: { decrement: 1 } } });
                    }
                }
                const changed = await tx.order.updateMany({
                    where: { id, status: old.status }, data: { status: 'CANCELLED' },
                });
                if (changed.count !== 1) throw new ConflictException('Đơn đã thay đổi');
                for (const item of old.orderItems) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.qty }, version: { increment: 1 } },
                    });
                }
                return tx.order.findUniqueOrThrow({ where: { id } });
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (e: any) {
            if (e?.code === 'P2034') throw new ConflictException('Đơn vừa được cập nhật, vui lòng thử lại');
            throw e;
        }
    }
}
