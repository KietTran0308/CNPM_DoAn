import { useAuthStore } from '../stores';
import { dichVuVoucher } from './dich-vu-voucher';

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
    tenPhanThuong: 'Thưởng 01 Cà Phê Sữa Đá Sài Gòn',
    moTa: 'Miễn phí 01 ly Cà phê sữa đá đậm đà chuẩn vị Sài Gòn (trị giá 29.000đ).',
    soDiemCanDoi: 200,
    giaTriUuDai: 29000,
    donToiThieu: 29000,
    maVoucherMau: 'FREECAPHE',
    hanSuDung: '45 ngày kể từ ngày đổi',
    danhMuc: 'DO_UONG',
  },
  {
    id: 'pt-300',
    tenPhanThuong: 'Combo Cà Phê & Croissant Bơ Pháp',
    moTa: 'Ưu đãi đặc biệt giảm 50.000đ khi gọi combo cà phê kèm bánh nướng nóng giòn.',
    soDiemCanDoi: 300,
    giaTriUuDai: 50000,
    donToiThieu: 60000,
    maVoucherMau: 'COMBOCAFE',
    hanSuDung: '45 ngày kể từ ngày đổi',
    danhMuc: 'BANH_NGOT',
  },
];

const STORAGE_KEY = 'brewlite_loyalty_history_v2';

const LICH_SU_KHOI_TAO: GiaoDichDiem[] = [];

const layLichSuTuStorage = (): GiaoDichDiem[] => {
  if (typeof window === 'undefined') return LICH_SU_KHOI_TAO;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Lỗi đọc lịch sử điểm từ localStorage', err);
  }
  return LICH_SU_KHOI_TAO;
};

const luuLichSuVaoStorage = (danhSach: GiaoDichDiem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(danhSach));
  } catch (err) {
    console.error('Lỗi lưu lịch sử điểm vào localStorage', err);
  }
};

let dangXuLyDoiDiem = false;

