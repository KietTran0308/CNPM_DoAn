import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    OnModuleInit,
    OnModuleDestroy,
} from "@nestjs/common";

import { OrderStatus, Prisma } from "@prisma/client";
import { createHash } from "node:crypto";

import { PrismaService } from "../prisma.service";
import type { CreateOrderDto, OrderItemDto } from "./orders.controller";
import { assertTransition } from "./order-state";

export function normalizeToppingSelections(item: OrderItemDto): Array<{
    toppingId: string;
    servings: number;
}> {
    if ((item.toppings?.length ?? 0) > 10 || (item.toppingIds?.length ?? 0) > 10) {
        throw new BadRequestException("Mỗi món tối đa 10 loại topping");
    }
    if (item.toppings !== undefined && item.toppingIds !== undefined) {
        throw new BadRequestException("Chỉ gửi toppings hoặc toppingIds, không gửi cả hai");
    }
    if (item.toppings !== undefined && !Array.isArray(item.toppings)) {
        throw new BadRequestException("toppings phải là mảng");
    }
    if (item.toppingIds !== undefined && !Array.isArray(item.toppingIds)) {
        throw new BadRequestException("toppingIds phải là mảng");
    }

    const selections = item.toppings ?? (item.toppingIds ?? []).map((toppingId) => ({
        toppingId,
        servings: 1,
    }));
    for (const selection of selections) {
        if (!selection || typeof selection.toppingId !== "string" || !selection.toppingId.trim()) {
            throw new BadRequestException("Mã topping không hợp lệ");
        }
        if (!Number.isInteger(selection.servings) || selection.servings < 1 || selection.servings > 10) {
            throw new BadRequestException("Số suất topping phải từ 1 đến 10");
        }
    }
    const ids = selections.map((s) => s.toppingId);
    if (new Set(ids).size !== ids.length) {
        throw new BadRequestException("Topping không được lặp lại");
    }
    return selections;
}

// ======================================================
// PRICING SERVICE
// ======================================================

@Injectable()
export class PricingService {
    async calculateItem(tx: Prisma.TransactionClient, item: OrderItemDto) {
        if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 100) {
            throw new BadRequestException("Số lượng phải lớn hơn 0");
        }

        const product = await tx.product.findUnique({
            where: { id: item.productId },
        });

        if (!product || !product.isActive) {
            throw new BadRequestException("Sản phẩm không tồn tại hoặc ngừng bán");
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
            throw new BadRequestException("Sản phẩm không hỗ trợ size này");
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
            throw new BadRequestException("Topping không tồn tại hoặc đã ngừng bán");
        }

        const toppingById = new Map(dbToppings.map((t) => [t.id, t]));
        const toppings = selections.map((selection) => ({
            topping: toppingById.get(selection.toppingId)!,
            servings: selection.servings,
        }));

        // Gia product_size_prices la gia day du cho tung size.
        const basePrice = Number(variant.price);
        const toppingTotal = toppings.reduce(
            (sum, selection) =>
                sum + Number(selection.topping.price) * selection.servings,
            0,
        );

        const unitPrice = basePrice + toppingTotal;
        const lineTotal = unitPrice * item.qty;

        if (
            !Number.isSafeInteger(basePrice) ||
            !Number.isSafeInteger(unitPrice) ||
            !Number.isSafeInteger(lineTotal) ||
            lineTotal > 9_999_999_999 ||
            basePrice < 0
        ) {
            throw new BadRequestException("Giá sản phẩm không hợp lệ");
        }

        return {
            product,
            toppings,
            basePrice,
            unitPrice,
            lineTotal,
        };
    }
}

