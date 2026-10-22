import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dichVuDiemThuong } from '../../services/dich-vu-diem-thuong';
import { CHINH_SACH_TICH_DIEM } from '../../services/quy-tac-uu-dai';
import { DoiDiem } from './doi-diem';
import { LichSuDiem } from './lich-su-diem';
import { DanhSachVoucher } from './danh-sach-voucher';
import {
  Sparkles,
  Gift,
  Clock,
  Tag,
  ArrowLeft,
  Coffee,
  Award,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';

export const TrangDiemThuong: React.FC = () => {
  const { user, setCurrentScreen, openCart, openAuthModal } = useApp();
  const [activeTab, setActiveTab] = useState<'doiDiem' | 'lichSu' | 'voucher' | 'chinhSach'>('doiDiem');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const diemHienCo = user?.loyaltyPoints ?? 0;
  const [history, setHistory] = useState<Awaited<ReturnType<typeof dichVuDiemThuong.layLichSuGiaoDich>>>([]);
  useEffect(() => {
    if (user?.id) dichVuDiemThuong.layLichSuGiaoDich().then(setHistory).catch(console.error);
    else setHistory([]);
  }, [user?.id, diemHienCo]);


  if (!user) {
    return (
      <div className="py-12 px-4 max-w-lg mx-auto text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-[#145C4B]/10 border border-[#145C4B]/20 flex items-center justify-center mx-auto mb-4 text-[#145C4B]">
          <Gift className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#252525] mb-2 tracking-tight">
          BrewLite Rewards
        </h1>
        <p className="text-xs text-[#252525]/70 max-w-sm mx-auto mb-6 leading-relaxed">
          Đăng nhập để theo dõi tích lũy điểm thưởng khi đặt món, thăng hạng hội viên và đổi lấy các voucher giảm giá đồ uống độc quyền.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentScreen('menu')}
            className="touch-target px-4 py-2 rounded-full border border-black/10 text-xs font-bold uppercase tracking-wider text-[#252525] hover:bg-stone-50 cursor-pointer"
          >
            Về thực đơn
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="touch-target px-6 py-2.5 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer transition-transform active:scale-95"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }


  const hangThanhVien = user.membershipTier || 'Standard';
  const tongQuan = {
    diemHienCo,
    diemTrongKy: history.filter(h => h.loai === 'CONG').reduce((sum,h) => sum + h.soDiem, 0),
    diemDaDung: -history.filter(h => h.loai === 'TRU').reduce((sum,h) => sum + h.soDiem, 0),
  };

  // Tiến trình lên hạng tiếp theo
  const mocHienTai = CHINH_SACH_TICH_DIEM.MOC_HANG[hangThanhVien as keyof typeof CHINH_SACH_TICH_DIEM.MOC_HANG] || 0;
  const mocTiepTheo =
    hangThanhVien === 'Standard'
      ? CHINH_SACH_TICH_DIEM.MOC_HANG.Silver
      : hangThanhVien === 'Silver'
      ? CHINH_SACH_TICH_DIEM.MOC_HANG.Gold
      : hangThanhVien === 'Gold'
      ? CHINH_SACH_TICH_DIEM.MOC_HANG.Diamond
      : 1000;

  const conThieu = Math.max(0, mocTiepTheo - diemHienCo);
  const phanTramTienTrinh = Math.min(100, Math.round((diemHienCo / mocTiepTheo) * 100));

  const handleDoiThanhCong = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto font-sans pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <nav aria-label="Đường dẫn trang" className="flex items-center gap-1.5 text-xs text-[#252525]/60">
          <button
            type="button"
            onClick={() => setCurrentScreen('menu')}
            className="hover:text-[#145C4B] transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Thực đơn</span>
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => setCurrentScreen('account')}
            className="hover:text-[#145C4B] transition-colors cursor-pointer"
          >
            Tài khoản
          </button>
          <span>/</span>
          <span className="text-[#252525] font-semibold">Điểm thưởng & Ưu đãi</span>
        </nav>

        <button
          type="button"
          onClick={() => setCurrentScreen('menu')}
          className="touch-target px-4 py-1.5 rounded-full bg-[#145C4B]/10 hover:bg-[#145C4B]/20 text-[#145C4B] text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Đặt món mang đi</span>
        </button>
      </div>

      {/* Main Loyalty Points Overview Card */}
      <div className="rounded-[22px] p-5 sm:p-6 bg-gradient-to-br from-[#145C4B] to-[#0a382e] text-white shadow-lg mb-6 border border-emerald-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-200">
                BrewLite Rewards
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-300/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-300/30">
                Hạng {hangThanhVien}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {diemHienCo} <span className="text-base font-sans font-semibold text-white/80">điểm hiện có</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('doiDiem')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'doiDiem'
                  ? 'bg-amber-400 text-stone-900 shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              Đổi điểm
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('voucher')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'voucher'
                  ? 'bg-white text-[#145C4B] shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              Kho voucher
            </button>
          </div>
        </div>

        {/* 3 Metrics: Điểm hiện có, Điểm trong kỳ, Điểm đã dùng */}
        <div className="grid grid-cols-3 gap-2 pt-4 text-center">
          <div className="bg-white/10 rounded-[14px] p-2.5">
            <span className="text-[10px] text-white/70 block uppercase">Điểm hiện có</span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-300 mt-0.5 block">
              {tongQuan.diemHienCo}
            </span>
          </div>

          <div className="bg-white/10 rounded-[14px] p-2.5">
            <span className="text-[10px] text-white/70 block uppercase">Đã tích trong kỳ</span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-300 mt-0.5 block">
              +{tongQuan.diemTrongKy}
            </span>
          </div>

          <div className="bg-white/10 rounded-[14px] p-2.5">
            <span className="text-[10px] text-white/70 block uppercase">Điểm đã sử dụng</span>
            <span className="text-base sm:text-lg font-black font-mono text-white/90 mt-0.5 block">
              -{tongQuan.diemDaDung}
            </span>
          </div>
        </div>

        {/* Progress to Next Tier */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
          <div className="flex justify-between text-[11px] text-white/80">
            <span>Tiến trình đạt hạng tiếp theo ({hangThanhVien === 'Diamond' ? 'Hạng cao nhất' : 'Kim Cương'})</span>
            <span className="font-mono">
              {conThieu > 0 ? `Còn thiếu ${conThieu} điểm` : 'Đã đạt mức tối đa'}
            </span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-300 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${phanTramTienTrinh}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 mb-6 border-b border-black/5 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'doiDiem', label: 'Đổi phần thưởng', icon: Gift },
          { id: 'voucher', label: 'Kho ưu đãi của tôi', icon: Tag },
          { id: 'lichSu', label: 'Lịch sử điểm', icon: Clock },
          { id: 'chinhSach', label: 'Chính sách tích điểm', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#145C4B] text-white shadow-xs'
                  : 'bg-white text-[#252525]/70 hover:bg-stone-50 border border-black/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'doiDiem' && (
        <DoiDiem
          diemHienCo={diemHienCo}
          onDoiThanhCong={handleDoiThanhCong}
          onChuyenSangVoucher={() => setActiveTab('voucher')}
        />
      )}

      {activeTab === 'voucher' && <DanhSachVoucher />}

      {activeTab === 'lichSu' && <LichSuDiem />}

      {activeTab === 'chinhSach' && (
        <div className="space-y-4 text-xs text-[#252525]">
          <div className="p-5 rounded-[20px] bg-white border border-black/10 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-[#145C4B] uppercase tracking-wide flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#145C4B]" />
              <span>Chính sách tích điểm minh bạch tại BrewLite</span>
            </h3>

            <div className="space-y-2.5 leading-relaxed text-[#252525]/85">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>10.000 đồng = 1 điểm:</strong> Mỗi 10.000đ thanh toán thực tế sau khi áp dụng voucher sẽ được cộng 1 điểm tích lũy vào tài khoản.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Cộng điểm sau thanh toán:</strong> Điểm được tự động cập nhật ngay khi đơn hàng hoàn tất xác nhận và nhận tại quầy.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Không tích điểm vòng lặp:</strong> Phần tiền thanh toán bằng điểm hoặc được chiết khấu từ voucher không tiếp tục tạo ra điểm mới.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Lịch sử giao dịch rõ ràng:</strong> Mọi biến động cộng, trừ hoặc đổi điểm đều có mã giao dịch riêng, ngày giờ và số dư sau giao dịch.
                </span>
              </div>
            </div>
          </div>

          {/* Tier Table */}
          <div className="p-5 rounded-[20px] bg-white border border-black/10 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-[#252525] uppercase tracking-wide">
              Các mốc hạng thành viên & Hệ số tích điểm
            </h4>

            <div className="divide-y divide-black/5 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#252525] block">Standard (Thành viên mới)</span>
                  <span className="text-[11px] text-[#252525]/60">0 - 99 điểm</span>
                </div>
                <span className="font-mono font-bold text-[#145C4B]">Tích điểm chuẩn 1.0x</span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#252525] block">Silver (Hội viên Bạc)</span>
                  <span className="text-[11px] text-[#252525]/60">100 - 299 điểm</span>
                </div>
                <span className="font-mono font-bold text-[#145C4B]">Hệ số 1.1x • Giảm 5%</span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#252525] block">Gold (Hội viên Vàng)</span>
                  <span className="text-[11px] text-[#252525]/60">300 - 599 điểm</span>
                </div>
                <span className="font-mono font-bold text-amber-600">Hệ số 1.25x • Giảm 10% • Ưu tiên quầy</span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#252525] block">Diamond (Hội viên Kim Cương)</span>
                  <span className="text-[11px] text-[#252525]/60">Từ 600 điểm trở lên</span>
                </div>
                <span className="font-mono font-bold text-amber-700">Hệ số 1.5x • Giảm 15% • Free Topping</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
