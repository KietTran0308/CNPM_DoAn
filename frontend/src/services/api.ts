import type {
    User,
    Product,
    Order,
    BranchInfo,
    VoucherItem,
    CartItem,
    PaymentMethodId,
} from '../types';
import {DEFAULT_BRANCHES, DEFAULT_VOUCHERS, SIZES, TOPPINGS} from '../constants';
import {request, USE_MOCK_API} from './http';

export {USE_MOCK_API, tokenStorage, request} from './http';
// authApi (đăng ký / đăng nhập / hồ sơ) đã được tách sang ./auth.api; re-export để code cũ không vỡ.
export {authApi} from './auth.api';

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

/** Thanh toán thất bại nhưng đơn đã được tạo (PAYMENT_FAILED) – mang theo đơn để hiện màn xác nhận. */
export class PaymentFailedError extends Error {
    order: Order;

    constructor(message: string, order: Order) {
        super(message);
        this.name = 'PaymentFailedError';
        this.order = order;
    }
}

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
    /** GET /orders/me – đơn của tài khoản đang đăng nhập (backend lọc theo JWT). */
    getOrders: async () => (await request<any[]>('/orders/me')).map(mapOrder),
    /** GET /orders/:id – một đơn của chính tài khoản (404 nếu không phải đơn của mình). */
    getOrder: async (orderId: string) => mapOrder(await request<any>(`/orders/${encodeURIComponent(orderId)}`)),
    /** Thanh toán lại một đơn PAYMENT_FAILED (cùng đơn, key idempotency mới). */
    retryPayment: async (orderId: string, paymentMethod: PaymentMethodId) => {
        const method = paymentMethod === 'card' ? 'CARD' : 'WALLET';
        return request<{ order: any }>('/payments', {
            method: 'POST',
            headers: {'Idempotency-Key': `retry-${orderId}-${Date.now()}`},
            body: JSON.stringify({orderId, method})
        });
    },
    createOrder: async (payload: CheckoutPayload, simulateFailure = false) => {
        if (USE_MOCK_API) {
            const created = await request<{ message: string; order: Order }>('/orders', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            try {
                return await request<{ message: string; order: Order }>('/payments', {
                    method: 'POST',
                    headers: {'Idempotency-Key': `pay-${created.order.id}`},
                    body: JSON.stringify({
                        orderId: created.order.id,
                        amount: payload.total,
                        method: payload.paymentMethod,
                        simulateFailure
                    })
                });
            } catch (e: any) {
                throw new PaymentFailedError(e?.message || 'Thanh toán không thành công.', {...created.order, status: 'PAYMENT_FAILED'});
            }
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
            throw new PaymentFailedError(
                'Thanh toán không thành công, giỏ hàng được giữ nguyên.',
                mapOrder({ ...created, ...paid.order, orderItems: created.orderItems, payments: [{ method, status: 'FAILED' }] })
            );
        }
        return {
            order: mapOrder({ ...created, ...paid.order, orderItems: created.orderItems, payments: [{ method, status: 'SUCCESS' }] }),
            message: 'Thanh toán mô phỏng thành công'
        };
    },
    cancelOrder: async (orderId: string) => {
        if (USE_MOCK_API) return request<any>(`/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' });
        return request<any>(`/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' });
    },
    updateStatus: async (orderId: string, status: string) => {
        const order = await request<any>(`/orders/${encodeURIComponent(orderId)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({status})
        });
        return {message: 'Đã cập nhật trạng thái', status: order.status};
    },
};
export const voucherApi = {
    mine: () => request<Array<{
        code: string; discountValue: number | string; minOrderValue: number | string;
        validTo: string; createdAt: string; status: 'active' | 'used' | 'expired'; rewardId: string
    }>>('/vouchers/mine'),
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
