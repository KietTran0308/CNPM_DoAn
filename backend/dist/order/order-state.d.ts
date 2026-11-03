import { OrderStatus } from '@prisma/client';
export { OrderStatus };
export declare const ALLOWED_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>>;
export declare function canTransition(from: OrderStatus, to: OrderStatus): boolean;
export declare function assertTransition(from: OrderStatus, to: OrderStatus): void;
