// API Client for BrewLite Frontend (Next.js)
// Standard Next.js environment configuration via process.env.NEXT_PUBLIC_API_URL
// with comprehensive Offline Mock Fallback when the backend server is not running.

export const API_BASE_URL: string =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || '';

// -------------------------------------------------------------
// 1. ORDER STATE MACHINE (7 Trạng thái chuẩn)
// -------------------------------------------------------------
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export class InvalidStateTransitionError extends Error {
  constructor(current: OrderStatus, target: OrderStatus) {
    super(
      `Lỗi State Machine: Không thể chuyển từ ${current} sang ${target}. Vòng đời hợp lệ: PENDING -> PAID -> PREPARING -> READY -> COMPLETED.`
    );
    this.name = 'InvalidStateTransitionError';
  }
}

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertTransition(current: OrderStatus, target: OrderStatus): void {
  const allowed = VALID_ORDER_TRANSITIONS[current] || [];
  if (!allowed.includes(target)) {
    throw new InvalidStateTransitionError(current, target);
  }
}

// -------------------------------------------------------------
// 2. 12.2 THỰC THỂ TỐI THIỂU (Exact field names)
// -------------------------------------------------------------

// 1. Product(id, name, price, imageUrl, stock, category, description)
export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  category?: string;
  description?: string;
}

// 2. User(id, email, passwordHash, loyaltyPoints)
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  loyaltyPoints: number;
}

// 3. Order(id, userId, status, total, createdAt)
export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items?: OrderItem[];
}

// 4. OrderItem(id, orderId, productId, size, qty, lineTotal)
export interface OrderItem {
  id: string;
  orderId: string;
  productId: number;
  size: string;
  qty: number;
  lineTotal: number;
  sugar?: string;
  ice?: string;
  note?: string;
}

// 5. Payment(id, orderId, idempotencyKey, amount, method)
export interface Payment {
  id: string;
  orderId: string;
  idempotencyKey: string;
  amount: number;
  method: string;
}

// -------------------------------------------------------------
// DEFAULT DATA & MOCK STORAGE
// -------------------------------------------------------------
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Cà phê sữa',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
    stock: 25,
    category: 'Cà phê',
    description: 'Cà phê Robusta đậm đà pha sữa đặc thơm béo truyền thống',
  },
  {
    id: 2,
    name: 'Americano',
    price: 40000,
    imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500&auto=format&fit=crop&q=80',
    stock: 20,
    category: 'Cà phê',
    description: 'Cà phê đen nguyên chất pha loãng với nước nóng thanh tao',
  },
  {
    id: 3,
    name: 'Cappuccino',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80',
    stock: 15,
    category: 'Cà phê',
    description: 'Espresso đậm vị kết hợp sữa nóng và lớp bọt sữa bồng bềnh',
  },
  {
    id: 4,
    name: 'Trà đào',
    price: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80',
    stock: 18,
    category: 'Trà',
    description: 'Trà thanh mát kết hợp đào miếng tươi giòn ngọt lịm',
  },
  {
    id: 5,
    name: 'Cà Phê Muối Huế',
    price: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80',
    stock: 30,
    category: 'Cà phê',
    description: 'Cà phê phin đậm đà kết hợp lớp kem muối mặn ngọt béo ngậy chuẩn vị cố đô',
  },
  {
    id: 6,
    name: 'Cà Phê Trứng Hà Nội',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
    stock: 25,
    category: 'Cà phê',
    description: 'Lớp kem trứng gà đánh bông mịn màng, thơm lừng hòa quyện cùng cà phê nóng',
  },
  {
    id: 7,
    name: 'Bạc Xỉu Đá Sài Gòn',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=80',
    stock: 35,
    category: 'Cà phê',
    description: 'Sữa đặc pha sữa tươi béo ngậy tạo tầng đẹp mắt cùng cà phê phin thơm nhẹ',
  },
  {
    id: 8,
    name: 'Cà Phê Cốt Dừa',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?w=500&auto=format&fit=crop&q=80',
    stock: 20,
    category: 'Cà phê',
    description: 'Cốt dừa xay đá tuyết mát lạnh, béo bùi quyện cùng vị đắng dịu của cà phê',
  },
  {
    id: 9,
    name: 'Cà Phê Sữa Tươi Sương Sáo',
    price: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
    stock: 28,
    category: 'Cà phê',
    description: 'Cà phê sữa tươi thanh nhẹ kết hợp cùng thạch sương sáo đen giòn mát',
  },
  {
    id: 10,
    name: 'Trà Sen Vàng Kem Cheese',
    price: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
    stock: 22,
    category: 'Trà',
    description: 'Trà Ô long thanh mát kết hợp hạt sen bùi, củ năng giòn và lớp kem phô mai mặn béo',
  },
  {
    id: 11,
    name: 'Trà Đào Cam Sả',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80',
    stock: 30,
    category: 'Trà',
    description: 'Hồng trà ủ lạnh thơm hương sả tươi, cam vàng mọng nước và đào miếng giòn ngọt',
  },
  {
    id: 12,
    name: 'Trà Vải Hoa Hồng',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=500&auto=format&fit=crop&q=80',
    stock: 25,
    category: 'Trà',
    description: 'Trà lài thanh tao quyện vị ngọt thanh của trái vải ngâm và hương hoa hồng dịu nhẹ',
  },
  {
    id: 13,
    name: 'Trà Mãng Cầu Tươi',
    price: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
    stock: 20,
    category: 'Trà',
    description: 'Mãng cầu xiêm tươi dầm chua ngọt sảng khoái trên nền trà xanh lài đậm vị',
  },
  {
    id: 14,
    name: 'Trà Ô Long Nhãn Nhục Hạt Chia',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80',
    stock: 24,
    category: 'Trà',
    description: 'Vị ngọt thanh cổ truyền từ nhãn nhục sấy khô, hạt chia bổ dưỡng cùng trà Ô long',
  },
];

