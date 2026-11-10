import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const LOGO = {
    chinh: '/images/logo.png',
    favicon: '/images/logo.png',
    bannerTrangChu: '/images/logo.png',
};

export const BACKGROUND = '/images/background.png';

export const ANH_MAC_DINH = '/images/caphesua.png';

export const ANH_MON_NUOC = {
    caPheSua: '/images/caphesua.png',
    americano: '/images/americano.png',
    cappuccino: '/images/capuchino.png',
    traDao: '/images/tradaocamsa.png',
    caPheMuoi: '/images/caphemuoi.png',
    caPheTrung: '/images/caphetrung.png',
    bacXiu: '/images/bacxiu.png',
    caPheCotDua: '/images/caphecotdua.png',
    caPheSuaTuoiSuongSao: '/images/caphesuatuoisuongsao.png',
    traSenVang: '/images/trasenvang.png',
    traDaoCamSa: '/images/tradaocamsa.png',
    traVaiHoaHong: '/images/travaihoahong.png',
    traMangCau: '/images/tramangcau.png',
    traOLongNhanNhuc: '/images/tralongnhanhatchia.png',
};

export function layDuongDanAnh(duongDan?: string): string {
    if (!duongDan || !duongDan.trim()) return '';
    const clean = duongDan.trim().replace(/\\/g, '/');
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
        return clean;
    }
    if (clean.startsWith('/public/')) {
        return clean.replace(/^\/public/, '');
    }
    if (clean.startsWith('public/')) {
        return '/' + clean.replace(/^public\//, '');
    }
    if (!clean.startsWith('/')) {
        return '/' + clean;
    }
    return clean;
}

export const HINH_ANH = {
    LOGO,
    BACKGROUND,
    ANH_MAC_DINH,
    ANH_MON_NUOC,
};

export type Screen =
    | 'auth'
    | 'menu'
    | 'product-detail'
    | 'cart'
    | 'checkout'
    | 'success'
    | 'history';

export type SizeType = 'S' | 'M' | 'L';

export type ToppingType =
    | 'Trân châu đen'
    | 'Trân châu trắng'
    | 'Thạch cà phê'
    | 'Kem cheese'
    | 'Kem tươi'
    | 'Trân châu hoàng kim'
    | 'Thạch đào'
    | 'Thạch vải'
    | 'Shot espresso'
    | 'Pudding trứng'
    | 'Trân châu'
    | 'Kem'
    | string;

export interface ToppingItem {
    id: string;
    code: string;
    name: string;
    price: number;
    isActive: boolean;
}

export const DEFAULT_TOPPINGS: ToppingItem[] = [
    { id: '3075f104-4b54-59d0-a5af-0d8fa3ab2828', code: 'TP001', name: 'Trân châu đen', price: 5000, isActive: true },
    { id: '4d4dca18-ae47-5485-ab6b-b5e74f089b74', code: 'TP002', name: 'Trân châu trắng', price: 6000, isActive: true },
    { id: 'ca461442-fc58-596a-a78a-e4b938fbaab7', code: 'TP003', name: 'Thạch cà phê', price: 5000, isActive: true },
    { id: 'be4d54f5-a987-5306-960f-632909bdac15', code: 'TP004', name: 'Kem cheese', price: 9000, isActive: true },
    { id: '3fa12143-595b-5f18-aabd-56a4882f0924', code: 'TP005', name: 'Kem tươi', price: 7000, isActive: true },
    { id: '7606cbbf-f31f-5dbd-b3cf-8f9b24036323', code: 'TP006', name: 'Trân châu hoàng kim', price: 7000, isActive: true },
    { id: '3655baaf-57e8-57d8-b0df-986345d8002c', code: 'TP007', name: 'Thạch đào', price: 6000, isActive: true },
    { id: '46ccd2db-66ca-5514-8ab3-7a0c76e4478e', code: 'TP008', name: 'Thạch vải', price: 6000, isActive: true },
    { id: '674c8ede-3830-5c10-963e-4d5fbe129ef4', code: 'TP009', name: 'Shot espresso', price: 10000, isActive: true },
    { id: 'c5f1343d-f22c-5819-bd08-62a013bfa85e', code: 'TP010', name: 'Pudding trứng', price: 8000, isActive: true },
];

export function tinhGiaTopping(toppings: (ToppingType | string)[], catalog: ToppingItem[] = DEFAULT_TOPPINGS): number {
    return toppings.reduce((sum, t) => {
        const found = catalog.find((item) => item.name === t);
        if (found) return sum + found.price;
        if (t === 'Trân châu') return sum + 5000;
        if (t === 'Kem') return sum + 10000;
        return sum;
    }, 0);
}

