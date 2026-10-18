/**
 * =======================================================================
 * HẰNG SỐ CẤU HÌNH HỆ THỐNG (SYSTEM CONSTANTS & OPTIONS)
 * =======================================================================
 * Chứa cấu hình kích cỡ ly (Sizes), Topping bổ sung, Phương thức thanh toán,
 * và Chi nhánh mặc định khi tải trang.
 */

import { SizeOption, ToppingOption, PaymentMethod, BranchInfo, VoucherItem } from '../types';

export const SIZES: SizeOption[] = [
  { id: 'S', name: 'Nhỏ (S)', volume: '350ml', extraPrice: 0 },
  { id: 'M', name: 'Vừa (M)', volume: '500ml', extraPrice: 6000 },
  { id: 'L', name: 'Lớn (L)', volume: '700ml', extraPrice: 12000 },
];

export const TOPPINGS: ToppingOption[] = [
  { id: 't1', name: 'Trân châu đen dẻo giòn', price: 8000 },
  { id: 't2', name: 'Kem Macchiato phô mai béo mặn', price: 10000 },
  { id: 't3', name: 'Thạch cà phê phin giòn', price: 7000 },
  { id: 't4', name: 'Thêm Shot Espresso Arabica (+1)', price: 10000 },
  { id: 't5', name: 'Hạt sen Huế thơm bùi', price: 10000 },
  { id: 't6', name: 'Đào ngâm vàng giòn ngọt', price: 8000 },
  { id: 't7', name: 'Vải thiều mọng nước', price: 8000 },
  { id: 't8', name: 'Sốt socola Bỉ đậm đà', price: 8000 },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'vietqr',
    name: 'Quét mã VietQR / VNPay',
    shortDesc: 'Quét mã tức thì từ 40+ ứng dụng ngân hàng & ví',
    iconType: 'qr',
    badge: 'Khuyên dùng',
  },
  {
    id: 'bank_transfer',
    name: 'Chuyển khoản Ngân hàng',
    shortDesc: 'Sao chép STK 1-chạm, xử lý tự động',
    iconType: 'card',
  },
  {
    id: 'momo',
    name: 'Ví Điện Tử MoMo',
    shortDesc: 'Mở app thanh toán 1-chạm hoặc quét mã',
    iconType: 'momo',
  },
  {
    id: 'zalopay',
    name: 'Ví Điện Tử ZaloPay',
    shortDesc: 'Xác thực nhanh trong hệ sinh thái Zalo',
    iconType: 'zalopay',
  },
  {
    id: 'card',
    name: 'Thẻ Quốc Tế (Visa / Master / JCB)',
    shortDesc: 'Cổng thanh toán bảo mật PCI-DSS 3D-Secure',
    iconType: 'card',
  },
];

export const DEFAULT_BRANCHES: BranchInfo[] = [
  {
    id: 'b1',
    name: 'Brew Lite Nhà Thờ - 12 Nhà Thờ, Hoàn Kiếm, HN',
    shortName: '12 Nhà Thờ, Hoàn Kiếm',
    address: '12 Nhà Thờ, P. Hàng Trống, Hoàn Kiếm, Hà Nội',
    counter: 'Quầy Pha Chế Tầng 1 - Mặt Tiền',
    phone: '024 3928 6688',
    openHours: '07:00 - 22:30',
    distance: '1.2 km',
  },
  {
    id: 'b2',
    name: 'Brew Lite Đồng Khởi - 88 Đồng Khởi, Quận 1, HCM',
    shortName: '88 Đồng Khởi, Quận 1',
    address: '88 Đồng Khởi, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    counter: 'Quầy Express Pickup Cửa Đông',
    phone: '028 3822 9988',
    openHours: '06:30 - 23:00',
    distance: '2.5 km',
  },
  {
    id: 'b3',
    name: 'Brew Lite Cầu Giấy - 241 Xuân Thủy, Cầu Giấy, HN',
    shortName: '241 Xuân Thủy, Cầu Giấy',
    address: '241 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    counter: 'Quầy Bar Trung Tâm',
    phone: '024 3754 8899',
    openHours: '07:00 - 22:00',
    distance: '3.8 km',
  },
];

export const DEFAULT_VOUCHERS: VoucherItem[] = [
  {
    code: 'BANMOI15',
    title: 'Giảm 15.000đ Đơn Đầu Tiên',
    discountAmount: 15000,
    minOrder: 40000,
    description: 'Áp dụng cho mọi khách hàng mới đặt món qua ứng dụng',
    tag: 'Khách Mới',
    expiry: '31/12/2026',
    requiredPoints: 0,
  },
  {
    code: 'BREWLITE20',
    title: 'Giảm 20.000đ Giờ Vàng 13h-16h',
    discountAmount: 20000,
    minOrder: 60000,
    description: 'Nạp năng lượng buổi chiều cùng cà phê & trà sữa',
    tag: 'Giờ Vàng',
    expiry: '31/12/2026',
    requiredPoints: 0,
  },
  {
    code: 'FREESHIP',
    title: 'Miễn Phí Ly Kem Gelato',
    discountAmount: 35000,
    minOrder: 100000,
    description: 'Tặng ngay 1 ly kem Gelato dừa non cho hóa đơn từ 100K',
    tag: 'Hot',
    expiry: '31/12/2026',
    requiredPoints: 0,
  },
  {
    code: 'VIPDIAMOND',
    title: 'Đặc Quyền Hội Viên Kim Cương',
    discountAmount: 50000,
    minOrder: 120000,
    description: 'Dành riêng cho hội viên Diamond tích lũy điểm',
    tag: 'VIP',
    expiry: '31/12/2026',
    requiredPoints: 100,
  },
];
