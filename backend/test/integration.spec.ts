/**
 * Chạy với TEST_DATABASE_URL trỏ database TEST RIÊNG có schema BrewLite.
 * Không chạy trên DB thật.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../src/prisma.service';
import { OrdersService } from '../src/orders/orders.service';
import { PricingService } from '../src/orders/pricing.service';
import { PaymentsService } from '../src/payments/payments.service';
import { RewardsService } from '../src/rewards/rewards.service';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';

const describeDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeDb('Task 10 - PostgreSQL thật', () => {
    let db: PrismaClient;
    let orders: OrdersService;
    let payments: PaymentsService;
    let userId: string;

    beforeAll(async () => {
        db = new PrismaClient({
            datasources: { db: { url: process.env.TEST_DATABASE_URL! } },
        });
        await db.$connect();
        await db.sizePrice.upsert({
            where: { size: 'S' }, update: { extraPrice: 0 },
            create: { size: 'S', extraPrice: 0 },
        });
        await db.sizePrice.upsert({
            where: { size: 'M' }, update: { extraPrice: 6000 },
            create: { size: 'M', extraPrice: 6000 },
        });
        const user = await db.user.create({
            data: { email: `test-${Date.now()}@example.com`, fullName: 'Test', passwordHash: 'test' },
        });
        userId = user.id;
        orders = new OrdersService(db as unknown as PrismaService, new PricingService());
        payments = new PaymentsService(db as unknown as PrismaService);
    });
    afterAll(async () => { if (db) await db.$disconnect(); });

    test('gửi hai lần cùng khóa: 1 payment, điểm cộng 1 lần', async () => {
        const code = `pay-${Date.now()}`;
        await db.product.create({
            data: { code, name: 'Món test', price: 30000, stock: 10 },
        });
        const order = await orders.create(userId, {
            items: [{ productCode: code, size: 'S', toppingCodes: [], qty: 2 }],
        });
        const key = `payment-${Date.now()}-repeat`;
        const first = await payments.pay(userId, key, { orderId: order.id, method: 'WALLET' });
        const second = await payments.pay(userId, key, { orderId: order.id, method: 'WALLET' });
        expect(first.replay).toBe(false);
        expect(second.replay).toBe(true);
        expect(await db.payment.count({ where: { orderId: order.id } })).toBe(1);
        expect(await db.loyaltyTransaction.count({
            where: { orderId: order.id, type: 'EARN' },
        })).toBe(1);
    });

    test('hai đơn đặt 1 sản phẩm còn stock=1: chỉ 1 thành công', async () => {
        const code = `stock-${Date.now()}`;
        await db.product.create({
            data: { code, name: 'Món chỉ còn 1', price: 25000, stock: 1 },
        });
        const payload = {
            items: [{ productCode: code, size: 'M' as const, toppingCodes: [], qty: 1 }],
        };
        const result = await Promise.allSettled([
            orders.create(userId, payload), orders.create(userId, payload),
        ]);
        expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
        expect((await db.product.findUniqueOrThrow({ where: { code } })).stock).toBe(0);
    });

    test('hồ sơ, mật khẩu, đổi voucher và hủy đơn PAID mô phỏng', async () => {
        const auth = new AuthService(db as unknown as PrismaService, {} as JwtService);
        const rewards = new RewardsService(db as unknown as PrismaService);
        const passwordHash = await bcrypt.hash('old-test-123', 10);
        await db.user.update({ where: { id: userId }, data: { passwordHash, loyaltyPoints: 150 } });
        const profile = await auth.updateProfile(userId, { fullName: 'Người Thử BrewLite', phone: '0901234567', favoriteBranch: 'Quầy số 1' });
        expect(profile.fullName).toBe('Người Thử BrewLite');
        expect(profile.phone).toBe('0901234567');
        await expect(auth.changePassword(userId, 'sai-mat-khau', 'new-test-123')).rejects.toThrow();
        await auth.changePassword(userId, 'old-test-123', 'new-test-123');
        const hashAfter = (await db.user.findUniqueOrThrow({ where: { id: userId } })).passwordHash;
        expect(await bcrypt.compare('new-test-123', hashAfter)).toBe(true);
        const requestId = randomUUID();
        const redeemed = await rewards.redeem(userId, 'pt-50', requestId);
        const replayed = await rewards.redeem(userId, 'pt-50', requestId);
        expect(redeemed.voucherCode).toBe(replayed.voucherCode);
        expect(replayed.replay).toBe(true);
        expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).loyaltyPoints).toBe(100);
        const productCode = `cancel-${randomUUID().slice(0, 8)}`;
        const product = await db.product.create({ data: { code: productCode, name: 'Trà demo', price: 40000, stock: 2 } });
        const order = await orders.create(userId, { items: [{ productCode, size: 'S', toppingCodes: [], qty: 1 }], voucherCode: redeemed.voucherCode });
        const paid = await payments.pay(userId, `payment-${randomUUID()}`, { orderId: order.id, method: 'CARD' });
        expect(paid.order.status).toBe('PAID');
        expect((await db.coupon.findUniqueOrThrow({ where: { code: redeemed.voucherCode } })).usedCount).toBe(1);
        const cancelled = await orders.cancel(order.id, userId);
        expect(cancelled.status).toBe('CANCELLED');
        expect((await db.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(2);
        expect((await db.coupon.findUniqueOrThrow({ where: { code: redeemed.voucherCode } })).usedCount).toBe(0);
        expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).loyaltyPoints).toBe(100);
        await expect(orders.cancel(order.id, userId)).rejects.toThrow();
    });
});
