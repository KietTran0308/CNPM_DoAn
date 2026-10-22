import { VoucherItem } from '../types';
import { metaApi, voucherApi, USE_MOCK_API } from './api';
import { useGioHangStore } from '../stores/gio-hang-store';
import { useTaiKhoanStore } from '../stores/tai-khoan-store';

export type TrangThaiVoucher = 'active' | 'insufficient' | 'used' | 'expired';
export interface VoucherNguoiDung extends VoucherItem {
  id: string;
  trangThai: TrangThaiVoucher;
  ngayNhan: string;
  ngaySuDung?: string;
  maDonSuDung?: string;
}
const storageKey = 'brewlite_mock_vouchers';
const fromMock = (): VoucherNguoiDung[] => {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
};
let latestVouchers: VoucherNguoiDung[] = [];

export const dichVuVoucher = {
  async layKhoVoucher(): Promise<VoucherNguoiDung[]> {
    const publicCoupons = await metaApi.getVouchers();
    const publicItems: VoucherNguoiDung[] = publicCoupons.map(v => ({ ...v,
      id: `promo_${v.code}`, trangThai: 'active', ngayNhan: 'Khuyến mãi hệ thống' }));
    if (USE_MOCK_API) {
      latestVouchers = [...publicItems, ...fromMock()];
    } else {
      let own: Awaited<ReturnType<typeof voucherApi.mine>> = [];
      if (useTaiKhoanStore.getState().user) own = await voucherApi.mine();
      latestVouchers = [...publicItems, ...own.map(v => ({
        id: `reward_${v.code}`, code: v.code,
        title: `Phiếu giảm ${Number(v.discountValue).toLocaleString('vi-VN')}đ từ điểm`,
        discountAmount: Number(v.discountValue), minOrder: Number(v.minOrderValue),
        description: 'Voucher đổi bằng điểm BrewLite', tag: 'Đã đổi điểm',
        expiry: new Date(v.validTo).toLocaleDateString('vi-VN'),
        ngayNhan: new Date(v.createdAt).toLocaleDateString('vi-VN'), trangThai: v.status,
      }))];
    }
    useGioHangStore.getState().setAvailableVouchers(latestVouchers.filter(v => v.trangThai === 'active'));
    return latestVouchers;
  },
  layVoucherLuuTru(): VoucherNguoiDung[] { return USE_MOCK_API && typeof window !== 'undefined' ? fromMock() : latestVouchers; },
  themVoucherMoi(voucher: Omit<VoucherNguoiDung, 'id' | 'ngayNhan' | 'trangThai'>): VoucherNguoiDung {
    if (!USE_MOCK_API) throw new Error('Voucher phải được tạo qua API đổi điểm');
    const created = { ...voucher, id: crypto.randomUUID(), ngayNhan: new Date().toLocaleDateString('vi-VN'), trangThai: 'active' as const };
    localStorage.setItem(storageKey, JSON.stringify([created, ...fromMock()]));
    return created;
  },
  themVoucherVaoKho(v: Omit<VoucherNguoiDung, 'id' | 'ngayNhan' | 'trangThai'>) { return this.themVoucherMoi(v); },
  danhDauDaSuDung(code: string, _maDonHang?: string) {
    if (!USE_MOCK_API) return; // server thanh toán sẽ cập nhật usedCount
    localStorage.setItem(storageKey, JSON.stringify(fromMock().map(v => v.code === code ? { ...v, trangThai: 'used' } : v)));
  },
  async layDanhSachVoucher() { return this.layKhoVoucher(); },
  phanLoaiTheoGioHang(subtotal: number, list = latestVouchers) {
    const coTheSuDung: VoucherNguoiDung[] = [];
    const chuaDuDieuKien: VoucherNguoiDung[] = [];
    const daSuDung: VoucherNguoiDung[] = [];
    const daHetHan: VoucherNguoiDung[] = [];
    for (const v of list) {
      if (v.trangThai === 'used') daSuDung.push(v);
      else if (v.trangThai === 'expired') daHetHan.push(v);
      else if (subtotal >= v.minOrder) coTheSuDung.push(v);
      else chuaDuDieuKien.push(v);
    }
    return { coTheSuDung, chuaDuDieuKien, daSuDung, daHetHan };
  },
};
export default dichVuVoucher;
