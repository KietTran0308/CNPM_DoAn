import { Injectable, InternalServerErrorException } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import { createHmac } from "node:crypto";

@Injectable()
export class VnpayService {
  constructor(private readonly config: ConfigService) {}

  private getConfig() {
    const tmnCode = this.config.get<string>("VNPAY_TMN_CODE");
    const hashSecret = this.config.get<string>("VNPAY_HASH_SECRET");
    const paymentUrl = this.config.get<string>("VNPAY_PAYMENT_URL");
    const returnUrl = this.config.get<string>("VNPAY_RETURN_URL");

    if (!tmnCode || !hashSecret || !paymentUrl || !returnUrl) {
      throw new InternalServerErrorException("Chưa cấu hình đầy đủ VNPay");
    }

    return { tmnCode, hashSecret, paymentUrl, returnUrl };
  }

  // Sắp xếp tham số theo alphabet trước khi ký.
  private sortParams(params: Record<string, string>) {
    return Object.keys(params)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = params[key];
          return result;
        },
        {} as Record<string, string>,
      );
  }

  // Tạo chuỗi query theo cách VNPay yêu cầu.
  private buildQuery(params: Record<string, string>) {
    return new URLSearchParams(params).toString();
  }

  private sign(data: string, secret: string) {
    return createHmac("sha512", secret).update(data, "utf8").digest("hex");
  }

  // Sinh URL thanh toán VNPay.
  createPaymentUrl(input: {
    txnRef: string;
    amount: number;
    orderInfo: string;
    ipAddress: string;
  }) {
    const config = this.getConfig();

    const now = new Date();

    const dateFormat = (date: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");

      return (
        date.getFullYear().toString() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds())
      );
    };

    const params: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: config.tmnCode,
      vnp_Amount: String(Math.round(input.amount * 100)),
      vnp_CurrCode: "VND",
      vnp_TxnRef: input.txnRef,
      vnp_OrderInfo: input.orderInfo,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: config.returnUrl,
      vnp_IpAddr: input.ipAddress,
      vnp_CreateDate: dateFormat(now),
    };

    const sorted = this.sortParams(params);
    const hashData = this.buildQuery(sorted);
    const secureHash = this.sign(hashData, config.hashSecret);

    const url = new URL(config.paymentUrl);

    url.search = new URLSearchParams({
      ...sorted,
      vnp_SecureHash: secureHash,
    }).toString();

    return url.toString();
  }

  // Kiểm tra chữ ký VNPay gửi về.
  verifySignature(params: Record<string, string>) {
    const { hashSecret } = this.getConfig();

    const receivedHash = params.vnp_SecureHash;

    if (!receivedHash) {
      return false;
    }

    const data: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") {
        data[key] = value;
      }
    }

    const sorted = this.sortParams(data);
    const hashData = this.buildQuery(sorted);
    const calculatedHash = this.sign(hashData, hashSecret);

    // So sánh không phụ thuộc chữ hoa/thường.
    return calculatedHash.toLowerCase() === receivedHash.toLowerCase();
  }
}
