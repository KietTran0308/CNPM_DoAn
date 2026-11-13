import { describe, expect, it, jest } from '@jest/globals';
import { OrderStatus, PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
import { OrdersService, PricingService } from './orders.service';
import { PrismaService } from '../prisma.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const ORDER_ID = '22222222-2222-4222-8222-222222222222';

function mockCancellation(status: OrderStatus, gatewayStatus: PaymentStatus = PaymentStatus.SUCCESS) {
    const order = { id: ORDER_ID, userId: USER_ID, status, total: new Prisma.Decimal(45000),
        couponId: null, pointsUsed: 0 };
    let currentStatus = status;
    const payment = { id: 'payment', orderId: ORDER_ID, amount: new Prisma.Decimal(45000),
        method: PaymentMethod.ZALOPAY, status: gatewayStatus,
        refundedAmount: new Prisma.Decimal(0) };
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

describe('Cancel PAID with simulated ZaloPay refund', () => {
    it('PAID -> CANCELLED records simulated refund without calling ZaloPay Refund API', async () => {
        const mock = mockCancellation(OrderStatus.PAID);
        const result = await mock.service.cancel(ORDER_ID, USER_ID);
        expect(result.order.status).toBe(OrderStatus.CANCELLED);
        expect(result.refund).toEqual({ mode: 'SIMULATED', amount: 45000, actualGatewayRefund: false });
        expect(mock.paymentUpdate).toHaveBeenCalledTimes(1);
        expect(mock.historyCreate).toHaveBeenCalledTimes(1);
        expect(Number(mock.payment.refundedAmount)).toBe(45000);
        await expect(mock.service.cancel(ORDER_ID, USER_ID)).rejects.toThrow();
        expect(mock.paymentUpdate).toHaveBeenCalledTimes(1);
    });

    it('PENDING gateway cannot be cancelled before reconciliation', async () => {
        const mock = mockCancellation(OrderStatus.PENDING, PaymentStatus.PENDING);
        await expect(mock.service.cancel(ORDER_ID, USER_ID)).rejects.toThrow('chờ xác minh');
        expect(mock.orderUpdate).not.toHaveBeenCalled();
        expect(mock.paymentUpdate).not.toHaveBeenCalled();
    });

    it('PREPARING cannot be cancelled after barista starts', async () => {
        const mock = mockCancellation(OrderStatus.PREPARING);
        await expect(mock.service.cancel(ORDER_ID, USER_ID)).rejects.toThrow('không cho phép hủy');
        expect(mock.paymentUpdate).not.toHaveBeenCalled();
    });
});