export const dichVuDiemThuong = {
  /**
   * Lấy toàn bộ lịch sử biến động điểm
   */
  layLichSuDiem(): GiaoDichDiem[] {
    return layLichSuTuStorage();
  },

  /**
   * Tính toán các chỉ số điểm tổng quan
   */
  layTongQuanDiem(soDiemHienTai: number) {
    const lichSu = layLichSuTuStorage();
    const diemTrongKy = lichSu
      .filter((g) => g.loai === 'CONG' && g.trangThai === 'THANH_CONG')
      .reduce((sum, g) => sum + g.soDiem, 0);
    const diemDaDung = Math.abs(
      lichSu
        .filter((g) => g.loai === 'TRU' && g.trangThai === 'THANH_CONG')
        .reduce((sum, g) => sum + g.soDiem, 0)
    );

    return {
      diemHienCo: soDiemHienTai,
      diemTrongKy,
      diemDaDung,
    };
  },

  /**
   * Ghi nhận giao dịch cộng điểm khi đơn hàng hoàn tất
   */
  ghiNhanCongDiem(soDiem: number, maDonHang: string, soDuHienTai: number): GiaoDichDiem {
    const lichSu = layLichSuTuStorage();
    const maGD = `GD-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const thoiGian = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.toLocaleDateString('vi-VN')}`;

    const giaoDichMoi: GiaoDichDiem = {
      id: `gd-${Date.now()}`,
      maGiaoDich: maGD,
      thoiGian,
      noiDung: `Tích điểm đơn hàng ${maDonHang} nhận tại quầy`,
      loai: 'CONG',
      soDiem,
      maLienQuan: maDonHang,
      soDuSau: soDuHienTai + soDiem,
      trangThai: 'THANH_CONG',
    };

    const capNhat = [giaoDichMoi, ...lichSu];
    luuLichSuVaoStorage(capNhat);
    return giaoDichMoi;
  },

  /**
   * Ghi nhận giao dịch trừ điểm khi đổi ưu đãi hoặc trừ điểm đơn hàng
   */
  ghiNhanTruDiem(soDiem: number, noiDung: string, soDuHienTai: number, maLienQuan?: string): GiaoDichDiem {
    const lichSu = layLichSuTuStorage();
    const maGD = `GD-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const thoiGian = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.toLocaleDateString('vi-VN')}`;

    const giaoDichTru: GiaoDichDiem = {
      id: `gd-${Date.now()}`,
      maGiaoDich: maGD,
      thoiGian,
      noiDung,
      loai: 'TRU',
      soDiem: -Math.abs(soDiem),
      maLienQuan,
      soDuSau: Math.max(0, soDuHienTai - Math.abs(soDiem)),
      trangThai: 'THANH_CONG',
    };

    const capNhat = [giaoDichTru, ...lichSu];
    luuLichSuVaoStorage(capNhat);
    return giaoDichTru;
  },

  /**
   * Thực hiện đổi điểm lấy phần thưởng (có kiểm tra an toàn, chống click đúp)
   */
  async doiPhanThuong(phanThuong: PhanThuongDoiDiem): Promise<{
    thanhCong: boolean;
    thongBao: string;
    maVoucherTaoMoi?: string;
  }> {
    if (dangXuLyDoiDiem) {
      return { thanhCong: false, thongBao: 'Yêu cầu đang được xử lý, vui lòng chờ trong giây lát.' };
    }

    try {
      dangXuLyDoiDiem = true;
      const user = useAuthStore.getState().user;
      if (!user) {
        return { thanhCong: false, thongBao: 'Vui lòng đăng nhập để thực hiện đổi điểm thưởng.' };
      }

      const diemHienCo = user.loyaltyPoints ?? 0;
      if (diemHienCo < phanThuong.soDiemCanDoi) {
        return {
          thanhCong: false,
          thongBao: `Số điểm hiện có (${diemHienCo} điểm) không đủ để đổi phần thưởng này (cần ${phanThuong.soDiemCanDoi} điểm).`,
        };
      }

      // 1. Trừ điểm người dùng thông qua AuthStore
      const ketQuaTru = await useAuthStore.getState().redeemPoints(phanThuong.soDiemCanDoi);
      if (!ketQuaTru.success) {
        return { thanhCong: false, thongBao: ketQuaTru.message };
      }

      const soDuMoi = ketQuaTru.remainingPoints ?? diemHienCo - phanThuong.soDiemCanDoi;

      // 2. Tạo mã voucher độc nhất đưa vào kho voucher của người dùng
      const maVoucherRandom = `${phanThuong.maVoucherMau}-${Math.floor(100 + Math.random() * 900)}`;
      dichVuVoucher.themVoucherVaoKho({
        code: maVoucherRandom,
        title: phanThuong.tenPhanThuong,
        discountAmount: phanThuong.giaTriUuDai,
        minOrder: phanThuong.donToiThieu,
        description: phanThuong.moTa,
        tag: `Đổi ${phanThuong.soDiemCanDoi} điểm`,
        expiry: phanThuong.hanSuDung,
      });

      // 3. Ghi lại lịch sử giao dịch trừ điểm
      const lichSu = layLichSuTuStorage();
      const maGD = `GD-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();
      const thoiGian = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.toLocaleDateString('vi-VN')}`;

      const giaoDichTru: GiaoDichDiem = {
        id: `gd-${Date.now()}`,
        maGiaoDich: maGD,
        thoiGian,
        noiDung: `Đổi phần thưởng "${phanThuong.tenPhanThuong}"`,
        loai: 'TRU',
        soDiem: -phanThuong.soDiemCanDoi,
        maLienQuan: maVoucherRandom,
        soDuSau: soDuMoi,
        trangThai: 'THANH_CONG',
      };

      luuLichSuVaoStorage([giaoDichTru, ...lichSu]);

      return {
        thanhCong: true,
        thongBao: `Đổi thành công! Đã trừ ${phanThuong.soDiemCanDoi} điểm. Phiếu ưu đãi [${maVoucherRandom}] đã được lưu vào Kho ưu đãi của bạn.`,
        maVoucherTaoMoi: maVoucherRandom,
      };
    } finally {
      dangXuLyDoiDiem = false;
    }
  },

  async layLichSuGiaoDich(): Promise<GiaoDichDiem[]> {
    return layLichSuTuStorage();
  },

  async layDanhMucPhanThuong(): Promise<PhanThuongDoiDiem[]> {
    return DANH_MUC_PHAN_THUONG;
  },

  async doiPhanThuongTheoId(rewardId: string): Promise<{ success: boolean; message: string; voucherCode?: string }> {
    const reward = DANH_MUC_PHAN_THUONG.find((r) => r.id === rewardId);
    if (!reward) {
      return { success: false, message: 'Phần thưởng không tồn tại.' };
    }
    const res = await this.doiPhanThuong(reward);
    return {
      success: res.thanhCong,
      message: res.thongBao,
      voucherCode: res.maVoucherTaoMoi,
    };
  },
};
