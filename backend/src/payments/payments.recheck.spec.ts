import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('ZaloPay reconciliation: only close definitely expired transactions', () => {
  const payment = {
    id: 'payment-1', orderId: 'order-1', providerRef: '261112_test1234567890',
    method: PaymentMethod.ZALOPAY, status: PaymentStatus.PENDING,
    amount: 90000, order: { expiresAt: new Date(Date.now() - 60000), status: OrderStatus.PENDING },
  };

  it('keeps PENDING when the gateway is still processing', async () => {
    const transaction = jest.fn();
    const prisma = { payment: { findFirst: jest.fn(async () => payment) }, $transaction: transaction };
    const gateway = { queryOrder: jest.fn(async () => ({
      returnCode: 3, subReturnCode: null, isProcessing: true,
    })) };
    const result = await new PaymentsService(prisma as any, gateway as any, {} as any)
      .recheckZalopay('ADMIN', payment.orderId);
    expect(result.message).toContain('còn xử lý');
    expect(transaction).not.toHaveBeenCalled();
  });

  it('marks FAILED only when QueryDR says TIME_INVALID after expiration', async () => {
    const paymentUpdate = jest.fn(async () => ({ count: 1 }));
    const orderUpdate = jest.fn(async () => ({ count: 1 }));
    const tx = { payment: { updateMany: paymentUpdate }, order: { updateMany: orderUpdate },
      orderStatusHistory: { create: jest.fn(async () => ({})) } };
    const prisma = { payment: { findFirst: jest.fn(async () => payment) },
      $transaction: jest.fn(async (fn: (arg: typeof tx) => Promise<unknown>) => fn(tx)) };
    const gateway = { queryOrder: jest.fn(async () => ({
      returnCode: 2, subReturnCode: -54, isProcessing: false,
    })) };
    const result = await new PaymentsService(prisma as any, gateway as any, {} as any)
      .recheckZalopay('ADMIN', payment.orderId);
    expect(result.paymentStatus).toBe(PaymentStatus.FAILED);
    expect(paymentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: PaymentStatus.FAILED },
    }));
    expect(orderUpdate).toHaveBeenCalled();
  });

  it('never marks failure from ORDER_NOT_EXIST, which may need manual verification', async () => {
    const transaction = jest.fn();
    const prisma = { payment: { findFirst: jest.fn(async () => payment) }, $transaction: transaction };
    const gateway = { queryOrder: jest.fn(async () => ({
      returnCode: 2, subReturnCode: -101, isProcessing: false,
    })) };
    await new PaymentsService(prisma as any, gateway as any, {} as any)
      .recheckZalopay('ADMIN', payment.orderId);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('refuses to finalize if a concurrent callback recorded another transaction id', async () => {
    const prisma = {
      payment: {
        findFirst: jest.fn(async () => payment),
        updateMany: jest.fn(async () => ({ count: 0 })),
        findUniqueOrThrow: jest.fn(async () => ({ ...payment,
          status: PaymentStatus.SUCCESS, zpTransId: '99999' })),
      },
      order: { findUniqueOrThrow: jest.fn() },
      $transaction: jest.fn(),
    };
    const gateway = { queryOrder: jest.fn(async () => ({
      returnCode: 1, amount: 90000, zpTransId: '12345',
    })) };
    const service = new PaymentsService(prisma as any, gateway as any, {} as any);
    await expect(service.recheckZalopay('ADMIN', payment.orderId))
      .rejects.toThrow('thay đổi trong lúc xử lý');
    expect(prisma.order.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('lists ZaloPay create requests missing their URL after two minutes', async () => {
    const findMany = jest.fn(async (_query: unknown) => []);
    const service = new PaymentsService({ payment: { findMany } } as any, {} as any, {} as any);
    await service.getReconciliationQueue('ADMIN');
    const query = findMany.mock.calls[0][0] as any;
    expect(query.where.OR).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: PaymentMethod.ZALOPAY,
        status: PaymentStatus.PENDING, zpOrderUrl: null }),
    ]));
  });
});