export type SugarType = '100%' | '70%' | '50%' | '30%' | 'Ít đường';
export type IceType = '100%' | '70%' | '50%' | 'Ít đá' | 'Đá riêng';

export interface CartLine {
    item: OrderItem;
    productName: string;
    toppings: ToppingType[];
    sugar: SugarType;
    ice: IceType;
    note?: string;
    unitPrice: number;
    stock: number;
}

export const API_BASE_URL: string =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:4000';

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
            `Lỗi chuyển trạng thái: Không thể chuyển từ ${current} sang ${target}. Quy trình hợp lệ: PENDING -> PAID -> PREPARING -> READY -> COMPLETED.`
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

export interface Product {
    id: string;
    uuid?: string;
    code?: string;
    name: string;
    price: number;
    imageUrl: string;
    imageKey?: string;
    stock: number; // chỉ dùng nếu API trả tồn kho sản phẩm; backend dùng tồn nguyên liệu
    stockKnown?: boolean;
    category?: string;
    description?: string;
    isActive?: boolean;
    version?: number;
    sizePrices?: Record<SizeType, number>;

}

// Chi cho chon nhung size co gia trong product_size_prices.
export function laySizeKhaDung(product: Product): SizeType[] {
    return (['S', 'M', 'L'] as SizeType[]).filter((size) => {
        const price = product.sizePrices?.[size];
        return typeof price === 'number' && Number.isFinite(price) && price > 0;
    });
}

export interface User {
    id: string;
    email: string;
    passwordHash?: string;
    fullName?: string;
    phone?: string;
    role?: 'CUSTOMER' | 'STAFF' | 'ADMIN' | string;
    loyaltyPoints: number;
    avatar?: string | null;
    favoriteBranch?: string | null;
    createdAt?: string;
}

export interface Order {
    id: string;
    orderCode?: number;
    userId: string;
    couponId?: string;
    status: OrderStatus;
    subtotal?: number;
    discountAmount?: number;
    pointsUsed?: number;
    pointsDiscount?: number;
    total: number;
    expiresAt?: string;
    createdAt: string;
    updatedAt?: string;
    idempotencyKey?: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    size: SizeType | string;
    qty: number;
    basePrice?: number;
    unitPrice?: number;
    lineTotal: number;
    sugar?: string;
    ice?: string;
    note?: string;
    toppings?: {toppingId: string; servings: number; name?: string}[];
}

export interface Payment {
    id: string;
    orderId: string;
    idempotencyKey: string;
    amount: number;
    method: string;
    status?: string;
    providerRef?: string;
    refundedAmount?: number;
    refundedAt?: string | null;
    simulateFailure?: boolean;
    pointsUsed?: number;
    pointsDiscount?: number;
    createdAt?: string;
}

export interface Coupon {
    id: string;
    code: string;
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
    minOrderValue: number;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
    validFrom: string;
    validTo: string;
}

