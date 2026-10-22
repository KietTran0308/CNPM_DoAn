import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { USE_MOCK_API } from '../services/api';
import { PaymentMethodId } from '../types';
import { formatCurrency } from '../utils';
import { DEFAULT_BRANCHES as BRANCHES, DEFAULT_VOUCHERS as AVAILABLE_VOUCHERS } from '../constants';
import {
  ArrowLeft,
  QrCode,
  CreditCard,
  Building2,
  Copy,
  Check,
  Clock,
  MapPin,
  RefreshCw,
  Phone,
  User,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Smartphone,
  Lock,
  Sparkles,
  Edit2,
  CheckCircle2,
  Tag,
  Gift,
} from 'lucide-react';


type QRStatus = 'WAITING' | 'CHECKING' | 'SUCCESS' | 'EXPIRED';
type MainCategory = 'recommended' | 'other';
type OtherMethod = 'bank_transfer' | 'ewallet' | 'card';
type EWalletProvider = 'momo' | 'zalopay' | 'vnpay';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartTotal,
    cartSubtotal,
    discount,
    pointsDiscount,
    setPointsDiscount,
    voucherCode,
    applyVoucher,
    pickupBranch,
    setPickupBranch,
    pickupTimeType,
    setPickupTimeType,
    scheduledTime,
    setScheduledTime,
    pickupNote,
    setPickupNote,
    setCurrentScreen,
    createOrder,
    branchName,
    user,
    openEditCartItem,
  } = useApp();

  // Selection states
  const [activeCategory, setActiveCategory] = useState<MainCategory>('recommended');
  const [selectedOther, setSelectedOther] = useState<OtherMethod>('bank_transfer');
  const [selectedWallet, setSelectedWallet] = useState<EWalletProvider>('momo');

  // Customer info states for in-store pickup
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [usePoints, setUsePoints] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherMsg, setVoucherMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (user) {
      if (user.fullName) setCustomerName(user.fullName);
      if (user.phone) setCustomerPhone(user.phone);
      if (user.favoriteBranch) setPickupBranch(user.favoriteBranch);
    }
  }, [user, setPickupBranch]);


  // Order summary expansion on mobile
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);

  // QA simulation
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // QR Code timer & status state
  const INITIAL_COUNTDOWN = 300; // 5 minutes in seconds
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_COUNTDOWN);
  const [qrStatus, setQrStatus] = useState<QRStatus>('WAITING');
  const [orderReference, setOrderReference] = useState(() => `BL${Math.floor(1000 + Math.random() * 9000)}`);

  // Copy feedback tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Bank transfer info
  const bankInfo = {
    bankName: 'THANH TOÁN DEMO — KHÔNG CHUYỂN TIỀN',
    bankShort: 'DEMO',
    accountNumber: '0000000000',
    accountHolder: 'KHONG CHUYEN TIEN - CHI DEMO',
    amount: cartTotal,
    content: `${orderReference} ${customerPhone.slice(-4)}`,
  };

  // Countdown timer effect
  useEffect(() => {
    if (activeCategory !== 'recommended' && !(activeCategory === 'other' && selectedOther === 'bank_transfer')) {
      return;
    }

    if (qrStatus === 'EXPIRED' || qrStatus === 'SUCCESS') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setQrStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCategory, selectedOther, qrStatus]);

  // Format countdown mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Renew QR code
  const handleRenewQR = () => {
    setTimeLeft(INITIAL_COUNTDOWN);
    setQrStatus('WAITING');
    setOrderReference(`BL${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Copy helper with feedback
  const handleCopy = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-container max-w-md mx-auto py-16 px-6 text-center liquid-glass rounded-[20px] border border-white/80 shadow-lg">
        <div className="w-14 h-14 rounded-full liquid-glass-butter flex items-center justify-center mx-auto mb-4 border border-amber-300/40 shadow-xs">
          <QrCode className="w-7 h-7 text-[#035542]" />
        </div>
        <h2 className="text-lg font-bold uppercase text-[#333333] mb-1 tracking-tight">
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="text-xs text-[#333333]/70 mb-6">
          Vui lòng chọn món yêu thích trước khi tiến hành thanh toán
        </p>
        <button
          onClick={() => setCurrentScreen('menu')}
          className="touch-target px-6 py-2.5 rounded-full liquid-glass-emerald text-white hover:brightness-105 transition-all text-xs font-bold uppercase cursor-pointer shadow-md"
        >
          QUAY LẠI THỰC ĐƠN
        </button>
      </div>
    );
  }

  // Determine current active PaymentMethodId for backend
  const getActivePaymentMethodId = (): PaymentMethodId => {
    if (activeCategory === 'recommended') return 'vietqr';
    if (selectedOther === 'bank_transfer') return 'bank_transfer';
    if (selectedOther === 'ewallet') return selectedWallet;
    if (selectedOther === 'card') return 'card';
    return 'vietqr';
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setQrStatus('CHECKING');

    setTimeout(async () => {
      const methodId = getActivePaymentMethodId();
      const result = await createOrder(methodId, simulateFailure, {
        name: customerName,
        phone: customerPhone,
      });
      setIsProcessing(false);
      if (result.success) {
        setQrStatus('SUCCESS');
      } else {
        setQrStatus('WAITING');
      }
    }, 950);
  };


  const totalItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="checkout-container w-full liquid-glass rounded-[20px] p-4 sm:p-6 lg:p-8 pb-32 sm:pb-36 border border-white/80 shadow-xl overflow-x-hidden">
      {/* Top Navigation Bar: Minimal, Clean, Liquid Glass */}
      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('menu')}
            className="touch-target w-10 h-10 rounded-full liquid-glass border border-white/80 flex items-center justify-center text-[#035542] hover:bg-white shadow-xs active:scale-95 transition-all cursor-pointer"
            title="Quay lại thực đơn"
            aria-label="Quay lại thực đơn"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase text-[#333333] tracking-tight">
              THANH TOÁN NHANH
            </h1>
            <p className="text-[11px] sm:text-xs text-[#035542] font-semibold tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#035542]" />
              Brew Lite Café
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full liquid-glass border border-emerald-900/10 text-[11px] font-mono font-bold text-[#035542] shadow-xs">
          <ShieldCheck className="w-4 h-4 text-[#035542]" />
          <span>THANH TOÁN MÔ PHỎNG — KHÔNG THU TIỀN</span>
        </div>
      </div>

      {/* Main Grid: Responsive 1 col on mobile, 12 cols on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-start">
        {/* Left Column (Desktop 7 cols): Quick Info & Payment Selection */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* 1. THÔNG TIN NHẬN NƯỚC TẠI QUẦY (IN-STORE PICKUP & TIMING) */}
          <div className="liquid-glass rounded-[20px] p-4 sm:p-5 border border-white/80 shadow-xs transition-all space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-black/5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#035542]" />
                <span className="text-xs font-bold text-[#035542] tracking-wide uppercase">
                  ĐIỂM NHẬN NƯỚC TẠI QUÁN
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingCustomer((prev) => !prev)}
                className="text-xs text-[#035542] hover:underline font-semibold flex items-center gap-1 cursor-pointer bg-emerald-900/5 px-2.5 py-1 rounded-full"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingCustomer ? 'Đóng' : 'Đổi thông tin'}</span>
              </button>
            </div>

            {/* Chi nhánh nhận nước */}
            <div>
              <label className="text-[10px] text-[#333333]/70 font-semibold uppercase block mb-1">
                Chi nhánh & Quầy phục vụ
              </label>
              <select
                value={pickupBranch}
                onChange={(e) => setPickupBranch(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-[12px] bg-white/95 border border-black/10 outline-none focus:border-[#035542] focus:ring-2 focus:ring-[#035542]/10 transition-colors cursor-pointer text-[#333333]"
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} — {b.address} ({b.distance})
                  </option>
                ))}
              </select>
            </div>

            {/* Thời gian nhận nước (Hẹn giờ hoặc Lấy ngay) */}
            <div>
              <label className="text-[10px] text-[#333333]/70 font-semibold uppercase block mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#035542]" />
                <span>Thời gian nhận đồ uống</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPickupTimeType('asap')}
                  className={`py-2 px-3 rounded-[12px] text-xs font-semibold text-center cursor-pointer transition-all border ${pickupTimeType === 'asap'
                      ? 'bg-[#035542] text-white border-[#035542] shadow-xs'
                      : 'bg-white/80 hover:bg-white text-[#333333] border-black/10'
                    }`}
                >
                  ⚡ Lấy ngay (5–10 phút)
                </button>
                <button
                  type="button"
                  onClick={() => setPickupTimeType('scheduled')}
                  className={`py-2 px-3 rounded-[12px] text-xs font-semibold text-center cursor-pointer transition-all border ${pickupTimeType === 'scheduled'
                      ? 'bg-[#035542] text-white border-[#035542] shadow-xs'
                      : 'bg-white/80 hover:bg-white text-[#333333] border-black/10'
                    }`}
                >
                  ⏰ Hẹn giờ lấy
                </button>
              </div>

              {pickupTimeType === 'scheduled' && (
                <div className="mt-2 flex flex-wrap gap-1.5 animate-in fade-in duration-150">
                  {['Sau 15 phút', 'Sau 30 phút', 'Sau 45 phút', 'Sau 1 giờ', '17:30 hôm nay'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setScheduledTime(slot)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer border ${scheduledTime === slot
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                          : 'bg-white text-[#333333]/80 border-black/10 hover:border-black/30'
                        }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin người nhận */}
            {!isEditingCustomer ? (
              <div className="pt-2 border-t border-black/5 flex flex-wrap items-center justify-between text-xs text-[#333333]">
                <div className="flex items-center gap-4">
                  <span className="font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#035542]" />
                    {customerName}
                  </span>
                  <span className="font-mono text-[#333333]/80 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#035542]" />
                    {customerPhone}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#035542] bg-[#f9e9a9]/60 px-2 py-0.5 rounded-full">
                  Mã đọc tại quầy
                </span>
              </div>
            ) : (
              <div className="pt-2 border-t border-black/5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-150">
                <div>
                  <label className="text-[10px] text-[#333333]/70 font-semibold uppercase block mb-1">
                    Tên người nhận tại quầy
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-9 px-3 rounded-[10px] bg-white border border-black/10 text-xs font-semibold text-[#333333] focus:border-[#035542] outline-none"
                    placeholder="Tên của bạn"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#333333]/70 font-semibold uppercase block mb-1">
                    Số điện thoại nhận nước
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-9 px-3 rounded-[10px] bg-white border border-black/10 text-xs font-mono font-semibold text-[#333333] focus:border-[#035542] outline-none"
                    placeholder="09xx..."
                  />
                </div>
              </div>
            )}

            {/* Ghi chú cho Barista */}
            <div>
              <label className="text-[10px] text-[#333333]/70 font-semibold uppercase block mb-1">
                Ghi chú cho quầy Barista (tùy chọn)
              </label>
              <input
                type="text"
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder="Ví dụ: Đóng gói mang đi, để đá riêng, cho ống hút giấy..."
                className="w-full h-9 px-3 rounded-[10px] bg-white/95 border border-black/10 text-xs text-[#333333] focus:border-[#035542] outline-none"
              />
            </div>
          </div>


          {/* 2. PAYMENT METHODS: LIQUID GLASS 2-TIER CLASSIFICATION */}
          <div className="liquid-glass rounded-[20px] p-4 sm:p-6 border border-white/80 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#035542] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#035542]" />
                PHƯƠNG THỨC THANH TOÁN
              </span>
              <span className="text-[10px] font-mono text-[#333333]/60 uppercase">
                Tự động đối soát
              </span>
            </div>

            {/* RECOMMENDED METHOD CARD: QR Payment with Liquid Glass highlight */}
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-[#035542] tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#035542]" />
                <span>RECOMMENDED (KHUYÊN DÙNG)</span>
              </div>

              <div
                onClick={() => setActiveCategory('recommended')}
                className={`p-4 rounded-[20px] cursor-pointer transition-all ${activeCategory === 'recommended'
                    ? 'bg-gradient-to-r from-emerald-500/10 via-amber-200/20 to-teal-500/10 border-2 border-[#035542] shadow-md ring-2 ring-emerald-600/10'
                    : 'bg-white/60 hover:bg-white border border-black/5 hover:border-black/20'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[12px] bg-white border border-emerald-900/15 flex items-center justify-center shrink-0 shadow-xs">
                      <QrCode className="w-6 h-6 text-[#035542]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold uppercase text-[#035542]">
                          QR Payment (VietQR / VNPay)
                        </span>
                        <span className="text-[9px] font-mono font-bold bg-[#035542] text-white px-2 py-0.5 rounded-full uppercase">
                          Nhanh nhất
                        </span>
                      </div>
                      <p className="text-[11px] text-[#333333]/80 mt-0.5">
                        Quét tức thì bằng 40+ app ngân hàng hoặc ví điện tử
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${activeCategory === 'recommended'
                        ? 'border-[#035542] bg-[#035542] text-white shadow-xs'
                        : 'border-black/20'
                      }`}
                  >
                    {activeCategory === 'recommended' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            </div>

            {/* OTHER PAYMENT METHODS */}
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-[#333333]/60 tracking-wider mb-2">
                CÁC PHƯƠNG THỨC KHÁC
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Bank Transfer */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('other');
                    setSelectedOther('bank_transfer');
                  }}
                  className={`p-3.5 rounded-[20px] text-left cursor-pointer transition-all flex flex-col justify-between ${activeCategory === 'other' && selectedOther === 'bank_transfer'
                      ? 'liquid-glass border-[#035542] ring-2 ring-[#035542]/20 shadow-sm'
                      : 'bg-white/60 hover:bg-white border border-black/5 hover:border-black/15'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Building2 className="w-4 h-4 text-[#035542]" />
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeCategory === 'other' && selectedOther === 'bank_transfer'
                          ? 'border-[#035542] bg-[#035542]'
                          : 'border-black/20'
                        }`}
                    >
                      {activeCategory === 'other' && selectedOther === 'bank_transfer' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#333333] block">
                      CHUYỂN KHOẢN
                    </span>
                    <span className="text-[10px] text-[#333333]/60 font-mono">
                      Sao chép STK
                    </span>
                  </div>
                </button>

                {/* 2. E-Wallet */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('other');
                    setSelectedOther('ewallet');
                  }}
                  className={`p-3.5 rounded-[20px] text-left cursor-pointer transition-all flex flex-col justify-between ${activeCategory === 'other' && selectedOther === 'ewallet'
                      ? 'liquid-glass border-[#035542] ring-2 ring-[#035542]/20 shadow-sm'
                      : 'bg-white/60 hover:bg-white border border-black/5 hover:border-black/15'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Smartphone className="w-4 h-4 text-[#035542]" />
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeCategory === 'other' && selectedOther === 'ewallet'
                          ? 'border-[#035542] bg-[#035542]'
                          : 'border-black/20'
                        }`}
                    >
                      {activeCategory === 'other' && selectedOther === 'ewallet' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#333333] block">
                      VÍ ĐIỆN TỬ
                    </span>
                    <span className="text-[10px] text-[#333333]/60 font-mono">
                      MoMo • ZaloPay • VNPay
                    </span>
                  </div>
                </button>

                {/* 3. Card */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('other');
                    setSelectedOther('card');
                  }}
                  className={`p-3.5 rounded-[20px] text-left cursor-pointer transition-all flex flex-col justify-between ${activeCategory === 'other' && selectedOther === 'card'
                      ? 'liquid-glass border-[#035542] ring-2 ring-[#035542]/20 shadow-sm'
                      : 'bg-white/60 hover:bg-white border border-black/5 hover:border-black/15'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="w-4 h-4 text-[#035542]" />
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeCategory === 'other' && selectedOther === 'card'
                          ? 'border-[#035542] bg-[#035542]'
                          : 'border-black/20'
                        }`}
                    >
                      {activeCategory === 'other' && selectedOther === 'card' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#333333] block">
                      THẺ QUỐC TẾ
                    </span>
                    <span className="text-[10px] text-[#333333]/60 font-mono">
                      Visa • Master • JCB
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* DYNAMIC DETAIL DISPLAY ACCORDING TO SELECTION */}
            {/* A. QR CODE DETAILS (RECOMMENDED) */}
            {activeCategory === 'recommended' && (
              <div className="pt-3 border-t border-black/5 space-y-3.5 animate-in fade-in duration-200">
                {/* Status Bar & Countdown with frosted glass */}
                <div className="p-3 sm:p-3.5 rounded-[14px] liquid-glass border border-emerald-900/10 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      {qrStatus === 'WAITING' && (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#035542] opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#035542]" />
                        </>
                      )}
                      {qrStatus === 'EXPIRED' && (
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c93b2b]" />
                      )}
                      {qrStatus === 'CHECKING' && (
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2b7bb9]" />
                      )}
                      {qrStatus === 'SUCCESS' && (
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#035542]" />
                      )}
                    </span>
                    <span className="text-xs font-bold uppercase text-[#333333]">
                      {qrStatus === 'WAITING' && 'ĐANG CHỜ THANH TOÁN...'}
                      {qrStatus === 'CHECKING' && 'ĐANG XÁC THỰC GIAO DỊCH...'}
                      {qrStatus === 'EXPIRED' && 'MÃ QR ĐÃ HẾT HẠN'}
                      {qrStatus === 'SUCCESS' && 'ĐÃ THANH TOÁN THÀNH CÔNG!'}
                    </span>
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <Clock className="w-3.5 h-3.5 text-[#035542]" />
                    <span className="text-[#333333]/70">HẾT HẠN:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${timeLeft <= 60
                          ? 'bg-[#c93b2b] text-white animate-pulse'
                          : 'bg-white border border-emerald-900/10 text-[#035542]'
                        }`}
                    >
                      {formatTime(timeLeft)}
                    </span>
                    {qrStatus === 'EXPIRED' && (
                      <button
                        type="button"
                        onClick={handleRenewQR}
                        className="px-2.5 py-0.5 rounded-full bg-[#035542] text-white text-[10px] font-bold uppercase hover:bg-[#035542]/90 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        TẠO LẠI
                      </button>
                    )}
                  </div>
                </div>

                {/* QR Display Card with Liquid Glass finish */}
                <div className="p-4 sm:p-5 rounded-[16px] liquid-glass border border-white/90 bg-white/70 flex flex-col sm:flex-row items-center gap-5 shadow-xs">
                  {/* Clean Crisp VietQR Mock Asset */}
                  <div className="relative shrink-0 flex flex-col items-center">
                    <div className="w-40 h-40 bg-white p-2.5 border border-black/10 rounded-[14px] flex flex-col items-center justify-between shadow-sm">
                      {/* VietQR Header */}
                      <div className="w-full flex items-center justify-between px-1 border-b border-black/5 pb-1">
                        <span className="font-bold text-[9px] font-mono text-[#035542]">DEMO QR</span>
                        <span className="font-semibold text-[8px] font-mono text-[#2b7bb9]">MOCK PAYMENT</span>
                      </div>

                      {/* Crisp Dynamic QR SVG Visual */}
                      <div className="relative my-1">
                        <svg className="w-24 h-24 text-[#333333]" viewBox="0 0 100 100" fill="currentColor">
                          <rect x="5" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" rx="4" />
                          <rect x="13" y="13" width="12" height="12" fill="currentColor" rx="2" />
                          <rect x="67" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" rx="4" />
                          <rect x="75" y="13" width="12" height="12" fill="currentColor" rx="2" />
                          <rect x="5" y="67" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" rx="4" />
                          <rect x="13" y="75" width="12" height="12" fill="currentColor" rx="2" />

                          <rect x="38" y="10" width="7" height="7" rx="1" />
                          <rect x="50" y="15" width="8" height="8" rx="1" />
                          <rect x="42" y="27" width="6" height="6" rx="1" />
                          <rect x="54" y="32" width="7" height="7" rx="1" />
                          <rect x="10" y="42" width="8" height="7" rx="1" />
                          <rect x="24" y="40" width="7" height="7" rx="1" />
                          <rect x="42" y="45" width="16" height="16" fill="#035542" rx="3" />
                          <rect x="67" y="40" width="8" height="8" rx="1" />
                          <rect x="80" y="44" width="7" height="7" rx="1" />
                          <rect x="38" y="65" width="7" height="7" rx="1" />
                          <rect x="50" y="70" width="8" height="8" rx="1" />
                          <rect x="65" y="65" width="8" height="8" rx="1" />
                          <rect x="80" y="72" width="9" height="9" rx="1" />
                          <rect x="70" y="84" width="7" height="7" rx="1" />
                          <rect x="45" y="85" width="8" height="8" rx="1" />
                        </svg>

                        {/* Center Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white border border-[#035542]/30 rounded-full flex items-center justify-center shadow-xs">
                            <span className="text-[9px] font-bold font-mono text-[#035542]">BL</span>
                          </div>
                        </div>

                        {/* Expired Overlay if timed out */}
                        {qrStatus === 'EXPIRED' && (
                          <div className="absolute inset-0 bg-white/90 backdrop-blur-[16px] flex flex-col items-center justify-center text-center p-1 rounded-[20px]">
                            <AlertTriangle className="w-6 h-6 text-[#c93b2b] mb-1" />
                            <span className="text-[9px] font-bold text-[#c93b2b] uppercase">HẾT HẠN</span>
                          </div>
                        )}
                      </div>

                      {/* Footer reference */}
                      <span className="text-[8px] font-mono text-[#333333]/70 uppercase">
                        {orderReference}
                      </span>
                    </div>

                    {/* QR Action Buttons for Mobile */}
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(orderReference, 'qr_saved')}
                        className="px-2.5 py-1 rounded-full liquid-glass border border-black/10 text-[10px] font-mono font-bold text-[#333333] hover:bg-white flex items-center gap-1 cursor-pointer shadow-xs"
                        title="Tải mã QR"
                      >
                        {copiedKey === 'qr_saved' ? (
                          <>
                            <Check className="w-3 h-3 text-[#035542]" />
                            <span>ĐÃ LƯU</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            <span>TẢI QR</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleRenewQR}
                        className="px-2.5 py-1 rounded-full liquid-glass border border-black/10 text-[10px] font-mono font-bold text-[#333333] hover:bg-white flex items-center gap-1 cursor-pointer shadow-xs"
                        title="Đổi mã mới"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>LÀM MỚI</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Information Text & Copy Helpers */}
                  <div className="text-xs text-[#333333] space-y-2.5 flex-1 w-full">
                    <div className="p-3 rounded-[12px] bg-gradient-to-r from-amber-100/50 to-teal-50/50 border border-white/80 flex items-center justify-between shadow-xs">
                      <span className="text-xs font-semibold text-[#333333]/80">Số tiền thanh toán:</span>
                      <span className="font-mono text-base font-black text-[#035542]">
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px] bg-white/60 p-2.5 rounded-[12px] border border-black/5">
                      <div className="flex items-center justify-between py-1 border-b border-black/5">
                        <span className="text-[#333333]/60 uppercase">Ngân hàng:</span>
                        <span className="font-bold text-[#333333]">MB Bank</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-black/5">
                        <span className="text-[#333333]/60 uppercase">Chủ tài khoản:</span>
                        <span className="font-bold text-[#333333]">BREWLITE COFFEE JSC</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-[#333333]/60 uppercase">Nội dung CK:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#035542]">{bankInfo.content}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(bankInfo.content, 'qr_content')}
                            className="p-1 rounded-full text-[#035542] hover:bg-[#035542]/10 cursor-pointer"
                            title="Sao chép nội dung"
                          >
                            {copiedKey === 'qr_content' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Bank Assistant Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleCopy(bankInfo.accountNumber, 'open_bank');
                        }}
                        className="w-full py-2.5 px-3 rounded-full liquid-glass border border-emerald-900/15 text-[#035542] hover:bg-white text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>{copiedKey === 'open_bank' ? 'ĐÃ SAO CHÉP STK - HÃY MỞ APP' : 'MỞ APP NGÂN HÀNG TRÊN MÁY NÀY'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* B. BANK TRANSFER DETAILS (With 1-Click COPY for each row) */}
            {activeCategory === 'other' && selectedOther === 'bank_transfer' && (
              <div className="pt-3 border-t border-black/5 space-y-3 animate-in fade-in duration-200">
                <div className="p-3 rounded-[12px] bg-gradient-to-r from-amber-100/50 to-emerald-50/50 border border-white/80 text-xs text-[#035542] font-semibold flex items-center gap-2 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#035542]" />
                  <span>
                    Chuyển khoản chính xác theo thông tin bên dưới (hệ thống duyệt tự động 24/7)
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Bank Name */}
                  <div className="p-3 rounded-[12px] bg-white/70 border border-black/5 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] text-[#333333]/60 uppercase font-semibold block">
                        TÊN NGÂN HÀNG
                      </span>
                      <span className="text-xs font-bold text-[#333333]">
                        {bankInfo.bankName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankInfo.bankShort, 'bank_name')}
                      className="px-3 py-1 rounded-full liquid-glass border border-black/10 text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    >
                      {copiedKey === 'bank_name' ? (
                        <>
                          <Check className="w-3 h-3 text-[#035542]" />
                          <span className="text-[#035542]">ĐÃ CHÉP</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Account Number */}
                  <div className="p-3 rounded-[12px] bg-gradient-to-r from-amber-100/40 to-teal-50/40 border border-emerald-900/15 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] text-[#035542] uppercase font-bold block">
                        SỐ TÀI KHOẢN (STK)
                      </span>
                      <span className="text-sm font-mono font-bold text-[#035542]">
                        {bankInfo.accountNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankInfo.accountNumber, 'acc_num')}
                      className="px-3.5 py-1.5 rounded-full liquid-glass-emerald text-white text-[11px] font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-xs hover:brightness-105 transition-all"
                    >
                      {copiedKey === 'acc_num' ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>ĐÃ CHÉP</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY STK</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Account Holder */}
                  <div className="p-3 rounded-[12px] bg-white/70 border border-black/5 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] text-[#333333]/60 uppercase font-semibold block">
                        TÊN NGƯỜI NHẬN
                      </span>
                      <span className="text-xs font-bold text-[#333333]">
                        {bankInfo.accountHolder}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankInfo.accountHolder, 'holder')}
                      className="px-3 py-1 rounded-full liquid-glass border border-black/10 text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    >
                      {copiedKey === 'holder' ? (
                        <>
                          <Check className="w-3 h-3 text-[#035542]" />
                          <span className="text-[#035542]">ĐÃ CHÉP</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Transfer Amount */}
                  <div className="p-3 rounded-[12px] bg-white/70 border border-black/5 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] text-[#333333]/60 uppercase font-semibold block">
                        SỐ TIỀN CHUYỂN
                      </span>
                      <span className="text-sm font-mono font-bold text-[#035542]">
                        {formatCurrency(bankInfo.amount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankInfo.amount.toString(), 'amount')}
                      className="px-3 py-1 rounded-full liquid-glass border border-black/10 text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    >
                      {copiedKey === 'amount' ? (
                        <>
                          <Check className="w-3 h-3 text-[#035542]" />
                          <span className="text-[#035542]">ĐÃ CHÉP</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY TIỀN</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Transfer Content */}
                  <div className="p-3 rounded-[12px] bg-gradient-to-r from-amber-100/40 to-teal-50/40 border border-emerald-900/15 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] text-[#035542] uppercase font-bold block">
                        NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC)
                      </span>
                      <span className="text-xs font-mono font-bold text-[#035542]">
                        {bankInfo.content}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankInfo.content, 'content')}
                      className="px-3.5 py-1.5 rounded-full liquid-glass-emerald text-white text-[11px] font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-xs hover:brightness-105 transition-all"
                    >
                      {copiedKey === 'content' ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>ĐÃ CHÉP</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY ND</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* C. E-WALLET DETAILS (MOMO, ZALOPAY, VNPAY) */}
            {activeCategory === 'other' && selectedOther === 'ewallet' && (
              <div className="pt-3 border-t border-black/5 space-y-3 animate-in fade-in duration-200">
                <span className="text-[11px] text-[#333333]/80 uppercase font-bold block">
                  Chọn ví điện tử bạn đang dùng:
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* MoMo */}
                  <button
                    type="button"
                    onClick={() => setSelectedWallet('momo')}
                    className={`p-3 rounded-[20px] text-center cursor-pointer transition-all ${selectedWallet === 'momo'
                        ? 'bg-[#a50064]/10 border-2 border-[#a50064] shadow-sm'
                        : 'bg-white/60 hover:bg-white border border-black/5'
                      }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#a50064] text-white font-mono font-black text-xs flex items-center justify-center mx-auto mb-1.5 shadow-xs">
                      M
                    </div>
                    <span className="text-xs font-bold text-[#333333] block">MoMo</span>
                    <span className="text-[9px] text-[#a50064] font-mono font-bold">1-Chạm</span>
                  </button>

                  {/* ZaloPay */}
                  <button
                    type="button"
                    onClick={() => setSelectedWallet('zalopay')}
                    className={`p-3 rounded-[20px] text-center cursor-pointer transition-all ${selectedWallet === 'zalopay'
                        ? 'bg-[#0068ff]/10 border-2 border-[#0068ff] shadow-sm'
                        : 'bg-white/60 hover:bg-white border border-black/5'
                      }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0068ff] text-white font-mono font-black text-xs flex items-center justify-center mx-auto mb-1.5 shadow-xs">
                      Z
                    </div>
                    <span className="text-xs font-bold text-[#333333] block">ZaloPay</span>
                    <span className="text-[9px] text-[#0068ff] font-mono font-bold">Liên kết</span>
                  </button>

                  {/* VNPay */}
                  <button
                    type="button"
                    onClick={() => setSelectedWallet('vnpay')}
                    className={`p-3 rounded-[20px] text-center cursor-pointer transition-all ${selectedWallet === 'vnpay'
                        ? 'bg-[#004a98]/10 border-2 border-[#004a98] shadow-sm'
                        : 'bg-white/60 hover:bg-white border border-black/5'
                      }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#004a98] text-white font-mono font-black text-xs flex items-center justify-center mx-auto mb-1.5 shadow-xs">
                      V
                    </div>
                    <span className="text-xs font-bold text-[#333333] block">VNPay</span>
                    <span className="text-[9px] text-[#004a98] font-mono font-bold">QR Pay</span>
                  </button>
                </div>

                {/* E-wallet Action Card */}
                <div className="p-4 rounded-[20px] liquid-glass border border-white/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="text-xs text-[#333333] space-y-0.5 text-center sm:text-left">
                    <span className="font-bold uppercase block text-[#035542]">
                      Kết nối ví {selectedWallet.toUpperCase()}
                    </span>
                    <p className="text-[11px] text-[#333333]/70">
                      Hệ thống tự động mở app hoặc quét mã thanh toán an toàn
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full liquid-glass-emerald text-white hover:brightness-105 text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>MỞ APP {selectedWallet.toUpperCase()}</span>
                  </button>
                </div>
              </div>
            )}

            {/* D. CARD DETAILS (VISA, MASTER, JCB) */}
            {activeCategory === 'other' && selectedOther === 'card' && (
              <div className="pt-3 border-t border-black/5 space-y-3 animate-in fade-in duration-200">
                {/* Supported Card Badges */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#333333]/80 uppercase">Hỗ trợ:</span>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                    <span className="px-2.5 py-0.5 rounded-full liquid-glass border border-[#00579f]/30 text-[#00579f]">
                      VISA
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full liquid-glass border border-[#eb001b]/30 text-[#eb001b]">
                      MASTERCARD
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full liquid-glass border border-[#007940]/30 text-[#007940]">
                      JCB
                    </span>
                  </div>
                </div>

                {/* Secure Gateway Guarantee */}
                <div className="p-4 rounded-[20px] liquid-glass border border-emerald-900/10 space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#035542] uppercase">
                    <Lock className="w-4 h-4 text-[#035542]" />
                    <span>Cổng thanh toán quốc tế bảo mật PCI-DSS Level 1</span>
                  </div>
                  <p className="text-[11px] text-[#333333]/80 leading-relaxed">
                    Bạn không cần nhập thông tin thẻ nhạy cảm trên trang này. Khi xác nhận, hệ thống sẽ mở phiên giao dịch mã hóa 3D-Secure an toàn tuyệt đối.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Desktop 5 cols): Clean Sticky Summary & Payment CTA */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <div className="liquid-glass rounded-[20px] p-5 sm:p-6 border border-white/80 shadow-md space-y-4">
            {/* Header with item count & collapse trigger on mobile */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#035542] uppercase tracking-wider">
                TÓM TẮT ĐƠN HÀNG ({totalItemCount} MÓN)
              </span>
              <button
                type="button"
                onClick={() => setIsItemsExpanded((prev) => !prev)}
                className="text-xs text-[#035542] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer bg-emerald-900/5 px-2.5 py-0.5 rounded-full"
              >
                <span>{isItemsExpanded ? 'Thu gọn' : 'Xem món'}</span>
                {isItemsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Collapsible Items List */}
            {isItemsExpanded && (
              <div className="divide-y divide-black/5 max-h-48 overflow-y-auto pr-1 animate-in fade-in duration-150">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <span className="font-semibold text-[#333333] block truncate">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="text-[#333333]/60 block text-[10px] font-mono">
                        Size {item.size.name} {item.toppings.length > 0 ? `• ${item.toppings.length} topping` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditCartItem(item)}
                        className="text-[10px] text-[#035542] hover:underline font-semibold bg-emerald-900/5 hover:bg-emerald-900/10 px-2 py-0.5 rounded-full cursor-pointer"
                        title="Chỉnh sửa món này"
                      >
                        Sửa
                      </button>
                      <span className="font-bold font-mono text-[#035542]">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VOUCHER & LOYALTY POINTS REDEMPTION */}
            <div className="pt-2 border-t border-black/5 space-y-2.5">
              <span className="text-[11px] font-bold text-[#035542] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#035542]" />
                <span>ƯU ĐÃI & ĐIỂM REWARDS</span>
              </span>

              {/* Quick voucher buttons */}
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VOUCHERS.slice(0, 3).map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => {
                      const res = applyVoucher(v.code);
                      setVoucherMsg({ text: res.message, isError: !res.success });
                    }}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold cursor-pointer transition-colors border ${voucherCode === v.code
                        ? 'bg-[#035542] text-white border-[#035542]'
                        : 'bg-white text-[#035542] border-emerald-900/20 hover:bg-emerald-50'
                      }`}
                  >
                    {v.code} (-{formatCurrency(v.discountAmount)})
                  </button>
                ))}
              </div>

              {/* Voucher Input */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  placeholder="Nhập mã ưu đãi khác"
                  className="w-full px-3 py-1.5 rounded-[10px] bg-white border border-black/10 text-xs font-mono uppercase focus:border-[#035542] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (voucherInput.trim()) {
                      const res = applyVoucher(voucherInput.trim());
                      setVoucherMsg({ text: res.message, isError: !res.success });
                    }
                  }}
                  className="px-3 py-1.5 rounded-[10px] bg-[#035542] text-white text-xs font-bold uppercase cursor-pointer hover:bg-[#035542]/90 shrink-0"
                >
                  Áp dụng
                </button>
              </div>

              {voucherMsg && (
                <p className={`text-[11px] font-semibold flex items-center gap-1 ${voucherMsg.isError ? 'text-red-600' : 'text-[#035542]'}`}>
                  {voucherMsg.isError ? <AlertTriangle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                  <span>{voucherMsg.text}</span>
                </p>
              )}

              {/* Chế độ NestJS: server chưa hỗ trợ đổi điểm ngay khi đặt; chỉ hiển thị trong mock. */}
              {/* Loyalty Point Redemption Option */}
              {user && USE_MOCK_API && (user.loyaltyPoints || 0) >= 30 && (
                <div className="p-2.5 rounded-[12px] bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-900 block flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Điểm tích lũy: {user.loyaltyPoints} điểm
                    </span>
                    <span className="text-[10px] text-amber-800/80">
                      Đổi 30 điểm để giảm 15.000đ trực tiếp
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (pointsDiscount > 0) {
                        setPointsDiscount(0);
                        setUsePoints(false);
                      } else {
                        setPointsDiscount(15000);
                        setUsePoints(true);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer border ${pointsDiscount > 0
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                      }`}
                  >
                    {pointsDiscount > 0 ? 'Đang dùng' : 'Dùng 30đ'}
                  </button>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 pt-2 border-t border-black/5 text-xs text-[#333333]">
              <div className="flex justify-between items-center">
                <span className="text-[#333333]/70">Tạm tính ({totalItemCount} món)</span>
                <span className="font-mono font-semibold">{formatCurrency(cartSubtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-center text-[#035542]">
                  <span>Ưu đãi voucher ({voucherCode})</span>
                  <span className="font-mono font-semibold">- {formatCurrency(discount)}</span>
                </div>
              )}

              {pointsDiscount > 0 && (
                <div className="flex justify-between items-center text-amber-700">
                  <span>Trừ điểm BrewLite Rewards (30đ)</span>
                  <span className="font-mono font-semibold">- {formatCurrency(pointsDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#333333]/70">
                <span>Phí phục vụ quầy Barista</span>
                <span className="font-mono font-semibold text-emerald-700">0 Đ (Miễn phí)</span>
              </div>

              <div className="pt-2 border-t border-black/10 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold block text-[#333333]">TỔNG THANH TOÁN</span>
                  <span className="text-[10px] font-mono text-[#035542] flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    +{Math.max(1, Math.round(cartTotal / 10000))} điểm tích lũy
                  </span>
                </div>
                <span className="text-2xl font-black font-mono text-[#035542] tracking-tight">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
            </div>


            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessing || qrStatus === 'EXPIRED'}
              className="touch-target w-full h-12 rounded-full liquid-glass-emerald text-white hover:brightness-105 active:scale-[0.98] font-bold text-xs sm:text-sm uppercase flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang kiểm tra thanh toán...</span>
                </>
              ) : activeCategory === 'recommended' ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>TÔI ĐÃ CHUYỂN KHOẢN XONG</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>XÁC NHẬN THANH TOÁN {formatCurrency(cartTotal)}</span>
                </>
              )}
            </button>

            {/* Security Note Footer */}
            <div className="text-center pt-1">
              <p className="text-[10px] text-[#333333]/60 font-mono">
                Giao dịch mã hóa SSL 256-bit • Bảo mật an toàn
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
