import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ProductsService } from '../products/products.service';
import type { CreateOrderDto, OrderItemDto } from './orders.controller';
export declare class PricingService {
    calculateItem(tx: Prisma.TransactionClient, item: OrderItemDto): Promise<{
        product: {
            id: string;
            name: string;
            code: string;
            category: string;
            description: string | null;
            price: Prisma.Decimal;
            imageUrl: string | null;
            stock: number;
            version: number;
            isActive: boolean;
        };
        toppings: {
            id: string;
            name: string;
            code: string;
            price: Prisma.Decimal;
            isActive: boolean;
        }[];
        unitPrice: number;
        lineTotal: number;
    }>;
}
export declare class OrdersService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly pricingService;
    private readonly productsService;
    constructor(prisma: PrismaService, pricingService: PricingService, productsService: ProductsService);
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
                price: Prisma.Decimal;
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
                    price: Prisma.Decimal;
                    isActive: boolean;
                };
            } & {
                id: string;
                price: Prisma.Decimal;
                toppingId: string;
                orderItemId: string;
            })[];
        } & {
            id: string;
            productId: string;
            size: import(".prisma/client").$Enums.Size;
            qty: number;
            orderId: string;
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
    changeStatus(orderId: string, newStatus: 'PREPARING' | 'READY' | 'COMPLETED', role: string): Promise<{
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
}
