import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getStatusBadgeConfig } from '../utils';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Home,
  FileText,
  Play,
  Sparkles,
  QrCode,
  Phone,
  User,
  Coffee,
  Check,
} from 'lucide-react';
import { FeaturedSeal } from './HartzlerBrand';

export const OrderConfirmationPage: React.FC = () => {
  const {
    lastCreatedOrder,
    setCurrentScreen,
    orders,
    advanceOrderStatus,
  } = useApp();

  const order = lastCreatedOrder || orders[0];

  // Automatic realistic barista progression
  React.useEffect(() => {
    if (!order) return;
    if (order.status === 'PAID') {
      const timer = setTimeout(() => {
        advanceOrderStatus(order.id);
      }, 5000);
      return () => clearTimeout(timer);
    } else if (order.status === 'PREPARING') {
      const timer = setTimeout(() => {
        advanceOrderStatus(order.id);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [order?.id, order?.status, advanceOrderStatus]);

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-12 text-center liquid-glass rounded-[24px] p-6 border border-white/80 shadow-md">
        <p className="text-[#333333] text-sm uppercase mb-4">Chưa có thông tin đơn hàng mới.</p>
        <button
          onClick={() => setCurrentScreen('menu')}
          className="px-6 py-2.5 rounded-full liquid-glass-emerald text-white text-xs font-bold uppercase shadow-sm cursor-pointer"
        >
          QUAY LẠI THỰC ĐƠN
        </button>
      </div>
    );
  }

  const badgeConfig = getStatusBadgeConfig(order.status);
  const earnedPoints = order.pointsEarned ?? Math.max(1, Math.round(order.total / 10000));

  return (
    <div className="max-w-xl mx-auto pb-24 font-sans">
      {/* Main Confirmation Card with Liquid Glass finish */}
      <div className="liquid-glass rounded-[24px] border border-white/90 shadow-xl overflow-hidden bg-white/80">
        {/* Header Banner */}
        <div className="pt-8 pb-6 px-6 text-center border-b border-black/5 relative bg-gradient-to-b from-emerald-500/10 via-amber-200/15 to-transparent">
          <div className="flex justify-center mb-3">
            <FeaturedSeal size={84} label="PAID" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white/80 text-[#035542] border border-emerald-900/15 shadow-xs mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#035542]" />
            <span>ĐÃ THANH TOÁN • NHẬN TẠI QUẦY</span>
          </div>

          {/* Large Pickup Code Display */}
          <div className="my-2 p-3 rounded-[18px] bg-white border border-emerald-900/15 shadow-sm max-w-sm mx-auto">
            <span className="text-[11px] font-bold text-[#035542] uppercase tracking-wider block">
              MÃ NHẬN NƯỚC TẠI QUẦY BARISTA
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-[#035542] tracking-tight my-1">
              {order.pickupCode || order.orderNumber}
            </div>
            <span className="text-[10px] text-[#333333]/70 font-mono">
              Đơn hàng: {order.orderNumber}
            </span>
          </div>

          {/* Points Earned Callout */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>+{earnedPoints} điểm BrewLite Rewards đã cộng vào tài khoản!</span>
          </div>

          {/* Status Badge */}
          <div className="mt-2.5 flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold liquid-glass border border-emerald-900/20 text-[#035542] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#035542] animate-ping" />
              <span>TRẠNG THÁI: {badgeConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Counter QR Ticket (Đối soát nhận nước tại quầy) */}
        <div className="p-4 sm:p-5 border-b border-black/5 bg-[#FAF9F5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold text-[#035542] uppercase tracking-wide block mb-0.5">
              Mã QR đối soát nhận đồ uống
            </span>
            <p className="text-[11px] text-[#333333]/70">
              Xuất trình mã này cho Barista khi bảng thông báo gọi mã <strong>{order.pickupCode || order.orderNumber}</strong>.
            </p>
          </div>

          <div className="shrink-0 p-2 bg-white rounded-[14px] border border-black/10 shadow-xs flex flex-col items-center">
            <svg className="w-18 h-18 text-[#035542]" viewBox="0 0 100 100" fill="currentColor">
              <rect x="5" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" rx="4" />
              <rect x="13" y="13" width="12" height="12" fill="currentColor" rx="2" />
              <rect x="67" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" rx="4" />
              <rect x="75" y="13" width="12" height="12" fill="currentColor" rx="2" />
              <rect x="5" y="67" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" rx="4" />
              <rect x="13" y="75" width="12" height="12" fill="currentColor" rx="2" />
              <rect x="42" y="15" width="8" height="8" rx="1" />
              <rect x="54" y="25" width="7" height="7" rx="1" />
              <rect x="42" y="42" width="16" height="16" rx="3" fill="#035542" />
              <rect x="68" y="45" width="7" height="7" rx="1" />
              <rect x="25" y="45" width="8" height="8" rx="1" />
              <rect x="45" y="70" width="8" height="8" rx="1" />
              <rect x="65" y="70" width="10" height="10" rx="1" />
            </svg>
            <span className="text-[9px] font-mono font-bold text-[#035542] mt-0.5">
              {order.pickupCode || 'BL-PICKUP'}
            </span>
          </div>
        </div>

        {/* Live Barista Preparation Stepper */}
        <div className="p-5 sm:p-6 border-b border-black/5 space-y-3.5 bg-white/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#035542] uppercase tracking-wider font-mono">
              TIẾN TRÌNH QUẦY BARISTA
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#145C4B]/10 text-[#145C4B] text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-[#145C4B] animate-pulse" />
              <span>
                {order.status === 'PAID' && 'Đã tiếp nhận đơn'}
                {order.status === 'PREPARING' && 'Đang pha chế món'}
                {order.status === 'READY' && 'Đã sẵn sàng tại quầy'}
                {order.status === 'COMPLETED' && 'Đã nhận đồ uống'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { id: 'PAID', label: '1. Nhận đơn', active: true },
              {
                id: 'PREPARING',
                label: '2. Pha chế',
                active: ['PREPARING', 'READY', 'COMPLETED'].includes(order.status),
              },
              {
                id: 'READY',
                label: '3. Mời lấy',
                active: ['READY', 'COMPLETED'].includes(order.status),
              },
              {
                id: 'COMPLETED',
                label: '4. Đã nhận',
                active: order.status === 'COMPLETED',
              },
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 transition-all shadow-xs ${
                    step.active
                      ? 'bg-[#035542] text-white ring-2 ring-emerald-500/20'
                      : 'bg-white text-[#333333]/50 border border-black/10'
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-[11px] font-semibold leading-tight ${
                    step.active ? 'text-[#035542]' : 'text-[#333333]/50'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pickup & Order Information */}
        <div className="p-5 sm:p-6 space-y-3 text-xs text-[#333333]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-[#333333]/70">
              <MapPin className="w-3.5 h-3.5 text-[#035542]" /> Chi nhánh nhận nước:
            </span>
            <span className="font-bold text-[#035542] text-right">
              {order.pickupBranch || 'Chi nhánh Bến Nghé (Quầy Bar A)'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-[#333333]/70">
              <Clock className="w-3.5 h-3.5 text-[#035542]" /> Thời gian nhận dự kiến:
            </span>
            <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {order.scheduledTime || 'Lấy ngay (khoảng 5 - 10 phút)'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-[#333333]/70">
              <User className="w-3.5 h-3.5 text-[#035542]" /> Người nhận:
            </span>
            <span className="font-semibold">
              {order.customerName} • {order.customerPhone}
            </span>
          </div>

          {order.pickupNote && (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#333333]/70">Ghi chú quầy:</span>
              <span className="italic text-[#333333]/90">{order.pickupNote}</span>
            </div>
          )}

          {/* Details breakdown */}
          <div className="pt-3 border-t border-black/5">
            <span className="block mb-2 text-xs text-[#035542] font-bold uppercase">
              Danh sách món ({order.items.length} món)
            </span>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-[10px] bg-white/70 border border-black/5">
                  <div>
                    <span className="font-bold text-[#333333]">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="text-[#333333]/60 block text-[11px] font-mono">
                      Size {item.size.name} • {item.iceLevel} Đá / {item.sugarLevel} Đường
                      {item.toppings.length > 0 ? ` • ${item.toppings.map((t) => t.name).join(', ')}` : ''}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#035542]">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-black/10 flex justify-between items-baseline text-sm">
            <div>
              <span className="font-bold text-[#333333] block">TỔNG ĐÃ THANH TOÁN</span>
              <span className="text-[10px] text-[#333333]/60 font-mono">
                {order.paymentMethod === 'vietqr' ? 'VietQR Napas' : order.paymentMethod.toUpperCase()}
              </span>
            </div>
            <span className="text-xl font-black font-mono text-[#035542]">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-6 bg-white/80 backdrop-blur-md border-t border-black/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setCurrentScreen('menu')}
            className="touch-target h-12 px-5 rounded-full liquid-glass border border-emerald-900/20 text-[#035542] hover:bg-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>VỀ THỰC ĐƠN</span>
          </button>

          <button
            onClick={() => setCurrentScreen('orders')}
            className="touch-target h-12 px-5 rounded-full liquid-glass-emerald text-white hover:brightness-105 font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span>THEO DÕI ĐƠN HÀNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
