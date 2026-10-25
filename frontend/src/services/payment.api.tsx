// frontend/src/services/payment.api.ts

export type PaymentMethod = 'cod' | 'momo' | 'vnpay' | 'zalopay' | 'credit_card';

export interface CreatePaymentPayload {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  returnUrl?: string;
}

export interface PaymentResponse {
  paymentId: string;
  orderId: string;
  method: PaymentMethod;
  status: 'pending' | 'success' | 'failed';
  /** URL cổng thanh toán để redirect nếu là Ví điện tử / Thẻ */
  paymentUrl?: string;
  qrCodeUrl?: string;
  message?: string;
}

export const processPaymentApi = async (payload: CreatePaymentPayload): Promise<PaymentResponse> => {
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Lỗi khởi tạo thanh toán.');
  }

  return response.json();
};