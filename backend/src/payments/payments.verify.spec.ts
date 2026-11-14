import { NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('Customer self verification of ZaloPay', () => {
    const orderId = '74dc7420-94e5-4c68-9dbd-71785de4b228';
    const userId = 'customer-1';

    it('never queries ZaloPay when the order does not belong to the customer', async () => {
        const prisma = { order: { findFirst: jest.fn(async () => null) },
            payment: { findFirst: jest.fn() } };
        const svc = new PaymentsService(prisma as any, {} as any, {} as any);
        await expect(svc.verifyZalopayForCustomer(userId, orderId)).rejects.toBeInstanceOf(NotFoundException);
        expect(prisma.payment.findFirst).not.toHaveBeenCalled();
    });

    it('throttles repeated QueryDR checks on pending payment and preserves ownership filter', async () => {
        const findFirst = jest.fn(async () => ({ id: orderId, userId, status: OrderStatus.PENDING }));
        const prisma = { order: { findFirst }, payment: { findFirst: jest.fn(async () => ({
            id: 'pay-1', status: PaymentStatus.PENDING, methodCode: 'ZALOPAY',
        })) } };
        const svc = new PaymentsService(prisma as any, {} as any, {} as any);
        const recheck = jest.spyOn(svc, 'recheckZalopay').mockResolvedValue({ message: 'Đang xử lý' } as any);
        jest.spyOn(svc, 'getZalopayStatus').mockResolvedValue({ orderStatus: OrderStatus.PENDING } as any);
        await svc.verifyZalopayForCustomer(userId, orderId);
        await svc.verifyZalopayForCustomer(userId, orderId);
        expect(recheck).toHaveBeenCalledTimes(1);
        expect(findFirst).toHaveBeenCalledWith({ where: { id: orderId, userId } });
    });

    it('does not query gateway again after payment is already successful', async () => {
        const prisma = { order: { findFirst: jest.fn(async () => ({ id: orderId, userId,
            status: OrderStatus.PAID })) }, payment: { findFirst: jest.fn(async () => ({
            status: PaymentStatus.SUCCESS, methodCode: 'ZALOPAY',
        })) } };
        const svc = new PaymentsService(prisma as any, {} as any, {} as any);
        const recheck = jest.spyOn(svc, 'recheckZalopay');
        jest.spyOn(svc, 'getZalopayStatus').mockResolvedValue({ orderStatus: OrderStatus.PAID } as any);
        const result = await svc.verifyZalopayForCustomer(userId, orderId);
        expect(result.orderStatus).toBe(OrderStatus.PAID);
        expect(recheck).not.toHaveBeenCalled();
    });
});
