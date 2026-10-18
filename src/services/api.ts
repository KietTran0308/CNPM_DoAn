/**
 * =====================================================================
 * FRONTEND HTTP CLIENT (KẾT NỐI TRỰC TIẾP VỚI BACKEND API)
 * =====================================================================
 * Gửi yêu cầu HTTP đến Backend và tự động đính kèm Bearer Token JWT.
 */

import {
  User,
  Product,
  Order,
  BranchInfo,
  VoucherItem,
  CartItem,
  PaymentMethodId,
  UpdateUserProfilePayload,
  ChangePasswordPayload,
} from '../types';

const TOKEN_KEY = 'brewlite_auth_token';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore storage failure
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Yêu cầu thất bại với mã lỗi ${response.status}`);
  }

  return data as T;
}

// 1. API XÁC THỰC & HỒ SƠ KHÁCH HÀNG
export const authApi = {
  register: async (payload: { fullName: string; email: string; password: string; phone?: string }) => {
    const res = await request<{ user: User; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) tokenStorage.set(res.token);
    return res;
  },

  login: async (payload: { email: string; password: string }) => {
    const res = await request<{ user: User; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) tokenStorage.set(res.token);
    return res;
  },

  logout: () => {
    tokenStorage.remove();
  },

  getMe: async () => {
    return request<{ user: User }>('/api/auth/me');
  },

  updateProfile: async (payload: UpdateUserProfilePayload) => {
    return request<{ user: User; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    return request<{ message: string }>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  redeemPoints: async (points: number, description: string) => {
    return request<{ message: string; remainingPoints: number }>('/api/auth/redeem-points', {
      method: 'POST',
      body: JSON.stringify({ points, description }),
    });
  },
};

// 2. API THỰC ĐƠN SQL (MENU ITEMS)
export const menuApi = {
  getMenu: async (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Product[]>(`/api/menu${query}`);
  },

  getById: async (id: string) => {
    return request<Product>(`/api/menu/${id}`);
  },
};

// 3. API ĐƠN HÀNG (ORDERS)
export const orderApi = {
  getOrders: async () => {
    return request<Order[]>('/api/orders');
  },

  createOrder: async (orderData: {
    items: CartItem[];
    subtotal: number;
    discount?: number;
    pointsDiscount?: number;
    pointsUsed?: number;
    voucherCode?: string;
    total: number;
    paymentMethod: PaymentMethodId;
    customerName: string;
    customerPhone: string;
    pickupBranch: string;
    pickupCounter?: string;
    pickupTimeType?: 'asap' | 'scheduled';
    scheduledTime?: string;
    pickupNote?: string;
  }) => {
    return request<{ message: string; order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  updateStatus: async (orderId: string, status: string) => {
    return request<{ message: string; status: string }>(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// 4. API DỮ LIỆU CỐ ĐỊNH (BRANCHES, VOUCHERS, LOYALTY HISTORY)
export const metaApi = {
  getBranches: async () => {
    return request<BranchInfo[]>('/api/branches');
  },

  getVouchers: async () => {
    return request<VoucherItem[]>('/api/vouchers');
  },

  getLoyaltyHistory: async () => {
    return request<any[]>('/api/loyalty-history');
  },
};
