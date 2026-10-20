/**
 * Bài test Task 10 chạy trên PostgreSQL test RIÊNG.
 * Cần khai báo TEST_DATABASE_URL và chạy prisma db push với DATABASE_URL=testdb trước khi test.
 * Nếu chưa có DB riêng, Jest bỏ qua các ca integration, không tuyên bố là đã đạt.
 */
import { PrismaClient } from '@prisma/client';
import { OrdersService } from '../src/orders/orders.service';
import { PaymentsService } from '../src/payments/payments.service';
import { PrismaService } from '../src/prisma.service';

const enabled = Boolean(process.env.TEST_DATABASE_URL);
const describeDb = enabled ? describe : describe.skip;
describeDb('Task 10 integration (PostgreSQL riêng)', () => {
  let db: PrismaClient;
  let orders: OrdersService;
  let payments: PaymentsService;
  let userId: string;
  beforeAll(async () => {
    db = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL! } } });
    await db.$connect();
    const u = await db.user.create({ data: { email: `test-${Date.now()}@example.com`, fullName: 'Test', passwordHash: 'no-login' } });
    userId = u.id;
    orders = new OrdersService(db as unknown as PrismaService);
    payments = new PaymentsService(db as unknown as PrismaService);
  });
  afterAll(async () => { if (db) await db.$disconnect(); });
  test('cùng Idempotency-Key chỉ tạo 1 payment và cộng điểm 1 lần', async () => {
    const id = `test-product-${Date.now()}-pay`;
    await db.product.create({ data: { id, name: 'Test', category: 'coffee_viet', price: 30000, imageUrl: '/x.jpg', stock: 10 } });
    const o = await orders.create(userId, { items: [{ productId: id, size: 'S', toppings: [], qty: 2 }] });
    const key = `payment-${Date.now()}-repeat`;
    const a = await payments.pay(userId, key, { orderId: o.id, method: 'WALLET' });
    const b = await payments.pay(userId, key, { orderId: o.id, method: 'WALLET' });
    expect(a.replay).toBe(false);
    expect(b.replay).toBe(true);
    expect(await db.payment.count({ where: { orderId: o.id } })).toBe(1);
    expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).loyaltyPoints).toBe(6);
  });
  test('2 đơn cùng đặt 1 sản phẩm tồn kho 1, chỉ 1 đơn thành công', async () => {
    const id = `test-product-${Date.now()}-stock`;
    await db.product.create({ data: { id, name: 'Test stock', category: 'coffee_viet', price: 25000, imageUrl: '/x.jpg', stock: 1 } });
    const payload = { items: [{ productId: id, size: 'M' as const, toppings: [], qty: 1 }] };
    const result = await Promise.allSettled([orders.create(userId, payload), orders.create(userId, payload)]);
    expect(result.filter(x => x.status === 'fulfilled')).toHaveLength(1);
    expect((await db.product.findUniqueOrThrow({ where: { id } })).stock).toBe(0);
  });
});