export const DEFAULT_COUPONS: Coupon[] = [
    {
        id: 'adbbacc5-1334-51f8-8f49-0804c79ef130',
        code: 'WELCOME10',
        discountType: 'PERCENT',
        discountValue: 10,
        minOrderValue: 30000,
        maxUses: 100,
        usedCount: 0,
        isActive: true,
        validFrom: '2026-07-27T17:57:02.446Z',
        validTo: '2027-12-31T16:59:59.000Z',
    },
    {
        id: '653cb812-382c-5f3f-ab46-644a131aca3b',
        code: 'FREESHIP5',
        discountType: 'FIXED',
        discountValue: 5000,
        minOrderValue: 35000,
        maxUses: 120,
        usedCount: 0,
        isActive: true,
        validFrom: '2026-07-27T17:57:02.446Z',
        validTo: '2027-12-31T16:59:59.000Z',
    },
    {
        id: '9db61425-bfe9-5a73-aff5-36afc90c654c',
        code: 'GIAM10K',
        discountType: 'FIXED',
        discountValue: 10000,
        minOrderValue: 30000,
        maxUses: 80,
        usedCount: 0,
        isActive: true,
        validFrom: '2026-07-27T17:57:02.446Z',
        validTo: '2027-12-31T16:59:59.000Z',
    },
    {
        id: 'b2819e57-731d-589f-9502-160dd1f685a7',
        code: 'CAFE20',
        discountType: 'PERCENT',
        discountValue: 20,
        minOrderValue: 90000,
        maxUses: 50,
        usedCount: 0,
        isActive: true,
        validFrom: '2026-07-27T17:57:02.446Z',
        validTo: '2027-12-31T16:59:59.000Z',
    },
    {
        id: '05e690cc-5779-51ea-8363-0e9a810ea085',
        code: 'LOYA5K',
        discountType: 'FIXED',
        discountValue: 5000,
        minOrderValue: 45000,
        maxUses: 100,
        usedCount: 0,
        isActive: true,
        validFrom: '2026-07-27T17:57:02.446Z',
        validTo: '2027-12-31T16:59:59.000Z',
    },
    {
        id: '352c856d-4fdf-501c-8770-41ab24a770a6',
        code: 'EXPIRED10',
        discountType: 'PERCENT',
        discountValue: 10,
        minOrderValue: 30000,
        maxUses: 15,
        usedCount: 0,
        isActive: true,
        validFrom: '2026-07-27T17:57:02.446Z',
        validTo: '2026-10-20T17:57:02.446Z',
    },
    {
        id: '9121ba0a-9f7f-5381-a190-048874304192',
        code: 'INACTIVE5',
        discountType: 'FIXED',
        discountValue: 5000,
        minOrderValue: 40000,
        maxUses: 20,
        usedCount: 0,
        isActive: false,
        validFrom: '2026-08-26T17:57:02.446Z',
        validTo: '2027-12-31T16:59:59.000Z',
    },
    {
        id: '804ee787-75a6-539c-9d39-83bb8853f413',
        code: 'BREWLITE15',
        discountType: 'PERCENT',
        discountValue: 15,
        minOrderValue: 60000,
        maxUses: 80,
        usedCount: 0,
        isActive: true,
        validFrom: '2026-07-27T17:57:02.446Z',
        validTo: '2027-12-31T16:59:59.000Z',
    },
];

