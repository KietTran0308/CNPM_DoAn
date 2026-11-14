// Chỉ chạy với TEST_DATABASE_URL trỏ đến DB brewlite_test đã có schema mới.
// KHÔNG chạy với dữ liệu Render đang dùng.
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient, Size } from '@prisma/client';
import { OrdersService, PricingService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { ZalopayService } from '../payments/zalopay.service';
import { PrismaService } from '../prisma.service';

const url = process.env.TEST_DATABASE_URL;
const test = url ? describe : describe.skip;

test('Giữ trước tài nguyên trong giao dịch chờ thanh toán', () => {
    let db: PrismaClient;
    let userId: string;
    let productId: string;
    let ingredientId: string;
    let couponId: string;
    const orderIds: string[] = [];
    const prevFlag = process.env.ENABLE_DEMO_PAYMENTS;

    beforeAll(async () => {
        if (new URL(url!).pathname.replace(/^\//, '') !== 'brewlite_test') {
            throw new Error('Chỉ chạy trên database tên brewlite_test');
        }
        db = new PrismaClient({ datasources: { db: { url: url! } } });
        await db.$connect();
        process.env.ENABLE_DEMO_PAYMENTS = 'true';
        // Test DB only: demo payment methods are disabled by default in production.
        await db.paymentMethod.upsert({
            where: { code: 'WALLET' },
            create: { code: 'WALLET', name: 'Ví nội bộ (test)', type: 'INTERNAL', isActive: true },
            update: { isActive: true },
        });
        const suffix = randomUUID().replace(/-/g, '').slice(0, 16);
        const user = await db.user.create({ data: {
            email: `reservation-${suffix}@example.invalid`,
            fullName: 'Kiểm thử giữ tài nguyên', passwordHash: 'no-login', loyaltyPoints: 8,
        } });
        userId = user.id;
        const product = await db.product.create({ data: {
            code: `RSP${suffix}`, name: 'Test giữ kho', category: 'Test',
        } });
        productId = product.id;
        const ingredient = await db.ingredient.create({ data: {
            code: `RSI${suffix}`, name: 'Test kho', unit: 'g',
            stockQty: new Prisma.Decimal('1.000'),
        } });
        ingredientId = ingredient.id;
        await db.productSizePrice.create({ data: { productId, size: Size.M, price: 20000 } });
        await db.productIngredient.create({ data: {
            productId, size: Size.M, ingredientId, quantity: new Prisma.Decimal('1.000'),
        } });
        const now = new Date();
        const coupon = await db.coupon.create({ data: {
            code: `RSC${suffix}`, discountType: 'FIXED', discountValue: 1000,
            maxUses: 1, validFrom: new Date(now.getTime() - 60_000),
            validTo: new Date(now.getTime() + 3600_000),
        } });
        couponId = coupon.id;
    });

    afterAll(async () => {
        if (prevFlag === undefined) delete process.env.ENABLE_DEMO_PAYMENTS;
        else process.env.ENABLE_DEMO_PAYMENTS = prevFlag;
        if (!db) return;
        try {
            await db.ingredientMovement.deleteMany({ where: { orderId: { in: orderIds } } });
            await db.loyaltyTransaction.deleteMany({ where: { orderId: { in: orderIds } } });
            await db.payment.deleteMany({ where: { orderId: { in: orderIds } } });
            await db.orderIngredientReservation.deleteMany({ where: { orderId: { in: orderIds } } });
            await db.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } });
            await db.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
            await db.order.deleteMany({ where: { id: { in: orderIds } } });
            if (productId) {
                await db.productIngredient.deleteMany({ where: { productId } });
                await db.productSizePrice.deleteMany({ where: { productId } });
                await db.product.delete({ where: { id: productId } });
            }
            if (ingredientId) await db.ingredient.delete({ where: { id: ingredientId } });
            if (couponId) await db.coupon.delete({ where: { id: couponId } });
            if (userId) await db.user.delete({ where: { id: userId } });
        } finally {
            await db.$disconnect();
        }
    });

    it('giữ kho, voucher và điểm; hoàn giữ khi hủy; sau đó tiêu thụ đúng một lần', async () => {
        const orders = new OrdersService(db as PrismaService, new PricingService());
        const payments = new PaymentsService(db as PrismaService, {} as ZalopayService, orders);
        const dto = {
            items: [{ productId, size: Size.M as const, qty: 1 }],
            couponCode: (await db.coupon.findUniqueOrThrow({ where: { id: couponId } })).code,
            pointsToUse: 2,
        };
        const first = await orders.create(userId, dto, randomUUID());
        orderIds.push(first.id);
        expect((await db.order.findUniqueOrThrow({ where: { id: first.id } })).reservationStatus).toBe('HELD');
        let ingredient = await db.ingredient.findUniqueOrThrow({ where: { id: ingredientId } });
        expect(Number(ingredient.stockQty)).toBe(1);
        expect(Number(ingredient.reservedQty)).toBe(1);
        expect((await db.coupon.findUniqueOrThrow({ where: { id: couponId } })).reservedCount).toBe(1);
        expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).reservedPoints).toBe(2);

        // Cùng stock/coupon chỉ cho một đơn được giữ. Đơn bị từ chối không được ghi DB.
        await expect(orders.create(userId, dto, randomUUID())).rejects.toThrow();
        await orders.cancel(first.id, userId);
        ingredient = await db.ingredient.findUniqueOrThrow({ where: { id: ingredientId } });
        expect(Number(ingredient.stockQty)).toBe(1);
        expect(Number(ingredient.reservedQty)).toBe(0);
        expect((await db.coupon.findUniqueOrThrow({ where: { id: couponId } })).reservedCount).toBe(0);
        expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).reservedPoints).toBe(0);

        const next = await orders.create(userId, dto, randomUUID());
        orderIds.push(next.id);
        await payments.pay(userId, randomUUID(), { orderId: next.id, method: 'WALLET' });
        const paid = await db.order.findUniqueOrThrow({ where: { id: next.id } });
        expect(paid.status).toBe('PAID');
        expect(paid.reservationStatus).toBe('CONSUMED');
        ingredient = await db.ingredient.findUniqueOrThrow({ where: { id: ingredientId } });
        expect(Number(ingredient.stockQty)).toBe(0);
        expect(Number(ingredient.reservedQty)).toBe(0);
        expect((await db.coupon.findUniqueOrThrow({ where: { id: couponId } })).usedCount).toBe(1);
        expect((await db.coupon.findUniqueOrThrow({ where: { id: couponId } })).reservedCount).toBe(0);
        expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).reservedPoints).toBe(0);
        expect(await db.ingredientMovement.count({ where: {
            orderId: next.id, movementType: 'CONSUMPTION',
        } })).toBe(1);
    });
});
