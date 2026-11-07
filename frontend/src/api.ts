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

export function tinhGiaTopping(toppings: (ToppingType | string)[]): number {
  return toppings.reduce((sum, t) => {
    const found = DEFAULT_TOPPINGS.find((item) => item.name === t);
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
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || '';

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
  id: number;
  uuid?: string;
  code?: string;
  name: string;
  price: number;
  imageUrl: string;
  imageKey?: string;
  stock: number;
  category?: string;
  description?: string;
  isActive?: boolean;
  version?: number;
  sizePrices?: Record<SizeType, number>;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
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
  productId: number;
  size: SizeType | string;
  qty: number;
  basePrice?: number;
  unitPrice?: number;
  lineTotal: number;
  sugar?: string;
  ice?: string;
  note?: string;
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
    id: 1,
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
    sizePrices: { S: 35000, M: 35000, L: 35000 },
  },
  {
    id: 2,
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
    sizePrices: { S: 40000, M: 40000, L: 40000 },
  },
  {
    id: 3,
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
    sizePrices: { S: 45000, M: 45000, L: 45000 },
  },
  {
    id: 4,
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
    sizePrices: { S: 39000, M: 39000, L: 39000 },
  },
  {
    id: 5,
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
    sizePrices: { S: 39000, M: 39000, L: 39000 },
  },
  {
    id: 6,
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
    sizePrices: { S: 45000, M: 45000, L: 45000 },
  },
  {
    id: 7,
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
    sizePrices: { S: 35000, M: 35000, L: 35000 },
  },
  {
    id: 8,
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
    sizePrices: { S: 45000, M: 45000, L: 45000 },
  },
  {
    id: 9,
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
    sizePrices: { S: 39000, M: 39000, L: 39000 },
  },
  {
    id: 10,
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
    sizePrices: { S: 49000, M: 49000, L: 49000 },
  },
  {
    id: 11,
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
    sizePrices: { S: 45000, M: 45000, L: 45000 },
  },
  {
    id: 12,
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
    sizePrices: { S: 45000, M: 45000, L: 45000 },
  },
  {
    id: 13,
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
    sizePrices: { S: 49000, M: 49000, L: 49000 },
  },
  {
    id: 14,
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
    sizePrices: { S: 45000, M: 45000, L: 45000 },
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

  let price = Number(raw.price ?? raw.base_price ?? raw.unit_price ?? 0);
  if (!price && Array.isArray(raw.product_size_prices) && raw.product_size_prices.length > 0) {
    const sizeM = raw.product_size_prices.find((s: any) => s.size === 'M') || raw.product_size_prices[0];
    price = Number(sizeM?.price ?? 0);
  }
  if (!price && raw.sizePrices?.M) {
    price = Number(raw.sizePrices.M);
  }
  if (!price) {
    const defaultMatched = DEFAULT_PRODUCTS.find((p) => p.code === code || p.id === Number(raw.id));
    if (defaultMatched) price = defaultMatched.price;
  }

  const stock = Number(
    raw.stock ?? raw.stock_quantity ?? raw.stockQty ?? raw.availableQuantity ?? 25
  );

  const isActive =
    raw.isActive !== undefined
      ? Boolean(raw.isActive)
      : raw.is_active !== undefined
      ? Boolean(raw.is_active)
      : true;

  let id = Number(raw.id);
  if (isNaN(id) || id <= 0) {
    const matchByCode = DEFAULT_PRODUCTS.find((p) => p.code === code || p.uuid === raw.id);
    id = matchByCode ? matchByCode.id : fallbackId;
  }

  return {
    id,
    uuid: typeof raw.id === 'string' ? raw.id : raw.uuid,
    code,
    name: raw.name || raw.product_name || `Món #${id}`,
    price,
    imageUrl: layDuongDanAnh(imageUrl),
    imageKey,
    stock,
    category: raw.category || raw.category_name || 'Cà phê',
    description: raw.description || '',
    isActive,
    version: raw.version !== undefined ? Number(raw.version) : 0,
  };
}

export function mapUser(raw: any): User {
  if (!raw) return DEFAULT_USER;
  return {
    id: String(raw.id || raw.user_id || 'usr_' + Date.now().toString(36)),
    email: String(raw.email || '').trim().toLowerCase(),
    passwordHash: String(raw.passwordHash || raw.password_hash || 'hash_masked'),
    fullName: raw.fullName || raw.full_name,
    phone: raw.phone,
    role: raw.role || 'CUSTOMER',
    loyaltyPoints: Number(raw.loyaltyPoints ?? raw.loyalty_points ?? 0),
    avatar: raw.avatar || null,
    favoriteBranch: raw.favoriteBranch || raw.favorite_branch || null,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
}

export function mapOrderItem(raw: any): OrderItem {
  return {
    id: String(raw.id || raw.order_item_id || 'item_' + Date.now()),
    orderId: String(raw.orderId || raw.order_id || ''),
    productId: Number(raw.productId || raw.product_id || 1),
    size: String(raw.size || 'M'),
    qty: Number(raw.qty || raw.quantity || 1),
    lineTotal: Number(raw.lineTotal || raw.line_total || 0),
    basePrice: raw.basePrice !== undefined ? Number(raw.basePrice) : raw.base_price !== undefined ? Number(raw.base_price) : undefined,
    unitPrice: raw.unitPrice !== undefined ? Number(raw.unitPrice) : raw.unit_price !== undefined ? Number(raw.unit_price) : undefined,
    sugar: raw.sugar,
    ice: raw.ice,
    note: raw.note,
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
  const items = Array.isArray(raw.items || raw.order_items)
    ? (raw.items || raw.order_items).map(mapOrderItem)
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

export const DEFAULT_USER: User = {
  id: 'usr_001',
  email: 'khachhang@brewlite.vn',
  passwordHash: 'hash_masked',
  fullName: 'Khách Hàng Thân Thiết',
  phone: '0900000000',
  role: 'CUSTOMER',
  loyaltyPoints: 12,
};

export const DEFAULT_ACCOUNTS_SEED: Record<string, User> = {
  'khachhang@brewlite.vn': DEFAULT_USER,
  'admin01@example.com': {
    id: '305ebe46-9a84-5923-a736-df0a01191b58',
    email: 'admin01@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Quản trị BrewLite',
    phone: '0900000012',
    role: 'ADMIN',
    loyaltyPoints: 0,
  },
  'barista01@example.com': {
    id: '42a057e6-3fac-59a9-95ef-578d09bdf43b',
    email: 'barista01@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Nhân viên Quầy 01',
    phone: '0900000011',
    role: 'STAFF',
    loyaltyPoints: 0,
  },
  'customer01@example.com': {
    id: '0abd345f-7157-5376-bdf7-d23459d5c505',
    email: 'customer01@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Nguyễn Minh Anh',
    phone: '0900000001',
    role: 'CUSTOMER',
    loyaltyPoints: 0,
  },
  'customer02@example.com': {
    id: '89094c8e-81d2-582b-adcc-b81a331c6684',
    email: 'customer02@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Trần Quốc Bảo',
    phone: '0900000002',
    role: 'CUSTOMER',
    loyaltyPoints: 0,
  },
  'customer03@example.com': {
    id: 'fd59e87d-6638-5681-9acd-cf19dd4fe755',
    email: 'customer03@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Lê Thảo Vy',
    phone: '0900000003',
    role: 'CUSTOMER',
    loyaltyPoints: 0,
  },
  'customer04@example.com': {
    id: '5f15f651-55d0-54af-b402-204a5cdb438e',
    email: 'customer04@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Phạm Gia Huy',
    phone: '0900000004',
    role: 'CUSTOMER',
    loyaltyPoints: 0,
  },
  'customer05@example.com': {
    id: 'dd2a0246-fc58-59ea-9b22-3edd78488229',
    email: 'customer05@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Đỗ Khánh Linh',
    phone: '0900000005',
    role: 'CUSTOMER',
    loyaltyPoints: 0,
  },
  'customer06@example.com': {
    id: '84276309-9cbe-52f3-ba77-c6441210a0b3',
    email: 'customer06@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Võ Ngọc Mai',
    phone: '0900000006',
    role: 'CUSTOMER',
    loyaltyPoints: 0,
  },
  'customer07@example.com': {
    id: '56b6874f-e79a-5baa-82bf-742ae9204916',
    email: 'customer07@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Bùi Hoàng Nam',
    phone: '0900000007',
    role: 'CUSTOMER',
    loyaltyPoints: 0,
  },
  'customer08@example.com': {
    id: 'f6a3fc8e-3153-5f05-9339-b2ce98fdf72f',
    email: 'customer08@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Hoàng Thanh Trúc',
    phone: '0900000008',
    role: 'CUSTOMER',
    loyaltyPoints: 0,
  },
  'customer09@example.com': {
    id: '2d9e6949-bbae-547f-b825-e52a448c5841',
    email: 'customer09@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Đặng Nhật Minh',
    phone: '0900000009',
    role: 'CUSTOMER',
    loyaltyPoints: 0,
  },
  'customer10@example.com': {
    id: 'c5d55341-3044-5b34-92b7-7fac9f607a8e',
    email: 'customer10@example.com',
    passwordHash: '$2b$12$.fMfd4/QFSJJelZpB2vyy.cfte0yXlU8PXx4zy./KMLDYztKSGtfe',
    fullName: 'Lý Thu Hà',
    phone: '0900000010',
    role: 'CUSTOMER',
    loyaltyPoints: 0,
  },
};

export const getStoredAccounts = (): Record<string, User> => {
  try {
    const raw = localStorage.getItem('brewlite_accounts');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...DEFAULT_ACCOUNTS_SEED };
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
  } catch {}
};

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

const idempotencyStore = new Map<string, { status: OrderStatus }>();

async function callApiWithFallback<T>(
  path: string,
  options: RequestInit,
  fallbackFn: () => Promise<T> | T,
  normalizer?: (data: any) => T
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
      return normalizer ? normalizer(data) : (data as T);
    }

    if (res.status === 400 || res.status === 409) {
      const err = await res.json().catch(() => ({}));
      if (err.message) {
        throw new Error(err.message);
      }
    }
  } catch (err: any) {
    if (
      err.message &&
      !err.message.includes('fetch') &&
      !err.message.includes('abort') &&
      !err.message.includes('Failed to fetch')
    ) {
      throw err;
    }
  }

  return fallbackFn();
}

export const api = {
  async getProducts(): Promise<Product[]> {
    return callApiWithFallback<Product[]>(
      '/products',
      { method: 'GET' },
      () => {
        try {
          localStorage.setItem('brewlite_products_v2', JSON.stringify(DEFAULT_PRODUCTS));
        } catch {}
        return [...DEFAULT_PRODUCTS];
      },
      (data) => {
        const list = Array.isArray(data) ? data : data.data || [];
        return list.map((item: any, idx: number) => mapProduct(item, idx + 1));
      }
    );
  },

  async getProductById(id: number): Promise<Product | null> {
    return callApiWithFallback<Product | null>(
      `/products/${id}`,
      { method: 'GET' },
      () => {
        const found = DEFAULT_PRODUCTS.find((p) => p.id === id);
        return found || null;
      },
      (data) => {
        const item = data?.data || data;
        return item ? mapProduct(item, id) : null;
      }
    );
  },

  async getToppings(): Promise<ToppingItem[]> {
    return callApiWithFallback<ToppingItem[]>(
      '/toppings',
      { method: 'GET' },
      () => [...DEFAULT_TOPPINGS],
      (data) => {
        const list = Array.isArray(data) ? data : data.data || [];
        return list.map(mapTopping);
      }
    );
  },

  async getCoupons(): Promise<Coupon[]> {
    return callApiWithFallback<Coupon[]>(
      '/coupons',
      { method: 'GET' },
      () => [...DEFAULT_COUPONS],
      (data) => {
        const list = Array.isArray(data) ? data : data.data || [];
        return list.map(mapCoupon);
      }
    );
  },

  async register(email: string, password: string): Promise<{ token: string; user: User }> {
    const cleanEmail = email.trim();
    return callApiWithFallback<{ token: string; user: User }>(
      '/auth/register',
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
        if (accounts[cleanEmail.toLowerCase()]) {
          throw new Error('Email này đã được sử dụng.');
        }

        const userObj: User = {
          id: 'usr_' + Date.now().toString(36),
          email: cleanEmail,
          passwordHash: 'hash_masked',
          loyaltyPoints: 0,
        };
        setStoredAccount(userObj);

        const token = 'jwt_token_' + btoa(cleanEmail);
        setStoredToken(token);
        setStoredUser(userObj);

        return { token, user: userObj };
      },
      (data) => ({
        token: data.token || data.access_token || 'jwt_token_' + btoa(cleanEmail),
        user: mapUser(data.user || data),
      })
    );
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const cleanEmail = email.trim();
    return callApiWithFallback<{ token: string; user: User }>(
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
          loyaltyPoints:
            cleanEmail.toLowerCase() === DEFAULT_USER.email.toLowerCase()
              ? DEFAULT_USER.loyaltyPoints
              : 0,
        };
        setStoredAccount(userObj);

        const token = 'jwt_token_' + btoa(cleanEmail);
        setStoredToken(token);
        setStoredUser(userObj);

        return { token, user: userObj };
      },
      (data) => ({
        token: data.token || data.access_token || 'jwt_token_' + btoa(cleanEmail),
        user: mapUser(data.user || data),
      })
    );
  },

  async createOrder(
    items: OrderItem[],
    total: number
  ): Promise<{ orderId: string; status: OrderStatus }> {
    const token = getStoredToken();
    return callApiWithFallback<{ orderId: string; status: OrderStatus }>(
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
          createdAt:
            new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
            ' - ' +
            new Date().toLocaleDateString('vi-VN'),
          items,
        };

        try {
          const raw = localStorage.getItem('brewlite_orders_history');
          const list: Order[] = raw ? JSON.parse(raw) : [...SEED_ORDERS];
          list.unshift(newOrder);
          localStorage.setItem('brewlite_orders_history', JSON.stringify(list));
        } catch {}

        return { orderId: fallbackId, status: 'PENDING' };
      },
      (data) => ({
        orderId: String(data.orderId || data.order_id || data.id || '1040'),
        status: (data.status as OrderStatus) || 'PENDING',
      })
    );
  },

  async processPayment(
    paymentPayload: Payment,
    trangThaiKetQua?: OrderStatus
  ): Promise<{ status: OrderStatus; isDuplicate?: boolean }> {
    if (idempotencyStore.has(paymentPayload.idempotencyKey)) {
      const cached = idempotencyStore.get(paymentPayload.idempotencyKey)!;
      return { status: cached.status, isDuplicate: true };
    }

    const simulateFailure =
      trangThaiKetQua === 'PAYMENT_FAILED' || Boolean(paymentPayload.simulateFailure);

    const token = getStoredToken();
    return callApiWithFallback<{ status: OrderStatus; isDuplicate?: boolean }>(
      '/payments',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': paymentPayload.idempotencyKey,
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          ...paymentPayload,
          simulateFailure,
        }),
      },
      () => {
        const finalStatus: OrderStatus =
          trangThaiKetQua || (simulateFailure ? 'PAYMENT_FAILED' : 'PAID');
        idempotencyStore.set(paymentPayload.idempotencyKey, { status: finalStatus });

        try {
          const raw = localStorage.getItem('brewlite_orders_history');
          const list: Order[] = raw ? JSON.parse(raw) : [...SEED_ORDERS];
          const ord = list.find((o) => o.id === paymentPayload.orderId);
          if (ord) {
            ord.status = finalStatus;
            localStorage.setItem('brewlite_orders_history', JSON.stringify(list));
          }
        } catch {}

        if (finalStatus === 'PAID') {
          const pointsUsed = paymentPayload.pointsUsed || 0;
          const earned = Math.floor(paymentPayload.amount / 10000);
          const currentUser = getStoredUser();
          if (currentUser) {
            currentUser.loyaltyPoints =
              Math.max(0, (currentUser.loyaltyPoints || 0) - pointsUsed) + earned;
            setStoredUser(currentUser);
          }
        }

        return { status: finalStatus, isDuplicate: false };
      },
      (data) => ({
        status: (data.status as OrderStatus) || 'PAID',
        isDuplicate: Boolean(data.isDuplicate || data.is_duplicate),
      })
    );
  },

  async getMyOrders(): Promise<Order[]> {
    const token = getStoredToken();
    return callApiWithFallback<Order[]>(
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
      },
      (data) => {
        const list = Array.isArray(data) ? data : data.data || [];
        return list.map(mapOrder);
      }
    );
  },

  async transitionOrderStatus(
    orderId: string,
    targetStatus: OrderStatus
  ): Promise<{ order: Order; message: string; previousStatus: OrderStatus }> {
    const token = getStoredToken();
    return callApiWithFallback<{ order: Order; message: string; previousStatus: OrderStatus }>(
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
      },
      (data) => ({
        order: mapOrder(data.order || data),
        message: data.message || `Cập nhật đơn #${orderId}: ${targetStatus}`,
        previousStatus: data.previousStatus || data.previous_status || 'PENDING',
      })
    );
  },
};

export const QUERY_KEYS = {
  danhSachMon: ['products'] as const,
  chiTietMon: (id: number) => ['product', id] as const,
  lichSuDon: ['orders'] as const,
};

export function useDanhSachMon() {
  return useQuery<Product[]>({
    queryKey: QUERY_KEYS.danhSachMon,
    queryFn: () => api.getProducts(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useChiTietMon(id: number) {
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
    mutationFn: ({ items, total }: { items: OrderItem[]; total: number }) =>
      api.createOrder(items, total),
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