export const DEFAULT_PRODUCTS: Product[] = [
    {
        id: 'c2109f91-894f-5836-872b-fc4c0f04ca5d',
        uuid: 'c2109f91-894f-5836-872b-fc4c0f04ca5d',
        code: 'BL001',
        name: 'Cà phê sữa',
        price: 35000,
        imageUrl: ANH_MON_NUOC.caPheSua || ANH_MAC_DINH,
        imageKey: 'caPheSua',
        stock: 25,
        category: 'Cà phê',
        description: 'Cà phê Robusta đậm đà pha sữa đặc thơm béo truyền thống',
        isActive: true,
        version: 0,
        sizePrices: { S: 30000, M: 35000, L: 40000 },
    },
    {
        id: '80976789-a56b-5b36-88ba-04cd171910d6',
        uuid: '80976789-a56b-5b36-88ba-04cd171910d6',
        code: 'BL002',
        name: 'Americano',
        price: 40000,
        imageUrl: ANH_MON_NUOC.americano || ANH_MAC_DINH,
        imageKey: 'americano',
        stock: 20,
        category: 'Cà phê',
        description: 'Cà phê đen nguyên chất pha loãng với nước nóng thanh tao',
        isActive: true,
        version: 0,
        sizePrices: { S: 35000, M: 40000, L: 45000 },
    },
    {
        id: '0f5dda15-68ab-5ca9-aa9a-eb7dc73894d0',
        uuid: '0f5dda15-68ab-5ca9-aa9a-eb7dc73894d0',
        code: 'BL003',
        name: 'Cappuccino',
        price: 45000,
        imageUrl: ANH_MON_NUOC.cappuccino || ANH_MAC_DINH,
        imageKey: 'cappuccino',
        stock: 15,
        category: 'Cà phê',
        description: 'Espresso đậm vị kết hợp sữa nóng và lớp bọt sữa bồng bềnh',
        isActive: true,
        version: 0,
        sizePrices: { S: 40000, M: 45000, L: 50000 },
    },
    {
        id: '5f6a5f28-990d-585f-890a-4182e8664384',
        uuid: '5f6a5f28-990d-585f-890a-4182e8664384',
        code: 'BL004',
        name: 'Trà đào',
        price: 39000,
        imageUrl: ANH_MON_NUOC.traDao || ANH_MAC_DINH,
        imageKey: 'traDao',
        stock: 18,
        category: 'Trà',
        description: 'Trà thanh mát kết hợp đào miếng tươi giòn ngọt lịm',
        isActive: true,
        version: 0,
        sizePrices: { S: 34000, M: 39000, L: 44000 },
    },
    {
        id: '4c1c6d0a-0b99-5c97-b5ba-ac3a55b06479',
        uuid: '4c1c6d0a-0b99-5c97-b5ba-ac3a55b06479',
        code: 'BL005',
        name: 'Cà Phê Muối Huế',
        price: 39000,
        imageUrl: ANH_MON_NUOC.caPheMuoi || ANH_MAC_DINH,
        imageKey: 'caPheMuoi',
        stock: 30,
        category: 'Cà phê',
        description: 'Cà phê phin đậm đà kết hợp lớp kem muối mặn ngọt béo ngậy chuẩn vị cố đô',
        isActive: true,
        version: 0,
        sizePrices: { S: 34000, M: 39000, L: 44000 },
    },
    {
        id: '4f132288-30ec-529d-b40a-80d49fbdc751',
        uuid: '4f132288-30ec-529d-b40a-80d49fbdc751',
        code: 'BL006',
        name: 'Cà Phê Trứng Hà Nội',
        price: 45000,
        imageUrl: ANH_MON_NUOC.caPheTrung || ANH_MAC_DINH,
        imageKey: 'caPheTrung',
        stock: 25,
        category: 'Cà phê',
        description: 'Lớp kem trứng gà đánh bông mịn màng, thơm lừng hòa quyện cùng cà phê nóng',
        isActive: true,
        version: 0,
        sizePrices: { S: 40000, M: 45000, L: 50000 },
    },
    {
        id: 'f05fbd26-e12a-5870-83fe-01820d68bdba',
        uuid: 'f05fbd26-e12a-5870-83fe-01820d68bdba',
        code: 'BL007',
        name: 'Bạc Xỉu Đá Sài Gòn',
        price: 35000,
        imageUrl: ANH_MON_NUOC.bacXiu || ANH_MAC_DINH,
        imageKey: 'bacXiu',
        stock: 35,
        category: 'Cà phê',
        description: 'Sữa đặc pha sữa tươi béo ngậy tạo tầng đẹp mắt cùng cà phê phin thơm nhẹ',
        isActive: true,
        version: 0,
        sizePrices: { S: 30000, M: 35000, L: 40000 },
    },
    {
        id: '4e565d14-f3ab-5ad5-8577-6e657a55dcf4',
        uuid: '4e565d14-f3ab-5ad5-8577-6e657a55dcf4',
        code: 'BL008',
        name: 'Cà Phê Cốt Dừa',
        price: 45000,
        imageUrl: ANH_MON_NUOC.caPheCotDua || ANH_MAC_DINH,
        imageKey: 'caPheCotDua',
        stock: 20,
        category: 'Cà phê',
        description: 'Cốt dừa xay đá tuyết mát lạnh, béo bùi quyện cùng vị đắng dịu của cà phê',
        isActive: true,
        version: 0,
        sizePrices: { S: 40000, M: 45000, L: 50000 },
    },
    {
        id: 'e602a5e6-bfba-57b4-b178-79be1eed5883',
        uuid: 'e602a5e6-bfba-57b4-b178-79be1eed5883',
        code: 'BL009',
        name: 'Cà Phê Sữa Tươi Sương Sáo',
        price: 39000,
        imageUrl: ANH_MON_NUOC.caPheSuaTuoiSuongSao || ANH_MAC_DINH,
        imageKey: 'caPheSuaTuoiSuongSao',
        stock: 28,
        category: 'Cà phê',
        description: 'Cà phê sữa tươi thanh nhẹ kết hợp cùng thạch sương sáo đen giòn mát',
        isActive: true,
        version: 0,
        sizePrices: { S: 34000, M: 39000, L: 44000 },
    },
    {
        id: '0d823f6e-1063-5281-bf54-b04d352249f2',
        uuid: '0d823f6e-1063-5281-bf54-b04d352249f2',
        code: 'BL010',
        name: 'Trà Sen Vàng Kem Cheese',
        price: 49000,
        imageUrl: ANH_MON_NUOC.traSenVang || ANH_MAC_DINH,
        imageKey: 'traSenVang',
        stock: 22,
        category: 'Trà',
        description: 'Trà Ô long thanh mát kết hợp hạt sen bùi, củ năng giòn và lớp kem phô mai mặn béo',
        isActive: true,
        version: 0,
        sizePrices: { S: 44000, M: 49000, L: 54000 },
    },
    {
        id: '60a3c525-a72d-5dea-bb8e-436d7ed1f7f0',
        uuid: '60a3c525-a72d-5dea-bb8e-436d7ed1f7f0',
        code: 'BL011',
        name: 'Trà Đào Cam Sả',
        price: 45000,
        imageUrl: ANH_MON_NUOC.traDaoCamSa || ANH_MAC_DINH,
        imageKey: 'traDaoCamSa',
        stock: 30,
        category: 'Trà',
        description: 'Hồng trà ủ lạnh thơm hương sả tươi, cam vàng mọng nước và đào miếng giòn ngọt',
        isActive: true,
        version: 0,
        sizePrices: { S: 40000, M: 45000, L: 50000 },
    },
    {
        id: '25204519-c2ee-5fb9-a3b0-cd1e4f20a4c8',
        uuid: '25204519-c2ee-5fb9-a3b0-cd1e4f20a4c8',
        code: 'BL012',
        name: 'Trà Vải Hoa Hồng',
        price: 45000,
        imageUrl: ANH_MON_NUOC.traVaiHoaHong || ANH_MAC_DINH,
        imageKey: 'traVaiHoaHong',
        stock: 25,
        category: 'Trà',
        description: 'Trà lài thanh tao quyện vị ngọt thanh của trái vải ngâm và hương hoa hồng dịu nhẹ',
        isActive: true,
        version: 0,
        sizePrices: { S: 40000, M: 45000, L: 50000 },
    },
    {
        id: 'f6404914-0dbb-5b96-92f7-02e89db7cea7',
        uuid: 'f6404914-0dbb-5b96-92f7-02e89db7cea7',
        code: 'BL013',
        name: 'Trà Mãng Cầu Tươi',
        price: 49000,
        imageUrl: ANH_MON_NUOC.traMangCau || ANH_MAC_DINH,
        imageKey: 'traMangCau',
        stock: 20,
        category: 'Trà',
        description: 'Mãng cầu xiêm tươi dầm chua ngọt sảng khoái trên nền trà xanh lài đậm vị',
        isActive: true,
        version: 0,
        sizePrices: { S: 44000, M: 49000, L: 54000 },
    },
    {
        id: 'fc7d19ab-08ee-532c-a719-e7d34417bb98',
        uuid: 'fc7d19ab-08ee-532c-a719-e7d34417bb98',
        code: 'BL014',
        name: 'Trà Ô Long Nhãn Nhục Hạt Chia',
        price: 45000,
        imageUrl: ANH_MON_NUOC.traOLongNhanNhuc || ANH_MAC_DINH,
        imageKey: 'traOLongNhanNhuc',
        stock: 24,
        category: 'Trà',
        description: 'Vị ngọt thanh cổ truyền từ nhãn nhục sấy khô, hạt chia bổ dưỡng cùng trà Ô long',
        isActive: true,
        version: 0,
        sizePrices: { S: 40000, M: 45000, L: 50000 },
    },
];

