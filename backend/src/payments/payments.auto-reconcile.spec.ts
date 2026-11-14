import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('ZaloPay auto reconciliation without callback', () => {
    it('checks old PENDING payments without relying on a customer opening the website', async () => {
        const pending = [{ orderId: 'order-1' }];
        const findMany = jest.fn(async (args: any) =>
            args.where.status === PaymentStatus.PENDING ? pending : []);
        const prisma = { payment: { findMany, count: jest.fn(async () => 1) } };
        const service = new PaymentsService(prisma as any, {} as any, {} as any);
        const recheck = jest.spyOn(service, 'recheckZalopay')
            .mockResolvedValue({ message: 'Giao dịch còn xử lý' } as any);

        await (service as any).reconcilePendingZalopay();
        expect(recheck).toHaveBeenCalledWith('ADMIN', 'order-1');
        expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ methodCode: 'ZALOPAY',
                status: PaymentStatus.PENDING, createdAt: { lte: expect.any(Date) } }),
        }));
    });

    it('finishes a verified SUCCESS payment whose order is still PENDING', async () => {
        const findMany = jest.fn(async (args: any) =>
            args.where.status === PaymentStatus.SUCCESS ? [{ orderId: 'paid-order' }] : []);
        const prisma = { payment: { findMany, count: jest.fn(async () => 0) } };
        const service = new PaymentsService(prisma as any, {} as any, {} as any);
        const finalize = jest.spyOn(service as any, 'finalizeConfirmedZalopay')
            .mockResolvedValue(undefined);
        await (service as any).reconcilePendingZalopay();
        expect(finalize).toHaveBeenCalledWith('paid-order');
        expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ order: {
                status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
            } }),
        }));
    });

    it('preserves PENDING if QueryDR has an error; it never invents a failure', async () => {
        const prisma = { payment: {
            findMany: jest.fn(async (args: any) =>
                args.where.status === PaymentStatus.PENDING ? [{ orderId: 'order-error' }] : []),
            count: jest.fn(async () => 1), updateMany: jest.fn(),
        } };
        const service = new PaymentsService(prisma as any, {} as any, {} as any);
        jest.spyOn(service, 'recheckZalopay').mockRejectedValue(new Error('network timeout'));
        await expect((service as any).reconcilePendingZalopay()).resolves.toBeUndefined();
        expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });

    it('rotates through more than ten pending orders instead of starving newer orders', async () => {
        const findMany = jest.fn(async (args: any) => {
            if (args.where.status === PaymentStatus.SUCCESS) return [];
            return Array.from({ length: Math.min(args.take, 15 - args.skip) }, (_, i) =>
                ({ orderId: `order-${args.skip + i}` }));
        });
        const prisma = { payment: { findMany, count: jest.fn(async () => 15) } };
        const service = new PaymentsService(prisma as any, {} as any, {} as any);
        const recheck = jest.spyOn(service, 'recheckZalopay').mockResolvedValue({} as any);
        await (service as any).reconcilePendingZalopay();
        await (service as any).reconcilePendingZalopay();
        expect(recheck).toHaveBeenCalledTimes(15);
        const queries = findMany.mock.calls.map(([args]) => args as any)
            .filter(args => args.where.status === PaymentStatus.PENDING);
        expect(queries[0].skip).toBe(0);
        expect(queries[1].skip).toBe(10);
    });
});
