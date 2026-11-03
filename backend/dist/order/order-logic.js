"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertTransition = assertTransition;
exports.calculateLine = calculateLine;
const NEXT = {
    PENDING: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
    PAYMENT_FAILED: ["PENDING", "CANCELLED"],
    PAID: ["PREPARING", "CANCELLED"],
    PREPARING: ["READY"],
    READY: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
};
function assertTransition(from, to) {
    if (!NEXT[from].includes(to)) {
        throw new Error(`Không thể chuyển trạng thái ${from} → ${to}`);
    }
}
function calculateLine(productPrice, sizeExtraPrice, toppingPrices, qty) {
    let toppingTotal = 0;
    for (const price of toppingPrices) {
        toppingTotal += price;
    }
    return (productPrice + sizeExtraPrice + toppingTotal) * qty;
}
//# sourceMappingURL=order-logic.js.map