export function mapProduct(raw: any, fallbackId = 1): Product {
    if (!raw) return DEFAULT_PRODUCTS[0];
    const code = raw.code || raw.product_code || `BL00${fallbackId}`;
    const imageKey = raw.imageKey || raw.image_key;
    let imageUrl = raw.imageUrl || raw.image_url;
    if (!imageUrl && imageKey && (ANH_MON_NUOC as Record<string, string>)[imageKey]) {
        imageUrl = (ANH_MON_NUOC as Record<string, string>)[imageKey];
    }
    if (!imageUrl && code) {
        const defaultMatched = DEFAULT_PRODUCTS.find((p) => p.code === code);
        if (defaultMatched) imageUrl = defaultMatched.imageUrl;
    }
    if (!imageUrl) imageUrl = ANH_MAC_DINH;

    const rows = raw.sizePrices || raw.product_size_prices || [];
    const sizePrices: Record<SizeType, number> = {S: 0, M: 0, L: 0};
    if (Array.isArray(rows)) {
        for (const row of rows) {
            if (row.size === 'S' || row.size === 'M' || row.size === 'L') sizePrices[row.size] = Number(row.price);
        }
    } else if (rows && typeof rows === 'object') {
        for (const size of ['S','M','L'] as SizeType[]) sizePrices[size] = Number(rows[size] || 0);
    }
    let price = Number(raw.price ?? raw.base_price ?? raw.unit_price ?? sizePrices.M ?? 0);
    if (!price && Array.isArray(raw.product_size_prices) && raw.product_size_prices.length > 0) {
        const sizeM = raw.product_size_prices.find((s: any) => s.size === 'M') || raw.product_size_prices[0];
        price = Number(sizeM?.price ?? 0);
    }
    if (!price) {
        price = (['S', 'M', 'L'] as SizeType[])
            .map((size) => sizePrices[size])
            .find((value) => value > 0) ?? 0;
    }
    if (!price) {
        const defaultMatched = DEFAULT_PRODUCTS.find((p) => p.code === code || p.id === String(raw.id));
        if (defaultMatched) price = defaultMatched.price;
    }

    // products.stock không tồn tại trong database (tồn kho theo NGUYÊN LIỆU).
    // Khi API không trả stock, giới hạn số lượng phải do API thanh toán xác thực.
    const stockKnown = [raw.stock, raw.stock_quantity, raw.stockQty, raw.availableQuantity]
        .some((value) => value !== null && value !== undefined);
    const stock = stockKnown
        ? Number(raw.stock ?? raw.stock_quantity ?? raw.stockQty ?? raw.availableQuantity)
        : Number.MAX_SAFE_INTEGER;

    const isActive =
        raw.isActive !== undefined
            ? Boolean(raw.isActive)
            : raw.is_active !== undefined
                ? Boolean(raw.is_active)
                : true;

    const id = String(raw.id || raw.uuid || DEFAULT_PRODUCTS.find(p => p.code === code)?.id || '');

    return {
        id,
        uuid: typeof raw.id === 'string' ? raw.id : raw.uuid,
        code,
        name: raw.name || raw.product_name || `Món #${id}`,
        price,
        // Khong su dung gia mac dinh khi API khong tra size.
        sizePrices,
        imageUrl: layDuongDanAnh(imageUrl),
        imageKey,
        stock,
        stockKnown,
        category: raw.category || raw.category_name || 'Cà phê',
        description: raw.description || '',
        isActive,
        version: raw.version !== undefined ? Number(raw.version) : 0,
    };
}

