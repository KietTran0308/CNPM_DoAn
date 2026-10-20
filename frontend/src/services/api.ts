import type {
    User,
    Product,
    Order,
    BranchInfo,
    VoucherItem,
    CartItem,
    PaymentMethodId,
    UpdateUserProfilePayload,
    ChangePasswordPayload
} from '../types';
import {DEFAULT_BRANCHES, DEFAULT_VOUCHERS, SIZES, TOPPINGS} from '../constants';
import {mockRequest} from '../mocks/request';

/** Chỉ bật khi muốn thử giao diện không cần chạy NestJS/PostgreSQL. */
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'brewlite_auth_token';
export const tokenStorage = {
    get: (): string | null => typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY),
    set: (token: string) => {
        if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
    },
    remove: () => {
        if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
    },
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (USE_MOCK_API) return mockRequest<T>(path, options);
    const headers = new Headers(options.headers);
    if (options.body) headers.set('Content-Type', 'application/json');
    const token = tokenStorage.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    let response: Response;
    try {
        response = await fetch(`${BASE_URL}${path}`, {...options, headers, cache: 'no-store'});
    } catch {
        throw new Error('Không kết nối được NestJS. Kiểm tra http://localhost:4000/health hoặc bật NEXT_PUBLIC_USE_MOCK_API=true để thử frontend.');
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) tokenStorage.remove();
        throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || `API lỗi ${response.status}`);
    }
    return body as T;
}

function mapUser(data: any): User {
    const u = data.user || data;
    return {
        id: String(u.id), fullName: u.fullName || '', email: u.email || '', phone: u.phone || '',
        avatar: u.avatar || undefined, favoriteBranch: u.favoriteBranch || undefined,
        role: u.role === 'ADMIN' ? 'admin' : u.role === 'STAFF' ? 'barista' : 'customer',
        loyaltyPoints: u.loyaltyPoints || 0, createdAt: u.createdAt, membershipTier: u.membershipTier || 'Standard'
    };
}

export const authApi = {
    register: async (payload: { fullName: string; email: string; password: string; phone?: string }) => {
        const res = await request<{ user: User; token: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        tokenStorage.set(res.token);
        return {...res, user: mapUser(res.user), message: 'Đăng ký thành công'};
    },
    login: async (payload: { email: string; password: string }) => {
        const res = await request<{ user: User; token: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        tokenStorage.set(res.token);
        return {...res, user: mapUser(res.user), message: 'Đăng nhập thành công'};
    },
    logout: () => tokenStorage.remove(),
    getMe: async () => ({user: mapUser(await request<any>('/auth/me'))}),
    updateProfile: async (payload: UpdateUserProfilePayload) => ({
        user: mapUser(await request<any>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(payload)
        })), message: 'Đã cập nhật hồ sơ'
    }),
    changePassword: (payload: ChangePasswordPayload) => request<{ message: string }>('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
            currentPassword: payload.currentPassword ?? payload.oldPass,
            newPassword: payload.newPassword ?? payload.newPass
        })
    }),
    redeemPoints: (points: number, description: string) => request<{
        message: string;
        remainingPoints: number
    }>('/auth/redeem-points', {method: 'POST', body: JSON.stringify({points, description})}),
};

export function mapProductFromBackend(p: Record<string, any>): Product {
    return {
        id: String(p.code ?? p.id),
        name: String(p.name),
        category: p.category || 'coffee_viet',
        categoryName: p.categoryName || ({
            coffee_viet: 'Cà phê Việt Nam',
            coffee_machine: 'Cà phê pha máy',
            tea: 'Trà & Trà sữa',
            bakery: 'Bánh ngọt & Bánh mì',
            ice_cream: 'Kem Gelato thủ công'
        }[p.category as string] ?? 'Khác'),
        sectionCaption: p.sectionCaption,
        description: p.description || '',
        basePrice: Number(p.price ?? p.basePrice ?? 0),
        image: String(p.imageUrl ?? p.image ?? '/images/artisan_hero_food_1791967258188.jpg').replace('/src/assets/images/', '/images/'),
        isPopular: p.isPopular ?? false,
        calories: p.calories
    };
}

