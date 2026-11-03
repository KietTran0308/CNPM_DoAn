import { CurrentUser } from "../auth/jwt.guard";
import { PaymentsService } from "./payments.service";
export declare class PaymentDto {
    orderId: string;
    method: "WALLET" | "CARD";
    simulateFailure?: boolean;
}
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    pay(req: {
        user: CurrentUser;
    }, key: string, body: PaymentDto): Promise<{
        replay: boolean;
        order: {
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
        };
        payment: {
            order: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            idempotencyKey: string;
            orderId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            method: import(".prisma/client").$Enums.PaymentMethod;
            providerRef: string | null;
        };
    } | {
        replay: boolean;
        order: {
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
        };
        payment: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            idempotencyKey: string;
            orderId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            method: import(".prisma/client").$Enums.PaymentMethod;
            providerRef: string | null;
        };
        earnedPoints: number;
    }>;
}
