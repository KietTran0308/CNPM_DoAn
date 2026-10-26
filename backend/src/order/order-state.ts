import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

// Chỉ dùng một bộ trạng thái: enum PostgreSQL thông qua Prisma.
export { OrderStatus };

export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
    PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
    PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
    PAID: ['PREPARING'],
    PREPARING: ['READY'],
    READY: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (!canTransition(from, to)) {
        throw new BadRequestException(`Không thể chuyển đơn từ ${from} sang ${to}`);
    }
}
