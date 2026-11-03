import { describe, expect, it } from "@jest/globals";
import { assertTransition, calculateLine } from "./order-logic";

describe("Order state transitions", () => {
  it("cho phép chuyển trạng thái hợp lệ", () => {
    expect(() => assertTransition("PENDING", "PAID")).not.toThrow();
    expect(() => assertTransition("PAID", "PREPARING")).not.toThrow();
    expect(() => assertTransition("PREPARING", "READY")).not.toThrow();
    expect(() => assertTransition("READY", "COMPLETED")).not.toThrow();
    expect(() => assertTransition("PENDING", "CANCELLED")).not.toThrow();
  });

  it("từ chối chuyển trạng thái không hợp lệ", () => {
    expect(() => assertTransition("PENDING", "COMPLETED")).toThrow();
    expect(() => assertTransition("COMPLETED", "PAID")).toThrow();
    expect(() => assertTransition("CANCELLED", "PAID")).toThrow();
    expect(() => assertTransition("PREPARING", "CANCELLED")).toThrow();
  });

  it("tính tổng tiền sản phẩm, size, topping và số lượng", () => {
    const total = calculateLine(30000, 6000, [8000, 8000], 2);

    expect(total).toBe(104000);
  });
});
