import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

// Chỉ dùng một bộ trạng thái: enum PostgreSQL thông qua Prisma.
export { OrderStatus };

export const ALLOWED_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
    [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.READY],
    [OrderStatus.READY]: [OrderStatus.COMPLETED],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (!canTransition(from, to)) {
        throw new BadRequestException(`Không thể chuyển đơn từ ${from} sang ${to}`);
    }
}