export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

// Token storage helpers
export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('brewlite_jwt_token');
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem('brewlite_jwt_token', token);
    } else {
      localStorage.removeItem('brewlite_jwt_token');
    }
  } catch {
    // ignore
  }
};

// User & Loyalty helpers
export const DEFAULT_USER: User = {
  id: 'usr_001',
  email: 'khachhang@brewlite.vn',
  passwordHash: 'hash_masked',
  loyaltyPoints: 12,
};

export const getStoredAccounts = (): Record<string, User> => {
  try {
    const raw = localStorage.getItem('brewlite_accounts');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    'khachhang@brewlite.vn': DEFAULT_USER,
  };
};

export const setStoredAccount = (user: User) => {
  try {
    const accounts = getStoredAccounts();
    accounts[user.email.toLowerCase()] = user;
    localStorage.setItem('brewlite_accounts', JSON.stringify(accounts));
  } catch {}
};

export const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('brewlite_user');
    if (raw) return JSON.parse(raw);
  } catch {
    return null;
  }
  return null;
};

export const setStoredUser = (user: User | null): void => {
  try {
    if (user) {
      localStorage.setItem('brewlite_user', JSON.stringify(user));
      setStoredAccount(user);
    } else {
      localStorage.removeItem('brewlite_user');
    }
  } catch {
    // ignore
  }
};

// Seed sample orders for demonstrating State Machine in History
export const SEED_ORDERS: Order[] = [
  {
    id: '1041',
    userId: 'usr_me',
    status: 'PAID',
    total: 45000,
    createdAt: '08:30 - 21/10/2026',
    items: [
      {
        id: 'item_1041_1',
        orderId: '1041',
        productId: 3,
        size: 'M',
        qty: 1,
        lineTotal: 45000,
      },
    ],
  },
  {
    id: '1040',
    userId: 'usr_me',
    status: 'PAYMENT_FAILED',
    total: 75000,
    createdAt: '08:15 - 21/10/2026',
    items: [
      {
        id: 'item_1040_1',
        orderId: '1040',
        productId: 1,
        size: 'S',
        qty: 1,
        lineTotal: 35000,
      },
      {
        id: 'item_1040_2',
        orderId: '1040',
        productId: 2,
        size: 'M',
        qty: 1,
        lineTotal: 40000,
      },
    ],
  },
  {
    id: '1039',
    userId: 'usr_me',
    status: 'COMPLETED',
    total: 80000,
    createdAt: '16:45 - 20/10/2026',
    items: [
      {
        id: 'item_1039_1',
        orderId: '1039',
        productId: 2,
        size: 'M',
        qty: 2,
        lineTotal: 80000,
      },
    ],
  },
];

// In-memory idempotency cache for payment requests
const idempotencyStore = new Map<string, { status: OrderStatus }>();

// -------------------------------------------------------------
// HELPER: SAFE FETCH WITH OFFLINE FALLBACK
// -------------------------------------------------------------
async function safeFetch<T>(
  path: string,
  options: RequestInit,
  fallbackFn: () => Promise<T> | T
): Promise<T> {
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  if (!baseUrl) {
    return fallbackFn();
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data as T;
    }

    // If server specifically returned 400 or 409 error with message, throw it
    if (res.status === 400 || res.status === 409) {
      const err = await res.json().catch(() => ({}));
      if (err.message) {
        throw new Error(err.message);
      }
    }
  } catch (err: any) {
    // If it's a specific validation error from backend, re-throw it
    if (err.message && !err.message.includes('fetch') && !err.message.includes('abort') && !err.message.includes('Failed to fetch')) {
      throw err;
    }
    // Network unavailable / offline: seamlessly fall back
  }

  return fallbackFn();
}

