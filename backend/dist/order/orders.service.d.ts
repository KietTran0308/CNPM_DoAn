import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import type { CreateOrderDto, OrderItemDto } from "./orders.controller";
export declare function normalizeToppingSelections(item: OrderItemDto): Array<{
    toppingId: string;
    servings: number;
}>;
export declare class PricingService {
    calculateItem(tx: Prisma.TransactionClient, item: OrderItemDto): Promise<{
        product: {
            id: string;
            name: string;
            code: string;
            category: string;
            description: string | null;
            imageUrl: string | null;
            imageKey: string | null;
            version: number;
            isActive: boolean;
        };
        toppings: {
            topping: {
                id: string;
                name: string;
                code: string;
                isActive: boolean;
                price: Prisma.Decimal;
            };
            servings: number;
        }[];
        basePrice: number;
        unitPrice: number;
        lineTotal: number;
    }>;
}
export declare class OrdersService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly pricingService;
    constructor(prisma: PrismaService, pricingService: PricingService);
    private expiryTimer?;
    onModuleInit(): void;
    onModuleDestroy(): void;
    private expirePendingOrders;
    create(userId: string, dto: CreateOrderDto, key?: string): Promise<{
        id: string;
        orderCode: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: number;
    }>;
    mine(userId: string): Promise<({
        user: {
            fullName: string;
            phone: string;
        };
        coupon: {
            code: string;
        };
        orderItems: ({
            product: {
                id: string;
                name: string;
                code: string;
                category: string;
                description: string | null;
                imageUrl: string | null;
                imageKey: string | null;
                version: number;
                isActive: boolean;
            };
            toppings: ({
                topping: {
                    id: string;
                    name: string;
                    code: string;
                    isActive: boolean;
                    price: Prisma.Decimal;
                };
            } & {
                id: string;
                price: Prisma.Decimal;
                servings: number;
                orderItemId: string;
                toppingId: string;
            })[];
        } & {
            id: string;
            productId: string;
            size: import(".prisma/client").$Enums.Size;
            qty: number;
            orderId: string;
            basePrice: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            lineTotal: Prisma.Decimal;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            idempotencyKey: string;
            orderId: string;
            amount: Prisma.Decimal;
            method: import(".prisma/client").$Enums.PaymentMethod;
            providerRef: string | null;
            refundedAmount: Prisma.Decimal;
            refundedAt: Date | null;
        }[];
        statusHistory: {
            id: string;
            fromStatus: import(".prisma/client").$Enums.OrderStatus | null;
            toStatus: import(".prisma/client").$Enums.OrderStatus;
            changedAt: Date;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        orderCode: number;
        userId: string;
        couponId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        subtotal: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        pointsUsed: number;
        pointsDiscount: Prisma.Decimal;
        total: Prisma.Decimal;
        expiresAt: Date;
        updatedAt: Date;
        idempotencyKey: string | null;
        requestHash: string | null;
    })[]>;
    changeStatus(orderId: string, newStatus: "PREPARING" | "READY" | "COMPLETED", role: string, performedBy?: string): Promise<{
        id: string;
        createdAt: Date;
        orderCode: number;
        userId: string;
        couponId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        subtotal: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        pointsUsed: number;
        pointsDiscount: Prisma.Decimal;
        total: Prisma.Decimal;
        expiresAt: Date;
        updatedAt: Date;
        idempotencyKey: string | null;
        requestHash: string | null;
    }>;
    cancel(orderId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        orderCode: number;
        userId: string;
        couponId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        subtotal: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        pointsUsed: number;
        pointsDiscount: Prisma.Decimal;
        total: Prisma.Decimal;
        expiresAt: Date;
        updatedAt: Date;
        idempotencyKey: string | null;
        requestHash: string | null;
    }>;
    private consumeIngredients;
}
