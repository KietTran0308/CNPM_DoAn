import { PaymentStatus, OrderStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

const payment = {
    id: 'payment-1', orderId: 'order-1', methodCode: 'ZALOPAY',
    gatewayTransaction: { providerRef: '261112_test1234567890', gatewayTransactionId: null,
        checkoutUrl: 'https://zalopay.vn/checkout', qrContent: null },
    status: PaymentStatus.PENDING, amount: 90000,
    order: { expiresAt: new Date(Date.now() - 60_000), status: OrderStatus.PENDING },
    createdAt: new Date(Date.now() - 60_000),
};

describe('ZaloPay QueryDR / payment gateway detail', () => {
    it('giữ PENDING khi gateway vẫn đang xử lý', async () => {
        const transaction = jest.fn();
        const svc = new PaymentsService({ payment: { findFirst: jest.fn(async () => payment) },
            $transaction: transaction } as any, { queryOrder: jest.fn(async () => ({
                returnCode: 3, subReturnCode: null, isProcessing: true,
            })) } as any, {} as any);
        const result = await svc.recheckZalopay('ADMIN', payment.orderId);
        expect(result.message).toContain('còn xử lý');
        expect(transaction).not.toHaveBeenCalled();
    });

    it('chỉ đóng khi gateway xác nhận TIME_INVALID và đơn đã hết hạn', async () => {
        const update = jest.fn(async () => ({ count: 1 }));
        const tx = { payment: { updateMany: update },
            order: { updateMany: jest.fn(async () => ({ count: 1 })) },
            orderStatusHistory: { create: jest.fn(async () => ({})) } };
        const prisma = { payment: { findFirst: jest.fn(async () => payment) },
            order: { findUnique: jest.fn(async () => ({ status: OrderStatus.CANCELLED })) },
            $transaction: jest.fn(async (fn: (arg: typeof tx) => Promise<unknown>) => fn(tx)) };
        const svc = new PaymentsService(prisma as any, { queryOrder: jest.fn(async () => ({
            returnCode: 2, subReturnCode: -54, isProcessing: false,
        })) } as any, {} as any);
        const result = await svc.recheckZalopay('ADMIN', payment.orderId);
        expect('paymentStatus' in result ? result.paymentStatus : null).toBe(PaymentStatus.FAILED);
        expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: PaymentStatus.FAILED } }));
    });

    it('không đóng ORDER_NOT_EXIST sớm khi đã có QR', async () => {
        const transaction = jest.fn();
        const svc = new PaymentsService({ payment: { findFirst: jest.fn(async () => payment) },
            $transaction: transaction } as any, { queryOrder: jest.fn(async () => ({
                returnCode: 2, subReturnCode: -101, isProcessing: false,
            })) } as any, {} as any);
        await svc.recheckZalopay('ADMIN', payment.orderId);
        expect(transaction).not.toHaveBeenCalled();
    });

    it('không finalize khi callback đồng thời ghi mã khác', async () => {
        const tx = { payment: { updateMany: jest.fn(async () => ({ count: 0 })) },
            paymentGatewayTransaction: { update: jest.fn() } };
        const prisma = { payment: {
            findFirst: jest.fn(async () => payment),
            findUniqueOrThrow: jest.fn(async () => ({
                ...payment, status: PaymentStatus.SUCCESS,
                gatewayTransaction: { ...payment.gatewayTransaction, gatewayTransactionId: '99999' },
            })) },
            $transaction: jest.fn(async (fn: (arg: typeof tx) => Promise<unknown>) => fn(tx)),
            order: { findUniqueOrThrow: jest.fn() } };
        const svc = new PaymentsService(prisma as any, { queryOrder: jest.fn(async () => ({
            returnCode: 1, amount: 90000, zpTransId: '12345',
        })) } as any, {} as any);
        await expect(svc.recheckZalopay('ADMIN', payment.orderId))
            .rejects.toThrow('thay đổi trong lúc xử lý');
        expect(prisma.order.findUniqueOrThrow).not.toHaveBeenCalled();
        expect(tx.paymentGatewayTransaction.update).not.toHaveBeenCalled();
    });

    it('liệt kê giao dịch thiếu QR sau 2 phút theo quan hệ', async () => {
        const findMany = jest.fn(async (_query: unknown) => []);
        const svc = new PaymentsService({ payment: { findMany } } as any, {} as any, {} as any);
        await svc.getReconciliationQueue('ADMIN');
        const query = findMany.mock.calls[0][0] as any;
        expect(query.where.OR).toEqual(expect.arrayContaining([
            expect.objectContaining({ status: PaymentStatus.PENDING,
                gatewayTransaction: { is: { checkoutUrl: null, qrContent: null } } }),
        ]));
    });
});
