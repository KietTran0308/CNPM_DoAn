export type OrderState = "PENDING" | "PAID" | "PAYMENT_FAILED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
export declare function assertTransition(from: OrderState, to: OrderState): void;
export declare function calculateLine(productPrice: number, sizeExtraPrice: number, toppingPrices: number[], qty: number): number;
