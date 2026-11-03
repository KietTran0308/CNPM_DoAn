import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { PaymentDto } from './payments.controller';
export declare class PaymentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getReplay;
    pay(userId: string, key: string | undefined, dto: PaymentDto): Promise<{
        replay: boolean;
        order: {
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
        };
        payment: {
            order: {
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
            };
        } & {
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
            subtotal: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            pointsUsed: number;
            pointsDiscount: Prisma.Decimal;
            total: Prisma.Decimal;
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
            amount: Prisma.Decimal;
            method: import(".prisma/client").$Enums.PaymentMethod;
            providerRef: string | null;
            refundedAmount: Prisma.Decimal;
            refundedAt: Date | null;
        };
        earnedPoints: number;
    }>;
}
