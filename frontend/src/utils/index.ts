import { CartItem, OrderStatus, SizeOption, ToppingOption } from '../types';

// ==========================================
// 1. ĐỊNH DẠNG TIỀN TỆ & CON SỐ (FORMATTING)
// ==========================================
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const dinhDangTien = formatCurrency;

/**
 * Định dạng ngày giờ (vi-VN) từ chuỗi ISO. Chuỗi không phải ngày hợp lệ được trả về nguyên văn.
 */
export const formatDateTime = (value?: string | null): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Định dạng số phân cách hàng nghìn
 * Ví dụ: 10420 -> "10.420"
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num || 0);
};

export const dinhDangSo = formatNumber;

// ==========================================
// 2. TÍNH TOÁN GIÁ & ĐƠN HÀNG (CALCULATIONS)
// ==========================================

/**
 * Tính đơn giá cho 1 món dựa trên: Giá gốc + Phụ phí Size + Tổng tiền Toppings
 */
export const calculateItemPrice = (
  basePrice: number,
  size?: SizeOption | null,
  toppings: ToppingOption[] = []
): number => {
  const extraSize = size?.extraPrice || 0;
  const extraToppings = toppings.reduce((sum, t) => sum + (t?.price || 0), 0);
  return basePrice + extraSize + extraToppings;
};

export const tinhGiaMon = calculateItemPrice;

/**
 * Tính tổng tạm tính của toàn bộ giỏ hàng
 */
export const calculateCartSubtotal = (items: CartItem[] = []): number => {
  return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
};

export const tinhTamTinhGioHang = calculateCartSubtotal;

/**
 * Đếm tổng số ly/món trong giỏ hàng
 */
export const calculateCartQuantity = (items: CartItem[] = []): number => {
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
};

export const tinhTongSoLuong = calculateCartQuantity;

/**
 * Tính tổng số tiền cuối cùng sau khi khấu trừ Voucher và Giảm giá từ Điểm thưởng
 */
export const calculateOrderTotal = (
  subtotal: number,
  voucherDiscount: number = 0,
  pointsDiscount: number = 0
): number => {
  return Math.max(0, subtotal - voucherDiscount - pointsDiscount);
};

export const tinhTongThanhToan = calculateOrderTotal;

// ==========================================
// 3. KIỂM TRA HỢP LỆ DỮ LIỆU (VALIDATION)
// ==========================================

/**
 * Kiểm tra định dạng số điện thoại Việt Nam (10 chữ số, đầu 03, 05, 07, 08, 09)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s.-]/g, '');
  return /^(0[3|5|7|8|9])[0-9]{8}$/.test(cleaned);
};

export const kiemTraSoDienThoai = validatePhoneNumber;

/**
 * Kiểm tra định dạng email tiêu chuẩn
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const kiemTraEmail = validateEmail;

/**
 * Kiểm tra chuỗi ký tự không được để trống
 */
export const validateRequired = (text: string): boolean => {
  return Boolean(text && text.trim().length > 0);
};

export const kiemTraKhongRong = validateRequired;

// ==========================================
// 4. CẤU HÌNH TRẠNG THÁI ĐƠN HÀNG (STATUS CONFIG)
// ==========================================

export interface StatusBadgeConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  color: string;
  stepIndex: number;
}

export const getStatusBadgeConfig = (status: OrderStatus): StatusBadgeConfig => {
  switch (status) {
      case 'PENDING':
          return {
              label: 'Chờ thanh toán',
              badgeClass: 'bg-blue-50 text-blue-800 border-blue-200/80',
              dotClass: 'bg-blue-600',
              color: '#2563EB',
              stepIndex: 0,
          };
      case 'CANCELLED':
          return {
              label: 'Đã hủy đơn',
              badgeClass: 'bg-stone-200 text-stone-600 border-stone-300',
              dotClass: 'bg-stone-500',
              color: '#57534E',
              stepIndex: 0,
          };
      case 'PAID':
      return {
        label: 'Đã thanh toán',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        dotClass: 'bg-[#145C4B]',
        color: '#145C4B',
        stepIndex: 1,
      };
    case 'PREPARING':
      return {
        label: 'Đang pha chế',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
        dotClass: 'bg-[#D97706]',
        color: '#D97706',
        stepIndex: 2,
      };
    case 'READY':
      return {
        label: 'Mời nhận nước',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/80 animate-pulse',
        dotClass: 'bg-[#0D9488]',
        color: '#0D9488',
        stepIndex: 3,
      };
    case 'COMPLETED':
      return {
        label: 'Đã hoàn thành',
        badgeClass: 'bg-stone-100 text-stone-700 border-stone-200/80',
        dotClass: 'bg-stone-500',
        color: '#78716C',
        stepIndex: 4,
      };
    case 'PAYMENT_FAILED':
      return {
        label: 'Thanh toán lỗi',
        badgeClass: 'bg-red-50 text-red-800 border-red-200/80',
        dotClass: 'bg-[#DC2626]',
        color: '#DC2626',
        stepIndex: 0,
      };
    default:
      return {
        label: 'Đang xử lý',
        badgeClass: 'bg-stone-50 text-stone-700 border-stone-200',
        dotClass: 'bg-stone-400',
        color: '#A8A29E',
        stepIndex: 1,
      };
  }
};
