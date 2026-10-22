/**
 * =======================================================================
 * HỆ THỐNG ĐỊNH NGHĨA TYPESCRIPT CHO TOÀN BỘ ỨNG DỤNG (CONSOLIDATED TYPES)
 * =======================================================================
 * Gom toàn bộ types từ san-pham, don-hang, tai-khoan, voucher, diem-thuong
 * vào một module duy nhất, có đầy đủ tiếng Anh chuẩn và bí danh tiếng Việt.
 */

// ==========================================
// 1. DANH MỤC & SẢN PHẨM (PRODUCTS & MENU)
// ==========================================

export type ProductCategory =
    | 'coffee_viet'
    | 'coffee_machine'
    | 'tea'
    | 'bakery'
    | 'ice_cream';

export interface SizeOption {
    id: 'S' | 'M' | 'L';
    name: string;
    volume: string;
    extraPrice: number;
}

export interface ToppingOption {
    id: string;
    name: string;
    price: number;
}

export interface Product {
    id: string;
    name: string;
    category: ProductCategory;
    categoryName: string;
    sectionCaption?: string;
    description: string;
    basePrice: number;
    image: string;
    isPopular?: boolean;
    calories?: number;
    tags?: string[];
}

export type SanPham = Product;
export type TuyChonSize = SizeOption;
export type TuyChonTopping = ToppingOption;

// ==========================================
// 2. GIỎ HÀNG & ĐƠN HÀNG (CART & ORDERS)
// ==========================================

export interface CartItem {
    cartItemId: string;
    product: Product;
    size: SizeOption;
    toppings: ToppingOption[];
    iceLevel: '0%' | '30%' | '50%' | '100%';
    sugarLevel: '0%' | '30%' | '50%' | '100%';
    note: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export type MonGioHang = CartItem;

export type PaymentMethodId =
    | 'vietqr'
    | 'bank_transfer'
    | 'momo'
    | 'zalopay'
    | 'card'
    | 'vnpay';

export interface PaymentMethod {
    id: PaymentMethodId;
    name: string;
    shortDesc: string;
    iconType: 'qr' | 'momo' | 'zalopay' | 'card';
    badge?: string;
}

export type PhuongThucThanhToan = PaymentMethod;

export type OrderStatus =
    | 'PAID'
    | 'PENDING'
    | 'PREPARING'
    | 'READY'
    | 'COMPLETED'
    | 'PAYMENT_FAILED'
    | 'CANCELLED';

export type TrangThaiDonHang = OrderStatus;

export type PickupTimeType = 'asap' | 'scheduled';

export interface BranchInfo {
    id: string;
    name: string;
    shortName: string;
    address: string;
    counter: string;
    phone: string;
    openHours: string;
    distance?: string;
}

export type ThongTinChiNhanh = BranchInfo;

export interface Order {
    id: string;
    orderNumber: string;
    pickupCode: string;
    createdAt: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    pointsDiscount?: number;
    pointsUsed?: number;
    voucherCode?: string;
    total: number;
    paymentMethod: PaymentMethodId;
    status: OrderStatus;
    customerName: string;
    customerPhone: string;
    pickupBranch: string;
    pickupCounter: string;
    pickupTimeType: PickupTimeType;
    scheduledTime?: string;
    pickupNote?: string;
    estimatedMinutes?: number;
    pointsEarned: number;
}

export type DonHang = Order;

// ==========================================
// 3. TÀI KHOẢN & HỘI VIÊN (USER & MEMBERSHIP)
// ==========================================

export type MembershipTier = 'Standard' | 'Silver' | 'Gold' | 'Diamond';
export type HangHoiVien = MembershipTier;

export interface User {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    avatar?: string;
    createdAt?: string;
    role?: 'customer' | 'admin' | 'barista';
    membershipTier?: MembershipTier;
    loyaltyPoints?: number;
    favoriteBranch?: string;
    token?: string;
}

export type NguoiDung = User;

export interface UpdateUserProfilePayload {
    fullName: string;
    phone: string;
    avatar?: string;
    favoriteBranch?: string;
}

export interface ChangePasswordPayload {
    currentPassword?: string;
    oldPass?: string;
    newPassword?: string;
    newPass?: string;
    confirmPassword?: string;
    confirmPass?: string;
}

// ==========================================
// 4. ƯU ĐÃI & ĐIỂM THƯỞNG (VOUCHER & REWARDS)
// ==========================================

export interface VoucherItem {
    code: string;
    title: string;
    discountAmount: number;
    minOrder: number;
    description: string;
    tag?: string;
    expiry?: string;
    requiredPoints?: number;
    isRedeemed?: boolean;
}

export interface LoyaltyHistoryItem {
    id: string;
    date: string;
    action: 'EARN' | 'REDEEM';
    points: number;
    description: string;
    orderId?: string;
}

export interface RewardExchangeOption {
    id: string;
    title: string;
    discountAmount: number;
    requiredPoints: number;
    minOrder: number;
    description: string;
    voucherCode: string;
}

export type LichSuDiem = LoyaltyHistoryItem;
export type TuyChonDoiDiem = RewardExchangeOption;

// ==========================================
// 5. GIAO DIỆN & ĐIỀU HƯỚNG (UI & NAVIGATION)
// ==========================================

export type ScreenType =
    | 'menu'
    | 'cart'
    | 'checkout'
    | 'confirmation'
    | 'orders'
    | 'account'
    | 'rewards'
    | 'vouchers';

export type ManHinhHienTai = ScreenType;

export type BreakpointCategory = 'mobile' | 'tablet' | 'laptop' | 'desktop';

export type DeviceView =
    | 'fluid'
    | 'mobile-320'
    | 'mobile-375'
    | 'mobile-430'
    | 'tablet-768'
    | 'laptop-1024'
    | 'desktop-1440';

export type AppViewMode = 'app' | 'figma-scrum';

export interface ToastMessage {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}
