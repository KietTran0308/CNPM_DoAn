import type {Order, User, OrderStatus} from '../types';
import {DEFAULT_BRANCHES, DEFAULT_VOUCHERS} from '../constants';
import {MOCK_PRODUCTS} from './products';

/** Chỉ dùng để demo trên trình duyệt, KHÔNG phải backend bảo mật hay cổng thanh toán thật. */
const KEY = 'brewlite_mock_v1';
const TOKEN_KEY = 'brewlite_auth_token';
type StoredUser = { profile: User; digest: string };
type Db = { users: StoredUser[]; orders: Order[]; paymentKeys: Record<string, string> };
const initialDb = (): Db => ({users: [], orders: [], paymentKeys: {}});
const load = (): Db => {
    try {
        return {...initialDb(), ...JSON.parse(localStorage.getItem(KEY) || '{}')};
    } catch {
        return initialDb();
    }
};
const save = (db: Db) => localStorage.setItem(KEY, JSON.stringify(db));
const problem = (msg: string): never => {
    throw new Error(msg);
};
const passHash = async (email: string, password: string): Promise<string> => {
    // Digest nhằm tránh lưu mật khẩu thuần ở bản demo; KHÔNG có tính an toàn của hash phía server.
    const bytes = new TextEncoder().encode(`brewlite-demo:${email.toLowerCase()}:${password}`);
    const buffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(buffer), (n) => n.toString(16).padStart(2, '0')).join('');
};
const signedIn = (db: Db): User | null => {
    const token = localStorage.getItem(TOKEN_KEY) || '';
    return db.users.find((u) => `demo-${u.profile.id}` === token)?.profile ?? null;
};
const ensureAuth = (db: Db): User => signedIn(db) || problem('Bạn cần đăng nhập để tiếp tục.');
const now = () => new Date().toISOString();
const id = () => globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const json = (options: RequestInit) => options.body ? JSON.parse(String(options.body)) : {};
const response = <T>(result: unknown): T => result as T;
const transitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'], PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
    PAID: ['PREPARING', 'CANCELLED'], PREPARING: ['READY'], READY: ['COMPLETED'], COMPLETED: [], CANCELLED: []
};