// ======================================================
// ORDERS SERVICE
// ======================================================

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pricingService: PricingService,
    ) {}

    private expiryTimer?: ReturnType<typeof setInterval>;

    // Mỗi đơn mới giữ trước kho/voucher/điểm trong cùng transaction SERIALIZABLE.
    // Không trừ kho vật lý hoặc điểm thật cho tới khi payment được xác nhận.
    private async reserveOrderResources(tx: Prisma.TransactionClient, orderId: string) {
        const order = await tx.order.findUniqueOrThrow({ where: { id: orderId },
            include: { orderItems: { include: { toppings: true } } },
        });
        const required = new Map<string, Prisma.Decimal>();
        const add = (id: string, quantity: Prisma.Decimal) => {
            required.set(id, (required.get(id) ?? new Prisma.Decimal(0)).add(quantity));
        };
        for (const item of order.orderItems) {
            const recipes = await tx.productIngredient.findMany({
                where: { productId: item.productId, size: item.size },
            });
            if (recipes.length === 0) throw new ConflictException('Món chưa có công thức nguyên liệu');
            for (const recipe of recipes) add(recipe.ingredientId, recipe.quantity.mul(item.qty));
            for (const topping of item.toppings) {
                const toppingRecipes = await tx.toppingIngredient.findMany({
                    where: { toppingId: topping.toppingId },
                });
                if (toppingRecipes.length === 0) throw new ConflictException('Topping chưa có công thức nguyên liệu');
                for (const recipe of toppingRecipes) {
                    add(recipe.ingredientId, recipe.quantity.mul(topping.servings).mul(item.qty));
                }
            }
        }
        // Kho + reservation được cập nhật theo thứ tự cố định để giảm deadlock.
        for (const [ingredientId, qty] of [...required.entries()].sort(([a], [b]) => a.localeCompare(b))) {
            if (qty.lte(0)) throw new ConflictException('Định lượng công thức không hợp lệ');
            const ingredient = await tx.ingredient.findUniqueOrThrow({ where: { id: ingredientId } });
            if (!ingredient.isActive || ingredient.stockQty.sub(ingredient.reservedQty).lt(qty)) {
                throw new ConflictException(`Không đủ nguyên liệu ${ingredient.name} để giữ cho đơn hàng`);
            }
            const updated = await tx.ingredient.updateMany({
                where: { id: ingredientId, version: ingredient.version, reservedQty: ingredient.reservedQty,
                    isActive: true },
                data: { reservedQty: { increment: qty }, version: { increment: 1 } },
            });
            if (updated.count !== 1) throw new ConflictException('Tồn kho vừa thay đổi, vui lòng thử lại');
            await tx.orderIngredientReservation.create({ data: { orderId, ingredientId, quantity: qty } });
        }
        if (order.couponId) {
            const coupon = await tx.coupon.findUniqueOrThrow({ where: { id: order.couponId } });
            const now = new Date();
            if (!coupon.isActive || coupon.validFrom > now || coupon.validTo <= now ||
                coupon.usedCount + coupon.reservedCount >= coupon.maxUses ||
                Number(coupon.minOrderValue) > Number(order.subtotal)) {
                throw new ConflictException('Voucher đã hết lượt hoặc không còn hợp lệ');
            }
            const updated = await tx.coupon.updateMany({
                where: { id: coupon.id, usedCount: coupon.usedCount, reservedCount: coupon.reservedCount,
                    isActive: true },
                data: { reservedCount: { increment: 1 } },
            });
            if (updated.count !== 1) throw new ConflictException('Lượt voucher vừa thay đổi');
            const owned = await tx.userVoucher.findUnique({
                where: { userId_couponId: { userId: order.userId, couponId: coupon.id } },
            });
            if (owned) {
                const locked = await tx.userVoucher.updateMany({
                    where: { id: owned.id, reservedOrderId: null, usedAt: null, usedOrderId: null },
                    data: { reservedOrderId: orderId },
                });
                if (locked.count !== 1) throw new ConflictException('Voucher đã được giữ cho đơn khác');
            } else if (await tx.userVoucher.findFirst({ where: { couponId: coupon.id } })) {
                throw new ForbiddenException('Voucher không thuộc tài khoản');
            }
        }
        if (order.pointsUsed > 0) {
            const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId } });
            if (user.loyaltyPoints - user.reservedPoints < order.pointsUsed) {
                throw new ConflictException('Điểm khả dụng không đủ để giữ cho đơn');
            }
            const reserved = await tx.user.updateMany({
                where: { id: user.id, reservedPoints: user.reservedPoints,
                    loyaltyPoints: { gte: user.reservedPoints + order.pointsUsed } },
                data: { reservedPoints: { increment: order.pointsUsed } },
            });
            if (reserved.count !== 1) throw new ConflictException('Điểm đã thay đổi, vui lòng thử lại');
        }
        await tx.order.update({ where: { id: orderId }, data: { reservationStatus: 'HELD' } });
    }

    private async releaseOrderResources(tx: Prisma.TransactionClient, orderId: string) {
        const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
        if (order.reservationStatus !== 'HELD') return; // Đơn cũ hoặc đã giải phóng
        const rows = await tx.orderIngredientReservation.findMany({
            where: { orderId }, orderBy: { ingredientId: 'asc' },
        });
        for (const row of rows) {
            const ingredient = await tx.ingredient.findUniqueOrThrow({ where: { id: row.ingredientId } });
            const updated = await tx.ingredient.updateMany({
                where: { id: row.ingredientId, version: ingredient.version,
                    reservedQty: { gte: row.quantity } },
                data: { reservedQty: { decrement: row.quantity }, version: { increment: 1 } },
            });
            if (updated.count !== 1) throw new ConflictException('Không thể hoàn giữ kho, hãy thử lại');
        }
        if (order.couponId) {
            const released = await tx.coupon.updateMany({
                where: { id: order.couponId, reservedCount: { gt: 0 } },
                data: { reservedCount: { decrement: 1 } },
            });
            if (released.count !== 1) throw new ConflictException('Không thể hoàn lượt voucher');
            await tx.userVoucher.updateMany({
                where: { userId: order.userId, couponId: order.couponId, reservedOrderId: orderId },
                data: { reservedOrderId: null },
            });
        }
        if (order.pointsUsed > 0) {
            const released = await tx.user.updateMany({
                where: { id: order.userId, reservedPoints: { gte: order.pointsUsed } },
                data: { reservedPoints: { decrement: order.pointsUsed } },
            });
            if (released.count !== 1) throw new ConflictException('Không thể hoàn điểm đang giữ');
        }
        await tx.order.updateMany({
            where: { id: orderId, reservationStatus: 'HELD' },
            data: { reservationStatus: 'RELEASED' },
        });
    }

    // ====================================================
    // MODULE LIFECYCLE
    // ====================================================

    onModuleInit() {
        const cleanup = () => {
            void this.expirePendingOrders().catch((error) => {
                console.error("Lỗi xử lý đơn hết hạn:", error);
            });
        };
        // Render/local khởi động lại sau thời gian offline: dọn đơn đã quá hạn ngay.
        cleanup();
        this.expiryTimer = setInterval(cleanup, 60_000);
    }

    onModuleDestroy() {
        if (this.expiryTimer) {
            clearInterval(this.expiryTimer);
        }
    }

    // ====================================================
    // EXPIRE PENDING ORDERS
    // ====================================================

    private async expirePendingOrders() {
        const expiredOrders = await this.prisma.order.findMany({
            where: {
                status: {
                    in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED],
                },
                expiresAt: {
                    lte: new Date(),
                },
                // Đơn còn phiên ZaloPay hoặc giao dịch cũ PENDING phải đối soát trước khi cho phép hủy.
                payments: { none: { paymentMethod: { type: 'GATEWAY' }, status: { in: ['PENDING', 'SUCCESS'] } } },
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
            } catch (error) {
                console.error(`Không thể hủy đơn hết hạn ${order.id}:`, error);
            }
        }
    }

    // ====================================================
    // CREATE ORDER
    // ====================================================

    async create(userId: string, dto: CreateOrderDto, key?: string) {
        const idempotencyKey = key?.trim();

        if (
            !idempotencyKey ||
            idempotencyKey.length < 8 ||
            idempotencyKey.length > 128
        ) {
            throw new BadRequestException("Idempotency-Key phải có 8–128 ký tự");
        }

        if (!dto.items?.length) {
            throw new BadRequestException("Đơn hàng phải có ít nhất một sản phẩm");
        }
        if (dto.items.length > 50) {
            throw new BadRequestException("Một đơn hàng không được vượt quá 50 dòng sản phẩm");
        }

        // Chuẩn hóa dữ liệu để tạo request hash.
        const normalizedItems = dto.items
            .map((item) => ({
                productId: item.productId,
                size: item.size,
                qty: item.qty,
                sugar: item.sugar ?? "100%",
                ice: item.ice ?? "100%",
                note: item.note?.trim() ?? "",
                toppings: [...normalizeToppingSelections(item)]
                    .sort((a, b) => a.toppingId.localeCompare(b.toppingId)),
            }))
            .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

        const requestHash = createHash("sha256")
            .update(
                JSON.stringify({
                    items: normalizedItems,
                    couponCode: dto.couponCode?.trim().toUpperCase() ?? null,
                    pointsToUse: dto.pointsToUse ?? 0,
                }),
            )
            .digest("hex");

        // Kiểm tra idempotency trước khi tạo đơn.
        const existing = await this.prisma.order.findUnique({
            where: { idempotencyKey },
        });

        if (existing) {
            if (existing.userId !== userId || existing.requestHash !== requestHash) {
                throw new ConflictException("Idempotency-Key đã dùng cho yêu cầu khác");
            }

            return {
                id: existing.id,
                orderCode: existing.orderCode,
                status: existing.status,
                total: Number(existing.total),
            };
        }

        try {
            return await this.prisma.$transaction(
                async (tx) => {
                    // Tránh một tài khoản đặt quá nhiều đơn chỉ để giữ hàng tồn.
                    // Kể cả QR đã hết hạn nhưng chưa đối soát vẫn tính là đang giữ.
                    const activeHolds = await tx.order.count({
                        where: { userId, reservationStatus: 'HELD',
                            status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] } },
                    });
                    if (activeHolds >= 3) {
                        throw new ConflictException('Bạn có 3 đơn đang giữ nguyên liệu. Hãy hoàn tất/hủy hoặc đối soát đơn cũ trước.');
                    }
                    let subtotal = 0;

                    const orderItems: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];

                    // Tính giá từng sản phẩm.
                    for (const item of dto.items) {
                        const result = await this.pricingService.calculateItem(tx, item);

                        subtotal += result.lineTotal;

                        orderItems.push({
                            productId: result.product.id,
                            size: item.size,
                            qty: item.qty,
                            sugar: item.sugar ?? "100%",
                            ice: item.ice ?? "100%",
                            note: item.note?.trim() || null,
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

                    // PostgreSQL numeric(12,2) lưu tối đa 9.999.999.999,99 VND.
                    if (!Number.isSafeInteger(subtotal) || subtotal <= 0 || subtotal > 9_999_999_999) {
                        throw new BadRequestException("Tổng tiền không hợp lệ");
                    }

                    // ----------------------------------------------
                    // COUPON
                    // ----------------------------------------------

                    let couponId: string | undefined;
                    let discountAmount = 0;

                    if (dto.couponCode?.trim()) {
                        const coupon = await tx.coupon.findUnique({
                            where: {
                                code: dto.couponCode.trim().toUpperCase(),
                            },
                        });

                        const now = new Date();

                        if (
                            !coupon ||
                            !coupon.isActive ||
                            coupon.usedCount + coupon.reservedCount >= coupon.maxUses ||
                            coupon.validFrom > now ||
                            coupon.validTo <= now ||
                            subtotal < Number(coupon.minOrderValue)
                        ) {
                            throw new BadRequestException("Mã giảm giá không hợp lệ");
                        }

                        // Kiểm tra voucher sở hữu của người dùng.
                        const ownedVoucher = await tx.userVoucher.findUnique({
                            where: {
                                userId_couponId: {
                                    userId,
                                    couponId: coupon.id,
                                },
                            },
                        });

                        if (
                            ownedVoucher &&
                            (ownedVoucher.usedAt || ownedVoucher.usedOrderId || ownedVoucher.reservedOrderId)
                        ) {
                            throw new BadRequestException("Voucher đã được sử dụng");
                        }

                        if (!ownedVoucher) {
                            // Nhất quán với PaymentsService: coupon đã cấp dạng
                            // voucher cá nhân cho người khác thì không còn là mã công khai.
                            const privateVoucher = await tx.userVoucher.findFirst({
                                where: { couponId: coupon.id },
                                select: { id: true },
                            });
                            if (privateVoucher) {
                                throw new ForbiddenException("Voucher không thuộc tài khoản");
                            }
                        }

                        couponId = coupon.id;

                        discountAmount =
                            coupon.discountType === "PERCENT"
                                ? Math.round((subtotal * Number(coupon.discountValue)) / 100)
                                : Number(coupon.discountValue);

                        discountAmount = Math.min(discountAmount, subtotal);
                    }

                    // ----------------------------------------------
                    // LOYALTY POINTS
                    // ----------------------------------------------

                    const pointsUsed = dto.pointsToUse ?? 0;

                    if (!Number.isInteger(pointsUsed) || pointsUsed < 0) {
                        throw new BadRequestException("Số điểm không hợp lệ");
                    }

                    if (pointsUsed > 0) {
                        const user = await tx.user.findUnique({
                            where: { id: userId },
                        });

                        if (!user || user.loyaltyPoints - user.reservedPoints < pointsUsed) {
                            throw new BadRequestException("Không đủ điểm tích lũy");
                        }
                    }

                    // Quy ước demo: 1 điểm = 500 đồng.
                    const pointsDiscount = pointsUsed * 500;

                    if (
                        !Number.isSafeInteger(pointsDiscount) ||
                        discountAmount + pointsDiscount > subtotal
                    ) {
                        throw new BadRequestException("Số tiền giảm vượt quá tiền hàng");
                    }

                    // ----------------------------------------------
                    // CREATE ORDER
                    // ----------------------------------------------

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

                            status: OrderStatus.PENDING,

                            statusHistory: {
                                create: {
                                    toStatus: OrderStatus.PENDING,
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

                    await this.reserveOrderResources(tx, order.id);

                    return {
                        id: order.id,
                        orderCode: order.orderCode,
                        status: order.status,
                        total: Number(order.total),
                    };
                },
                {
                    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                },
            );
        } catch (error: any) {
            if (error?.code === "P2002" || error?.code === "P2034") {
                const saved = await this.prisma.order.findUnique({
                    where: { idempotencyKey },
                });

                if (saved) {
                    if (saved.userId !== userId || saved.requestHash !== requestHash) {
                        throw new ConflictException(
                            "Idempotency-Key đã dùng cho yêu cầu khác",
                        );
                    }

                    return {
                        id: saved.id,
                        orderCode: saved.orderCode,
                        status: saved.status,
                        total: Number(saved.total),
                    };
                }

                throw new ConflictException(
                    "Đơn đang được xử lý, vui lòng thử lại với cùng key",
                );
            }

            throw error;
        }
    }

    // ====================================================
    // GET MY ORDERS
    // ====================================================

    async mine(userId: string) {
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

    // Hàng đợi đơn cho nhân viên/quản trị (không lộ token hay passwordHash).
    async queue(role: string, limit = 50) {
        if (role !== 'STAFF' && role !== 'ADMIN') {
            throw new ForbiddenException('Chỉ nhân viên được xem hàng đợi');
        }
        return this.prisma.order.findMany({
            where: { status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY] } },
            orderBy: { createdAt: 'asc' },
            take: Math.min(100, Math.max(1, limit)),
            include: { orderItems: { include: { product: { select: { name: true } },
                toppings: { include: { topping: { select: { name: true } } } } } } },
        });
    }

    // ====================================================
    // CHANGE ORDER STATUS
    // ====================================================

    async changeStatus(
        orderId: string,
        newStatus: "PREPARING" | "READY" | "COMPLETED",
        role: string,
        performedBy?: string,
    ) {
        if (role !== "ADMIN" && role !== "STAFF") {
            throw new ForbiddenException("Bạn không có quyền cập nhật đơn hàng");
        }

        try {
            return await this.prisma.$transaction(
                async (tx) => {
                    const order = await tx.order.findUnique({
                        where: { id: orderId },
                    });

                    if (!order) {
                        throw new NotFoundException("Không tìm thấy đơn hàng");
                    }

                    assertTransition(order.status, newStatus);
                    // Tồn kho đã trừ ở bước thanh toán PAID.

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
                        throw new ConflictException("Trạng thái đơn đã bị thay đổi");
                    }
                    // Điểm đã cộng ở bước thanh toán, không cộng lần hai.

                    await tx.orderStatusHistory.create({
                        data: {
                            orderId,
                            fromStatus: order.status,
                            toStatus: newStatus,
                            changedBy: performedBy,
                        },
                    });

                    return tx.order.findUniqueOrThrow({
                        where: { id: orderId },
                    });
                },
                {
                    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                },
            );
        } catch (error: any) {
            if (error?.code === "P2034") {
                throw new ConflictException("Đơn đã thay đổi, vui lòng thử lại");
            }

            throw error;
        }
    }

    // ====================================================
    // CANCEL ORDER
    // ====================================================

    async cancel(orderId: string, userId: string) {
        try {
            return await this.prisma.$transaction(
                async (tx) => {
                    const order = await tx.order.findFirst({
                        where: {
                            id: orderId,
                            userId,
                        },
                    });

                    if (!order) {
                        throw new NotFoundException("Không tìm thấy đơn hàng");
                    }

                    if (
                        order.status !== OrderStatus.PENDING &&
                        order.status !== OrderStatus.PAYMENT_FAILED &&
                        order.status !== OrderStatus.PAID
                    ) {
                        throw new BadRequestException(
                            "Trạng thái hiện tại không cho phép hủy đơn",
                        );
                    }

                    // Giao dịch chưa rõ kết quả PHẢI đối soát trước. Không hủy để tránh
                    // tạo điều kiện cho khách thanh toán trong khi đơn đã bị giải phóng tài nguyên.
                    const pendingGateway = await tx.payment.findFirst({
                        where: { orderId, paymentMethod: { type: 'GATEWAY' }, status: 'PENDING' },
                    });
                    if (pendingGateway) {
                        throw new ConflictException('Thanh toán đang chờ xác minh với cổng; vui lòng kiểm tra kết quả trước khi hủy');
                    }
                    const confirmedGateway = await tx.payment.findFirst({
                        where: { orderId, paymentMethod: { type: 'GATEWAY' }, status: 'SUCCESS' },
                    });
                    // Nếu đã có tiền tại cổng nhưng đơn chưa PAID, bắt buộc hoàn tất/đối soát
                    // trước. Chỉ đơn PAID (chưa pha chế) mới được HỦY và HOÀN MÔ PHỎNG.
                    if (confirmedGateway && order.status !== OrderStatus.PAID) {
                        throw new ConflictException('Cổng đã ghi nhận tiền nhưng đơn chưa hoàn tất. Cần đối soát trước khi hủy');
                    }
                    // BrewLite đang tích hợp riêng ZaloPay SANDBOX: cho phép hủy đơn PAID
                    // trước khi pha chế và ghi nhận hoàn MÔ PHỎNG ở sổ cái nội bộ.
                    // Không gọi Refund API, KHÔNG khẳng định tiền đã về lại ví ZaloPay.
                    // Phương thức cổng khác / ZaloPay production không được phép áp dụng.
                    if (confirmedGateway && order.status === OrderStatus.PAID) {
                        const sandboxCreateUrl = process.env.ZALOPAY_CREATE_URL ||
                            'https://sb-openapi.zalopay.vn/v2/create';
                        if (confirmedGateway.methodCode !== 'ZALOPAY' ||
                            sandboxCreateUrl !== 'https://sb-openapi.zalopay.vn/v2/create') {
                            throw new ConflictException('Chỉ hỗ trợ hủy mô phỏng đối với ZaloPay Sandbox');
                        }
                    }
                    assertTransition(order.status, OrderStatus.CANCELLED);
                    let simulatedRefundAmount = 0;

                    // ----------------------------------------------
                    // CANCEL ORDER
                    // ----------------------------------------------

                    const updated = await tx.order.updateMany({
                        where: {
                            id: orderId,
                            userId,
                            status: order.status,
                        },
                        data: {
                            status: OrderStatus.CANCELLED,
                        },
                    });

                    if (updated.count !== 1) {
                        throw new ConflictException("Trạng thái đơn đã bị thay đổi");
                    }

                    // Giải phóng toàn bộ tài nguyên giữ trước nếu đơn chưa nhận tiền.
                    // Giao dịch chưa rõ trạng thái đã bị chặn trước transaction này.
                    if (order.status !== OrderStatus.PAID) {
                        await this.releaseOrderResources(tx, orderId);
                    }

                    // ----------------------------------------------
                    // REFUND PAID ORDER
                    // ----------------------------------------------

                    if (order.status === OrderStatus.PAID) {
                        const payment = await tx.payment.findFirst({
                            where: {
                                orderId,
                                status: "SUCCESS",
                            },
                            orderBy: {
                                createdAt: "desc",
                            },
                        });

                        // Đơn tổng 0 VND được xác nhận nội bộ, không có payment.
                        // Chỉ cho phép thiếu payment nếu tổng đúng bằng 0.
                        if (!payment && Number(order.total) !== 0) {
                            throw new ConflictException(
                                "Không tìm thấy giao dịch thanh toán thành công",
                            );
                        }

                        if (payment) {
                            if (payment.refundedAmount.greaterThan(0)) {
                                throw new ConflictException('Giao dịch này đã được ghi nhận hoàn mô phỏng trước đó');
                            }
                            // Chỉ ghi nhận hoàn MÔ PHỎNG tại BrewLite (bao gồm ZaloPay Sandbox).
                            // refundedAmount ở đây là số liệu DEMO, KHÔNG phải hoàn tiền thật về ví.
                            simulatedRefundAmount = Number(payment.amount);
                            await tx.payment.update({
                                where: { id: payment.id },
                                data: {
                                    refundedAmount: payment.amount,
                                    refundedAt: payment.amount.greaterThan(0) ? new Date() : null,
                                },
                            });
                        }

                        // Hoàn nguyên liệu đã trừ khi PAID, trước lúc pha chế.
                        const consumed = await tx.ingredientMovement.findMany({
                            where: { orderId, movementType: "CONSUMPTION" },
                            orderBy: { ingredientId: "asc" },
                        });
                        for (const move of consumed) {
                            const ingredient = await tx.ingredient.findUniqueOrThrow({where: {id: move.ingredientId}});
                            const quantity = move.quantityChange.negated();
                            const changed = await tx.ingredient.updateMany({
                                where: {id: ingredient.id, version: ingredient.version},
                                data: {stockQty: {increment: quantity}, version: {increment: 1}, updatedAt: new Date()},
                            });
                            if (changed.count !== 1) throw new ConflictException("Tồn kho vừa thay đổi, hãy thử lại");
                            await tx.ingredientMovement.create({data: {
                                    ingredientId: ingredient.id, orderId, movementType: "ADJUST",
                                    expectedVersion: ingredient.version, quantityChange: quantity,
                                    stockBefore: ingredient.stockQty, stockAfter: ingredient.stockQty.add(quantity),
                                    note: "Hoàn nguyên liệu khi hủy đơn đã thanh toán",
                                }});
                        }

                        // Hoàn tác điểm EARN được cộng khi thanh toán.
                        const earned = await tx.loyaltyTransaction.findFirst({where: {orderId, type: 'EARN'}});
                        if (earned) {
                            // Khách có thể đã sử dụng điểm vừa được thưởng.
                            // Trừ số điểm còn lại, phần thiếu ghi nợ để khấu trừ vào lần EARN tiếp theo.
                            const account = await tx.user.findUniqueOrThrow({where: {id: userId}});
                            const deducted = Math.min(account.loyaltyPoints - account.reservedPoints, earned.points);
                            await tx.user.update({where: {id: userId}, data: {
                                    loyaltyPoints: {decrement: deducted},
                                    loyaltyDebt: {increment: earned.points - deducted},
                                }});
                            await tx.loyaltyTransaction.create({data: {
                                    userId, orderId, points: earned.points,
                                    type: 'REVERSAL', reversesTransactionId: earned.id,
                                }});
                        }

                        // --------------------------------------------
                        // RESTORE COUPON
                        // --------------------------------------------

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
                                throw new ConflictException(
                                    "Không thể hoàn lượt sử dụng mã giảm giá",
                                );
                            }

                            // Chỉ mở lại voucher được dùng bởi chính đơn này.
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

                        // --------------------------------------------
                        // REVERSE LOYALTY POINTS
                        // --------------------------------------------

                        // Hoàn lại điểm REDEEM khi hủy đơn đã thanh toán.
                        if (order.pointsUsed > 0) {
                            const redeemed = await tx.loyaltyTransaction.findFirst({
                                where: { orderId, type: "REDEEM" },
                            });
                            if (!redeemed || redeemed.points !== order.pointsUsed) {
                                throw new ConflictException(
                                    "Dữ liệu điểm đã sử dụng không khớp",
                                );
                            }

                            const account = await tx.user.findUniqueOrThrow({ where: { id: userId } });
                            const offsetDebt = Math.min(account.loyaltyDebt, redeemed.points);
                            await tx.user.update({
                                where: { id: userId },
                                data: {
                                    loyaltyPoints: { increment: redeemed.points - offsetDebt },
                                    loyaltyDebt: { decrement: offsetDebt },
                                },
                            });
                            await tx.loyaltyTransaction.create({
                                data: {
                                    userId,
                                    orderId,
                                    points: redeemed.points,
                                    type: "REVERSAL",
                                    reversesTransactionId: redeemed.id,
                                },
                            });
                        }
                    }

                    // ----------------------------------------------
                    // STATUS HISTORY
                    // ----------------------------------------------

                    await tx.orderStatusHistory.create({
                        data: {
                            orderId,
                            fromStatus: order.status,
                            toStatus: OrderStatus.CANCELLED,
                        },
                    });

                    const cancelledOrder = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
                    return {
                        order: cancelledOrder,
                        previousStatus: order.status,
                        refund: {
                            mode: simulatedRefundAmount > 0 ? 'SIMULATED' : 'NONE',
                            amount: simulatedRefundAmount,
                            actualGatewayRefund: false,
                        },
                    };
                },
                {
                    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                },
            );
        } catch (error: any) {
            if (error?.code === "P2034") {
                throw new ConflictException("Đơn đang được xử lý, vui lòng thử lại");
            }

            throw error;
        }
    }

    // ====================================================
    // CONSUME INGREDIENTS
    // ====================================================

    async consumeIngredients(
        tx: Prisma.TransactionClient,
        orderId: string,
        performedBy?: string,
    ) {
        // 1. Lấy đơn hàng cùng các topping.
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
            throw new NotFoundException("Không tìm thấy đơn hàng");
        }

        // Với đơn mới đã HELD, dùng snapshot công thức lúc tạo đơn.
        // Không tính lại công thức đã có thể thay đổi sau khi người dùng quét QR.
        if (order.reservationStatus === 'HELD') {
            const rows = await tx.orderIngredientReservation.findMany({
                where: { orderId }, orderBy: { ingredientId: 'asc' },
            });
            if (!rows.length) throw new ConflictException('Thiếu dữ liệu nguyên liệu đã giữ');
            const consumed = await tx.ingredientMovement.findFirst({
                where: { orderId, movementType: 'CONSUMPTION' },
            });
            if (consumed) throw new ConflictException('Đơn đã xuất kho');
            for (const row of rows) {
                const ingredient = await tx.ingredient.findUniqueOrThrow({ where: { id: row.ingredientId } });
                if (!ingredient.isActive || ingredient.stockQty.lt(row.quantity) ||
                    ingredient.reservedQty.lt(row.quantity)) {
                    throw new ConflictException('Tồn kho đã giữ không còn khớp, cần đối soát');
                }
                const stockAfter = ingredient.stockQty.sub(row.quantity);
                const updated = await tx.ingredient.updateMany({
                    where: { id: row.ingredientId, version: ingredient.version,
                        stockQty: { gte: row.quantity }, reservedQty: { gte: row.quantity } },
                    data: { stockQty: { decrement: row.quantity },
                        reservedQty: { decrement: row.quantity }, version: { increment: 1 },
                        updatedAt: new Date() },
                });
                if (updated.count !== 1) throw new ConflictException('Tồn kho vừa thay đổi, cần thử lại');
                await tx.ingredientMovement.create({ data: {
                    ingredientId: row.ingredientId, orderId, performedBy: performedBy ?? null,
                    movementType: 'CONSUMPTION', expectedVersion: ingredient.version,
                    quantityChange: row.quantity.negated(), stockBefore: ingredient.stockQty,
                    stockAfter, note: 'Xuất kho từ nguyên liệu đã giữ cho đơn',
                } });
            }
            return { orderId, consumedIngredients: rows.length };
        }
        if (order.reservationStatus === 'RELEASED' || order.reservationStatus === 'CONSUMED') {
            throw new ConflictException('Đơn không còn quyền sử dụng nguyên liệu đã giữ');
        }

        // 2. Kiểm tra đơn đã xuất kho hay chưa.
        const existingMovement = await tx.ingredientMovement.findFirst({
            where: {
                orderId,
                movementType: "CONSUMPTION",
            },
        });

        if (existingMovement) {
            throw new ConflictException("Đơn hàng đã được xuất nguyên liệu trước đó");
        }

        // Map: ingredientId -> tổng số lượng cần dùng.
        const requiredIngredients = new Map<string, Prisma.Decimal>();

        const addRequiredIngredient = (
            ingredientId: string,
            quantity: Prisma.Decimal,
        ) => {
            const current =
                requiredIngredients.get(ingredientId) ?? new Prisma.Decimal(0);

            requiredIngredients.set(ingredientId, current.add(quantity));
        };

        // 3. Tính nguyên liệu của sản phẩm theo size.
        for (const item of order.orderItems) {
            const productRecipes = await tx.productIngredient.findMany({
                where: {
                    productId: item.productId,
                    size: item.size,
                },
            });

            if (productRecipes.length === 0) {
                throw new ConflictException(
                    `Chưa có công thức nguyên liệu cho sản phẩm ${item.productId}, size ${item.size}`,
                );
            }

            for (const recipe of productRecipes) {
                const requiredQuantity = recipe.quantity.mul(item.qty);

                addRequiredIngredient(recipe.ingredientId, requiredQuantity);
            }

            // 4. Tính nguyên liệu của topping.
            for (const itemTopping of item.toppings) {
                const toppingRecipes = await tx.toppingIngredient.findMany({
                    where: {
                        toppingId: itemTopping.toppingId,
                    },
                });

                if (toppingRecipes.length === 0) {
                    throw new ConflictException(
                        `Chưa có công thức nguyên liệu cho topping ${itemTopping.toppingId}`,
                    );
                }

                for (const recipe of toppingRecipes) {
                    const requiredQuantity = recipe.quantity
                        .mul(itemTopping.servings)
                        .mul(item.qty);

                    addRequiredIngredient(recipe.ingredientId, requiredQuantity);
                }
            }
        }

        // 5. Kiểm tra và trừ kho.
        // Cố định thứ tự cập nhật để giảm deadlock khi nhiều đơn cùng xuất kho.
        const sortedIngredients = [...requiredIngredients.entries()]
            .sort(([a], [b]) => a.localeCompare(b));
        for (const [ingredientId, requiredQuantity] of sortedIngredients) {
            const ingredient = await tx.ingredient.findUnique({
                where: {
                    id: ingredientId,
                },
            });

            if (!ingredient || !ingredient.isActive) {
                throw new NotFoundException(
                    `Nguyên liệu ${ingredientId} không tồn tại hoặc đã ngừng hoạt động`,
                );
            }

            if (ingredient.stockQty.sub(ingredient.reservedQty).lessThan(requiredQuantity)) {
                throw new ConflictException(
                    `Không đủ nguyên liệu ${ingredient.name}. ` +
                    `Tồn kho: ${ingredient.stockQty.toString()} ${ingredient.unit}, ` +
                    `cần: ${requiredQuantity.toString()} ${ingredient.unit}`,
                );
            }

            const stockBefore = ingredient.stockQty;
            const stockAfter = stockBefore.sub(requiredQuantity);

            // Optimistic locking:
            // Chỉ cập nhật nếu version và tồn kho vẫn đúng
            // với dữ liệu vừa đọc.
            const result = await tx.ingredient.updateMany({
                where: {
                    id: ingredientId,
                    version: ingredient.version,
                    stockQty: {
                        gte: ingredient.reservedQty.add(requiredQuantity),
                    },
                    reservedQty: ingredient.reservedQty,
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
                throw new ConflictException(
                    `Tồn kho nguyên liệu ${ingredient.name} vừa thay đổi. Vui lòng thử lại`,
                );
            }

            // 6. Ghi lịch sử xuất nguyên liệu.
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
}
