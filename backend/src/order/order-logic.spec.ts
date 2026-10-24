import { assertTransition, calculateLine } from "./order-logic";
import { describe, expect, it } from "@jest/globals";

describe("Order logic", () => {
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

  it("tính tiền size, topping và số lượng", () => {
    const total = calculateLine(
      30000, // Giá sản phẩm
      6000, // Phụ phí size M
      [8000, 8000], // Hai topping
      2, // Số lượng
    );

    expect(total).toBe(104000);
  });
});
