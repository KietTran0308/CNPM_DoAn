import { describe, expect, it, jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import { assertTransition, canTransition } from './order-state';
import { PricingService, normalizeToppingSelections } from './orders.service';
import { ProductSize } from './orders.controller';

const PRODUCT_ID = 'c2109f91-894f-5836-872b-fc4c0f04ca5d';
const TOPPING_ID = 'be4d54f5-a987-5306-960f-632909bdac15';

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

describe('PricingService', () => {
    const service = new PricingService();
    const tx = {
        product: {
            findUnique: jest.fn(async () => ({ id: PRODUCT_ID, isActive: true })),
        },
        productSizePrice: {
            findUnique: jest.fn(async () => ({ price: new Prisma.Decimal(34000) })),
        },
        topping: {
            findMany: jest.fn(async () => [
                { id: TOPPING_ID, price: new Prisma.Decimal(9000) },
            ]),
        },
    } as unknown as Prisma.TransactionClient;

    it('nhân số suất topping cho MỖI ly trước khi nhân qty', async () => {
        const result = await service.calculateItem(tx, {
            productId: PRODUCT_ID,
            size: ProductSize.M,
            qty: 2,
            toppings: [{ toppingId: TOPPING_ID, servings: 2 }],
        });
        expect(result.basePrice).toBe(34000);
        expect(result.unitPrice).toBe(52000);
        expect(result.lineTotal).toBe(104000);
        expect(result.toppings[0].servings).toBe(2);
    });

    it('vẫn chấp nhận toppingIds[] cũ với 1 suất/topping', async () => {
        const result = await service.calculateItem(tx, {
            productId: PRODUCT_ID,
            size: ProductSize.M,
            qty: 2,
            toppingIds: [TOPPING_ID],
        });
        expect(result.unitPrice).toBe(43000);
        expect(result.lineTotal).toBe(86000);
        expect(result.toppings[0].servings).toBe(1);
    });

    it('từ chối gửi đồng thời toppingIds và toppings', () => {
        expect(() => normalizeToppingSelections({
            productId: PRODUCT_ID,
            size: ProductSize.M,
            qty: 1,
            toppingIds: [],
            toppings: [],
        })).toThrow();
    });

    it('từ chối topping trùng và số suất bằng 0', () => {
        const base = { productId: PRODUCT_ID, size: ProductSize.M, qty: 1 };
        expect(() => normalizeToppingSelections({
            ...base,
            toppings: [
                { toppingId: TOPPING_ID, servings: 1 },
                { toppingId: TOPPING_ID, servings: 1 },
            ],
        })).toThrow();
        expect(() => normalizeToppingSelections({
            ...base,
            toppings: [{ toppingId: TOPPING_ID, servings: 0 }],
        })).toThrow();
    });

    it('từ chối payload topping không hợp lệ (null / ngoài giới hạn)', () => {
        const base = { productId: PRODUCT_ID, size: ProductSize.M, qty: 1 };
        expect(() => normalizeToppingSelections({
            ...base,
            toppings: null as any,
        })).toThrow();
        expect(() => normalizeToppingSelections({
            ...base,
            toppings: [{ toppingId: TOPPING_ID, servings: 101 }],
        })).toThrow();
    });

    it('từ chối số lượng 101 để tránh đơn khổng lồ', async () => {
        await expect(service.calculateItem(tx, {
            productId: PRODUCT_ID,
            size: ProductSize.M,
            qty: 101,
        })).rejects.toThrow();
    });

    it('từ chối hơn 10 suất topping', () => {
        expect(() => normalizeToppingSelections({
            productId: PRODUCT_ID,
            size: ProductSize.M,
            qty: 1,
            toppings: [{ toppingId: TOPPING_ID, servings: 11 }],
        })).toThrow();
    });

    it('từ chối size không có giá trong CSDL', async () => {
        const badTx = {
            product: { findUnique: jest.fn(async () => ({ id: PRODUCT_ID, isActive: true })) },
            productSizePrice: { findUnique: jest.fn(async () => null) },
        } as unknown as Prisma.TransactionClient;
        await expect(service.calculateItem(badTx, {
            productId: PRODUCT_ID, size: ProductSize.M, qty: 1,
        })).rejects.toThrow();
    });
});
