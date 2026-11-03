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
exports.OrdersService = exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../prisma.service");
const products_service_1 = require("../products/products.service");
const order_state_1 = require("./order-state");
let PricingService = class PricingService {
    async calculateItem(tx, item) {
        if (!Number.isInteger(item.qty) || item.qty < 1) {
            throw new common_1.BadRequestException('Số lượng phải lớn hơn 0');
        }
        const product = await tx.product.findUnique({
            where: { id: item.productId },
        });
        if (!product || !product.isActive) {
            throw new common_1.BadRequestException('Sản phẩm không tồn tại hoặc ngừng bán');
        }
        const variant = await tx.productSizePrice.findUnique({
            where: {
                productId_size: { productId: item.productId, size: item.size },
            },
        });
        if (!variant) {
            throw new common_1.BadRequestException('Sản phẩm không hỗ trợ size này');
        }
        const toppingIds = item.toppingIds ?? [];
        if (new Set(toppingIds).size !== toppingIds.length) {
            throw new common_1.BadRequestException('Topping không được lặp lại');
        }
        const toppings = await tx.topping.findMany({
            where: { id: { in: toppingIds }, isActive: true },
        });
        if (toppings.length !== toppingIds.length) {
            throw new common_1.BadRequestException('Topping không tồn tại hoặc đã ngừng bán');
        }
        const unitPrice = Number(variant.price) + toppings.reduce((sum, topping) => sum + Number(topping.price), 0);
        const lineTotal = unitPrice * item.qty;
        if (!Number.isSafeInteger(unitPrice) || !Number.isSafeInteger(lineTotal) || unitPrice < 0) {
            throw new common_1.BadRequestException('Giá sản phẩm không hợp lệ');
        }
        return { product, toppings, unitPrice, lineTotal };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)()
], PricingService);
let OrdersService = class OrdersService {
    constructor(prisma, pricingService, productsService) {
        this.prisma = prisma;
        this.pricingService = pricingService;
        this.productsService = productsService;
    }
    onModuleInit() {
        this.expiryTimer = setInterval(() => {
            void this.expirePendingOrders().catch(error => {
                console.error('Lỗi xử lý đơn hết hạn:', error);
            });
        }, 60_000);
    }
    onModuleDestroy() {
        if (this.expiryTimer) {
            clearInterval(this.expiryTimer);
        }
    }
    async expirePendingOrders() {
        const expiredOrders = await this.prisma.order.findMany({
            where: {
                status: {
                    in: [
                        client_1.OrderStatus.PENDING,
                        client_1.OrderStatus.PAYMENT_FAILED,
                    ],
                },
                expiresAt: {
                    lte: new Date(),
                },
            },
            select: {
                id: true,
                userId: true,
            },
            take: 100,
        });
        for (const order of expiredOrders) {
            try {
                await this.cancel(order.id, order.userId);
            }
            catch (error) {
                console.error(`Không thể hủy đơn hết hạn ${order.id}:`, error);
            }
        }
    }
    async create(userId, dto, key) {
        const idempotencyKey = key?.trim();
        if (!idempotencyKey ||
            idempotencyKey.length < 8 ||
            idempotencyKey.length > 128) {
            throw new common_1.BadRequestException('Idempotency-Key phải có 8–128 ký tự');
        }
        const normalizedItems = dto.items
            .map(item => ({
            productId: item.productId,
            size: item.size,
            qty: item.qty,
            toppingIds: [
                ...(item.toppingIds ?? []),
            ].sort(),
        }))
            .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        const requestHash = (0, node_crypto_1.createHash)('sha256')
            .update(JSON.stringify({
            items: normalizedItems,
            couponCode: dto.couponCode?.trim().toUpperCase() ?? null,
            pointsToUse: dto.pointsToUse ?? 0,
        }))
            .digest('hex');
        const existing = await this.prisma.order.findUnique({
            where: { idempotencyKey },
        });
        if (existing) {
            if (existing.userId !== userId ||
                existing.requestHash !== requestHash) {
                throw new common_1.ConflictException('Idempotency-Key đã dùng cho yêu cầu khác');
            }
            return {
                id: existing.id,
                orderCode: existing.orderCode,
                status: existing.status,
                total: Number(existing.total),
            };
        }
        try {
            return await this.prisma.$transaction(async (tx) => {
                let subtotal = 0;
                const orderItems = [];
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
                    throw new common_1.BadRequestException('Tổng tiền không hợp lệ');
                }
                let couponId;
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
                        throw new common_1.BadRequestException('Mã giảm giá không hợp lệ');
                    }
                    const ownedVoucher = await tx.userVoucher.findUnique({ where: { couponId: coupon.id } });
                    if (ownedVoucher && (ownedVoucher.userId !== userId || ownedVoucher.usedAt)) {
                        throw new common_1.BadRequestException('Voucher không thuộc tài khoản hoặc đã sử dụng');
                    }
                    couponId = coupon.id;
                    discountAmount = coupon.discountType === 'PERCENT'
                        ? Math.round(subtotal * Number(coupon.discountValue) / 100)
                        : Number(coupon.discountValue);
                    discountAmount = Math.min(discountAmount, subtotal);
                }
                const pointsUsed = dto.pointsToUse ?? 0;
                if (!Number.isInteger(pointsUsed) || pointsUsed < 0) {
                    throw new common_1.BadRequestException('Số điểm không hợp lệ');
                }
                if (pointsUsed > 0) {
                    const user = await tx.user.findUnique({ where: { id: userId } });
                    if (!user || user.loyaltyPoints < pointsUsed) {
                        throw new common_1.BadRequestException('Không đủ điểm tích lũy');
                    }
                }
                const pointsDiscount = pointsUsed * 500;
                if (discountAmount + pointsDiscount > subtotal) {
                    throw new common_1.BadRequestException('Số tiền giảm vượt quá tiền hàng');
                }
                const order = await tx.order.create({
                    data: {
                        idempotencyKey,
                        requestHash,
                        user: { connect: { id: userId } },
                        ...(couponId ? { coupon: { connect: { id: couponId } } } : {}),
                        subtotal,
                        discountAmount,
                        pointsUsed,
                        pointsDiscount,
                        total: subtotal - discountAmount - pointsDiscount,
                        status: client_1.OrderStatus.PENDING,
                        statusHistory: { create: { toStatus: client_1.OrderStatus.PENDING } },
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
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            if (error?.code === 'P2002' ||
                error?.code === 'P2034') {
                const saved = await this.prisma.order.findUnique({
                    where: { idempotencyKey },
                });
                if (saved) {
                    if (saved.userId !== userId ||
                        saved.requestHash !== requestHash) {
                        throw new common_1.ConflictException('Idempotency-Key đã dùng cho yêu cầu khác');
                    }
                    return {
                        id: saved.id,
                        orderCode: saved.orderCode,
                        status: saved.status,
                        total: Number(saved.total),
                    };
                }
                throw new common_1.ConflictException('Đơn đang được xử lý, vui lòng thử lại với cùng key');
            }
            throw error;
        }
    }
    async mine(userId) {
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
    async changeStatus(orderId, newStatus, role) {
        if (role !== 'ADMIN' && role !== 'STAFF') {
            throw new common_1.ForbiddenException('Bạn không có quyền cập nhật đơn hàng');
        }
        try {
            return await this.prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({ where: { id: orderId } });
                if (!order)
                    throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
                (0, order_state_1.assertTransition)(order.status, newStatus);
                const updated = await tx.order.updateMany({
                    where: { id: orderId, status: order.status },
                    data: { status: newStatus },
                });
                if (updated.count !== 1) {
                    throw new common_1.ConflictException('Trạng thái đơn đã bị thay đổi');
                }
                await tx.orderStatusHistory.create({
                    data: { orderId, fromStatus: order.status, toStatus: newStatus },
                });
                return tx.order.findUniqueOrThrow({ where: { id: orderId } });
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            if (error?.code === 'P2034') {
                throw new common_1.ConflictException('Đơn đã thay đổi, vui lòng thử lại');
            }
            throw error;
        }
    }
    async cancel(orderId, userId) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const order = await tx.order.findFirst({ where: { id: orderId, userId } });
                if (!order)
                    throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
                if (order.status !== client_1.OrderStatus.PENDING && order.status !== client_1.OrderStatus.PAYMENT_FAILED && order.status !== client_1.OrderStatus.PAID) {
                    throw new common_1.BadRequestException('Trạng thái hiện tại không cho phép hủy đơn');
                }
                (0, order_state_1.assertTransition)(order.status, client_1.OrderStatus.CANCELLED);
                const updated = await tx.order.updateMany({
                    where: { id: orderId, userId, status: order.status },
                    data: { status: client_1.OrderStatus.CANCELLED },
                });
                if (updated.count !== 1) {
                    throw new common_1.ConflictException('Trạng thái đơn đã bị thay đổi');
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
                if (order.status === client_1.OrderStatus.PAID) {
                    const payment = await tx.payment.findFirst({
                        where: {
                            orderId,
                            status: 'SUCCESS',
                        },
                    });
                    if (!payment) {
                        throw new common_1.ConflictException('Không tìm thấy giao dịch thanh toán thành công');
                    }
                    await tx.payment.update({
                        where: { id: payment.id },
                        data: {
                            providerRef: `MOCK_REFUNDED:${payment.id}`,
                        },
                    });
                    if (order.couponId) {
                        const restored = await tx.coupon.updateMany({
                            where: {
                                id: order.couponId,
                                usedCount: { gt: 0 },
                            },
                            data: {
                                usedCount: { decrement: 1 },
                            },
                        });
                        if (restored.count !== 1) {
                            throw new common_1.ConflictException('Không thể hoàn lượt sử dụng mã giảm giá');
                        }
                        await tx.userVoucher.updateMany({
                            where: {
                                couponId: order.couponId,
                                userId,
                            },
                            data: {
                                usedAt: null,
                            },
                        });
                    }
                    const movements = await tx.loyaltyTransaction.findMany({
                        where: { orderId },
                    });
                    const earned = movements.find(m => m.type === 'EARN')?.points ?? 0;
                    const redeemed = movements.find(m => m.type === 'REDEEM')?.points ?? 0;
                    const difference = redeemed - earned;
                    if (difference !== 0) {
                        const updated = await tx.user.updateMany({
                            where: {
                                id: userId,
                                loyaltyPoints: {
                                    gte: Math.max(0, -difference),
                                },
                            },
                            data: {
                                loyaltyPoints: {
                                    increment: difference,
                                },
                            },
                        });
                        if (updated.count !== 1) {
                            throw new common_1.ConflictException('Không đủ điểm để thu hồi thưởng; cần xử lý thủ công');
                        }
                    }
                    if (redeemed > 0) {
                        await tx.loyaltyTransaction.create({
                            data: {
                                userId,
                                points: redeemed,
                                type: 'EARN',
                            },
                        });
                    }
                    if (earned > 0) {
                        await tx.loyaltyTransaction.create({
                            data: {
                                userId,
                                points: earned,
                                type: 'REDEEM',
                            },
                        });
                    }
                }
                await tx.orderStatusHistory.create({
                    data: { orderId, fromStatus: order.status, toStatus: client_1.OrderStatus.CANCELLED },
                });
                return tx.order.findUniqueOrThrow({ where: { id: orderId } });
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            if (error?.code === 'P2034') {
                throw new common_1.ConflictException('Đơn đang được xử lý, vui lòng thử lại');
            }
            throw error;
        }
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        PricingService,
        products_service_1.ProductsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map