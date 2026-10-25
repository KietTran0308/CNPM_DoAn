import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import { formatCurrency, formatDateTime, getStatusBadgeConfig } from '../utils';
import type { Order } from '../types';
import {
  ArrowLeft,
  Clock,
  RotateCcw,
  Coffee,
  Play,
  ChevronDown,
  ChevronUp,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

type FilterId = 'all' | 'active' | 'completed' | 'failed';

const ACTIVE = ['PAID', 'PREPARING', 'READY'];
const PROBLEM = ['PAYMENT_FAILED', 'PENDING', 'CANCELLED'];

const FILTERS: { id: FilterId; label: string; match: (o: Order) => boolean }[] = [
  { id: 'all', label: 'TẤT CẢ', match: () => true },
  { id: 'active', label: 'ĐANG XỬ LÝ', match: (o) => ACTIVE.includes(o.status) },
  { id: 'completed', label: 'HOÀN THÀNH', match: (o) => o.status === 'COMPLETED' },
  { id: 'failed', label: 'LỖI / ĐÃ HỦY', match: (o) => PROBLEM.includes(o.status) },
];

const OrderSkeleton: React.FC = () => (
  <div aria-hidden className="liquid-glass-card rounded-[20px] border border-white/90 p-4 sm:p-5 animate-pulse space-y-3">
    <div className="flex justify-between gap-3">
      <div className="h-4 w-32 rounded-full bg-stone-200" />
      <div className="h-4 w-20 rounded-full bg-stone-200" />
    </div>
    <div className="h-3 w-48 rounded-full bg-stone-200" />
    <div className="h-3 w-3/4 rounded-full bg-stone-100" />
  </div>
);

export const OrderHistoryPage: React.FC = () => {
  const {
    orders, isOrdersLoading, isOrdersFetching, isOrdersError, refetchOrders, openOrderDetail,
    setCurrentScreen, reOrder, advanceOrderStatus, cancelOrder, user, openAuthModal,
  } = useApp();
  const { isInitialized } = useAuthContext();

  const [filter, setFilter] = useState<FilterId>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);

  // Thông báo hủy đơn tự ẩn sau 5 giây
  useEffect(() => {
    if (!cancelNotice) return;
    const t = setTimeout(() => setCancelNotice(null), 5000);
    return () => clearTimeout(t);
  }, [cancelNotice]);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn này? Nếu đã thanh toán mô phỏng, hệ thống sẽ hoàn tác điểm và voucher.')) return;
    setCancelError(null);
    setCancelNotice(null);
    setCancellingId(id);
    try {
      await cancelOrder(id);
      setCancelNotice('Đã hủy đơn thành công. Dữ liệu đã được cập nhật trên hệ thống.');
    } catch (e: any) {
      setCancelError(e?.message || 'Không thể hủy đơn');
    } finally {
      setCancellingId(null);
    }
  };

  /* ---- 1. Đang kiểm tra phiên đăng nhập (tránh nháy màn "chưa đăng nhập" khi tải lại trang) ---- */
  if (!isInitialized) {
    return (
      <div role="status" className="py-16 flex flex-col items-center gap-2 text-[#035542]">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-xs font-bold uppercase">Đang kiểm tra phiên đăng nhập...</span>
      </div>
    );
  }

  /* ---- 2. Chưa đăng nhập ---- */
  if (!user) {
    return (
      <div className="py-12 px-4 max-w-lg mx-auto text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-[#145C4B]/10 border border-[#145C4B]/20 flex items-center justify-center mx-auto mb-4 text-[#145C4B]">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#252525] mb-2 tracking-tight">Lịch sử đơn hàng</h1>
        <p className="text-xs text-[#252525]/70 max-w-sm mx-auto mb-6 leading-relaxed">
          Đăng nhập để theo dõi tiến trình pha chế tại quầy theo thời gian thực và quản lý các đơn hàng đã đặt của bạn.
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

  const activeFilter = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const filteredOrders = orders.filter(activeFilter.match);
  const hasNoOrders = !isOrdersLoading && !isOrdersError && orders.length === 0;
  const showFullError = isOrdersError && orders.length === 0;
  const showStaleError = isOrdersError && orders.length > 0;

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {cancelError && (
        <p role="alert" className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {cancelError}
        </p>
      )}
      {cancelNotice && (
        <p role="status" className="bg-emerald-50 text-emerald-800 p-3 rounded-xl mb-4 text-xs font-semibold">
          {cancelNotice}
        </p>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-black/5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setCurrentScreen('menu')}
            className="touch-target w-10 h-10 shrink-0 rounded-full liquid-glass border border-white/80 flex items-center justify-center text-[#035542] hover:bg-white shadow-xs active:scale-95 transition-all cursor-pointer"
            title="Quay lại thực đơn"
            aria-label="Quay lại thực đơn"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold uppercase text-[#333333] tracking-tight">Lịch sử đơn hàng</h1>
            <p className="text-xs text-[#035542] font-semibold truncate">
              Đơn của {user.fullName} ({user.email}). Có thể hủy trước khi quầy bắt đầu pha chế.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refetchOrders}
            disabled={isOrdersFetching}
            title="Tải lại"
            aria-label="Tải lại danh sách đơn"
            className="touch-target w-9 h-9 rounded-full bg-emerald-900/5 text-[#035542] flex items-center justify-center hover:bg-emerald-900/10 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isOrdersFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentScreen('menu')}
            className="hidden sm:inline-block text-xs font-bold uppercase text-[#035542] hover:underline px-3 py-1.5 rounded-full bg-emerald-900/5 transition-colors cursor-pointer"
          >
            + Đặt món mới
          </button>
        </div>
      </div>

      {/* Lỗi khi đã có dữ liệu cũ: giữ danh sách, chỉ báo không cập nhật được */}
      {showStaleError && (
        <div role="alert" className="mb-4 p-3 rounded-[14px] bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">Không cập nhật được dữ liệu mới nhất. Đang hiển thị dữ liệu đã tải trước đó.</span>
          <button type="button" onClick={refetchOrders} className="underline font-bold cursor-pointer">Thử lại</button>
        </div>
      )}

      {/* Filter Tabs (ẩn số đếm khi chưa có dữ liệu) */}
      {!showFullError && !hasNoOrders && (
        <div role="tablist" aria-label="Lọc đơn hàng" className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                filter === tab.id ? 'liquid-glass-emerald text-white shadow-sm' : 'bg-white/70 hover:bg-white text-[#333333] border border-black/5'
              }`}
            >
              {isOrdersLoading ? tab.label : `${tab.label} (${orders.filter(tab.match).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Danh sách đơn */}
      <div className="space-y-3.5">
        {isOrdersLoading ? (
          <div role="status" aria-label="Đang tải đơn hàng" className="space-y-3.5">
            <OrderSkeleton />
            <OrderSkeleton />
            <OrderSkeleton />
          </div>
        ) : showFullError ? (
          <div role="alert" className="text-center py-10 rounded-[24px] border border-red-200 bg-red-50/70 p-6">
            <AlertCircle className="w-8 h-8 text-[#c93b2b] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#c93b2b]">Không tải được lịch sử đơn hàng</p>
            <p className="text-xs text-[#333333]/70 mt-1">Kiểm tra kết nối tới máy chủ rồi thử lại.</p>
            <button
              type="button"
              onClick={refetchOrders}
              disabled={isOrdersFetching}
              className="mt-4 px-6 py-2 rounded-full liquid-glass-emerald text-white text-xs font-bold uppercase shadow-sm cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
            >
              {isOrdersFetching && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Thử lại
            </button>
          </div>
        ) : hasNoOrders ? (
          <div className="text-center py-12 liquid-glass rounded-[24px] p-8 border border-white/80 shadow-xs">
            <Coffee className="w-12 h-12 text-[#035542]/50 mx-auto mb-3" />
            <h3 className="font-bold text-[#333333] text-sm uppercase">Bạn chưa có đơn hàng nào</h3>
            <p className="text-xs text-[#333333]/70 mt-1">Các đơn bạn đặt sẽ xuất hiện tại đây để theo dõi và đặt lại nhanh.</p>
            <button
              type="button"
              onClick={() => setCurrentScreen('menu')}
              className="mt-4 px-6 py-2 rounded-full liquid-glass-emerald text-white text-xs font-bold uppercase shadow-sm cursor-pointer"
            >
              Xem thực đơn
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-10 liquid-glass rounded-[24px] p-8 border border-white/80 shadow-xs">
            <h3 className="font-bold text-[#333333] text-sm uppercase">Không có đơn nào trong mục này</h3>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-4 px-6 py-2 rounded-full border border-black/10 text-[#035542] text-xs font-bold uppercase hover:bg-white cursor-pointer"
            >
              Xem tất cả đơn
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const badgeConfig = getStatusBadgeConfig(order.status);
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <div key={order.id} className="liquid-glass-card rounded-[20px] border border-white/90 overflow-hidden shadow-xs">
                {/* Hàng tóm tắt (là button để bàn phím/đọc màn hình dùng được) */}
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                  className="w-full text-left p-4 sm:p-5 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold font-mono text-base text-[#333333]">{order.orderNumber}</span>
                        {order.pickupCode && PROBLEM.indexOf(order.status) === -1 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#035542] text-white">
                            Mã nhận: {order.pickupCode}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeConfig.badgeClass}`}>
                          {badgeConfig.label}
                        </span>
                      </div>
                      <div className="text-xs text-[#333333]/70 font-mono mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#035542]" /> {formatDateTime(order.createdAt)}
                        </span>
                        {order.pickupBranch && (
                          <span className="text-[11px] text-[#035542] font-sans font-semibold">• {order.pickupBranch}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3 shrink-0">
                      <div>
                        <span className="font-bold text-sm text-[#035542] font-mono block">{formatCurrency(order.total)}</span>
                        <span className="text-[11px] text-[#333333]/70 font-medium">{itemCount} món</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-[#333333]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-[#333333]/80 line-clamp-1">
                    {order.items.map((i) => `${i.quantity}x ${i.product.name} (Size ${i.size.name})`).join(' • ')}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-black/5 bg-white/50 space-y-3 text-xs">
                    <div className="space-y-2">
                      <span className="text-[11px] text-[#035542] font-bold uppercase block">Danh sách đồ uống</span>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[#333333] py-1">
                          <div>
                            <span className="font-semibold">{item.quantity}x {item.product.name}</span>
                            <span className="text-[#333333]/60 block text-[11px] font-mono">
                              Size {item.size.name}
                              {item.toppings.length > 0 ? ` • Topping: ${item.toppings.map((t) => t.name).join(', ')}` : ''}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#035542]">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-black/5 space-y-1 text-[#333333]/80">
                      <div className="flex justify-between">
                        <span>Tạm tính</span>
                        <span className="font-mono">{formatCurrency(order.subtotal)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-[#035542]">
                          <span>Giảm giá</span>
                          <span className="font-mono">- {formatCurrency(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-black font-bold pt-1 border-t border-black/5">
                        <span>{order.status === 'CANCELLED' ? 'Tổng tiền đơn đã hủy' : order.status === 'PAYMENT_FAILED' || order.status === 'PENDING' ? 'Tổng tiền cần thanh toán' : 'Tổng tiền thanh toán'}</span>
                        <span className="font-mono text-[#035542]">{formatCurrency(order.total)}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-black/5 flex flex-wrap items-center gap-2">
                      {(user.role === 'barista' || user.role === 'admin') && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && ACTIVE.includes(order.status) && (
                        <button
                          type="button"
                          onClick={() => advanceOrderStatus(order.id)}
                          className="touch-target h-9 px-3.5 rounded-full liquid-glass border border-emerald-900/15 text-[#035542] text-xs font-bold flex items-center gap-1.5 hover:bg-white transition-colors cursor-pointer shadow-xs"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Quầy: Chuyển bước ({order.status} →)</span>
                        </button>
                      )}

                      {['PENDING', 'PAYMENT_FAILED', 'PAID'].includes(order.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancel(order.id)}
                          disabled={cancellingId !== null}
                          className="touch-target h-9 px-4 rounded-full border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          {cancellingId === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          {cancellingId === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openOrderDetail(order.id)}
                        className="touch-target h-9 px-4 rounded-full liquid-glass border border-emerald-900/15 text-[#035542] text-xs font-bold flex items-center gap-1.5 hover:bg-white cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {order.status === 'PAYMENT_FAILED' ? 'Xem & thanh toán lại' : 'Xem chi tiết'}
                      </button>

                      <button
                        type="button"
                        onClick={() => reOrder(order)}
                        className="touch-target h-9 px-4 rounded-full liquid-glass-emerald text-white font-bold text-xs flex items-center gap-1.5 hover:brightness-105 transition-all ml-auto cursor-pointer shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Đặt lại đơn này</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};