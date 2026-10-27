import { describe, expect, it, jest } from '@jest/globals';
import { assertTransition, canTransition } from './order-state';

describe('Order State Machine', () => {
    it('chấp nhận các bước hợp lệ', () => {
        expect(() => assertTransition('PENDING', 'PAID')).not.toThrow();
        expect(() => assertTransition('PAID', 'PREPARING')).not.toThrow();
        expect(() => assertTransition('PREPARING', 'READY')).not.toThrow();
        expect(() => assertTransition('READY', 'COMPLETED')).not.toThrow();
        expect(() => assertTransition('PAYMENT_FAILED', 'PENDING')).not.toThrow();
        expect(canTransition('PENDING', 'CANCELLED')).toBe(true);
        expect(canTransition('PAID', 'CANCELLED')).toBe(true);
    });

    it('từ chối các bước sai', () => {
        expect(() => assertTransition('PENDING', 'COMPLETED')).toThrow();
        expect(() => assertTransition('COMPLETED', 'PAID')).toThrow();
        expect(() => assertTransition('CANCELLED', 'PAID')).toThrow();
        expect(() => assertTransition('PREPARING', 'CANCELLED')).toThrow();
        expect(() => assertTransition('CANCELLED', 'PENDING')).toThrow();
        expect(() => assertTransition('READY', 'CANCELLED')).toThrow();
    });
});


import { Prisma } from '@prisma/client';
import { PricingService } from './orders.service';
import { ProductSize } from './orders.controller';

describe('PricingService', () => {
    const service = new PricingService();
    const item = {
        productId: '44baa590-43da-5eb0-b5b4-2fa55ac89eb1',
        size: ProductSize.M,
        qty: 2,
        toppingIds: ['be4d54f5-a987-5306-960f-632909bdac15'],
    };

    it('lấy giá đầy đủ theo size, cộng topping rồi nhân số lượng', async () => {
        const tx = {
            product: { findUnique: jest.fn(async () => ({ id: item.productId, isActive: true })) },
            productSizePrice: { findUnique: jest.fn(async () => ({ price: 34000 })) },
            topping: { findMany: jest.fn(async () => [{ id: item.toppingIds[0], price: 9000 }]) },
        } as unknown as Prisma.TransactionClient;

        const result = await service.calculateItem(tx, item);
        expect(result.unitPrice).toBe(43000);
        expect(result.lineTotal).toBe(86000);
    });

    it('từ chối size không có giá trong CSDL', async () => {
        const tx = {
            product: { findUnique: jest.fn(async () => ({ id: item.productId, isActive: true })) },
            productSizePrice: { findUnique: jest.fn(async () => null) },
        } as unknown as Prisma.TransactionClient;

        await expect(service.calculateItem(tx, item)).rejects.toThrow();
    });
});
