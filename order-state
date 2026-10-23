
import { BadRequestException } from '@nestjs/common';

// Các trạng thái đơn hàng
export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Những trạng thái được phép chuyển tiếp
export const ALLOWED_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PENDING,
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.PAID]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],

  [OrderStatus.PREPARING]: [
    OrderStatus.READY,
  ],

  [OrderStatus.READY]: [
    OrderStatus.COMPLETED,
  ],

  [OrderStatus.COMPLETED]: [],

  [OrderStatus.CANCELLED]: [],
};

// Kiểm tra có được chuyển trạng thái hay không
export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return (
    ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
  );
}

// Báo lỗi nếu chuyển trạng thái không hợp lệ
export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  if (!canTransition(from, to)) {
    throw new BadRequestException(
      `Không thể chuyển đơn hàng từ ${from} sang ${to}`,
    );
  }
}
