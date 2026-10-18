import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAccount } from '../../hooks';
import {
  User as UserIcon,
  Phone,
  Mail,
  ShieldCheck,
  Edit3,
  Key,
  LogOut,
  Calendar,
  Award,
  Sparkles,
  ShoppingBag,
  ArrowLeft,
  Coffee,
  Check,
  Copy,
  ChevronRight,
  MapPin,
  Tag,
  Gift,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { DEFAULT_VOUCHERS as AVAILABLE_VOUCHERS, DEFAULT_BRANCHES as BRANCHES } from '../../constants';
import { formatCurrency } from '../../utils';
import { dichVuDiemThuong } from '../../services/dich-vu-diem-thuong';
import { dichVuVoucher } from '../../services/dich-vu-voucher';

export const AccountProfilePage: React.FC = () => {
  const {
    setCurrentScreen,
    openAuthModal,
    orders,
    applyVoucher,
    openCart,
  } = useApp();

  const {
    user,
    updateProfile,
    changePassword,
    logout,
    redeemPoints,
    isUpdatingProfile,
    isChangingPassword,
  } = useAccount();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [rewardNotice, setRewardNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    setCurrentScreen('menu');
  };

  const handleRedeemVoucher = async (points: number, voucherCode: string) => {
    const res = await redeemPoints(points);
    if (res.success) {
      // 1. Ghi nhận lịch sử trừ điểm
      dichVuDiemThuong.ghiNhanTruDiem(
        points,
        `Đổi phiếu ưu đãi [${voucherCode}]`,
        user?.loyaltyPoints || 0,
        voucherCode
      );

      // 2. Lưu voucher vào kho ưu đãi cá nhân
      const discountAmount = points === 30 ? 15000 : points === 50 ? 30000 : 50000;
      const minOrder = points === 30 ? 30000 : points === 50 ? 50000 : 80000;
      dichVuVoucher.themVoucherVaoKho({
        code: voucherCode,
        title: `Voucher giảm ${formatCurrency(discountAmount)} đổi từ điểm`,
        discountAmount,
        minOrder,
        description: `Đổi từ ${points} điểm tích lũy BrewLite Rewards`,
        tag: `Đổi ${points} điểm`,
        expiry: '31/12/2026',
      });

      setRewardNotice({
        text: `Đổi thành công mã ưu đãi [${voucherCode}] bằng ${points} điểm! Đã lưu vào Kho ưu đãi.`,
        isError: false,
      });

      // 3. Tự động áp dụng vào giỏ hàng
      applyVoucher(voucherCode);
    } else {
      setRewardNotice({ text: res.message, isError: true });
    }
    setTimeout(() => setRewardNotice(null), 4000);
  };

  const handleUseVoucher = (code: string) => {
    const res = applyVoucher(code);
    setRewardNotice({
      text: res.success ? `Đã chọn áp dụng mã [${code}] vào đơn hàng!` : res.message,
      isError: !res.success,
    });
    setTimeout(() => setRewardNotice(null), 3000);
    openCart();
  };

  if (!user) {
    return (
      <div className="py-12 px-4 max-w-lg mx-auto text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-[#145C4B]/10 border border-[#145C4B]/20 flex items-center justify-center mx-auto mb-4 text-[#145C4B]">
          <UserIcon className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#252525] mb-2 tracking-tight">
          Tài khoản thành viên
        </h1>
        <p className="text-xs text-[#252525]/70 max-w-sm mx-auto mb-6 leading-relaxed">
          Đăng nhập để theo dõi tích điểm BrewLite Rewards, hạng hội viên, đổi ưu đãi và xem lịch sử nhận nước tại quầy.
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

  const completedOrdersCount = orders.length;
  const currentPoints = user.loyaltyPoints ?? 0;
  const tier = user.membershipTier || 'Standard';

  // Calculate points needed for next tier
  const nextTierTarget = tier === 'Standard' ? 100 : tier === 'Silver' ? 300 : tier === 'Gold' ? 600 : 1000;
  const pointsToNextTier = Math.max(0, nextTierTarget - currentPoints);
  const tierProgress = Math.min(100, Math.round((currentPoints / nextTierTarget) * 100));

  return (
    <div className="w-full max-w-4xl mx-auto font-sans pb-16">
      {/* 1. TOP BREADCRUMB & NAV BAR */}
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
          <span className="text-[#252525] font-semibold">Tài khoản thành viên</span>
        </nav>

        <button
          type="button"
          onClick={() => setCurrentScreen('menu')}
          className="touch-target px-4 py-1.5 rounded-full bg-[#145C4B]/10 hover:bg-[#145C4B]/20 text-[#145C4B] text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Đặt nước mang đi</span>
        </button>
      </div>

      {/* Global Reward Notice Toast */}
      {rewardNotice && (
        <div
          className={`mb-4 p-3 rounded-[16px] text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 border ${
            rewardNotice.isError
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{rewardNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setRewardNotice(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 2. DIGITAL MEMBERSHIP CARD (Hạng thành viên & Điểm tích lũy) */}
      <div className="relative rounded-[24px] p-5 sm:p-7 bg-gradient-to-br from-[#0c4336] via-[#145C4B] to-[#1c3e34] text-white shadow-xl overflow-hidden mb-6 border border-emerald-800/40">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-56 h-56 rounded-full bg-emerald-300/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Identity Left */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={user.fullName}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-3 border-amber-300/90 shadow-md bg-stone-100"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <div
                className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 rounded-full p-1 shadow-xs"
                title="Thành viên BrewLite"
              >
                <Award className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {user.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-300/25 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-300/40">
                  {tier} Member
                </span>
              </div>
              <p className="text-xs text-white/80 flex items-center gap-1.5 mb-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-white/60 shrink-0" />
                <span>{user.phone}</span>
              </p>
              <p className="text-[11px] text-white/60 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-white/40 shrink-0" />
                <span>Thành viên từ: {user.createdAt || '15/01/2026'}</span>
              </p>
            </div>
          </div>

          {/* Membership Tier & Points Box Right */}
          <div className="bg-white/10 backdrop-blur-md rounded-[20px] p-4 border border-white/15 min-w-[260px]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-white/90 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Điểm BrewLite Rewards</span>
              </span>
              <span className="font-mono font-black text-amber-300 text-base">
                {currentPoints} điểm
              </span>
            </div>

            {/* Progress Bar to Next Tier */}
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-gradient-to-r from-amber-300 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/70">
              <span>Hạng {tier}</span>
              <span>
                {pointsToNextTier > 0
                  ? `Còn ${pointsToNextTier} điểm lên ${tier === 'Gold' ? 'Kim Cương' : 'hạng kế tiếp'}`
                  : 'Đạt hạng cao nhất'}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="touch-target inline-flex items-center gap-1 text-[11px] font-bold text-white hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Sửa thông tin</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="touch-target inline-flex items-center gap-1 text-[11px] font-bold text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <Key className="w-3 h-3" />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TÍCH ĐIỂM & ĐỔI ƯU ĐÃI (REWARDS & VOUCHERS WALLET) */}
      <div className="liquid-glass rounded-[22px] p-5 sm:p-6 border border-white/80 shadow-sm bg-white/85 mb-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#252525] uppercase tracking-wide">
                Đổi điểm nhận ưu đãi nhận tại quán
              </h2>
              <span className="text-[11px] text-[#252525]/60">
                Mỗi 10.000đ khi đặt món được tích lũy 1 điểm • Dùng điểm đổi voucher trực tiếp
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#145C4B] bg-[#145C4B]/10 px-3 py-1 rounded-full">
            Số dư: {currentPoints} điểm
          </span>
        </div>

        {/* Point Exchange Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { pts: 30, discount: 15000, code: 'POINT15K', title: 'Voucher 15.000đ', min: 'Đơn từ 30k' },
            { pts: 50, discount: 30000, code: 'POINT30K', title: 'Voucher 30.000đ', min: 'Đơn từ 50k' },
            { pts: 80, discount: 50000, code: 'POINT50K', title: 'Voucher VIP 50.000đ', min: 'Đơn từ 80k' },
          ].map((rw) => {
            const canRedeem = currentPoints >= rw.pts;
            return (
              <div
                key={rw.code}
                className="p-3.5 rounded-[16px] bg-[#FAF9F5] border border-black/5 hover:border-[#145C4B]/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {rw.pts} điểm
                    </span>
                    <span className="text-[10px] text-[#252525]/50">{rw.min}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#252525]">{rw.title}</h3>
                  <p className="text-[11px] text-[#252525]/60 mt-0.5 font-mono">Mã: {rw.code}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRedeemVoucher(rw.pts, rw.code)}
                  disabled={!canRedeem}
                  className={`mt-3 w-full py-1.5 px-3 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
                    canRedeem
                      ? 'bg-[#145C4B] hover:bg-[#035542] text-white shadow-xs'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  {canRedeem ? 'Đổi điểm ngay' : 'Chưa đủ điểm'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Available Vouchers List */}
        <div>
          <span className="text-xs font-bold text-[#252525] uppercase tracking-wide block mb-3 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#145C4B]" />
            <span>Kho phiếu giảm giá sẵn có của bạn</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_VOUCHERS.slice(0, 4).map((v) => (
              <div
                key={v.code}
                className="p-3 rounded-[14px] bg-white border border-black/5 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#145C4B] bg-[#145C4B]/10 px-2 py-0.5 rounded-md">
                      {v.code}
                    </span>
                    {v.tag && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
                        {v.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#252525] mt-1">{v.title}</p>
                  <p className="text-[11px] text-[#252525]/60">{v.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleUseVoucher(v.code)}
                  className="shrink-0 px-3 py-1.5 rounded-full border border-[#145C4B]/30 hover:bg-[#145C4B] hover:text-white text-[#145C4B] text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Dùng ngay
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. DETAILS GRID (Chi nhánh quán yêu thích & Thông tin liên hệ & Quyền lợi hạng) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Card 1: Chi nhánh yêu thích thường ghé nhận nước */}
        <div className="liquid-glass rounded-[20px] p-5 sm:p-6 border border-white/80 shadow-sm bg-white/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#145C4B]/10 flex items-center justify-center text-[#145C4B]">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-[#252525] uppercase tracking-wide">
                  Chi nhánh nhận nước yêu thích
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-bold text-[#145C4B] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Đổi</span>
              </button>
            </div>

            <div className="bg-[#FAF9F5] rounded-[16px] p-3.5 border border-black/5 mb-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#145C4B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-[#252525] block">
                    {user.favoriteBranch || BRANCHES[0].name}
                  </span>
                  <p className="text-[11px] text-[#252525]/70 mt-1 leading-relaxed">
                    Được ưu tiên chọn sẵn khi đặt món giúp bạn tiết kiệm thời gian ghé quầy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-black/5 flex items-center justify-between text-xs">
            <span className="text-[#252525]/60">Thời gian chuẩn bị: 5–10 phút</span>
            <span className="font-semibold text-[#145C4B]">Nhận tại quầy Barista</span>
          </div>
        </div>

        {/* Card 2: Thông tin cá nhân & Liên hệ nhận món */}
        <div className="liquid-glass rounded-[20px] p-5 sm:p-6 border border-white/80 shadow-sm bg-white/80">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#145C4B]/10 flex items-center justify-center text-[#145C4B]">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold text-[#252525] uppercase tracking-wide">
                Thông tin nhận diện thành viên
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs font-bold text-[#145C4B] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Sửa</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#252525]/60 text-[11px] block uppercase font-medium">Họ và tên</span>
              <span className="text-[#252525] font-semibold text-sm mt-0.5 block">{user.fullName}</span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-[#252525]/60 text-[11px] block uppercase font-medium">Số điện thoại nhận nước</span>
                <button
                  type="button"
                  onClick={() => handleCopy(user.phone, 'Số điện thoại')}
                  className="text-[10px] text-[#145C4B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'Số điện thoại' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Sao chép</span>
                </button>
              </div>
              <span className="text-[#252525] font-mono font-semibold text-sm mt-0.5 block">{user.phone}</span>
            </div>

            <div>
              <span className="text-[#252525]/60 text-[11px] block uppercase font-medium">Email tài khoản</span>
              <span className="text-[#252525] font-semibold text-sm mt-0.5 block truncate">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Đặc quyền Hạng thành viên (Tiers & Privileges) */}
        <div className="liquid-glass rounded-[20px] p-5 sm:p-6 border border-white/80 shadow-sm bg-white/80">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-400/15 flex items-center justify-center text-amber-600">
                <Award className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold text-[#252525] uppercase tracking-wide">
                Đặc quyền Hạng {tier}
              </h2>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-[#252525]">
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Tích lũy 1 điểm cho mỗi 10.000đ hóa đơn (hệ số x1.25)</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Giảm trực tiếp 10% cho mọi đơn cà phê & bánh ngọt</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Ưu tiên pha chế tại quầy Barista không cần chờ đợi</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Tặng 01 bánh ngọt bất kỳ vào tháng sinh nhật</span>
            </div>
          </div>
        </div>

        {/* Card 4: Đơn hàng & Tiện ích */}
        <div className="liquid-glass rounded-[20px] p-5 sm:p-6 border border-white/80 shadow-sm bg-white/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#145C4B]/10 flex items-center justify-center text-[#145C4B]">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-[#252525] uppercase tracking-wide">
                  Đơn nhận tại quầy
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[#FAF9F5] p-3 rounded-[14px] border border-black/5 text-center">
                <span className="text-[11px] text-[#252525]/60 block uppercase">Tổng đơn đã lấy</span>
                <span className="text-lg font-black font-mono text-[#145C4B] mt-0.5 block">
                  {completedOrdersCount}
                </span>
              </div>
              <div className="bg-[#FAF9F5] p-3 rounded-[14px] border border-black/5 text-center">
                <span className="text-[11px] text-[#252525]/60 block uppercase">Mã ưu đãi có sẵn</span>
                <span className="text-lg font-black font-mono text-amber-600 mt-0.5 block">
                  {AVAILABLE_VOUCHERS.length}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-black/5">
            <button
              type="button"
              onClick={() => setCurrentScreen('orders')}
              className="w-full touch-target py-2 px-3 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Xem lịch sử đơn hàng ({completedOrdersCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. FOOTER ACTIONS / LOGOUT BUTTON */}
      <div className="p-4 rounded-[20px] bg-red-50/60 border border-red-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <span className="text-xs font-bold text-red-900 block">
            Quản trị phiên làm việc
          </span>
          <span className="text-[11px] text-red-700/80">
            Bạn có thể đăng xuất khỏi thiết bị này bất cứ khi nào
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="touch-target px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSave={updateProfile}
        isSaving={isUpdatingProfile}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={changePassword}
        isSaving={isChangingPassword}
      />

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[24px] p-6 shadow-2xl text-center border border-black/10">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#252525] mb-1">
              Xác nhận đăng xuất?
            </h3>
            <p className="text-xs text-[#252525]/70 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <strong>{user.fullName}</strong> không?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="touch-target px-4 py-2 rounded-full border border-black/10 text-xs font-bold uppercase tracking-wider text-[#252525] hover:bg-stone-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="touch-target px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