export const menuApi = {
    getMenu: async (category?: string, search?: string): Promise<Product[]> => {
        const list = (await request<Record<string, any>[]>('/products')).map(mapProductFromBackend);
        return list.filter(p => (!category || p.category === category) && (!search || `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())));
    },
    getById: async (id: string) => mapProductFromBackend(await request<any>(`/products/${encodeURIComponent(id)}`)),
};

function mapOrder(raw: any): Order {
    // Database dùng orderItems, không phải items của bản mock cũ.
    if (raw.orderNumber && raw.items?.[0]?.product?.basePrice !== undefined) return raw as Order;
    const rows = raw.orderItems ?? raw.items ?? [];
    const items: CartItem[] = rows.map((it: any) => {
        const product = mapProductFromBackend(it.product ?? {
            code: it.productId, name: it.productId, price: it.unitPrice
        });
        const qty = Number(it.qty) || 1;
        const size = SIZES.find(s => s.id === it.size) ?? SIZES[0];
        // Relation Prisma: [{topping: {code: 't1', ...}, price: ...}]
        const selected = (Array.isArray(it.toppings) ? it.toppings : [])
            .map((row: any) => TOPPINGS.find(t => t.id === (row.topping?.code ?? row.code)))
            .filter((t: any): t is typeof TOPPINGS[number] => Boolean(t));
        const lineTotal = Number(it.lineTotal);
        return {
            cartItemId: String(it.id), product, size, toppings: selected,
            quantity: qty, unitPrice: lineTotal / qty, totalPrice: lineTotal,
            iceLevel: '100%', sugarLevel: '100%', note: ''
        };
    });
    const payment = raw.payments?.find((p: any) => p.status === 'SUCCESS') ?? raw.payments?.[0];
    return {
        id: String(raw.id),
        orderNumber: `BL-${raw.orderCode ?? String(raw.id).slice(0, 8).toUpperCase()}`,
        pickupCode: String(raw.orderCode ?? raw.id).slice(-4),
        createdAt: String(raw.createdAt), items,
        subtotal: Number(raw.subtotal),
        discount: Number(raw.discountAmount ?? raw.discount ?? 0),
        pointsDiscount: Number(raw.pointsDiscount ?? 0),
        pointsUsed: Number(raw.pointsUsed ?? 0),
        total: Number(raw.total), status: raw.status,
        paymentMethod: payment?.method === 'CARD' ? 'card' : 'momo',
        customerName: raw.user?.fullName ?? '',
        customerPhone: raw.user?.phone ?? '',
        pickupBranch: DEFAULT_BRANCHES[0].name,
        pickupCounter: DEFAULT_BRANCHES[0].counter,
        pickupTimeType: 'asap',
        pointsEarned: raw.status === 'PAID' ? Math.floor(Number(raw.total) / 10000) : 0
    };
}

interface CheckoutPayload {
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
}

export const orderApi = {
    getOrders: async () => (await request<any[]>('/orders/me')).map(mapOrder),
    createOrder: async (payload: CheckoutPayload, simulateFailure = false) => {
        if (USE_MOCK_API) {
            const created = await request<{ message: string; order: Order }>('/orders', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const paid = await request<{ message: string; order: Order }>('/payments', {
                method: 'POST',
                headers: {'Idempotency-Key': `pay-${created.order.id}`},
                body: JSON.stringify({
                    orderId: created.order.id,
                    amount: payload.total,
                    method: payload.paymentMethod,
                    simulateFailure
                })
            });
            return paid;
        }
        const created = await request<any>('/orders', {
            method: 'POST', body: JSON.stringify({
                items: payload.items.map(it => ({
                    productCode: it.product.id,
                    size: it.size.id,
                    toppingCodes: it.toppings.map(t => t.id),
                    qty: it.quantity
                })),
                ...(payload.voucherCode ? {voucherCode: payload.voucherCode} : {}),
            })
        });
        const method = payload.paymentMethod === 'card' ? 'CARD' : 'WALLET';
        const paid = await request<{ order: any }>('/payments', {
            method: 'POST', headers: {'Idempotency-Key': `pay-${created.id}`},
            body: JSON.stringify({orderId: created.id, method, simulateFailure})
        });
        if (paid.order.status !== 'PAID') {
            throw new Error('Thanh toán không thành công, giỏ hàng được giữ nguyên.');
        }
        return {
            order: mapOrder({ ...created, ...paid.order, orderItems: created.orderItems, payments: [{ method, status: 'SUCCESS' }] }),
            message: 'Thanh toán mô phỏng thành công'
        };
    },
    updateStatus: async (orderId: string, status: string) => {
        const order = await request<any>(`/orders/${encodeURIComponent(orderId)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({status})
        });
        return {message: 'Đã cập nhật trạng thái', status: order.status};
    },
};
export const metaApi = {
    getBranches: async (): Promise<BranchInfo[]> => USE_MOCK_API ? request<BranchInfo[]>('/branches') : DEFAULT_BRANCHES,
    getVouchers: async (): Promise<VoucherItem[]> => {
        if (USE_MOCK_API) return request<VoucherItem[]>('/vouchers');
        const data = await request<Array<{
            code: string; discountType: 'FIXED' | 'PERCENT';
            discountValue: string | number; minOrderValue: string | number;
            isActive: boolean; maxUses: number; usedCount: number;
            validTo: string;
        }>>('/vouchers');
        return data.filter(v => v.isActive && v.usedCount < v.maxUses)
            .map(v => ({
                code: v.code,
                title: v.discountType === 'PERCENT' ? `Giảm ${v.discountValue}%` : `Giảm ${Number(v.discountValue).toLocaleString('vi-VN')}đ`,
                description: 'Mã ưu đãi BrewLite',
                discountAmount: v.discountType === 'FIXED' ? Number(v.discountValue) : 0,
                minOrder: Number(v.minOrderValue),
                tag: 'Ưu đãi',
                expiry: new Date(v.validTo).toLocaleDateString('vi-VN'),
                requiredPoints: 0,
            }));
    },
    getLoyaltyHistory: async (): Promise<unknown[]> => [],
};