export async function mockRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const db = load();
    const method = (options.method || 'GET').toUpperCase();
    const body = json(options);
    if (path === '/products' && method === 'GET') return response<T>(MOCK_PRODUCTS);
    if (path.startsWith('/products/') && method === 'GET') {
        const product = MOCK_PRODUCTS.find((p) => p.id === decodeURIComponent(path.slice(10)));
        return response<T>(product || problem('Không tìm thấy sản phẩm'));
    }
    if (path === '/auth/register' && method === 'POST') {
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        if (!email.includes('@') || password.length < 6 || !String(body.fullName || '').trim()) problem('Cần họ tên, email hợp lệ và mật khẩu tối thiểu 6 ký tự.');
        if (db.users.some((entry) => entry.profile.email.toLowerCase() === email)) problem('Email này đã được đăng ký.');
        const profile: User = {
            id: id(),
            fullName: String(body.fullName).trim(),
            email,
            phone: String(body.phone || ''),
            loyaltyPoints: 0,
            membershipTier: 'Standard',
            role: 'customer',
            createdAt: now()
        };
        db.users.push({profile, digest: await passHash(email, password)});
        save(db);
        return response<T>({user: profile, token: `demo-${profile.id}`, message: 'Tạo tài khoản demo thành công'});
    }
    if (path === '/auth/login' && method === 'POST') {
        const email = String(body.email || '').trim().toLowerCase();
        const user = db.users.find((u) => u.profile.email.toLowerCase() === email);
        if (!user || user.digest !== await passHash(email, String(body.password || ''))) return problem('Email hoặc mật khẩu chưa đúng. Hãy đăng ký tài khoản demo trước.');
        return response<T>({
            user: user.profile,
            token: `demo-${user.profile.id}`,
            message: 'Đăng nhập demo thành công'
        });
    }
    if (path === '/auth/me') return response<T>({user: ensureAuth(db)});
    if (path === '/auth/profile' && method === 'PUT') {
        const user = ensureAuth(db);
        const record = db.users.find((u) => u.profile.id === user.id)!;
        record.profile = {
            ...record.profile,
            fullName: body.fullName || user.fullName,
            phone: body.phone ?? user.phone,
            avatar: body.avatar ?? user.avatar,
            favoriteBranch: body.favoriteBranch ?? user.favoriteBranch
        };
        save(db);
        return response<T>({user: record.profile, message: 'Cập nhật hồ sơ demo thành công'});
    }
    if (path === '/auth/password' && method === 'PUT') {
        const user = ensureAuth(db);
        const record = db.users.find((u) => u.profile.id === user.id)!;
        if (record.digest !== await passHash(user.email, String(body.currentPassword || body.oldPass || ''))) problem('Mật khẩu hiện tại không đúng.');
        const newPassword = String(body.newPassword || body.newPass || '');
        if (newPassword.length < 6) problem('Mật khẩu mới phải tối thiểu 6 ký tự.');
        record.digest = await passHash(user.email, newPassword);
        save(db);
        return response<T>({message: 'Đổi mật khẩu demo thành công'});
    }
    if (path === '/auth/redeem-points' && method === 'POST') {
        const user = ensureAuth(db);
        const record = db.users.find((u) => u.profile.id === user.id)!;
        const points = Number(body.points);
        if (!Number.isInteger(points) || points <= 0 || (user.loyaltyPoints || 0) < points) problem('Không đủ điểm hoặc số điểm không hợp lệ.');
        record.profile.loyaltyPoints = (user.loyaltyPoints || 0) - points;
        save(db);
        return response<T>({message: 'Đã trừ điểm trong bản demo', remainingPoints: record.profile.loyaltyPoints});
    }
    if (path === '/orders/me' && method === 'GET') {
        const user = signedIn(db);
        return response<T>(user ? db.orders.filter((o) => (o as Order & {
            userId?: string
        }).userId === user.id).reverse() : []);
    }
    const oneOrder = path.match(/^\/orders\/([^/]+)$/);
    if (oneOrder && method === 'GET') {
        const user = ensureAuth(db);
        const order = db.orders.find((o) => o.id === decodeURIComponent(oneOrder[1])) as (Order & { userId: string }) | undefined;
        if (!order || order.userId !== user.id) return problem('Không tìm thấy đơn hàng.');
        return response<T>(order);
    }
    if (path === '/orders' && method === 'POST') {
        const user = ensureAuth(db);
        if (!Array.isArray(body.items) || body.items.length === 0) problem('Giỏ hàng trống.');
        if (!Number.isFinite(body.total) || body.total < 0) problem('Tổng tiền không hợp lệ.');
        const orderId = id();
        const order: Order & { userId: string } = {
            ...body,
            id: orderId,
            userId: user.id,
            orderNumber: `BL-${Date.now()}`,
            pickupCode: String(Math.floor(1000 + Math.random() * 9000)),
            createdAt: now(),
            status: 'PENDING',
            pointsEarned: Math.max(1, Math.floor(Number(body.total) / 10000)),
            pickupTimeType: body.pickupTimeType || 'asap',
            pickupBranch: body.pickupBranch || '',
            pickupCounter: body.pickupCounter || 'Quầy Barista'
        };
        db.orders.push(order);
        save(db);
        return response<T>({message: 'Đã tạo đơn PENDING (demo)', order});
    }
    if (path === '/payments' && method === 'POST') {
        const user = ensureAuth(db);
        const order = db.orders.find((o) => o.id === body.orderId) as (Order & { userId: string }) | undefined;
        if (!order || order.userId !== user.id) return problem('Không tìm thấy đơn để thanh toán.');
        const headers = new Headers(options.headers);
        const key = headers.get('Idempotency-Key');
        if (!key) return problem('Thiếu Idempotency-Key.');
        if (db.paymentKeys[key] && db.paymentKeys[key] !== order.id) return problem('Idempotency-Key đã dùng cho đơn khác.');
        if (order.status === 'PAID') return response<T>({message: 'Thanh toán demo đã ghi nhận', order});
        if (order.status === 'PAYMENT_FAILED') order.status = 'PENDING'; // thanh toán lại đơn lỗi
        if (order.status !== 'PENDING') return problem('Không thể thanh toán đơn ở trạng thái hiện tại.');
        db.paymentKeys[key] = order.id;
        order.status = body.simulateFailure ? 'PAYMENT_FAILED' : 'PAID';
        if (order.status === 'PAID') {
            const record = db.users.find((u) => u.profile.id === user.id)!;
            const tier = record.profile.membershipTier || 'Standard';
            const multiplier = tier === 'Diamond' ? 1.5 : tier === 'Gold' ? 1.25 : tier === 'Silver' ? 1.1 : 1;
            const earned = Math.max(1, Math.round((order.total / 10000) * multiplier));
            order.pointsEarned = earned;
            record.profile.loyaltyPoints = (record.profile.loyaltyPoints || 0) + earned;
        }
        save(db);
        if (body.simulateFailure) problem('Thanh toán demo thất bại.');
        return response<T>({message: 'Thanh toán mô phỏng thành công — không có giao dịch thực', order});
    }
    const match = path.match(/^\/orders\/([^/]+)\/status$/);
    if (match && method === 'PATCH') {
        const user = ensureAuth(db);
        const order = db.orders.find((o) => o.id === match[1]) as (Order & { userId: string }) | undefined;
        if (!order || order.userId !== user.id) return problem('Không tìm thấy đơn hàng.');
        const next = body.status as OrderStatus;
        if (!transitions[order.status].includes(next)) problem(`Trạng thái không hợp lệ: ${order.status} → ${next}`);
        order.status = next;
        save(db);
        return response<T>({message: 'Cập nhật trạng thái demo', status: next});
    }
    if (path === '/branches' && method === 'GET') return response<T>(DEFAULT_BRANCHES);
    if (path === '/vouchers' && method === 'GET') return response<T>(DEFAULT_VOUCHERS);
    if (path === '/loyalty-history' && method === 'GET') return response<T>([]);
    return problem(`Chức năng demo chưa hỗ trợ: ${method} ${path}`);
}
