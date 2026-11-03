import { Size } from '@prisma/client';
export { Size as ProductSize };
import { CurrentUser } from '../auth/jwt.guard';
import { OrdersService } from './orders.service';
export declare class OrderItemDto {
    productId: string;
    size: Size;
    qty: number;
    toppingIds?: string[];
}
export declare class CreateOrderDto {
    items: OrderItemDto[];
    couponCode?: string;
    pointsToUse?: number;
}
export declare class StatusDto {
    status: 'PREPARING' | 'READY' | 'COMPLETED';
}
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(req: {
        user: CurrentUser;
    }, key: string, dto: CreateOrderDto): Promise<{
        id: string;
        orderCode: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: number;
    }>;
    mine(req: {
        user: CurrentUser;
    }): Promise<({
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
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                stock: number;
                version: number;
                isActive: boolean;
            };
            toppings: ({
                topping: {
                    id: string;
                    name: string;
                    code: string;
                    price: import("@prisma/client/runtime/library").Decimal;
                    isActive: boolean;
                };
            } & {
                id: string;
                price: import("@prisma/client/runtime/library").Decimal;
                toppingId: string;
                orderItemId: string;
            })[];
        } & {
            id: string;
            productId: string;
            size: import(".prisma/client").$Enums.Size;
            qty: number;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            lineTotal: import("@prisma/client/runtime/library").Decimal;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            idempotencyKey: string;
            orderId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            method: import(".prisma/client").$Enums.PaymentMethod;
            providerRef: string | null;
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
        subtotal: import("@prisma/client/runtime/library").Decimal;
        discountAmount: import("@prisma/client/runtime/library").Decimal;
        pointsUsed: number;
        pointsDiscount: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        expiresAt: Date;
        updatedAt: Date;
        idempotencyKey: string | null;
        requestHash: string | null;
    })[]>;
    changeStatus(req: {
        user: CurrentUser;
    }, id: string, dto: StatusDto): Promise<{
        id: string;
        createdAt: Date;
        orderCode: number;
        userId: string;
        couponId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        discountAmount: import("@prisma/client/runtime/library").Decimal;
        pointsUsed: number;
        pointsDiscount: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        expiresAt: Date;
        updatedAt: Date;
        idempotencyKey: string | null;
        requestHash: string | null;
    }>;
    cancel(req: {
        user: CurrentUser;
    }, id: string): Promise<{
        id: string;
        createdAt: Date;
        orderCode: number;
        userId: string;
        couponId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        discountAmount: import("@prisma/client/runtime/library").Decimal;
        pointsUsed: number;
        pointsDiscount: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        expiresAt: Date;
        updatedAt: Date;
        idempotencyKey: string | null;
        requestHash: string | null;
    }>;
}