export function mapUser(raw: any): User {
    if (!raw) throw new Error("Máy chủ không trả về thông tin tài khoản");
    return {
        id: String(raw.id || raw.user_id || 'usr_' + Date.now().toString(36)),
        email: String(raw.email || '').trim().toLowerCase(),
        // Không trả/lưu hash mật khẩu vào browser.
        passwordHash: undefined,
        fullName: raw.fullName || raw.full_name,
        phone: raw.phone,
        role: raw.role || 'CUSTOMER',
        loyaltyPoints: Number(raw.loyaltyPoints ?? raw.loyalty_points ?? 0),
        avatar: raw.avatar || raw.avatarUrl || raw.avatar_url || null,
        favoriteBranch: raw.favoriteBranch || raw.favorite_branch || null,
        createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    };
}

export function mapOrderItem(raw: any): OrderItem {
    return {
        id: String(raw.id || raw.order_item_id || 'item_' + Date.now()),
        orderId: String(raw.orderId || raw.order_id || ''),
        productId: String(raw.productId || raw.product_id || ''),
        size: String(raw.size || 'M'),
        qty: Number(raw.qty ?? raw.quantity ?? 1),
        lineTotal: Number(raw.lineTotal || raw.line_total || 0),
        basePrice: raw.basePrice !== undefined ? Number(raw.basePrice) : raw.base_price !== undefined ? Number(raw.base_price) : undefined,
        unitPrice: raw.unitPrice !== undefined ? Number(raw.unitPrice) : raw.unit_price !== undefined ? Number(raw.unit_price) : undefined,
        sugar: raw.sugar,
        ice: raw.ice,
        note: raw.note,
        toppings: Array.isArray(raw.toppings) ? raw.toppings.map((t: any) => ({
            toppingId: String(t.toppingId ?? t.topping_id),
            servings: Number(t.servings ?? 1),
            name: String(t.topping?.name ?? t.name ?? t.toppingName ?? ''),
        })) : [],
    };
}

export function mapOrder(raw: any): Order {
    if (!raw) {
        return {
            id: '1001',
            userId: 'usr_me',
            status: 'PENDING',
            total: 0,
            createdAt: new Date().toISOString(),
        };
    }
    const id = String(raw.id || raw.order_id || raw.orderCode || raw.order_code || '1001');
    const items = Array.isArray(raw.orderItems || raw.items || raw.order_items)
        ? (raw.orderItems || raw.items || raw.order_items).map(mapOrderItem)
        : undefined;

    return {
        id,
        orderCode: raw.orderCode || raw.order_code ? Number(raw.orderCode || raw.order_code) : undefined,
        userId: String(raw.userId || raw.user_id || 'usr_me'),
        couponId: raw.couponId || raw.coupon_id || undefined,
        status: (raw.status as OrderStatus) || 'PENDING',
        subtotal: raw.subtotal !== undefined ? Number(raw.subtotal) : undefined,
        discountAmount:
            raw.discountAmount !== undefined
                ? Number(raw.discountAmount)
                : raw.discount_amount !== undefined
                    ? Number(raw.discount_amount)
                    : undefined,
        pointsUsed:
            raw.pointsUsed !== undefined
                ? Number(raw.pointsUsed)
                : raw.points_used !== undefined
                    ? Number(raw.points_used)
                    : undefined,
        pointsDiscount:
            raw.pointsDiscountAmount !== undefined ? Number(raw.pointsDiscountAmount) :
                raw.pointsDiscount !== undefined
                    ? Number(raw.pointsDiscount)
                    : raw.points_discount !== undefined
                        ? Number(raw.points_discount)
                        : undefined,
        total: Number(raw.total ?? raw.total_amount ?? 0),
        createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
        items,
    };
}

