import { CartItem, MembershipTier, VoucherItem } from '../types';

/**
 * CHÍNH SÁCH VÀ QUY TẮC TÍCH ĐIỂM BREWLITE
 * - Mỗi 10.000 đồng chi tiêu thực tế hợp lệ = 1 điểm tích lũy
 * - Nhân hệ số tích điểm theo hạng thành viên
 * - Phần tiền giảm giá (voucher hoặc điểm) không sinh ra điểm mới
 */
export const CHINH_SACH_TICH_DIEM = {
  SO_TIEN_MOI_DIEM: 10000,
  HE_SO_HANG: {
    Standard: 1.0,
    Silver: 1.1,
    Gold: 1.25,
    Diamond: 1.5,
  } as Record<MembershipTier, number>,
  MOC_HANG: {
    Standard: 0,
    Silver: 100,
    Gold: 300,
    Diamond: 600,
  },
};

/**
 * Tính số điểm tích lũy nhận được từ giá trị thanh toán thực tế
 */
export const tinhDiemTichLuy = (
  soTienThucTe: number,
  hangThanhVien: MembershipTier = 'Standard'
): number => {
  if (soTienThucTe <= 0) return 0;
  const heSo = CHINH_SACH_TICH_DIEM.HE_SO_HANG[hangThanhVien] || 1.0;
  const diemCoBan = Math.floor(soTienThucTe / CHINH_SACH_TICH_DIEM.SO_TIEN_MOI_DIEM);
  return Math.max(1, Math.round(diemCoBan * heSo));
};

/**
 * Xác định hạng thành viên dựa trên tổng điểm tích lũy
 */
export const xacDinhHangThanhVien = (tongDiem: number): MembershipTier => {
  if (tongDiem >= CHINH_SACH_TICH_DIEM.MOC_HANG.Diamond) return 'Diamond';
  if (tongDiem >= CHINH_SACH_TICH_DIEM.MOC_HANG.Gold) return 'Gold';
  if (tongDiem >= CHINH_SACH_TICH_DIEM.MOC_HANG.Silver) return 'Silver';
  return 'Standard';
};

/**
 * Kiểm tra và tính toán giảm giá từ phiếu giảm giá (Voucher)
 */
export interface KetQuaApDungVoucher {
  hopLe: boolean;
  tienGiam: number;
  lyDo?: string;
  voucher?: VoucherItem;
}

export const tinhGiamGiaVoucher = (
  tamTinh: number,
  voucher: VoucherItem | undefined
): KetQuaApDungVoucher => {
  if (!voucher) {
    return { hopLe: false, tienGiam: 0, lyDo: 'Chưa chọn phiếu giảm giá.' };
  }

  if (tamTinh < voucher.minOrder) {
    const thieu = voucher.minOrder - tamTinh;
    return {
      hopLe: false,
      tienGiam: 0,
      lyDo: `Đơn hàng chưa đạt mức tối thiểu ${voucher.minOrder.toLocaleString('vi-VN')}đ (cần thêm ${thieu.toLocaleString('vi-VN')}đ).`,
      voucher,
    };
  }

  // Tiền giảm tối đa không vượt quá tạm tính
  const tienGiam = Math.min(tamTinh, voucher.discountAmount);
  return {
    hopLe: true,
    tienGiam,
    voucher,
  };
};

/**
 * Tính tổng tiền thanh toán cuối cùng bảo đảm không âm
 */
export const tinhTongThanhToan = (
  tamTinh: number,
  tienGiamVoucher: number,
  tienGiamDiem: number = 0
): number => {
  const tongGiam = Math.max(0, tienGiamVoucher) + Math.max(0, tienGiamDiem);
  return Math.max(0, tamTinh - tongGiam);
};
