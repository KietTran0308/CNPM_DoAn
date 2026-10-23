export type OrderState =
  | "PENDING"
  | "PAID"
  | "PAYMENT_FAILED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

const NEXT: Record<OrderState, OrderState[]> = {
  PENDING: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAYMENT_FAILED: ["PENDING", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertTransition(from: OrderState, to: OrderState): void {
  if (!NEXT[from].includes(to)) {
    throw new Error(`Không thể chuyển trạng thái ${from} → ${to}`);
  }
}

// Giá sản phẩm + phụ phí size + topping, nhân số lượng.
export function calculateLine(
  productPrice: number,
  sizeExtraPrice: number,
  toppingPrices: number[],
  qty: number,
): number {
  let toppingTotal = 0;

  for (const price of toppingPrices) {
    toppingTotal += price;
  }

  return (productPrice + sizeExtraPrice + toppingTotal) * qty;
}