export function mapTopping(raw: any): ToppingItem {
    return {
        id: String(raw.id || raw.topping_id || ''),
        code: String(raw.code || raw.topping_code || ''),
        name: String(raw.name || raw.topping_name || ''),
        price: Number(raw.price || 0),
        isActive:
            raw.isActive !== undefined
                ? Boolean(raw.isActive)
                : raw.is_active !== undefined
                    ? Boolean(raw.is_active)
                    : true,
    };
}

export function mapCoupon(raw: any): Coupon {
    return {
        id: String(raw.id || ''),
        code: String(raw.code || ''),
        discountType: (raw.discountType || raw.discount_type || 'FIXED') as 'PERCENT' | 'FIXED',
        discountValue: Number(raw.discountValue || raw.discount_value || 0),
        minOrderValue: Number(raw.minOrderValue || raw.min_order_value || 0),
        maxUses: Number(raw.maxUses || raw.max_uses || 100),
        usedCount: Number(raw.usedCount || raw.used_count || 0),
        isActive:
            raw.isActive !== undefined
                ? Boolean(raw.isActive)
                : raw.is_active !== undefined
                    ? Boolean(raw.is_active)
                    : true,
        validFrom: String(raw.validFrom || raw.valid_from || ''),
        validTo: String(raw.validTo || raw.valid_to || ''),
    };
}

export const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

export const removeVietnameseTones = (str: string): string => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
};

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
            // Chỉ lưu thông tin hiển thị, không lưu danh sách tài khoản mẫu.
        } else {
            localStorage.removeItem('brewlite_user');
        }
    } catch {}
};

// Mọi API dưới đây kết nối NestJS thật; lỗi mạng KHÔNG tạo đơn/thanh toán giả.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
        const response = await fetch(API_BASE_URL.replace(/\/+$/, '') + path, {
            ...options, signal: controller.signal,
            headers: {'Content-Type': 'application/json', ...(options.headers || {})},
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
            throw new Error(message || `API ${path}: HTTP ${response.status}`);
        }
        return data as T;
    } finally { clearTimeout(timeout); }
}

function authHeaders(key?: string): Record<string, string> {
    const token = getStoredToken();
    if (!token) throw new Error('Vui lòng đăng nhập');
    return {Authorization: `Bearer ${token}`, ...(key ? {'Idempotency-Key': key} : {})};
}

