import { useAuthStore } from '../stores';
import { authApi, USE_MOCK_API } from './api';
import { dichVuVoucher } from './dich-vu-voucher';
import { queryClient } from '../lib/nha-cung-cap-truy-van';

export interface GiaoDichDiem {
  id: string;
  maGiaoDich: string;
  thoiGian: string;
  noiDung: string;
  loai: 'CONG' | 'TRU' | 'DIEU_CHINH';
  soDiem: number;
  maLienQuan?: string;
  soDuSau: number;
  trangThai: 'THANH_CONG' | 'DA_HUY';
}

export interface PhanThuongDoiDiem {
  id: string;
  tenPhanThuong: string;
  moTa: string;
  soDiemCanDoi: number;
  giaTriUuDai: number;
  donToiThieu: number;
  maVoucherMau: string;
  hanSuDung: string;
  danhMuc: 'VOUCHER_TIEN' | 'DO_UONG' | 'BANH_NGOT';
}

export const DANH_MUC_PHAN_THUONG: PhanThuongDoiDiem[] = [
  {
    id: 'pt-50',
    tenPhanThuong: 'Phiếu giảm 5.000đ',
    moTa: 'Giảm trực tiếp 5.000đ cho đơn hàng đồ uống hoặc bánh nhận tại quán.',
    soDiemCanDoi: 50,
    giaTriUuDai: 5000,
    donToiThieu: 25000,
    maVoucherMau: 'BREW5K',
    hanSuDung: '30 ngày kể từ ngày đổi',
    danhMuc: 'VOUCHER_TIEN',
  },
  {
    id: 'pt-100',
    tenPhanThuong: 'Phiếu giảm 10.000đ',
    moTa: 'Giảm trực tiếp 10.000đ cho hóa đơn đặt trước từ 35.000đ lấy tại quầy.',
    soDiemCanDoi: 100,
    giaTriUuDai: 10000,
    donToiThieu: 35000,
    maVoucherMau: 'BREW10K',
    hanSuDung: '30 ngày kể từ ngày đổi',
    danhMuc: 'VOUCHER_TIEN',
  },
  {
    id: 'pt-150',
    tenPhanThuong: 'Phiếu giảm 15.000đ',
    moTa: 'Giảm 15.000đ cho đơn từ 45.000đ, áp dụng toàn bộ thực đơn cà phê & trà.',
    soDiemCanDoi: 150,
    giaTriUuDai: 15000,
    donToiThieu: 45000,
    maVoucherMau: 'BREW15K',
    hanSuDung: '30 ngày kể từ ngày đổi',
    danhMuc: 'VOUCHER_TIEN',
  },
  {
    id: 'pt-200',
    tenPhanThuong: 'Phiếu giảm 29.000đ',
    moTa: 'Giảm trực tiếp 29.000đ cho đơn từ 29.000đ.',
    soDiemCanDoi: 200,
    giaTriUuDai: 29000,
    donToiThieu: 29000,
    maVoucherMau: 'FREECAPHE',
    hanSuDung: '45 ngày kể từ ngày đổi',
    danhMuc: 'DO_UONG',
  },
  {
    id: 'pt-300',
    tenPhanThuong: 'Phiếu giảm 50.000đ',
    moTa: 'Giảm trực tiếp 50.000đ cho đơn từ 60.000đ.',
    soDiemCanDoi: 300,
    giaTriUuDai: 50000,
    donToiThieu: 60000,
    maVoucherMau: 'COMBOCAFE',
    hanSuDung: '45 ngày kể từ ngày đổi',
    danhMuc: 'BANH_NGOT',
  },
];

// Backend là nguồn dữ liệu chuẩn khi NEXT_PUBLIC_USE_MOCK_API=false.
let historyCache: GiaoDichDiem[] = [];
const storageKey = 'brewlite_loyalty_history_mock';
function mockHistory(): GiaoDichDiem[] {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
}
function writeMock(history: GiaoDichDiem[]) {
  if (typeof window !== 'undefined') localStorage.setItem(storageKey, JSON.stringify(history));
}

