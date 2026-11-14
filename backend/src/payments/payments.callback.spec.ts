import { PaymentStatus, OrderStatus, Prisma } from '@prisma/client';
import { PaymentsService } from './payments.service';

const callback = { data: '{}', mac: 'signed', type: 1 };
const data = { app_id: 12345, app_trans_id: '261112_abcdefgh1234', amount: 90000, zp_trans_id: 555 };
const pending = {
    id: 'p1', orderId: 'o1', methodCode: 'ZALOPAY', status: PaymentStatus.PENDING,
    amount: new Prisma.Decimal(90000), order: { id: 'o1', status: OrderStatus.PENDING },
};
const gatewayDetail = {
    paymentId: 'p1', gatewayTransactionId: null as string | null,
    providerRef: data.app_trans_id, payment: pending,
};

describe('ZaloPay callback với bảng payment_gateway_transactions', () => {
    it('ghi SUCCESS và gatewayTransactionId cùng transaction dù finalize kho lỗi', async () => {
        const txUpdate = jest.fn(async () => ({ count: 1 }));
        const txGatewayUpdate = jest.fn(async () => ({}));
        const tx = { payment: { updateMany: txUpdate },
            paymentGatewayTransaction: { update: txGatewayUpdate } };
        const prisma = {
            paymentGatewayTransaction: { findUnique: jest.fn(async () => gatewayDetail) },
            payment: { findUniqueOrThrow: jest.fn(async () => ({
                ...pending, status: PaymentStatus.SUCCESS,
                gatewayTransaction: { gatewayTransactionId: '555' },
            })) },
            order: { findUniqueOrThrow: jest.fn(async () => pending.order) },
            $transaction: jest.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
        };
        const svc = new PaymentsService(prisma as any,
            { verifyCallback: jest.fn(() => data) } as any, {} as any);
        expect((await svc.handleZalopayCallback(callback)).return_code).toBe(2);
        expect(txUpdate).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: PaymentStatus.SUCCESS }),
        }));
        expect(txGatewayUpdate).toHaveBeenCalledWith(expect.objectContaining({
            data: { gatewayTransactionId: '555' },
        }));
        expect(prisma.$transaction).toHaveBeenCalledTimes(2); // 1 save + 1 attempted finalize
    });

    it('chữ ký sai không truy vấn DB', async () => {
        const lookup = jest.fn();
        const svc = new PaymentsService({ paymentGatewayTransaction: { findUnique: lookup } } as any,
            { verifyCallback: jest.fn(() => null) } as any, {} as any);
        expect((await svc.handleZalopayCallback(callback)).return_code).toBe(2);
        expect(lookup).not.toHaveBeenCalled();
    });

    it('từ chối callback sai số tiền', async () => {
        const prisma = { paymentGatewayTransaction: {
            findUnique: jest.fn(async () => gatewayDetail),
        }, $transaction: jest.fn() };
        const svc = new PaymentsService(prisma as any,
            { verifyCallback: jest.fn(() => ({ ...data, amount: 10000 })) } as any, {} as any);
        expect((await svc.handleZalopayCallback(callback)).return_code).toBe(2);
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('cùng mã callback lần 2 không trừ kho 2 lần', async () => {
        const paid = { ...pending, status: PaymentStatus.SUCCESS,
            order: { ...pending.order, status: OrderStatus.PAID } };
        const prisma = {
            paymentGatewayTransaction: { findUnique: jest.fn(async () => ({
                ...gatewayDetail, payment: paid, gatewayTransactionId: '555',
            })) },
            payment: { findUniqueOrThrow: jest.fn(async () => ({
                ...paid, gatewayTransaction: { gatewayTransactionId: '555' },
            })) },
            order: { findUniqueOrThrow: jest.fn(async () => paid.order) },
            $transaction: jest.fn(),
        };
        const svc = new PaymentsService(prisma as any,
            { verifyCallback: jest.fn(() => data) } as any, {} as any);
        expect((await svc.handleZalopayCallback(callback)).return_code).toBe(1);
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('ACK callback lặp lại sau khi PAID ZaloPay đã hủy mô phỏng; không PAID lại', async () => {
        const cancelled = {
            ...pending,
            status: PaymentStatus.SUCCESS,
            refundedAmount: new Prisma.Decimal(90000),
            refundedAt: new Date(),
            order: { ...pending.order, status: OrderStatus.CANCELLED },
        };
        const prisma = {
            paymentGatewayTransaction: { findUnique: jest.fn(async () => ({
                ...gatewayDetail, payment: cancelled, gatewayTransactionId: '555',
            })) },
            payment: {
                findUniqueOrThrow: jest.fn(async () => ({
                    ...cancelled, gatewayTransaction: { gatewayTransactionId: '555' },
                })),
                findFirst: jest.fn(async () => cancelled),
            },
            order: { findUniqueOrThrow: jest.fn(async () => cancelled.order) },
            $transaction: jest.fn(),
        };
        const svc = new PaymentsService(prisma as any,
            { verifyCallback: jest.fn(() => data) } as any, {} as any);
        expect((await svc.handleZalopayCallback(callback)).return_code).toBe(1);
        expect(prisma.$transaction).not.toHaveBeenCalled();
        expect(prisma.payment.findFirst).toHaveBeenCalledWith({
            where: { orderId: 'o1', methodCode: 'ZALOPAY', status: PaymentStatus.SUCCESS },
        });
    });

    it('không xác nhận callback sau khi CANCELLED nếu chưa ghi hoàn mô phỏng', async () => {
        const cancelled = {
            ...pending, status: PaymentStatus.SUCCESS,
            order: { ...pending.order, status: OrderStatus.CANCELLED },
        };
        const prisma = {
            paymentGatewayTransaction: { findUnique: jest.fn(async () => ({
                ...gatewayDetail, payment: cancelled, gatewayTransactionId: '555',
            })) },
            payment: {
                findUniqueOrThrow: jest.fn(async () => ({ ...cancelled,
                    gatewayTransaction: { gatewayTransactionId: '555' } })),
                findFirst: jest.fn(async () => null),
            },
            order: { findUniqueOrThrow: jest.fn(async () => cancelled.order) },
            $transaction: jest.fn(),
        };
        const svc = new PaymentsService(prisma as any,
            { verifyCallback: jest.fn(() => data) } as any, {} as any);
        expect((await svc.handleZalopayCallback(callback)).return_code).toBe(2);
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('không nhận callback mới với gatewayTransactionId khác', async () => {
        const prisma = { paymentGatewayTransaction: { findUnique: jest.fn(async () => ({
            ...gatewayDetail, payment: { ...pending, status: PaymentStatus.SUCCESS },
            gatewayTransactionId: '999',
        })) }, $transaction: jest.fn() };
        const svc = new PaymentsService(prisma as any,
            { verifyCallback: jest.fn(() => data) } as any, {} as any);
        expect((await svc.handleZalopayCallback(callback)).return_code).toBe(2);
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });
});
