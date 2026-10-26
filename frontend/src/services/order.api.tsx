// frontend/src/services/order.api.ts

export interface CreateOrderPayload {
  customer: {
    name: string;
    phone: string;
  };
  pickup: {
    branch: string;
    timeType: 'asap' | 'scheduled';
    scheduledTime?: string;
    note?: string;
  };
  items: Array<{
    productId: string;
    sizeId: string;
    toppingIds: string[];
    iceLevel: string;
    sugarLevel: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    note?: string;
  }>;
  subtotal: number;
  discount: number;
  pointsDiscount: number;
  total: number;
  voucherCode?: string;
  orderNote?: string;
}

export interface OrderResponse {
  id: string;
  orderCode: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  createdAt: string;
}

export const createOrderApi = async (payload: CreateOrderPayload): Promise<OrderResponse> => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
  }

  return response.json();
};