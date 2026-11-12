import { BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { PaymentsService } from "./payments.service";
import { VnpayService } from "./vnpay.service";
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const USER_ID = "0abd345f-7157-5376-bdf7-d23459d5c505";
const OTHER_USER_ID = "89094c8e-81d2-582b-adcc-b81a331c6684";
const ORDER_ID = "33288bf2-7b4a-50b7-94e9-f949a5190459";

const DTO = {
  orderId: ORDER_ID,
  method: "WALLET" as const,
  simulateFailure: false,
};

// Mock VNPay: không gọi API VNPay thật trong unit test.
const mockVnpayService = {
  createPaymentUrl: jest.fn(),
  verifySignature: jest.fn(),
};

// Unit tests: idempotency replay không cần PostgreSQL thật.
describe("PaymentsService - idempotency", () => {
  let vnpayService: VnpayService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_DEMO_PAYMENTS = 'true';
    vnpayService = mockVnpayService as unknown as VnpayService;
  });

  it("tra ve giao dich da luu khi cung key va dung request", async () => {
    const savedPayment = {
      id: "payment-1",
      orderId: ORDER_ID,
      method: "WALLET",
      status: "SUCCESS",
      order: {
        id: ORDER_ID,
        userId: USER_ID,
        status: "PAID",
      },
    };

    const findUnique = jest
      .fn<() => Promise<typeof savedPayment>>()
      .mockResolvedValue(savedPayment);
    const transaction = jest.fn(async () => {
      throw new Error("Khong duoc xu ly lai transaction");
    });

    const prisma = {
      payment: { findUnique },
      $transaction: transaction,
    } as unknown as PrismaService;

    const result = await new PaymentsService(prisma, vnpayService, {} as any).pay(
      USER_ID,
      "payment-key-123",
      DTO,
    );

    expect(result.replay).toBe(true);
    expect(result.payment).toEqual(savedPayment);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("tu choi su dung lai key voi phuong thuc thanh toan khac", async () => {
    const savedPayment = {
      id: "payment-1",
      orderId: ORDER_ID,
      method: "CARD",
      status: "SUCCESS",
      order: {
        id: ORDER_ID,
        userId: USER_ID,
        status: "PAID",
      },
    };

    const prisma = {
      payment: {
        findUnique: jest
          .fn<() => Promise<typeof savedPayment>>()
          .mockResolvedValue(savedPayment),
      },
    } as unknown as PrismaService;

    await expect(
      new PaymentsService(prisma, vnpayService, {} as any).pay(
        USER_ID,
        "payment-key-123",
        DTO,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it("tu choi replay tu tai khoan khac", async () => {
    const savedPayment = {
      id: "payment-1",
      orderId: ORDER_ID,
      method: "WALLET",
      status: "SUCCESS",
      order: {
        id: ORDER_ID,
        userId: OTHER_USER_ID,
        status: "PAID",
      },
    };

    const prisma = {
      payment: {
        findUnique: jest
          .fn<() => Promise<typeof savedPayment>>()
          .mockResolvedValue(savedPayment),
      },
    } as unknown as PrismaService;

    await expect(
      new PaymentsService(prisma, vnpayService, {} as any).pay(
        USER_ID,
        "payment-key-123",
        DTO,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it("cho phep replay thanh toan FAILED khi request dung", async () => {
    const savedPayment = {
      id: "payment-2",
      orderId: ORDER_ID,
      method: "WALLET",
      status: "FAILED",
      order: {
        id: ORDER_ID,
        userId: USER_ID,
        status: "PAYMENT_FAILED",
      },
    };

    const prisma = {
      payment: {
        findUnique: jest
          .fn<() => Promise<typeof savedPayment>>()
          .mockResolvedValue(savedPayment),
      },
    } as unknown as PrismaService;

    const result = await new PaymentsService(prisma, vnpayService, {} as any).pay(
      USER_ID,
      "payment-key-456",
      {
        ...DTO,
        simulateFailure: true,
      },
    );

    expect(result.replay).toBe(true);
    expect(result.payment).toEqual(savedPayment);
  });

  it("tu choi idempotency key ngan hon 8 ky tu", async () => {
    const service = new PaymentsService({} as PrismaService, vnpayService, {} as any);

    await expect(service.pay(USER_ID, "short", DTO)).rejects.toThrow(
      BadRequestException,
    );
  });
});
