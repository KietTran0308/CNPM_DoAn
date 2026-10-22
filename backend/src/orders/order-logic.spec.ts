import { assertTransition, calculateLine } from './order-logic';

describe('Task 10: Order State Machine', () => {
  test('đơn hàng đi theo quy trình hợp lệ', () => {
    expect(() => assertTransition('PENDING', 'PAID')).not.toThrow();
    expect(() => assertTransition('PAID', 'PREPARING')).not.toThrow();
    expect(() => assertTransition('PREPARING', 'READY')).not.toThrow();
    expect(() => assertTransition('READY', 'COMPLETED')).not.toThrow();
    expect(() => assertTransition('PAID', 'CANCELLED')).not.toThrow();
  });
  test('chặn chuyển trạng thái không hợp lệ', () => {
    expect(() => assertTransition('PENDING', 'COMPLETED')).toThrow();
    expect(() => assertTransition('COMPLETED', 'PAID')).toThrow();
    expect(() => assertTransition('CANCELLED', 'PAID')).toThrow();
    expect(() => assertTransition('PREPARING', 'CANCELLED')).toThrow();
  });
  test('tính tiền size, topping, số lượng', () => {
    expect(calculateLine(30000, 'M', ['kem', 'trân châu'], 2)).toBe(104000);
  });
});