// -------------------------------------------------------------
// 12.1 MỘT SỐ ENDPOINT CHÍNH (Frontend REST Client + Mock Fallback)
// -------------------------------------------------------------
export const api = {
  // 1. GET /products: Danh sách sản phẩm (menu)
  async getProducts(): Promise<Product[]> {
    return safeFetch<Product[]>('/products', { method: 'GET' }, () => {
      try {
        const stored = localStorage.getItem('brewlite_products');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length >= DEFAULT_PRODUCTS.length) {
            return parsed;
          }
        }
        localStorage.setItem('brewlite_products', JSON.stringify(DEFAULT_PRODUCTS));
      } catch {}
      return DEFAULT_PRODUCTS;
    });
  },

  // 2. GET /products/:id: Chi tiết một sản phẩm
  async getProductById(id: number): Promise<Product | null> {
    return safeFetch<Product | null>(`/products/${id}`, { method: 'GET' }, () => {
      try {
        const stored = localStorage.getItem('brewlite_products');
        if (stored) {
          const list: Product[] = JSON.parse(stored);
          const item = list.find((p) => p.id === id);
          if (item) return item;
        }
      } catch {}
      const found = DEFAULT_PRODUCTS.find((p) => p.id === id);
      return found || null;
    });
  },

  // 3. POST /auth/register: Đăng ký tài khoản (User với loyaltyPoints: 0)
  async register(email: string, password: string): Promise<{ token: string; user: User }> {
    const cleanEmail = email.trim();
    return safeFetch<{ token: string; user: User }>(
      '/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      },
      () => {
        // Validation regex email chuẩn
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          throw new Error('Email không đúng định dạng');
        }
        if (password.length < 6) {
          throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
        }

        const accounts = getStoredAccounts();
        if (accounts[cleanEmail.toLowerCase()]) {
          throw new Error('Email này đã được sử dụng.');
        }

        const userObj: User = {
          id: 'usr_' + Date.now().toString(36),
          email: cleanEmail,
          passwordHash: 'hash_masked',
          loyaltyPoints: 0, // Tiêu chí Task 1: Luôn khởi tạo 0 điểm
        };
        setStoredAccount(userObj);

        const token = 'jwt_mock_' + btoa(cleanEmail);
        setStoredToken(token);
        setStoredUser(userObj);

        return { token, user: userObj };
      }
    );
  },

  // 4. POST /auth/login: Đăng nhập, trả JWT và tải thông tin user kèm loyaltyPoints
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const cleanEmail = email.trim();
    return safeFetch<{ token: string; user: User }>(
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      },
      () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          throw new Error('Email không đúng định dạng');
        }
        if (password.length < 6) {
          throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
        }

        const accounts = getStoredAccounts();
        const existing = accounts[cleanEmail.toLowerCase()];
        const userObj: User = existing || {
          id: 'usr_' + Date.now().toString(36),
          email: cleanEmail,
          passwordHash: 'hash_masked',
          loyaltyPoints: cleanEmail.toLowerCase() === DEFAULT_USER.email.toLowerCase() ? DEFAULT_USER.loyaltyPoints : 0,
        };
        setStoredAccount(userObj);

        const token = 'jwt_mock_' + btoa(cleanEmail);
        setStoredToken(token);
        setStoredUser(userObj);

        return { token, user: userObj };
      }
    );
  },

  // 5. POST /orders: Tạo đơn (PENDING)
  async createOrder(
    items: OrderItem[],
    total: number
  ): Promise<{ orderId: string; status: OrderStatus }> {
    const token = getStoredToken();
    return safeFetch<{ orderId: string; status: OrderStatus }>(
      '/orders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ items, total }),
      },
      () => {
        const fallbackId = String(1040 + Math.floor(Math.random() * 50));
        const newOrder: Order = {
          id: fallbackId,
          userId: 'usr_me',
          status: 'PENDING',
          total,
          createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN'),
          items,
        };

        try {
          const raw = localStorage.getItem('brewlite_orders_history');
          const list: Order[] = raw ? JSON.parse(raw) : [...SEED_ORDERS];
          list.unshift(newOrder);
          localStorage.setItem('brewlite_orders_history', JSON.stringify(list));
        } catch {}

        return { orderId: fallbackId, status: 'PENDING' };
      }
    );
  },

  // 6. POST /payments: Thanh toán (idempotent, mock fallback)
  async processPayment(
    paymentPayload: Payment,
    simulateStatus?: OrderStatus
  ): Promise<{ status: OrderStatus; isDuplicate?: boolean }> {
    // Idempotency Check: nếu đã xử lý khóa này, trả về kết quả đã lưu mà không trừ tiền lại
    if (idempotencyStore.has(paymentPayload.idempotencyKey)) {
      const cached = idempotencyStore.get(paymentPayload.idempotencyKey)!;
      return { status: cached.status, isDuplicate: true };
    }

    if (simulateStatus) {
      idempotencyStore.set(paymentPayload.idempotencyKey, { status: simulateStatus });
      return { status: simulateStatus, isDuplicate: false };
    }

    const token = getStoredToken();
    return safeFetch<{ status: OrderStatus; isDuplicate?: boolean }>(
      '/payments',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': paymentPayload.idempotencyKey,
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(paymentPayload),
      },
      () => {
        const finalStatus: OrderStatus = 'PAID';
        idempotencyStore.set(paymentPayload.idempotencyKey, { status: finalStatus });

        // Cập nhật trạng thái trong lịch sử đơn
        try {
          const raw = localStorage.getItem('brewlite_orders_history');
          if (raw) {
            const list: Order[] = JSON.parse(raw);
            const ord = list.find((o) => o.id === paymentPayload.orderId);
            if (ord) ord.status = finalStatus;
            localStorage.setItem('brewlite_orders_history', JSON.stringify(list));
          }
        } catch {}

        // Tích lũy điểm thưởng loyalty (+5 điểm mỗi 50.000đ)
        const earned = Math.floor(paymentPayload.amount / 50000) * 5;
        if (earned > 0) {
          const currentUser = getStoredUser();
          if (currentUser) {
            currentUser.loyaltyPoints = (currentUser.loyaltyPoints || 0) + earned;
            setStoredUser(currentUser);
          }
        }

        return { status: finalStatus, isDuplicate: false };
      }
    );
  },

  // 7. GET /orders/me: Lịch sử đơn của user
  async getMyOrders(): Promise<Order[]> {
    const token = getStoredToken();
    return safeFetch<Order[]>(
      '/orders/me',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      },
      () => {
        try {
          const local = localStorage.getItem('brewlite_orders_history');
          if (local) return JSON.parse(local);
        } catch {}
        return SEED_ORDERS;
      }
    );
  },

  // 8. PATCH /orders/:id/status: Chuyển đổi trạng thái đơn hàng (tuân thủ assertTransition)
  async transitionOrderStatus(
    orderId: string,
    targetStatus: OrderStatus
  ): Promise<{ order: Order; message: string; previousStatus: OrderStatus }> {
    const token = getStoredToken();
    return safeFetch<{ order: Order; message: string; previousStatus: OrderStatus }>(
      `/orders/${orderId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ targetStatus }),
      },
      () => {
        let history: Order[] = [];
        try {
          const raw = localStorage.getItem('brewlite_orders_history');
          history = raw ? JSON.parse(raw) : [...SEED_ORDERS];
        } catch {
          history = [...SEED_ORDERS];
        }

        const order = history.find((o) => o.id === orderId);
        if (!order) {
          throw new Error(`Đơn hàng #${orderId} không tìm thấy.`);
        }

        // Kiểm tra quy tắc chuyển trạng thái thông qua assertTransition
        assertTransition(order.status, targetStatus);

        const previousStatus = order.status;
        order.status = targetStatus;

        try {
          localStorage.setItem('brewlite_orders_history', JSON.stringify(history));
        } catch {}

        let message = `Cập nhật đơn #${orderId}: ${previousStatus} -> ${targetStatus}`;
        if (targetStatus === 'READY') {
          message = `Đồ uống của bạn đã pha xong. Mời bạn đến quầy đọc mã đơn #${orderId} để nhận nước.`;
        } else if (targetStatus === 'PREPARING') {
          message = `Đơn hàng #${orderId} đã được quầy tiếp nhận và đang tiến hành pha chế.`;
        } else if (targetStatus === 'COMPLETED') {
          message = `Đơn hàng #${orderId} đã được bàn giao thành công cho khách hàng.`;
        } else if (targetStatus === 'CANCELLED') {
          message = `Đơn hàng #${orderId} đã được hủy bỏ.`;
        }

        return { order, message, previousStatus };
      }
    );
  },
};
