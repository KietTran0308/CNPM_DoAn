import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import {OrderStatus, Prisma} from '@prisma/client';
import {PrismaService} from '../prisma.service';
import type {PaymentDto} from './payments.controller';
import {assertTransition} from '../orders/order-logic';

@Injectable()
export class PaymentsService {
    constructor(private readonly prisma: PrismaService) {}

    async pay(userId: string, key: string, dto: PaymentDto) {
        if (!key || key.length < 8 || key.length > 128) throw new BadRequestException('Idempotency-Key phải dài 8–128 ký tự');

        const existing = await this.prisma.payment.findUnique({where: {idempotencyKey: key}, include: {order: true}});
        if (existing) {
            if (existing.orderId !== dto.orderId || existing.order.userId !== userId || existing.method !== dto.method || existing.status !== (dto.simulateFailure ? 'FAILED' : 'SUCCESS')) throw new ConflictException('Idempotency-Key đã dùng cho một yêu cầu khác');
            return {replay: true, order: existing.order, payment: existing};
        }

        try {
            return await this.prisma.$transaction(async tx => {
                const replay = await tx.payment.findUnique({where: {idempotencyKey: key}, include: {order: true}});
                if (replay) {
                    if (replay.orderId !== dto.orderId || replay.order.userId !== userId || replay.method !== dto.method || replay.status !== (dto.simulateFailure ? 'FAILED' : 'SUCCESS'))throw new ConflictException('Idempotency-Key đã dùng cho một yêu cầu khác');
                    return {replay: true, order: replay.order, payment: replay};
                }
                const order = await tx.order.findUnique({where: {id: dto.orderId}});

                if (!order) throw new NotFoundException('Không tìm thấy đơn');

                if (order.userId !== userId) throw new ForbiddenException('Không thể thanh toán đơn của người khác');

                const target = dto.simulateFailure ? OrderStatus.PAYMENT_FAILED : OrderStatus.PAID;
                // PAYMENT_FAILED → PENDING → PAID (hoặc PAYMENT_FAILED), đều nằm trong một transaction.
                let currentStatus = order.status;
                if (currentStatus === 'PAYMENT_FAILED') {
                    assertTransition('PAYMENT_FAILED', 'PENDING');
                    const retry = await tx.order.updateMany({
                        where: {id: order.id, status: 'PAYMENT_FAILED'},
                        data: {status: 'PENDING'}
                    });
                    if (retry.count !== 1) throw new ConflictException('Đơn đã thay đổi trạng thái');
                    currentStatus = 'PENDING';
                }
                try {
                    assertTransition(currentStatus, target);
                } catch {
                    throw new BadRequestException(`Không thể thanh toán đơn đang ở trạng thái ${order.status}`);
                }
                const changed = await tx.order.updateMany({
                    where: {id: order.id, status: currentStatus},
                    data: {status: target}
                });
                if (changed.count !== 1) throw new ConflictException('Đơn đã được xử lý, vui lòng tải lại');
                // Chỉ tiêu thụ lượt voucher khi thanh toán MÔ PHỎNG thành công.
                if (target === OrderStatus.PAID && order.couponId) {
                    const coupon = await tx.coupon.findUniqueOrThrow({ where: { id: order.couponId } });
                    const now = new Date();
                    const result = await tx.coupon.updateMany({
                        where: { id: coupon.id, isActive: true, usedCount: { lt: coupon.maxUses },
                            validFrom: { lte: now }, validTo: { gt: now } },
                        data: { usedCount: { increment: 1 } }
                    });
                    if (result.count !== 1) throw new ConflictException('Voucher hết hạn hoặc đã hết lượt sử dụng');
                }
                const payment = await tx.payment.create({
                    data: {
                        orderId: order.id,
                        idempotencyKey: key,
                        amount: order.total,
                        method: dto.method,
                        status: dto.simulateFailure ? 'FAILED' : 'SUCCESS'
                    }
                });
                if (target === OrderStatus.PAID) {
                    const earned = Math.floor(Number(order.total) / 10000);
                    if (earned > 0) {
                        await tx.user.update({ where: { id: userId }, data: { loyaltyPoints: { increment: earned } } });
                        await tx.loyaltyTransaction.create({ data: { userId, orderId: order.id, points: earned, type: 'EARN' } });
                    }
                }
                const updated = await tx.order.findUniqueOrThrow({where: {id: order.id}});
                return {
                    replay: false,
                    order: updated,
                    payment,
                    earnedPoints: target === OrderStatus.PAID ? Math.floor(Number(order.total) / 10000) : 0
                };
            }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});
        } catch (error: any) {
            if (error?.code === 'P2002' || error?.code === 'P2034') {
                const replay = await this.prisma.payment.findUnique({
                    where: {idempotencyKey: key},
                    include: {order: true}
                });
                if (replay) {
                    if (replay.orderId !== dto.orderId || replay.order.userId !== userId || replay.method !== dto.method || replay.status !== (dto.simulateFailure ? 'FAILED' : 'SUCCESS')) throw new ConflictException('Khóa thanh toán không khớp yêu cầu');
                    return {replay: true, order: replay.order, payment: replay};
                }
                throw new ConflictException('Thanh toán đang được xử lý, vui lòng thử lại với cùng khóa');
            }
            throw error;
        }
    }
}