export const dichVuDiemThuong = {
  layLichSuDiem(): GiaoDichDiem[] { return USE_MOCK_API ? (typeof window === 'undefined' ? [] : mockHistory()) : historyCache; },
  layTongQuanDiem(soDiemHienTai: number) {
    const rows = this.layLichSuDiem();
    return {
      diemHienCo: soDiemHienTai,
      diemTrongKy: rows.filter(r => r.loai === 'CONG').reduce((a,r) => a + r.soDiem, 0),
      diemDaDung: -rows.filter(r => r.loai === 'TRU').reduce((a,r) => a + r.soDiem, 0),
    };
  },
  ghiNhanCongDiem(soDiem: number, maDonHang: string, soDuHienTai: number) {
    if (!USE_MOCK_API) return; // backend đã ghi giao dịch khi thanh toán mô phỏng thành công
    const rows = mockHistory();
    rows.unshift({ id: crypto.randomUUID(), maGiaoDich: 'MOCK', thoiGian: new Date().toLocaleString('vi-VN'),
      noiDung: `Tích điểm đơn ${maDonHang}`, loai: 'CONG', soDiem, soDuSau: soDuHienTai + soDiem, trangThai: 'THANH_CONG' });
    writeMock(rows);
  },
  ghiNhanTruDiem(soDiem: number, noiDung: string, soDuHienTai: number, maLienQuan?: string) {
    if (!USE_MOCK_API) return;
    const rows = mockHistory();
    rows.unshift({ id: crypto.randomUUID(), maGiaoDich: 'MOCK', thoiGian: new Date().toLocaleString('vi-VN'),
      noiDung, maLienQuan, loai: 'TRU', soDiem: -soDiem, soDuSau: soDuHienTai - soDiem, trangThai: 'THANH_CONG' });
    writeMock(rows);
  },
  async layLichSuGiaoDich(): Promise<GiaoDichDiem[]> {
    if (USE_MOCK_API) return this.layLichSuDiem();
    const txs = await authApi.getLoyaltyHistory();
    let running = useAuthStore.getState().user?.loyaltyPoints ?? 0;
    historyCache = txs.map((t) => {
      const after = running;
      running -= t.type === 'EARN' ? t.points : -t.points;
      return {
        id: t.id, maGiaoDich: `GD-${t.id.slice(0, 8).toUpperCase()}`,
        thoiGian: new Date(t.createdAt).toLocaleString('vi-VN'),
        noiDung: t.type === 'EARN' ? `Tích điểm đơn BL-${t.order?.orderCode ?? '---'}` : (t.order?.orderCode ? `Hoàn tác điểm do hủy đơn BL-${t.order.orderCode}` : 'Đổi điểm lấy voucher'),
        loai: t.type === 'EARN' ? 'CONG' as const : 'TRU' as const,
        soDiem: t.type === 'EARN' ? t.points : -t.points,
        maLienQuan: t.order?.orderCode ? `BL-${t.order.orderCode}` : undefined,
        soDuSau: after, trangThai: 'THANH_CONG' as const,
      };
    });
    return historyCache;
  },
  async layDanhMucPhanThuong() { return DANH_MUC_PHAN_THUONG; },
  async doiPhanThuong(reward: PhanThuongDoiDiem) {
    const user = useAuthStore.getState().user;
    if (!user) return { thanhCong: false, thongBao: 'Bạn cần đăng nhập.' };
    try {
      const res = await authApi.redeemReward(reward.id, crypto.randomUUID());
      await useAuthStore.getState().initAuth();
      await queryClient.invalidateQueries({ queryKey: ['voucher'] });
      await queryClient.invalidateQueries({ queryKey: ['diem-thuong'] });
      await dichVuVoucher.layKhoVoucher();
      return { thanhCong: true, thongBao: `${res.message} Mã: ${res.voucherCode}`, maVoucherTaoMoi: res.voucherCode };
    } catch (e: any) {
      return { thanhCong: false, thongBao: e.message || 'Không đổi được điểm' };
    }
  },
  async doiPhanThuongTheoId(rewardId: string) {
    const reward = DANH_MUC_PHAN_THUONG.find(r => r.id === rewardId);
    if (!reward) return { success: false, message: 'Phần thưởng không tồn tại' };
    const res = await this.doiPhanThuong(reward);
    return { success: res.thanhCong, message: res.thongBao, voucherCode: res.maVoucherTaoMoi };
  },
};
