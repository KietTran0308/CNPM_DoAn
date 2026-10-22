// Hàm thuần (không kết nối DB) => dễ hiểu và dễ viết unit test.
export const SIZE_FEE: Record<'S' | 'M' | 'L', number> = {S: 0, M: 6000, L: 10000};
export const TOPPING_FEE = 8000;
export type OrderState = 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'PAYMENT_FAILED' | 'CANCELLED';
const NEXT: Record<OrderState, OrderState[]> = {
    PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
    PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
    PAID: ['PREPARING', 'CANCELLED'], // thanh toán mô phỏng: hủy trước khi quầy pha chế
    PREPARING: ['READY'],
    READY: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
};

export function assertTransition(from: OrderState, to: OrderState): void {
    if (!NEXT[from]?.includes(to)) throw new Error(`Không thể chuyển trạng thái ${from} → ${to}`);
}

export function calculateLine(price: number, size: 'S' | 'M' | 'L', toppings: string[], qty: number) {
    return (price + SIZE_FEE[size] + TOPPING_FEE * toppings.length) * qty;
}
