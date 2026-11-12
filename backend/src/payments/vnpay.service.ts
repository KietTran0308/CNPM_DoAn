import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';

@Injectable()
export class VnpayService {
  private config() {
    const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
    const hashSecret = process.env.VNPAY_HASH_SECRET?.trim();
    const paymentUrl = process.env.VNPAY_PAYMENT_URL?.trim();
    const returnUrl = process.env.VNPAY_RETURN_URL?.trim();
    if (!tmnCode || !hashSecret || !paymentUrl || !returnUrl ||
        !/^[a-zA-Z0-9]{8}$/.test(tmnCode) || hashSecret.includes('SANDBOX_CUA_BAN')) {
      throw new InternalServerErrorException('Thiếu cấu hình VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_PAYMENT_URL hoặc VNPAY_RETURN_URL');
    }
    if (!returnUrl.startsWith('https://') && !returnUrl.startsWith('http://localhost:')) {
      throw new InternalServerErrorException('VNPAY_RETURN_URL phải là HTTPS công khai (hoặc localhost lúc thử local)');
    }
    return { tmnCode, hashSecret, paymentUrl, returnUrl };
  }

  assertConfigured() { this.config(); }
  matchesMerchant(code: string) { return code === this.config().tmnCode; }

  // VNPay dùng yyyyMMddHHmmss theo giờ Việt Nam, không dùng múi giờ của container Render.
  formatDate(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date);
    const pick = (key: string) => parts.find(p => p.type === key)?.value || '';
    return `${pick('year')}${pick('month')}${pick('day')}${pick('hour')}${pick('minute')}${pick('second')}`;
  }

  private query(params: Record<string, string>) {
    const ordered = new URLSearchParams();
    Object.keys(params).sort().forEach(key => ordered.append(key, params[key]));
    return ordered.toString();
  }

  private signature(data: string, secret: string) {
    return createHmac('sha512', secret).update(data, 'utf8').digest('hex');
  }

  createPaymentUrl(input: {
    txnRef: string; amount: number; orderInfo: string; ipAddress: string;
    createDate: string; expireDate: string;
  }) {
    const config = this.config();
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
      throw new InternalServerErrorException('Số tiền VNPay phải là số nguyên VND lớn hơn 0');
    }
    const params: Record<string, string> = {
      vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: config.tmnCode,
      vnp_Amount: String(input.amount * 100), vnp_CurrCode: 'VND',
      vnp_TxnRef: input.txnRef, vnp_OrderInfo: input.orderInfo,
      vnp_OrderType: 'other', vnp_Locale: 'vn',
      vnp_ReturnUrl: config.returnUrl, vnp_IpAddr: input.ipAddress,
      vnp_CreateDate: input.createDate, vnp_ExpireDate: input.expireDate,
    };
    const signedQuery = this.query(params);
    const url = new URL(config.paymentUrl);
    url.search = signedQuery + '&vnp_SecureHash=' + this.signature(signedQuery, config.hashSecret);
    return url.toString();
  }

  // QueryDR 2.1.0: chủ cửa hàng truy vấn giao dịch mất IPN.
  // Chỉ tin phản hồi khi HMAC từ API merchant được xác minh, KHÔNG dựa vào URL trình duyệt.
  async queryTransaction(input: { txnRef: string; transactionDate: string; orderId: string }) {
    const config = this.config();
    const apiUrl = process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
    if (!apiUrl.startsWith('https://')) {
      throw new InternalServerErrorException('VNPAY_API_URL phải sử dụng HTTPS');
    }
    const ip = process.env.VNPAY_IP_ADDR?.trim() || '127.0.0.1';
    if (!/^[0-9a-fA-F:.]{7,45}$/.test(ip)) {
      throw new InternalServerErrorException('VNPAY_IP_ADDR không hợp lệ');
    }
    const reqParams: Record<string, string> = {
      vnp_RequestId: randomUUID().replace(/-/g, ''),
      vnp_Version: '2.1.0', vnp_Command: 'querydr',
      vnp_TmnCode: config.tmnCode, vnp_TxnRef: input.txnRef,
      vnp_TransactionDate: input.transactionDate,
      vnp_CreateDate: this.formatDate(new Date()),
      vnp_IpAddr: ip, vnp_OrderInfo: `Tra cuu don ${input.orderId}`,
    };
    const requestData = ['vnp_RequestId', 'vnp_Version', 'vnp_Command', 'vnp_TmnCode',
      'vnp_TxnRef', 'vnp_TransactionDate', 'vnp_CreateDate', 'vnp_IpAddr', 'vnp_OrderInfo']
      .map(key => reqParams[key]).join('|');
    reqParams.vnp_SecureHash = this.signature(requestData, config.hashSecret);
    let response: Response;
    try {
      response = await fetch(apiUrl, { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqParams), signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new ServiceUnavailableException('Không thể kết nối API tra cứu VNPay; không thay đổi trạng thái đơn');
    }
    if (!response.ok) throw new ServiceUnavailableException('VNPay không phản hồi truy vấn thành công');
    const result = await response.json().catch(() => null) as Record<string, string> | null;
    if (!result || typeof result !== 'object' || typeof result.vnp_SecureHash !== 'string' ||
        !/^[0-9a-fA-F]{128}$/.test(result.vnp_SecureHash)) {
      throw new ServiceUnavailableException('Phản hồi tra cứu VNPay không hợp lệ');
    }
    const responseKeys = ['vnp_ResponseId', 'vnp_Command', 'vnp_ResponseCode', 'vnp_Message',
      'vnp_TmnCode', 'vnp_TxnRef', 'vnp_Amount', 'vnp_BankCode', 'vnp_PayDate',
      'vnp_TransactionNo', 'vnp_TransactionType', 'vnp_TransactionStatus',
      'vnp_OrderInfo', 'vnp_PromotionCode', 'vnp_PromotionAmount'];
    const data = responseKeys.map(key => typeof result[key] === 'string' ? result[key] : '').join('|');
    const expected = this.signature(data, config.hashSecret);
    if (!timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(result.vnp_SecureHash, 'hex')) ||
        result.vnp_TmnCode !== config.tmnCode || result.vnp_TxnRef !== input.txnRef ||
        result.vnp_Command !== 'querydr') {
      throw new ServiceUnavailableException('Phản hồi QueryDR không khớp chữ ký, merchant hoặc mã giao dịch');
    }
    return {
      responseCode: result.vnp_ResponseCode, transactionStatus: result.vnp_TransactionStatus,
      amount: result.vnp_Amount, transactionNo: result.vnp_TransactionNo,
      transactionType: result.vnp_TransactionType, bankCode: result.vnp_BankCode,
      verified: true,
    };
  }

  verifySignature(params: Record<string, string>): boolean {
    const hash = params.vnp_SecureHash;
    if (!hash || !/^[0-9a-fA-F]{128}$/.test(hash)) return false;
    const signable: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && typeof value === 'string') {
        signable[key] = value;
      }
    }
    const expected = this.signature(this.query(signable), this.config().hashSecret);
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(hash, 'hex'));
  }
}
