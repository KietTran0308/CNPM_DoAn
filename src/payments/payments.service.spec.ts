import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, ConflictException } from "@nestjs/common";

import { PaymentsService } from "./payments.service";
import { PrismaService } from "../prisma.service";

describe("PaymentsService", () => {
  let service: PaymentsService;
  let prisma: {
    payment: {
      findUnique: ReturnType<typeof jest.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      payment: {
        findUnique: jest.fn(),
      },
    };

    service = new PaymentsService(prisma as unknown as PrismaService);
  });

  it("từ chối Idempotency-Key quá ngắn", async () => {
    await expect(
      service.pay("user-1", "short", {
        orderId: "order-1",
        method: "CARD",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });

  it("trả kết quả cũ khi nhận lại cùng yêu cầu thanh toán", async () => {
    const oldPayment = {
      id: "payment-1",
      orderId: "order-1",
      idempotencyKey: "payment-key-123",
      method: "CARD",
      status: "SUCCESS",
      order: {
        id: "order-1",
        userId: "user-1",
        status: "PAID",
      },
    };

    prisma.payment.findUnique.mockResolvedValue(oldPayment);

    const result = await service.pay("user-1", "payment-key-123", {
      orderId: "order-1",
      method: "CARD",
    });

    expect(result.replay).toBe(true);
    expect(result.payment).toEqual(oldPayment);
    expect(result.order).toEqual(oldPayment.order);

    // Không chạy lại transaction khi đã có kết quả cũ.
    expect(prisma.payment.findUnique).toHaveBeenCalledTimes(1);
  });

  it("báo ConflictException nếu dùng khóa cũ cho đơn hàng khác", async () => {
    const oldPayment = {
      id: "payment-1",
      orderId: "order-1",
      idempotencyKey: "payment-key-123",
      method: "CARD",
      status: "SUCCESS",
      order: {
        id: "order-1",
        userId: "user-1",
        status: "PAID",
      },
    };

    prisma.payment.findUnique.mockResolvedValue(oldPayment);

    await expect(
      service.pay("user-1", "payment-key-123", {
        orderId: "order-2",
        method: "CARD",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
