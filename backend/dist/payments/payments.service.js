"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma.service");
const order_state_1 = require("../order/order-state");
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getReplay(payment, userId, dto) {
        const expectedStatus = dto.simulateFailure === true ? 'FAILED' : 'SUCCESS';
        if (payment.orderId !== dto.orderId ||
            payment.order.userId !== userId ||
            payment.method !== dto.method ||
            payment.status !== expectedStatus) {
            throw new common_1.ConflictException('Idempotency-Key đã sử dụng cho yêu cầu khác');
        }
        return { replay: true, order: payment.order, payment };
    }
    async pay(userId, key, dto) {
        const idempotencyKey = key?.trim();
        if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
            throw new common_1.BadRequestException('Idempotency-Key phải dài 8–128 ký tự');
        }
        const existing = await this.prisma.payment.findUnique({
            where: { idempotencyKey },
            include: { order: true },
        });
        if (existing)
            return this.getReplay(existing, userId, dto);
        try {
            return await this.prisma.$transaction(async (tx) => {
                const replay = await tx.payment.findUnique({
                    where: { idempotencyKey },
                    include: { order: true },
                });
                if (replay)
                    return this.getReplay(replay, userId, dto);
                const order = await tx.order.findUnique({ where: { id: dto.orderId } });
                if (!order)
                    throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
                if (order.userId !== userId) {
                    throw new common_1.ForbiddenException('Không thể thanh toán đơn của người khác');
                }
                if (order.expiresAt.getTime() <= Date.now()) {
                    throw new common_1.BadRequestException('Đơn hàng đã hết thời gian thanh toán');
                }
                const targetStatus = dto.simulateFailure === true
                    ? client_1.OrderStatus.PAYMENT_FAILED
                    : client_1.OrderStatus.PAID;
                let currentStatus = order.status;
                if (currentStatus === client_1.OrderStatus.PAYMENT_FAILED) {
                    (0, order_state_1.assertTransition)(currentStatus, client_1.OrderStatus.PENDING);
                    const retry = await tx.order.updateMany({
                        where: { id: order.id, status: currentStatus },
                        data: { status: client_1.OrderStatus.PENDING },
                    });
                    if (retry.count !== 1) {
                        throw new common_1.ConflictException('Đơn hàng đã thay đổi trạng thái');
                    }
                    await tx.orderStatusHistory.create({
                        data: {
                            orderId: order.id,
                            fromStatus: currentStatus,
                            toStatus: client_1.OrderStatus.PENDING,
                        },
                    });
                    currentStatus = client_1.OrderStatus.PENDING;
                }
                (0, order_state_1.assertTransition)(currentStatus, targetStatus);
                const updated = await tx.order.updateMany({
                    where: { id: order.id, status: currentStatus },
                    data: { status: targetStatus },
                });
                if (updated.count !== 1) {
                    throw new common_1.ConflictException('Đơn hàng đã được xử lý');
                }
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: order.id,
                        fromStatus: currentStatus,
                        toStatus: targetStatus,
                    },
                });
                if (targetStatus === client_1.OrderStatus.PAID && order.couponId) {
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
                        throw new common_1.ConflictException('Mã giảm giá đã hết hạn hoặc hết lượt');
                    }
                    const owned = await tx.userVoucher.findUnique({ where: { couponId: coupon.id } });
                    if (owned) {
                        if (owned.userId !== userId || owned.usedAt) {
                            throw new common_1.ConflictException('Voucher đã dùng hoặc không thuộc tài khoản');
                        }
                        const consumed = await tx.userVoucher.updateMany({
                            where: { id: owned.id, userId, usedAt: null },
                            data: { usedAt: now },
                        });
                        if (consumed.count !== 1)
                            throw new common_1.ConflictException('Voucher đã được sử dụng');
                    }
                }
                if (targetStatus === client_1.OrderStatus.PAID && order.pointsUsed > 0) {
                    const deducted = await tx.user.updateMany({
                        where: { id: userId, loyaltyPoints: { gte: order.pointsUsed } },
                        data: { loyaltyPoints: { decrement: order.pointsUsed } },
                    });
                    if (deducted.count !== 1) {
                        throw new common_1.ConflictException('Không đủ điểm thưởng để thanh toán');
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
                const earnedPoints = targetStatus === client_1.OrderStatus.PAID
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
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            if (error?.code === 'P2002' || error?.code === 'P2034') {
                const replay = await this.prisma.payment.findUnique({
                    where: { idempotencyKey },
                    include: { order: true },
                });
                if (replay)
                    return this.getReplay(replay, userId, dto);
                throw new common_1.ConflictException('Thanh toán đang được xử lý, vui lòng thử lại');
            }
            throw error;
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map