import React from 'react';
import { useApp } from '../context/AppContext';
import { useChiTietDonHang } from '../hooks/dung-don-hang';
import { USE_MOCK_API } from '../services/http';
import { formatCurrency, formatDateTime, getStatusBadgeConfig } from '../utils';
import type { Order } from '../types';
import {
  Clock,
  MapPin,
  Home,
  FileText,
  Sparkles,
  User,
  XCircle,
  RotateCcw,
  Loader2,
  LogIn,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { FeaturedSeal } from './HartzlerBrand';

/** Các trạng thái "đã thanh toán thành công". */
const PAID_FLOW = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-xl mx-auto pb-24 font-sans">{children}</div>
);

const Notice: React.FC<{
  icon: React.ReactNode;
  title: string;
  text?: string;
  actions: { label: string; onClick: () => void; primary?: boolean }[];
}> = ({ icon, title, text, actions }) => (
  <div className="max-w-md mx-auto py-12 text-center liquid-glass rounded-[24px] p-6 border border-white/80 shadow-md">
    <div className="w-14 h-14 rounded-full bg-[#145C4B]/10 text-[#145C4B] flex items-center justify-center mx-auto mb-3">{icon}</div>
    <p className="text-[#333333] text-sm font-bold uppercase mb-1">{title}</p>
    {text && <p className="text-xs text-[#333333]/70 mb-4">{text}</p>}
    <div className="flex items-center justify-center gap-3 mt-4">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={a.onClick}
          className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase cursor-pointer ${
            a.primary ? 'liquid-glass-emerald text-white shadow-sm' : 'border border-black/10 text-[#252525] hover:bg-stone-50'
          }`}
        >
          {a.label}
        </button>
      ))}
    </div>
  </div>
);

export const OrderConfirmationPage: React.FC = () => {
  const { viewedOrderId, lastCreatedOrder, user, openAuthModal, setCurrentScreen, advanceOrderStatus } = useApp();

  // Đơn đang xem: lấy từ URL /orders/:id; nếu vào màn này sau khi thanh toán thì là đơn vừa tạo.
  const orderId = viewedOrderId ?? lastCreatedOrder?.id ?? null;
  const { order, isLoading, isError, refetch, retryPayment, isRetrying } = useChiTietDonHang(orderId);
  const [retryMessage, setRetryMessage] = React.useState<string | null>(null);

  // Chế độ demo (không có backend): tự mô phỏng quầy pha chế. Với backend thật, nhân viên đổi trạng thái
  // và trang này tự cập nhật bằng polling nên khách không được tự đổi.
  React.useEffect(() => {
    if (!USE_MOCK_API || !order) return;
    const delay = order.status === 'PAID' ? 5000 : order.status === 'PREPARING' ? 8000 : 0;
    if (!delay) return;
    const timer = setTimeout(() => advanceOrderStatus(order.id), delay);
    return () => clearTimeout(timer);
  }, [order?.id, order?.status, advanceOrderStatus]);

  if (!user) {
    return (
      <Notice
        icon={<LogIn className="w-7 h-7" />}
        title="Đăng nhập để xem đơn hàng"
        text="Đơn hàng gắn với tài khoản của bạn nên cần đăng nhập để xem."
        actions={[
          { label: 'Về thực đơn', onClick: () => setCurrentScreen('menu') },
          { label: 'Đăng nhập', onClick: () => openAuthModal('login'), primary: true },
        ]}
      />
    );
  }

  if (!orderId) {
    return (
      <Notice
        icon={<ShoppingBag className="w-7 h-7" />}
        title="Chưa có thông tin đơn hàng"
        actions={[
          { label: 'Quay lại thực đơn', onClick: () => setCurrentScreen('menu') },
          { label: 'Lịch sử đơn', onClick: () => setCurrentScreen('orders'), primary: true },
        ]}
      />
    );
  }

  if (!order && isLoading) {
    return (
      <div className="py-16 flex flex-col items-center gap-2 text-[#035542]" role="status">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-xs font-bold uppercase">Đang tải đơn hàng...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <Notice
        icon={<AlertCircle className="w-7 h-7" />}
        title="Không tìm thấy đơn hàng"
        text={isError ? 'Không tải được đơn. Kiểm tra kết nối rồi thử lại.' : 'Đơn không tồn tại hoặc không thuộc tài khoản của bạn.'}
        actions={[
          { label: 'Lịch sử đơn', onClick: () => setCurrentScreen('orders') },
          { label: 'Thử lại', onClick: () => void refetch(), primary: true },
        ]}
      />
    );
  }

  const handleRetry = async () => {
    setRetryMessage(null);
    try {
      const updated = await retryPayment(order);
      if (updated.status !== 'PAID') setRetryMessage('Thanh toán lại chưa thành công, vui lòng thử lại.');
    } catch (e: any) {
      setRetryMessage(e?.message || 'Không thể thanh toán lại lúc này.');
    }
  };

  return (
    <Shell>
      {PAID_FLOW.includes(order.status) ? (
        <SuccessView order={order} onMenu={() => setCurrentScreen('menu')} onHistory={() => setCurrentScreen('orders')} />
      ) : order.status === 'PAYMENT_FAILED' ? (
        <FailedView
          order={order}
          isRetrying={isRetrying}
          retryMessage={retryMessage}
          onRetry={handleRetry}
          onCheckout={() => setCurrentScreen('checkout')}
          onHistory={() => setCurrentScreen('orders')}
        />
      ) : (
        <OtherView order={order} onMenu={() => setCurrentScreen('menu')} onHistory={() => setCurrentScreen('orders')} />
      )}
    </Shell>
  );
};

/* ---------- Khối thông tin dùng chung: mã đơn, tổng tiền, trạng thái ---------- */

const OrderSummary: React.FC<{ order: Order; tone: 'ok' | 'fail' | 'neutral' }> = ({ order, tone }) => {
  const badge = getStatusBadgeConfig(order.status);
  const color = tone === 'fail' ? 'text-[#c93b2b]' : 'text-[#035542]';
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
      <div className="p-3 rounded-[14px] bg-white border border-black/5 shadow-xs">
        <dt className="text-[10px] font-bold uppercase tracking-wider text-[#333333]/60">Mã đơn</dt>
        <dd data-testid="order-code" className={`font-mono font-black text-base ${color}`}>{order.orderNumber}</dd>
      </div>
      <div className="p-3 rounded-[14px] bg-white border border-black/5 shadow-xs">
        <dt className="text-[10px] font-bold uppercase tracking-wider text-[#333333]/60">Tổng tiền</dt>
        <dd data-testid="order-total" className={`font-mono font-black text-base ${color}`}>{formatCurrency(order.total)}</dd>
      </div>
      <div className="p-3 rounded-[14px] bg-white border border-black/5 shadow-xs">
        <dt className="text-[10px] font-bold uppercase tracking-wider text-[#333333]/60">Trạng thái</dt>
        <dd className="flex flex-col gap-0.5">
          <span data-testid="order-status" className={`font-mono font-black text-base ${color}`}>{order.status}</span>
          <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}>{badge.label}</span>
        </dd>
      </div>
    </dl>
  );
};

const ItemsAndTotal: React.FC<{ order: Order; totalLabel: string }> = ({ order, totalLabel }) => (
  <div className="p-5 sm:p-6 space-y-3 text-xs text-[#333333]">
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 font-semibold text-[#333333]/70">
        <Clock className="w-3.5 h-3.5 text-[#035542]" /> Thời gian đặt:
      </span>
      <span className="font-semibold">{formatDateTime(order.createdAt)}</span>
    </div>

    <div className="pt-3 border-t border-black/5">
      <span className="block mb-2 text-xs text-[#035542] font-bold uppercase">Danh sách món ({order.items.length} món)</span>
      <div className="space-y-2">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-[10px] bg-white/70 border border-black/5">
            <div>
              <span className="font-bold text-[#333333]">{item.quantity}x {item.product.name}</span>
              <span className="text-[#333333]/60 block text-[11px] font-mono">
                Size {item.size.name}
                {item.toppings.length > 0 ? ` • ${item.toppings.map((t) => t.name).join(', ')}` : ''}
              </span>
            </div>
            <span className="font-mono font-bold text-[#035542]">{formatCurrency(item.totalPrice)}</span>
          </div>
        ))}
      </div>
    </div>

    {order.discount > 0 && (
      <div className="flex justify-between text-[#035542]">
        <span>Giảm giá</span>
        <span className="font-mono">- {formatCurrency(order.discount)}</span>
      </div>
    )}

    <div className="pt-3 border-t border-black/10 flex justify-between items-baseline text-sm">
      <div>
        <span className="font-bold text-[#333333] block">{totalLabel}</span>
        <span className="text-[10px] text-[#333333]/60 font-mono">
          {order.paymentMethod === 'vietqr' ? 'VietQR Napas' : String(order.paymentMethod).toUpperCase()}
        </span>
      </div>
      <span className="text-xl font-black font-mono text-[#035542]">{formatCurrency(order.total)}</span>
    </div>
  </div>
);

const ActionBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-4 sm:p-6 bg-white/80 backdrop-blur-md border-t border-black/5 grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
);

const ghostBtn =
  'touch-target h-12 px-5 rounded-full liquid-glass border border-emerald-900/20 text-[#035542] hover:bg-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs';
const primaryBtn =
  'touch-target h-12 px-5 rounded-full liquid-glass-emerald text-white hover:brightness-105 font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-60';

/* ---------- PAID (và các bước tiếp theo của quầy) ---------- */

const SuccessView: React.FC<{ order: Order; onMenu: () => void; onHistory: () => void }> = ({ order, onMenu, onHistory }) => {
  const earnedPoints = order.pointsEarned > 0 ? order.pointsEarned : Math.floor(order.total / 10000);
  const steps = [
    { label: '1. Nhận đơn', active: true },
    { label: '2. Pha chế', active: ['PREPARING', 'READY', 'COMPLETED'].includes(order.status) },
    { label: '3. Mời lấy', active: ['READY', 'COMPLETED'].includes(order.status) },
    { label: '4. Đã nhận', active: order.status === 'COMPLETED' },
  ];
  return (
    <div className="liquid-glass rounded-[24px] border border-white/90 shadow-xl overflow-hidden bg-white/80">
      <div className="pt-8 pb-6 px-6 text-center border-b border-black/5 bg-gradient-to-b from-emerald-500/10 via-amber-200/15 to-transparent space-y-3">
        <div className="flex justify-center">
          <FeaturedSeal size={84} label="PAID" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white/80 text-[#035542] border border-emerald-900/15 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ĐÃ THANH TOÁN • NHẬN TẠI QUẦY</span>
        </div>

        <OrderSummary order={order} tone="ok" />

        <div className="p-3 rounded-[18px] bg-white border border-emerald-900/15 shadow-sm max-w-sm mx-auto">
          <span className="text-[11px] font-bold text-[#035542] uppercase tracking-wider block">MÃ NHẬN NƯỚC TẠI QUẦY BARISTA</span>
          <div className="text-3xl sm:text-4xl font-black font-mono text-[#035542] tracking-tight my-1">{order.pickupCode || order.orderNumber}</div>
        </div>

        {earnedPoints > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>+{earnedPoints} điểm BrewLite Rewards đã cộng vào tài khoản!</span>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 border-b border-black/5 space-y-3.5 bg-white/60">
        <span className="text-xs font-bold text-[#035542] uppercase tracking-wider font-mono">TIẾN TRÌNH QUẦY BARISTA</span>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 transition-all shadow-xs ${
                  step.active ? 'bg-[#035542] text-white ring-2 ring-emerald-500/20' : 'bg-white text-[#333333]/50 border border-black/10'
                }`}
              >
                {idx + 1}
              </div>
              <span className={`text-[11px] font-semibold leading-tight ${step.active ? 'text-[#035542]' : 'text-[#333333]/50'}`}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 sm:px-6 pt-5 space-y-3 text-xs text-[#333333]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-[#333333]/70">
            <MapPin className="w-3.5 h-3.5 text-[#035542]" /> Chi nhánh nhận nước:
          </span>
          <span className="font-bold text-[#035542] text-right">{order.pickupBranch || 'Chi nhánh Bến Nghé (Quầy Bar A)'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-[#333333]/70">
            <User className="w-3.5 h-3.5 text-[#035542]" /> Người nhận:
          </span>
          <span className="font-semibold">{[order.customerName, order.customerPhone].filter(Boolean).join(' • ')}</span>
        </div>
        {order.pickupNote && (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#333333]/70">Ghi chú quầy:</span>
            <span className="italic text-[#333333]/90">{order.pickupNote}</span>
          </div>
        )}
      </div>

      <ItemsAndTotal order={order} totalLabel="TỔNG ĐÃ THANH TOÁN" />

      <ActionBar>
        <button type="button" onClick={onMenu} className={ghostBtn}>
          <Home className="w-4 h-4" /> <span>VỀ THỰC ĐƠN</span>
        </button>
        <button type="button" onClick={onHistory} className={primaryBtn}>
          <FileText className="w-4 h-4" /> <span>LỊCH SỬ ĐƠN HÀNG</span>
        </button>
      </ActionBar>
    </div>
  );
};

/* ---------- PAYMENT_FAILED ---------- */

const FailedView: React.FC<{
  order: Order;
  isRetrying: boolean;
  retryMessage: string | null;
  onRetry: () => void;
  onCheckout: () => void;
  onHistory: () => void;
}> = ({ order, isRetrying, retryMessage, onRetry, onCheckout, onHistory }) => (
  <div className="liquid-glass rounded-[24px] border border-white/90 shadow-xl overflow-hidden bg-white/80">
    <div className="pt-8 pb-6 px-6 text-center border-b border-black/5 bg-gradient-to-b from-red-500/10 via-amber-200/10 to-transparent space-y-3">
      <div className="w-16 h-16 rounded-full bg-red-100/80 text-[#c93b2b] flex items-center justify-center mx-auto shadow-xs">
        <XCircle className="w-9 h-9 stroke-[2.2]" />
      </div>
      <h1 className="text-xl font-bold uppercase text-[#333333] tracking-tight">Thanh toán không thành công</h1>
      <p className="text-xs text-[#333333]/80 max-w-sm mx-auto">
        Đơn đã được lưu nhưng chưa được thanh toán. Bạn có thể thanh toán lại ngay, tiền chưa bị trừ.
      </p>

      <OrderSummary order={order} tone="fail" />

      {retryMessage && (
        <p role="alert" className="p-3 rounded-[12px] bg-red-50/90 border border-red-200 text-[#c93b2b] text-xs font-semibold">
          {retryMessage}
        </p>
      )}
    </div>

    <ItemsAndTotal order={order} totalLabel="TỔNG CẦN THANH TOÁN" />

    <ActionBar>
      <button type="button" onClick={onRetry} disabled={isRetrying} className={`${primaryBtn} sm:col-span-2`}>
        {isRetrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
        <span>{isRetrying ? 'ĐANG THANH TOÁN...' : 'THANH TOÁN LẠI'}</span>
      </button>
      <button type="button" onClick={onCheckout} className={ghostBtn}>
        <ShoppingBag className="w-4 h-4" /> <span>ĐỔI PHƯƠNG THỨC</span>
      </button>
      <button type="button" onClick={onHistory} className={ghostBtn}>
        <FileText className="w-4 h-4" /> <span>LỊCH SỬ ĐƠN HÀNG</span>
      </button>
    </ActionBar>
  </div>
);

/* ---------- PENDING / CANCELLED ---------- */

const OtherView: React.FC<{ order: Order; onMenu: () => void; onHistory: () => void }> = ({ order, onMenu, onHistory }) => (
  <div className="liquid-glass rounded-[24px] border border-white/90 shadow-xl overflow-hidden bg-white/80">
    <div className="pt-8 pb-6 px-6 text-center border-b border-black/5 space-y-3">
      <h1 className="text-xl font-bold uppercase text-[#333333] tracking-tight">
        {order.status === 'CANCELLED' ? 'Đơn hàng đã hủy' : 'Đơn hàng đang chờ thanh toán'}
      </h1>
      <OrderSummary order={order} tone="neutral" />
    </div>
    <ItemsAndTotal order={order} totalLabel="TỔNG TIỀN ĐƠN" />
    <ActionBar>
      <button type="button" onClick={onMenu} className={ghostBtn}>
        <Home className="w-4 h-4" /> <span>VỀ THỰC ĐƠN</span>
      </button>
      <button type="button" onClick={onHistory} className={primaryBtn}>
        <FileText className="w-4 h-4" /> <span>LỊCH SỬ ĐƠN HÀNG</span>
      </button>
    </ActionBar>
  </div>
);
