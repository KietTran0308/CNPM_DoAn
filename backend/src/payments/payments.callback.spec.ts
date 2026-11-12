import { PaymentsService } from './payments.service';
import { PaymentMethod, PaymentStatus, OrderStatus, Prisma } from '@prisma/client';

const callback = { data: '{"app_id":12345,"app_trans_id":"261112_abcdefgh1234","amount":90000,"zp_trans_id":555}', mac: 'signed', type: 1 };
const data = { app_id: 12345, app_trans_id: '261112_abcdefgh1234', amount: 90000, zp_trans_id: 555 };

const pending = {
  id: 'p1', orderId: 'o1', providerRef: data.app_trans_id,
  method: PaymentMethod.ZALOPAY, status: PaymentStatus.PENDING, amount: new Prisma.Decimal(90000),
  order: { id: 'o1', status: OrderStatus.PENDING }, zpTransId: null,
};

describe('ZaloPay callback bookkeeping', () => {
  it('records the verified gateway SUCCESS even when stock finalization fails', async () => {
    const updateMany = jest.fn(async () => ({ count: 1 }));
    const prisma = { payment: { findUnique: jest.fn<Promise<any>, []>().mockResolvedValueOnce(pending)
        .mockResolvedValueOnce({ ...pending, status: PaymentStatus.SUCCESS, zpTransId: '555' }),
      updateMany }, order: { findUniqueOrThrow: jest.fn(async () => pending.order) },
      $transaction: jest.fn(async () => { throw new Error('Out of stock'); }),
    };
    const gateway = { verifyCallback: jest.fn(() => data) };
    const svc = new PaymentsService(prisma as any, gateway as any, {} as any);
    const result = await svc.handleZalopayCallback(callback);
    expect(result.return_code).toBe(2); // Gateway không được xác nhận thành công khi xử lý nội bộ chưa xong.
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: PaymentStatus.SUCCESS, zpTransId: '555' }),
    }));
  });
  it('never touches DB if signature is invalid', async () => {
    const lookup = jest.fn();
    const svc = new PaymentsService({ payment: { findUnique: lookup } } as any,
      { verifyCallback: jest.fn(() => null) } as any, {} as any);
    expect((await svc.handleZalopayCallback(callback)).return_code).toBe(2);
    expect(lookup).not.toHaveBeenCalled();
  });
  it('rejects a matching signed transaction with a different amount', async () => {
    const gateway = { verifyCallback: jest.fn(() => ({ ...data, amount: 10000 })) };
    const updateMany = jest.fn();
    const svc = new PaymentsService({ payment: { findUnique: jest.fn(async () => pending), updateMany } } as any,
      gateway as any, {} as any);
    expect((await svc.handleZalopayCallback(callback)).return_code).toBe(2);
    expect(updateMany).not.toHaveBeenCalled();
  });
  it('keeps cancelled orders in reconciliation instead of finalizing or inventing refunds', async () => {
    const paid = { ...pending, status: PaymentStatus.SUCCESS, zpTransId: '555',
      order: { ...pending.order, status: OrderStatus.CANCELLED } };
    const transaction = jest.fn();
    const prisma = { payment: { findUnique: jest.fn(async () => paid) },
      order: { findUniqueOrThrow: jest.fn(async () => paid.order) }, $transaction: transaction };
    const svc = new PaymentsService(prisma as any, { verifyCallback: jest.fn(() => data) } as any, {} as any);
    expect((await svc.handleZalopayCallback(callback)).return_code).toBe(2);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('does not accept a different gateway transaction code on replay', async () => {
    const paid = { ...pending, status: PaymentStatus.SUCCESS, zpTransId: '999' };
    const updateMany = jest.fn();
    const prisma = { payment: { findUnique: jest.fn(async () => paid), updateMany } };
    const svc = new PaymentsService(prisma as any, { verifyCallback: jest.fn(() => data) } as any, {} as any);
    expect((await svc.handleZalopayCallback(callback)).return_code).toBe(2);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('accepts repeated callback without subtracting stock twice once order is PAID', async () => {
    const paid = { ...pending, status: PaymentStatus.SUCCESS, zpTransId: '555',
      order: { ...pending.order, status: OrderStatus.PAID } };
    const transaction = jest.fn();
    const prisma = { payment: { findUnique: jest.fn(async () => paid) },
      order: { findUniqueOrThrow: jest.fn(async () => paid.order) }, $transaction: transaction };
    const svc = new PaymentsService(prisma as any, { verifyCallback: jest.fn(() => data) } as any, {} as any);
    expect((await svc.handleZalopayCallback(callback)).return_code).toBe(1);
    expect(transaction).not.toHaveBeenCalled();
  });
});
