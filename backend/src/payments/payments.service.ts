import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { assertTransition } from '../order/order-state';
import type { PaymentDto } from './payments.controller';

// Kiểu dữ liệu trả về khi lấy Payment kèm Order.
type PaymentWithOrder = Prisma.PaymentGetPayload<{
    include: { order: true };
}>;

@Injectable()
export class PaymentsService {
    constructor(private readonly prisma: PrismaService) {}

    // Cùng Idempotency-Key chỉ được dùng cho cùng một yêu cầu thanh toán.
    private getReplay(
        payment: PaymentWithOrder,
        userId: string,
        dto: PaymentDto,
    ) {
        const expectedStatus = dto.simulateFailure === true ? 'FAILED' : 'SUCCESS';
        if (
            payment.orderId !== dto.orderId ||
            payment.order.userId !== userId ||
            payment.method !== dto.method ||
            payment.status !== expectedStatus
        ) {
            throw new ConflictException('Idempotency-Key đã sử dụng cho yêu cầu khác');
        }
        return { replay: true, order: payment.order, payment };
    }

    async pay(userId: string, key: string | undefined, dto: PaymentDto) {
        const idempotencyKey = key?.trim();
        if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
            throw new BadRequestException('Idempotency-Key phải dài 8–128 ký tự');
        }

        // Request lặp: trả giao dịch đã lưu, không cộng/trừ điểm lần hai.
        const existing = await this.prisma.payment.findUnique({
            where: { idempotencyKey },
            include: { order: true },
        });
        if (existing) return this.getReplay(existing, userId, dto);

        try {
            return await this.prisma.$transaction(async (tx) => {
                // Kiểm tra lại bên trong transaction để tránh xử lý trùng.
                const replay = await tx.payment.findUnique({
                    where: { idempotencyKey },
                    include: { order: true },
                });
                if (replay) return this.getReplay(replay, userId, dto);

                const order = await tx.order.findUnique({ where: { id: dto.orderId } });
                if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
                if (order.userId !== userId) {
                    throw new ForbiddenException('Không thể thanh toán đơn của người khác');
                }
                if (order.expiresAt.getTime() <= Date.now()) {
                    throw new BadRequestException('Đơn hàng đã hết thời gian thanh toán');
                }

                const targetStatus = dto.simulateFailure === true
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
                        throw new ConflictException('Đơn hàng đã thay đổi trạng thái');
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

                assertTransition(currentStatus, targetStatus);
                const updated = await tx.order.updateMany({
                    where: { id: order.id, status: currentStatus },
                    data: { status: targetStatus },
                });
                if (updated.count !== 1) {
                    throw new ConflictException('Đơn hàng đã được xử lý');
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
                        throw new ConflictException('Mã giảm giá đã hết hạn hoặc hết lượt');
                    }
                    const owned = await tx.userVoucher.findUnique({where: {couponId: coupon.id}});
                    if (owned) {
                        if (owned.userId !== userId || owned.usedAt) {
                            throw new ConflictException('Voucher đã dùng hoặc không thuộc tài khoản');
                        }
                        const consumed = await tx.userVoucher.updateMany({
                            where: {id: owned.id, userId, usedAt: null},
                            data: {usedAt: now},
                        });
                        if (consumed.count !== 1) throw new ConflictException('Voucher đã được sử dụng');
                    }
                }

                // Điểm chỉ trừ sau khi thanh toán THÀNH CÔNG.
                if (targetStatus === OrderStatus.PAID && order.pointsUsed > 0) {
                    const deducted = await tx.user.updateMany({
                        where: { id: userId, loyaltyPoints: { gte: order.pointsUsed } },
                        data: { loyaltyPoints: { decrement: order.pointsUsed } },
                    });
                    if (deducted.count !== 1) {
                        throw new ConflictException('Không đủ điểm thưởng để thanh toán');
                    }
                    await tx.loyaltyTransaction.create({
                        data: {
                            userId,
                            orderId: order.id,
                            points: order.pointsUsed,
                            type: 'REDEEM',
                        },
                    });
                }

                const payment = await tx.payment.create({
                    data: {
                        orderId: order.id,
                        idempotencyKey,
                        amount: order.total,
                        method: dto.method,
                        status: dto.simulateFailure === true ? 'FAILED' : 'SUCCESS',
                    },
                });

                const earnedPoints = targetStatus === OrderStatus.PAID
                    ? Math.floor(Number(order.total) / 10000)
                    : 0;
                if (earnedPoints > 0) {
                    await tx.user.update({
                        where: { id: userId },
                        data: { loyaltyPoints: { increment: earnedPoints } },
                    });
                    await tx.loyaltyTransaction.create({
                        data: {
                            userId,
                            orderId: order.id,
                            points: earnedPoints,
                            type: 'EARN',
                        },
                    });
                }

                const savedOrder = await tx.order.findUniqueOrThrow({
                    where: { id: order.id },
                });
                return { replay: false, order: savedOrder, payment, earnedPoints };
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error: any) {
            // Nếu request khác đã commit cùng key, trả kết quả cũ.
            if (error?.code === 'P2002' || error?.code === 'P2034') {
                const replay = await this.prisma.payment.findUnique({
                    where: { idempotencyKey },
                    include: { order: true },
                });
                if (replay) return this.getReplay(replay, userId, dto);
                throw new ConflictException('Thanh toán đang được xử lý, vui lòng thử lại');
            }
            throw error;
        }
    }
}
