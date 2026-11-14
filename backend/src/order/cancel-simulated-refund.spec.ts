import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { OrdersService, PricingService } from './orders.service';
import { PrismaService } from '../prisma.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const ORDER_ID = '22222222-2222-4222-8222-222222222222';

function mockCancellation(status: OrderStatus, methodCode: 'ZALOPAY' | 'WALLET' = 'ZALOPAY',
                          gatewayStatus: PaymentStatus = PaymentStatus.SUCCESS) {
    const order = { id: ORDER_ID, userId: USER_ID, status, total: new Prisma.Decimal(45000),
        couponId: null, pointsUsed: 0 };
    let currentStatus = status;
    const payment = { id: 'payment', orderId: ORDER_ID, amount: new Prisma.Decimal(45000),
        methodCode, status: gatewayStatus, refundedAmount: new Prisma.Decimal(0) };
    const paymentUpdate = jest.fn(async ({ data }: any) => { Object.assign(payment, data); return payment; });
    const orderUpdate = jest.fn(async ({ where, data }: any) => {
        if (where.status !== currentStatus) return { count: 0 };
        currentStatus = data.status;
        return { count: 1 };
    });
    const historyCreate = jest.fn(async ({ data }: any) => data);
    const tx = {
        order: {
            findFirst: jest.fn(async () => ({ ...order, status: currentStatus })),
            updateMany: orderUpdate,
            findUniqueOrThrow: jest.fn(async () => ({ ...order, status: currentStatus })),
        },
        payment: {
            findFirst: jest.fn(async ({ where }: any) => {
                if (where.paymentMethod?.type === 'GATEWAY' && methodCode !== 'ZALOPAY') return null;
                return where.status === payment.status ? payment : null;
            }),
            update: paymentUpdate,
        },
        ingredientMovement: { findMany: jest.fn(async () => []) },
        loyaltyTransaction: { findFirst: jest.fn(async () => null) },
        orderStatusHistory: { create: historyCreate },
    };
    const prisma = { $transaction: (run: (tx: any) => Promise<any>) => run(tx) } as unknown as PrismaService;
    return { service: new OrdersService(prisma, new PricingService()), order, payment, paymentUpdate,
        orderUpdate, historyCreate };
}

describe('Hủy đơn: ZaloPay Sandbox chỉ hoàn mô phỏng', () => {
    it('cho phép hủy PAID ZaloPay Sandbox trước khi pha chế', async () => {
        const mock = mockCancellation(OrderStatus.PAID);
        const result = await mock.service.cancel(ORDER_ID, USER_ID);
        expect(result.order.status).toBe(OrderStatus.CANCELLED);
        expect(result.refund).toEqual({ mode: 'SIMULATED', amount: 45000, actualGatewayRefund: false });
        expect(Number(mock.payment.refundedAmount)).toBe(45000);
        expect(mock.historyCreate).toHaveBeenCalledTimes(1);
    });

    it('chặn hủy PAID ZaloPay nếu không phải endpoint Sandbox', async () => {
        const previous = process.env.ZALOPAY_CREATE_URL;
        process.env.ZALOPAY_CREATE_URL = 'https://openapi.zalopay.vn/v2/create';
        try {
            const mock = mockCancellation(OrderStatus.PAID);
            await expect(mock.service.cancel(ORDER_ID, USER_ID)).rejects.toThrow('Chỉ hỗ trợ hủy mô phỏng');
            expect(mock.paymentUpdate).not.toHaveBeenCalled();
            expect(mock.orderUpdate).not.toHaveBeenCalled();
        } finally {
            if (previous === undefined) delete process.env.ZALOPAY_CREATE_URL;
            else process.env.ZALOPAY_CREATE_URL = previous;
        }
    });

    it('cho phép hoàn tiền mô phỏng chỉ với ví nội bộ đã thanh toán', async () => {
        const mock = mockCancellation(OrderStatus.PAID, 'WALLET');
        const result = await mock.service.cancel(ORDER_ID, USER_ID);
        expect(result.order.status).toBe(OrderStatus.CANCELLED);
        expect(result.refund).toEqual({ mode: 'SIMULATED', amount: 45000, actualGatewayRefund: false });
        expect(Number(mock.payment.refundedAmount)).toBe(45000);
    });

    it('chặn hủy PENDING ZaloPay khi gateway chưa trả kết quả', async () => {
        const mock = mockCancellation(OrderStatus.PENDING, 'ZALOPAY', PaymentStatus.PENDING);
        await expect(mock.service.cancel(ORDER_ID, USER_ID)).rejects.toThrow('chờ xác minh');
        expect(mock.orderUpdate).not.toHaveBeenCalled();
    });

    it('PREPARING không được hủy', async () => {
        const mock = mockCancellation(OrderStatus.PREPARING);
        await expect(mock.service.cancel(ORDER_ID, USER_ID)).rejects.toThrow('không cho phép hủy');
        expect(mock.paymentUpdate).not.toHaveBeenCalled();
    });
});
