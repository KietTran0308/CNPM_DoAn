import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { OrdersService, PricingService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { VnpayService } from '../payments/vnpay.service';
import { PrismaService } from '../prisma.service';

// Chay voi PostgreSQL rieng: TEST_DATABASE_URL phai tro den database brewlite_test.
// Khong chay kiem thu nay tren database su dung that.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

integration('Hai don thanh toan dong thoi - ton kho', () => {
    let prisma: PrismaClient;
    const userIds: string[] = [];
    let productId: string;
    let ingredientId: string;
    const orderIds: string[] = [];

    beforeAll(async () => {
        const dbName = new URL(testDatabaseUrl!).pathname.slice(1);
        if (dbName !== 'brewlite_test') {
            throw new Error('Chi duoc test tren database ten brewlite_test');
        }

        prisma = new PrismaClient({ datasources: { db: { url: testDatabaseUrl! } } });
        await prisma.$connect();
        const suffix = randomUUID().replace(/-/g, '').slice(0, 16);
        for (let i = 0; i < 2; i++) {
            const user = await prisma.user.create({
                data: {
                    email: `stock-${suffix}-${i}@example.invalid`,
                    fullName: `Khach test ${i + 1}`,
                    passwordHash: 'chi-dung-cho-test',
                },
            });
            userIds.push(user.id);
        }

        const product = await prisma.product.create({
            data: { code: `TESTP${suffix}`, name: 'Mon test', category: 'Test' },
        });
        productId = product.id;

        const ingredient = await prisma.ingredient.create({
            data: {
                code: `TESTI${suffix}`,
                name: 'Nguyen lieu test',
                unit: 'g',
                stockQty: new Prisma.Decimal('1.000'),
            },
        });
        ingredientId = ingredient.id;

        await prisma.productSizePrice.create({
            data: { productId, size: 'M', price: new Prisma.Decimal(20000) },
        });
        await prisma.productIngredient.create({
            data: {
                productId,
                ingredientId,
                size: 'M',
                quantity: new Prisma.Decimal('1.000'),
            },
        });

        for (let i = 0; i < 2; i++) {
            const order = await prisma.order.create({
                data: {
                    userId: userIds[i],
                    subtotal: new Prisma.Decimal(20000),
                    total: new Prisma.Decimal(20000),
                    expiresAt: new Date(Date.now() + 15 * 60_000),
                },
            });
            orderIds.push(order.id);
            await prisma.orderItem.create({
                data: {
                    orderId: order.id,
                    productId,
                    size: 'M',
                    qty: 1,
                    basePrice: new Prisma.Decimal(20000),
                    unitPrice: new Prisma.Decimal(20000),
                    lineTotal: new Prisma.Decimal(20000),
                },
            });
        }
    });

    afterAll(async () => {
        if (!prisma) return;
        try {
            if (orderIds.length) {
                await prisma.ingredientMovement.deleteMany({ where: { orderId: { in: orderIds } } });
                await prisma.loyaltyTransaction.deleteMany({ where: { orderId: { in: orderIds } } });
                await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
                await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } });
                await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
                await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
            }
            if (productId) {
                await prisma.productIngredient.deleteMany({ where: { productId } });
                await prisma.productSizePrice.deleteMany({ where: { productId } });
                await prisma.product.delete({ where: { id: productId } });
            }
            if (ingredientId) await prisma.ingredient.delete({ where: { id: ingredientId } });
            for (const userId of userIds) {
                await prisma.user.delete({ where: { id: userId } });
            }
        } finally {
            await prisma.$disconnect();
        }
    });

    it('chi 1 don PAID khi kho chi du 1 ly', async () => {
        const ordersService = new OrdersService(prisma as PrismaService, new PricingService());
        const paymentsService = new PaymentsService(prisma as PrismaService, {} as VnpayService, ordersService);

        const results = await Promise.allSettled(orderIds.map((orderId, index) =>
            paymentsService.pay(userIds[index], `stock-test-${index}-${randomUUID()}`, {
                orderId,
                method: 'WALLET',
                simulateFailure: false,
            }),
        ));

        expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
        expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);

        const ingredient = await prisma.ingredient.findUniqueOrThrow({ where: { id: ingredientId } });
        const paidCount = await prisma.order.count({ where: { id: { in: orderIds }, status: 'PAID' } });
        const movements = await prisma.ingredientMovement.count({
            where: { orderId: { in: orderIds }, movementType: 'CONSUMPTION' },
        });
        const paymentCount = await prisma.payment.count({
            where: { orderId: { in: orderIds }, status: 'SUCCESS' },
        });

        expect(Number(ingredient.stockQty)).toBe(0);
        expect(ingredient.version).toBe(1);
        expect(paidCount).toBe(1);
        expect(movements).toBe(1);
        expect(paymentCount).toBe(1);
    });
});