export const api = {
    async getProducts(): Promise<Product[]> {
        const list = await request<any[]>('/products');
        return list.map((row, i) => mapProduct(row, i + 1));
    },
    async getProductById(id: string): Promise<Product | null> {
        const row = await request<any>(`/products/${id}`);
        return row ? mapProduct(row) : null;
    },
    async getToppings(): Promise<ToppingItem[]> {
        const list = await request<any[]>('/products/toppings');
        return list.map(mapTopping);
    },
    async getCoupons(): Promise<Coupon[]> {
        const publicCoupons = await request<any[]>('/vouchers');
        if (!getStoredToken()) return publicCoupons.map(mapCoupon);
        const mine = await request<any[]>('/vouchers/mine', {headers: authHeaders()});
        return [...publicCoupons, ...mine.filter(row => row.status === 'active')].map(mapCoupon);
    },
    async register(fullName: string, email: string, password: string): Promise<{token: string; user: User}> {
        const res = await request<any>('/auth/register', {
            method: 'POST', body: JSON.stringify({fullName, email: email.trim(), password}),
        });
        return {token: res.token, user: mapUser(res.user)};
    },
    async login(email: string, password: string): Promise<{token: string; user: User}> {
        const res = await request<any>('/auth/login', {
            method: 'POST', body: JSON.stringify({email: email.trim(), password}),
        });
        return {token: res.token, user: mapUser(res.user)};
    },
    async getMe(): Promise<User> {
        return mapUser(await request<any>('/auth/me', {headers: authHeaders()}));
    },
    async createOrder(items: OrderItem[], couponCode?: string, pointsToUse = 0):
        Promise<{orderId: string; status: OrderStatus; total: number; orderCode?: number}> {
        const dto = {
            items: items.map(item => ({
                productId: item.productId, size: item.size, qty: item.qty,
                toppings: item.toppings || [],
                sugar: item.sugar ?? '100%', ice: item.ice ?? '100%', note: item.note || undefined,
            })),
            couponCode: couponCode || undefined, pointsToUse,
        };
        const fingerprint = JSON.stringify(dto);
        let previous: { fingerprint: string; key: string } | null = null;
        try { previous = JSON.parse(sessionStorage.getItem('brewlite_create_key') || 'null'); } catch {}
        const key = previous?.fingerprint === fingerprint ? previous.key : crypto.randomUUID();
        sessionStorage.setItem('brewlite_create_key', JSON.stringify({ fingerprint, key }));
        const data = await request<any>('/orders', {
            method: 'POST', headers: authHeaders(key),
            body: JSON.stringify(dto),
        });
        return {orderId: String(data.id), orderCode:data.orderCode,
            status:data.status, total:Number(data.total)};
    },
    async processPayment(payment: Payment, result?: OrderStatus):
        Promise<{status: OrderStatus; isDuplicate?: boolean; earnedPoints?: number; total?: number}> {
        const data = await request<any>('/payments', {
            method:'POST', headers:authHeaders(payment.idempotencyKey),
            body:JSON.stringify({
                orderId: payment.orderId,
                method: payment.method === 'CARD' ? 'CARD' : 'WALLET',
                simulateFailure: result === 'PAYMENT_FAILED' || !!payment.simulateFailure,
            }),
        });
        return {status:data.order.status, isDuplicate:!!data.replay,
            earnedPoints:Number(data.earnedPoints || 0), total:Number(data.order.total)};
    },
    async getMyOrders(): Promise<Order[]> {
        const list = await request<any[]>('/orders/me', {headers:authHeaders()});
        return list.map(mapOrder);
    },
    async transitionOrderStatus(orderId: string, targetStatus: OrderStatus):
        Promise<{order: Order; message: string; previousStatus: OrderStatus}> {
        const path = targetStatus === 'CANCELLED' ? `/orders/${orderId}/cancel` : `/orders/${orderId}/status`;
        const data = await request<any>(path, {
            method:targetStatus === 'CANCELLED' ? 'POST' : 'PATCH',
            headers:authHeaders(),
            ...(targetStatus !== 'CANCELLED' ? {body:JSON.stringify({status:targetStatus})} : {}),
        });
        return {order:mapOrder(data.order || data), previousStatus:'PENDING',
            message:`Đơn đã chuyển sang ${targetStatus}`};
    },
};

export const QUERY_KEYS = {
    danhSachMon: ['products'] as const,
    chiTietMon: (id: string) => ['product', id] as const,
    lichSuDon: ['orders'] as const,
};

export function useDanhSachMon() {
    return useQuery<Product[]>({
        queryKey: QUERY_KEYS.danhSachMon,
        queryFn: () => api.getProducts(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useChiTietMon(id: string) {
    return useQuery<Product | null>({
        queryKey: QUERY_KEYS.chiTietMon(id),
        queryFn: () => api.getProductById(id),
        enabled: Boolean(id),
    });
}

export function useLichSuDon() {
    return useQuery<Order[]>({
        queryKey: QUERY_KEYS.lichSuDon,
        queryFn: () => api.getMyOrders(),
        staleTime: 1000 * 30,
    });
}

export function useTaoDonHang() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ items, couponCode, pointsToUse }: { items: OrderItem[]; couponCode?: string; pointsToUse?: number }) =>
            api.createOrder(items, couponCode, pointsToUse),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lichSuDon });
        },
    });
}

export function useThanhToanDon() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         paymentPayload,
                         trangThaiKetQua,
                     }: {
            paymentPayload: Payment;
            trangThaiKetQua?: OrderStatus;
        }) => api.processPayment(paymentPayload, trangThaiKetQua),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lichSuDon });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.danhSachMon });
        },
    });
}

export function useCapNhatTrangThaiDon() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         orderId,
                         targetStatus,
                     }: {
            orderId: string;
            targetStatus: OrderStatus;
        }) => api.transitionOrderStatus(orderId, targetStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lichSuDon });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.danhSachMon });
        },
    });
}
