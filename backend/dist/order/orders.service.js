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
exports.normalizeToppingSelections = normalizeToppingSelections;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../prisma.service");
const order_state_1 = require("./order-state");
function normalizeToppingSelections(item) {
    if (item.toppings !== undefined && item.toppingIds !== undefined) {
        throw new common_1.BadRequestException("Chỉ gửi toppings hoặc toppingIds, không gửi cả hai");
    }
    if (item.toppings !== undefined && !Array.isArray(item.toppings)) {
        throw new common_1.BadRequestException("toppings phải là mảng");
    }
    if (item.toppingIds !== undefined && !Array.isArray(item.toppingIds)) {
        throw new common_1.BadRequestException("toppingIds phải là mảng");
    }
    const selections = item.toppings ?? (item.toppingIds ?? []).map((toppingId) => ({
        toppingId,
        servings: 1,
    }));
    for (const selection of selections) {
        if (!selection || typeof selection.toppingId !== "string" || !selection.toppingId.trim()) {
            throw new common_1.BadRequestException("Mã topping không hợp lệ");
        }
        if (!Number.isInteger(selection.servings) || selection.servings < 1 || selection.servings > 100) {
            throw new common_1.BadRequestException("Số suất topping phải từ 1 đến 100");
        }
    }
    const ids = selections.map((s) => s.toppingId);
    if (new Set(ids).size !== ids.length) {
        throw new common_1.BadRequestException("Topping không được lặp lại");
    }
    return selections;
}
let PricingService = class PricingService {
    async calculateItem(tx, item) {
        if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 2147483647) {
            throw new common_1.BadRequestException("Số lượng phải lớn hơn 0");
        }
        const product = await tx.product.findUnique({
            where: { id: item.productId },
        });
        if (!product || !product.isActive) {
            throw new common_1.BadRequestException("Sản phẩm không tồn tại hoặc ngừng bán");
        }
        const variant = await tx.productSizePrice.findUnique({
            where: {
                productId_size: {
                    productId: item.productId,
                    size: item.size,
                },
            },
        });
        if (!variant) {
            throw new common_1.BadRequestException("Sản phẩm không hỗ trợ size này");
        }
        const selections = normalizeToppingSelections(item);
        const toppingIds = selections.map((selection) => selection.toppingId);
        const dbToppings = await tx.topping.findMany({
            where: {
                id: { in: toppingIds },
                isActive: true,
            },
        });
        if (dbToppings.length !== toppingIds.length) {
            throw new common_1.BadRequestException("Topping không tồn tại hoặc đã ngừng bán");
        }
        const toppingById = new Map(dbToppings.map((t) => [t.id, t]));
        const toppings = selections.map((selection) => ({
            topping: toppingById.get(selection.toppingId),
            servings: selection.servings,
        }));
        const basePrice = Number(variant.price);
        const toppingTotal = toppings.reduce((sum, selection) => sum + Number(selection.topping.price) * selection.servings, 0);
        const unitPrice = basePrice + toppingTotal;
        const lineTotal = unitPrice * item.qty;
        if (!Number.isSafeInteger(basePrice) ||
            !Number.isSafeInteger(unitPrice) ||
            !Number.isSafeInteger(lineTotal) ||
            basePrice < 0) {
            throw new common_1.BadRequestException("Giá sản phẩm không hợp lệ");
        }
        return {
            product,
            toppings,
            basePrice,
            unitPrice,
            lineTotal,
        };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)()
], PricingService);
let OrdersService = class OrdersService {
    constructor(prisma, pricingService) {
        this.prisma = prisma;
        this.pricingService = pricingService;
    }
    onModuleInit() {
        this.expiryTimer = setInterval(() => {
            void this.expirePendingOrders().catch((error) => {
                console.error("Lỗi xử lý đơn hết hạn:", error);
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
                    in: [client_1.OrderStatus.PENDING, client_1.OrderStatus.PAYMENT_FAILED],
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
            throw new common_1.BadRequestException("Idempotency-Key phải có 8–128 ký tự");
        }
        if (!dto.items?.length) {
            throw new common_1.BadRequestException("Đơn hàng phải có ít nhất một sản phẩm");
        }
        const normalizedItems = dto.items
            .map((item) => ({
            productId: item.productId,
            size: item.size,
            qty: item.qty,
            toppings: [...normalizeToppingSelections(item)]
                .sort((a, b) => a.toppingId.localeCompare(b.toppingId)),
        }))
            .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        const requestHash = (0, node_crypto_1.createHash)("sha256")
            .update(JSON.stringify({
            items: normalizedItems,
            couponCode: dto.couponCode?.trim().toUpperCase() ?? null,
            pointsToUse: dto.pointsToUse ?? 0,
        }))
            .digest("hex");
        const existing = await this.prisma.order.findUnique({
            where: { idempotencyKey },
        });
        if (existing) {
            if (existing.userId !== userId || existing.requestHash !== requestHash) {
                throw new common_1.ConflictException("Idempotency-Key đã dùng cho yêu cầu khác");
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
                    subtotal += result.lineTotal;
                    orderItems.push({
                        productId: result.product.id,
                        size: item.size,
                        qty: item.qty,
                        basePrice: result.basePrice,
                        unitPrice: result.unitPrice,
                        lineTotal: result.lineTotal,
                        toppings: {
                            create: result.toppings.map(({ topping, servings }) => ({
                                toppingId: topping.id,
                                price: topping.price,
                                servings,
                            })),
                        },
                    });
                }
                if (!Number.isSafeInteger(subtotal) || subtotal <= 0) {
                    throw new common_1.BadRequestException("Tổng tiền không hợp lệ");
                }
                let couponId;
                let discountAmount = 0;
                if (dto.couponCode?.trim()) {
                    const coupon = await tx.coupon.findUnique({
                        where: {
                            code: dto.couponCode.trim().toUpperCase(),
                        },
                    });
                    const now = new Date();
                    if (!coupon ||
                        !coupon.isActive ||
                        coupon.usedCount >= coupon.maxUses ||
                        coupon.validFrom > now ||
                        coupon.validTo <= now ||
                        subtotal < Number(coupon.minOrderValue)) {
                        throw new common_1.BadRequestException("Mã giảm giá không hợp lệ");
                    }
                    const ownedVoucher = await tx.userVoucher.findUnique({
                        where: {
                            userId_couponId: {
                                userId,
                                couponId: coupon.id,
                            },
                        },
                    });
                    if (ownedVoucher &&
                        (ownedVoucher.usedAt || ownedVoucher.usedOrderId)) {
                        throw new common_1.BadRequestException("Voucher đã được sử dụng");
                    }
                    if (!ownedVoucher) {
                        const privateVoucher = await tx.userVoucher.findFirst({
                            where: { couponId: coupon.id },
                            select: { id: true },
                        });
                        if (privateVoucher) {
                            throw new common_1.ForbiddenException("Voucher không thuộc tài khoản");
                        }
                    }
                    couponId = coupon.id;
                    discountAmount =
                        coupon.discountType === "PERCENT"
                            ? Math.round((subtotal * Number(coupon.discountValue)) / 100)
                            : Number(coupon.discountValue);
                    discountAmount = Math.min(discountAmount, subtotal);
                }
                const pointsUsed = dto.pointsToUse ?? 0;
                if (!Number.isInteger(pointsUsed) || pointsUsed < 0) {
                    throw new common_1.BadRequestException("Số điểm không hợp lệ");
                }
                if (pointsUsed > 0) {
                    const user = await tx.user.findUnique({
                        where: { id: userId },
                    });
                    if (!user || user.loyaltyPoints < pointsUsed) {
                        throw new common_1.BadRequestException("Không đủ điểm tích lũy");
                    }
                }
                const pointsDiscount = pointsUsed * 500;
                if (!Number.isSafeInteger(pointsDiscount) ||
                    discountAmount + pointsDiscount > subtotal) {
                    throw new common_1.BadRequestException("Số tiền giảm vượt quá tiền hàng");
                }
                const order = await tx.order.create({
                    data: {
                        idempotencyKey,
                        requestHash,
                        user: {
                            connect: { id: userId },
                        },
                        ...(couponId
                            ? {
                                coupon: {
                                    connect: { id: couponId },
                                },
                            }
                            : {}),
                        subtotal,
                        discountAmount,
                        pointsUsed,
                        pointsDiscount,
                        total: subtotal - discountAmount - pointsDiscount,
                        status: client_1.OrderStatus.PENDING,
                        statusHistory: {
                            create: {
                                toStatus: client_1.OrderStatus.PENDING,
                            },
                        },
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
                    id: order.id,
                    orderCode: order.orderCode,
                    status: order.status,
                    total: Number(order.total),
                };
            }, {
                isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
            });
        }
        catch (error) {
            if (error?.code === "P2002" || error?.code === "P2034") {
                const saved = await this.prisma.order.findUnique({
                    where: { idempotencyKey },
                });
                if (saved) {
                    if (saved.userId !== userId || saved.requestHash !== requestHash) {
                        throw new common_1.ConflictException("Idempotency-Key đã dùng cho yêu cầu khác");
                    }
                    return {
                        id: saved.id,
                        orderCode: saved.orderCode,
                        status: saved.status,
                        total: Number(saved.total),
                    };
                }
                throw new common_1.ConflictException("Đơn đang được xử lý, vui lòng thử lại với cùng key");
            }
            throw error;
        }
    }
    async mine(userId) {
        return this.prisma.order.findMany({
            where: { userId },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                user: {
                    select: {
                        fullName: true,
                        phone: true,
                    },
                },
                coupon: {
                    select: {
                        code: true,
                    },
                },
                payments: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                statusHistory: {
                    orderBy: {
                        changedAt: "asc",
                    },
                },
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
    async changeStatus(orderId, newStatus, role, performedBy) {
        if (role !== "ADMIN" && role !== "STAFF") {
            throw new common_1.ForbiddenException("Bạn không có quyền cập nhật đơn hàng");
        }
        try {
            return await this.prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                });
                if (!order) {
                    throw new common_1.NotFoundException("Không tìm thấy đơn hàng");
                }
                (0, order_state_1.assertTransition)(order.status, newStatus);
                if (order.status === client_1.OrderStatus.PAID &&
                    newStatus === client_1.OrderStatus.PREPARING) {
                    await this.consumeIngredients(tx, orderId, performedBy);
                }
                const updated = await tx.order.updateMany({
                    where: {
                        id: orderId,
                        status: order.status,
                    },
                    data: {
                        status: newStatus,
                    },
                });
                if (updated.count !== 1) {
                    throw new common_1.ConflictException("Trạng thái đơn đã bị thay đổi");
                }
                if (newStatus === client_1.OrderStatus.COMPLETED) {
                    const earnedPoints = Math.floor(Number(order.total) / 10000);
                    if (earnedPoints > 0) {
                        await tx.user.update({
                            where: { id: order.userId },
                            data: {
                                loyaltyPoints: { increment: earnedPoints },
                            },
                        });
                        await tx.loyaltyTransaction.create({
                            data: {
                                userId: order.userId,
                                orderId,
                                points: earnedPoints,
                                type: "EARN",
                            },
                        });
                    }
                }
                await tx.orderStatusHistory.create({
                    data: {
                        orderId,
                        fromStatus: order.status,
                        toStatus: newStatus,
                    },
                });
                return tx.order.findUniqueOrThrow({
                    where: { id: orderId },
                });
            }, {
                isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
            });
        }
        catch (error) {
            if (error?.code === "P2034") {
                throw new common_1.ConflictException("Đơn đã thay đổi, vui lòng thử lại");
            }
            throw error;
        }
    }
    async cancel(orderId, userId) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const order = await tx.order.findFirst({
                    where: {
                        id: orderId,
                        userId,
                    },
                });
                if (!order) {
                    throw new common_1.NotFoundException("Không tìm thấy đơn hàng");
                }
                if (order.status !== client_1.OrderStatus.PENDING &&
                    order.status !== client_1.OrderStatus.PAYMENT_FAILED &&
                    order.status !== client_1.OrderStatus.PAID) {
                    throw new common_1.BadRequestException("Trạng thái hiện tại không cho phép hủy đơn");
                }
                (0, order_state_1.assertTransition)(order.status, client_1.OrderStatus.CANCELLED);
                const updated = await tx.order.updateMany({
                    where: {
                        id: orderId,
                        userId,
                        status: order.status,
                    },
                    data: {
                        status: client_1.OrderStatus.CANCELLED,
                    },
                });
                if (updated.count !== 1) {
                    throw new common_1.ConflictException("Trạng thái đơn đã bị thay đổi");
                }
                if (order.status === client_1.OrderStatus.PAID) {
                    const payment = await tx.payment.findFirst({
                        where: {
                            orderId,
                            status: "SUCCESS",
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    });
                    if (!payment) {
                        throw new common_1.ConflictException("Không tìm thấy giao dịch thanh toán thành công");
                    }
                    await tx.payment.update({
                        where: {
                            id: payment.id,
                        },
                        data: {
                            refundedAmount: payment.amount,
                            refundedAt: payment.amount.greaterThan(0)
                                ? new Date()
                                : null,
                        },
                    });
                    if (order.couponId) {
                        const restored = await tx.coupon.updateMany({
                            where: {
                                id: order.couponId,
                                usedCount: {
                                    gt: 0,
                                },
                            },
                            data: {
                                usedCount: {
                                    decrement: 1,
                                },
                            },
                        });
                        if (restored.count !== 1) {
                            throw new common_1.ConflictException("Không thể hoàn lượt sử dụng mã giảm giá");
                        }
                        await tx.userVoucher.updateMany({
                            where: {
                                couponId: order.couponId,
                                userId,
                                usedOrderId: orderId,
                            },
                            data: {
                                usedAt: null,
                                usedOrderId: null,
                            },
                        });
                    }
                    if (order.pointsUsed > 0) {
                        const redeemed = await tx.loyaltyTransaction.findFirst({
                            where: { orderId, type: "REDEEM" },
                        });
                        if (!redeemed || redeemed.points !== order.pointsUsed) {
                            throw new common_1.ConflictException("Dữ liệu điểm đã sử dụng không khớp");
                        }
                        await tx.user.update({
                            where: { id: userId },
                            data: {
                                loyaltyPoints: { increment: redeemed.points },
                            },
                        });
                        await tx.loyaltyTransaction.create({
                            data: {
                                userId,
                                orderId,
                                points: redeemed.points,
                                type: "REVERSAL",
                            },
                        });
                    }
                }
                await tx.orderStatusHistory.create({
                    data: {
                        orderId,
                        fromStatus: order.status,
                        toStatus: client_1.OrderStatus.CANCELLED,
                    },
                });
                return tx.order.findUniqueOrThrow({
                    where: { id: orderId },
                });
            }, {
                isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
            });
        }
        catch (error) {
            if (error?.code === "P2034") {
                throw new common_1.ConflictException("Đơn đang được xử lý, vui lòng thử lại");
            }
            throw error;
        }
    }
    async consumeIngredients(tx, orderId, performedBy) {
        const order = await tx.order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                orderItems: {
                    include: {
                        toppings: true,
                    },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException("Không tìm thấy đơn hàng");
        }
        const existingMovement = await tx.ingredientMovement.findFirst({
            where: {
                orderId,
                movementType: "CONSUMPTION",
            },
        });
        if (existingMovement) {
            throw new common_1.ConflictException("Đơn hàng đã được xuất nguyên liệu trước đó");
        }
        const requiredIngredients = new Map();
        const addRequiredIngredient = (ingredientId, quantity) => {
            const current = requiredIngredients.get(ingredientId) ?? new client_1.Prisma.Decimal(0);
            requiredIngredients.set(ingredientId, current.add(quantity));
        };
        for (const item of order.orderItems) {
            const productRecipes = await tx.productIngredient.findMany({
                where: {
                    productId: item.productId,
                    size: item.size,
                },
            });
            if (productRecipes.length === 0) {
                throw new common_1.ConflictException(`Chưa có công thức nguyên liệu cho sản phẩm ${item.productId}, size ${item.size}`);
            }
            for (const recipe of productRecipes) {
                const requiredQuantity = recipe.quantity.mul(item.qty);
                addRequiredIngredient(recipe.ingredientId, requiredQuantity);
            }
            for (const itemTopping of item.toppings) {
                const toppingRecipes = await tx.toppingIngredient.findMany({
                    where: {
                        toppingId: itemTopping.toppingId,
                    },
                });
                if (toppingRecipes.length === 0) {
                    throw new common_1.ConflictException(`Chưa có công thức nguyên liệu cho topping ${itemTopping.toppingId}`);
                }
                for (const recipe of toppingRecipes) {
                    const requiredQuantity = recipe.quantity
                        .mul(itemTopping.servings)
                        .mul(item.qty);
                    addRequiredIngredient(recipe.ingredientId, requiredQuantity);
                }
            }
        }
        const sortedIngredients = [...requiredIngredients.entries()]
            .sort(([a], [b]) => a.localeCompare(b));
        for (const [ingredientId, requiredQuantity] of sortedIngredients) {
            const ingredient = await tx.ingredient.findUnique({
                where: {
                    id: ingredientId,
                },
            });
            if (!ingredient || !ingredient.isActive) {
                throw new common_1.NotFoundException(`Nguyên liệu ${ingredientId} không tồn tại hoặc đã ngừng hoạt động`);
            }
            if (ingredient.stockQty.lessThan(requiredQuantity)) {
                throw new common_1.ConflictException(`Không đủ nguyên liệu ${ingredient.name}. ` +
                    `Tồn kho: ${ingredient.stockQty.toString()} ${ingredient.unit}, ` +
                    `cần: ${requiredQuantity.toString()} ${ingredient.unit}`);
            }
            const stockBefore = ingredient.stockQty;
            const stockAfter = stockBefore.sub(requiredQuantity);
            const result = await tx.ingredient.updateMany({
                where: {
                    id: ingredientId,
                    version: ingredient.version,
                    stockQty: {
                        gte: requiredQuantity,
                    },
                    isActive: true,
                },
                data: {
                    stockQty: {
                        decrement: requiredQuantity,
                    },
                    version: {
                        increment: 1,
                    },
                    updatedAt: new Date(),
                },
            });
            if (result.count !== 1) {
                throw new common_1.ConflictException(`Tồn kho nguyên liệu ${ingredient.name} vừa thay đổi. Vui lòng thử lại`);
            }
            await tx.ingredientMovement.create({
                data: {
                    ingredientId,
                    orderId,
                    performedBy: performedBy ?? null,
                    movementType: "CONSUMPTION",
                    expectedVersion: ingredient.version,
                    quantityChange: requiredQuantity.negated(),
                    stockBefore,
                    stockAfter,
                    note: `Xuất nguyên liệu cho đơn hàng ${order.orderCode}`,
                },
            });
        }
        return {
            orderId,
            consumedIngredients: requiredIngredients.size,
        };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        PricingService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map