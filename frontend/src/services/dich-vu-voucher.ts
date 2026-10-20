/**
 * =====================================================================
 * DỊCH VỤ VOUCHER & ƯU ĐÃI (VOUCHER SERVICE VIA REAL SQL API)
 * =====================================================================
 */

import { VoucherItem } from '../types';
import { metaApi } from './api';

export type TrangThaiVoucher = 'active' | 'insufficient' | 'used' | 'expired';

export interface VoucherNguoiDung extends VoucherItem {
  id: string;
  trangThai: TrangThaiVoucher;
  ngayNhan: string;
  ngaySuDung?: string;
  maDonSuDung?: string;
}

const STORAGE_KEY = 'brewlite_user_vouchers_prod_v1';

export const dichVuVoucher = {
  /**
   * Lấy toàn bộ voucher trong kho của người dùng (từ SQL API & voucher đã đổi)
   */
  async layKhoVoucher(): Promise<VoucherNguoiDung[]> {
    try {
      const sqlVouchers = await metaApi.getVouchers();
      const stored = this.layVoucherLuuTru();
      
      const mapped: VoucherNguoiDung[] = (sqlVouchers || []).map((v, i) => ({
        id: `sql_vc_${v.code}`,
        ...v,
        trangThai: 'active',
        ngayNhan: 'Khuyến mãi hệ thống',
      }));

      // Gộp các voucher người dùng tự đổi từ điểm
      return [...mapped, ...stored];
    } catch {
      return this.layVoucherLuuTru();
    }
  },

  layVoucherLuuTru(): VoucherNguoiDung[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Thêm voucher mới khi người dùng đổi điểm thành công
   */
  themVoucherMoi(voucher: Omit<VoucherNguoiDung, 'id' | 'ngayNhan' | 'trangThai'>): VoucherNguoiDung {
    const moi: VoucherNguoiDung = {
      ...voucher,
      id: `vc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trangThai: 'active',
      ngayNhan: new Date().toLocaleDateString('vi-VN'),
    };

    const hienTai = this.layVoucherLuuTru();
    hienTai.unshift(moi);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hienTai));
    } catch {}

    return moi;
  },

  /**
   * Đánh dấu voucher đã dùng sau khi đặt đơn
   */
  danhDauDaSuDung(code: string, maDonHang?: string): void {
    const list = this.layVoucherLuuTru();
    const updated = list.map((v) => {
      if (v.code === code) {
        return {
          ...v,
          trangThai: 'used' as TrangThaiVoucher,
          ngaySuDung: new Date().toLocaleDateString('vi-VN'),
          maDonSuDung: maDonHang,
        };
      }
      return v;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  async layDanhSachVoucher(): Promise<VoucherNguoiDung[]> {
    return this.layKhoVoucher();
  },

  themVoucherVaoKho(voucher: Omit<VoucherNguoiDung, 'id' | 'ngayNhan' | 'trangThai'>): VoucherNguoiDung {
    return this.themVoucherMoi(voucher);
  },

  phanLoaiTheoGioHang(subtotal: number) {
    const list = this.layVoucherLuuTru();
    const coTheSuDung: VoucherNguoiDung[] = [];
    const chuaDuDieuKien: VoucherNguoiDung[] = [];
    const daSuDung: VoucherNguoiDung[] = [];
    const daHetHan: VoucherNguoiDung[] = [];

    for (const v of list) {
      if (v.trangThai === 'used') {
        daSuDung.push(v);
      } else if (v.trangThai === 'expired') {
        daHetHan.push(v);
      } else if (subtotal >= v.minOrder) {
        coTheSuDung.push(v);
      } else {
        chuaDuDieuKien.push(v);
      }
    }
    return { coTheSuDung, chuaDuDieuKien, daSuDung, daHetHan };
  },
};

export default dichVuVoucher;
