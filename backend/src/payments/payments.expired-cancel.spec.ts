import { PaymentsService } from './payments.service';

describe('QueryDR và đơn quá hạn', () => {
  const base = {
    id: 'p1', orderId: 'o1', providerRef: '251113_o1',
    status: 'PENDING', amount: 84000, zpOrderUrl: 'https://zalopay.vn/pay',
    zpQrCode: null, createdAt: new Date(Date.now() - 30_000),
    order: { id: 'o1', userId: 'u1', status: 'PENDING',
      expiresAt: new Date(Date.now() - 5 * 60_000) },
  };
  function create(gateway: object) {
    const tx = {
      payment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      order: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      payment: { findFirst: jest.fn().mockResolvedValue(base) },
      order: { findUnique: jest.fn().mockResolvedValue({ status: 'PAYMENT_FAILED' }) },
      $transaction: jest.fn(async (callback: (x: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const gatewayService = { queryOrder: jest.fn().mockResolvedValue(gateway) };
    const ordersService = { cancel: jest.fn().mockResolvedValue({}) };
    const service = new PaymentsService(prisma as any, gatewayService as any, ordersService as any);
    return { service, prisma, tx, ordersService };
  }

  it('ZaloPay xác nhận hết hạn: đánh FAILED rồi hủy đơn/hoàn giữ', async () => {
    const { service, ordersService, tx } = create({ returnCode: 2, subReturnCode: -54, isProcessing: false });
    const result = await service.recheckZalopay('ADMIN', 'o1');
    expect('paymentStatus' in result ? result.paymentStatus : null).toBe('FAILED');
    expect(tx.payment.updateMany).toHaveBeenCalled();
    expect(ordersService.cancel).toHaveBeenCalledWith('o1', 'u1');
  });

  it('ZaloPay vẫn PROCESSING: không đánh FAILED, không hủy đơn', async () => {
    const { service, ordersService, tx } = create({ returnCode: 3, subReturnCode: null, isProcessing: true });
    await service.recheckZalopay('ADMIN', 'o1');
    expect(tx.payment.updateMany).not.toHaveBeenCalled();
    expect(ordersService.cancel).not.toHaveBeenCalled();
  });
});
