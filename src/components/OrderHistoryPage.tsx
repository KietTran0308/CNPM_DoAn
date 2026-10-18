import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getStatusBadgeConfig } from '../utils';
import {
  ArrowLeft,
  Clock,
  RotateCcw,
  Coffee,
  Play,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const OrderHistoryPage: React.FC = () => {
  const { orders, setCurrentScreen, reOrder, advanceOrderStatus, user, openAuthModal } = useApp();
  const [filter, setFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="py-12 px-4 max-w-lg mx-auto text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-[#145C4B]/10 border border-[#145C4B]/20 flex items-center justify-center mx-auto mb-4 text-[#145C4B]">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#252525] mb-2 tracking-tight">
          Lịch sử đơn hàng
        </h1>
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

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['PAID', 'PREPARING', 'READY'].includes(order.status);
    if (filter === 'completed') return order.status === 'COMPLETED';
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('menu')}
            className="touch-target w-10 h-10 rounded-full liquid-glass border border-white/80 flex items-center justify-center text-[#035542] hover:bg-white shadow-xs active:scale-95 transition-all cursor-pointer"
            title="Quay lại thực đơn"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold uppercase text-[#333333] tracking-tight">
              Lịch sử đơn hàng
            </h1>
            <p className="text-xs text-[#035542] font-semibold">
              Theo dõi tiến trình pha chế tại quầy theo thời gian thực
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentScreen('menu')}
          className="text-xs font-bold uppercase text-[#035542] hover:underline px-3 py-1.5 rounded-full bg-emerald-900/5 transition-colors"
        >
          + Đặt món mới
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: `TẤT CẢ (${orders.length})` },
          {
            id: 'active',
            label: `ĐANG XỬ LÝ (${orders.filter((o) => ['PAID', 'PREPARING', 'READY'].includes(o.status)).length})`,
          },
          {
            id: 'completed',
            label: `HOÀN THÀNH (${orders.filter((o) => o.status === 'COMPLETED').length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              filter === tab.id
                ? 'liquid-glass-emerald text-white shadow-sm'
                : 'bg-white/70 hover:bg-white text-[#333333] border border-black/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3.5">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 liquid-glass rounded-[24px] p-8 border border-white/80 shadow-xs">
            <Coffee className="w-12 h-12 text-[#035542]/50 mx-auto mb-3" />
            <h3 className="font-bold text-[#333333] text-sm uppercase">Chưa có đơn hàng nào</h3>
            <p className="text-xs text-[#333333]/70 mt-1">
              Bạn có thể đặt món yêu thích bất cứ lúc nào trên thực đơn.
            </p>
            <button
              onClick={() => setCurrentScreen('menu')}
              className="mt-4 px-6 py-2 rounded-full liquid-glass-emerald text-white text-xs font-bold uppercase shadow-sm"
            >
              Xem thực đơn
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const badgeConfig = getStatusBadgeConfig(order.status);

            return (
              <div
                key={order.id}
                className="liquid-glass-card rounded-[20px] border border-white/90 overflow-hidden shadow-xs"
              >
                {/* Summary Row */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-4 sm:p-5 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold font-mono text-base text-[#333333]">
                          {order.orderNumber}
                        </span>
                        {order.pickupCode && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#035542] text-white">
                            Mã nhận: {order.pickupCode}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-900/10 text-[#035542]">
                          {badgeConfig.label}
                        </span>
                      </div>
                      <div className="text-xs text-[#333333]/70 font-mono mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#035542]" /> {order.createdAt}
                        </span>
                        {order.pickupBranch && (
                          <span className="text-[11px] text-[#035542] font-sans font-semibold">
                            • {order.pickupBranch}
                          </span>
                        )}
                      </div>

                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="font-bold text-sm text-[#035542] font-mono block">
                          {formatCurrency(order.total)}
                        </span>
                        <span className="text-[11px] text-[#333333]/70 font-medium">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} món
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-[#333333]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-[#333333]/80 line-clamp-1">
                    {order.items.map((i) => `${i.quantity}x ${i.product.name} (Size ${i.size.name})`).join(' • ')}
                  </div>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-black/5 bg-white/50 space-y-3 text-xs">
                    <div className="space-y-2">
                      <span className="text-[11px] text-[#035542] font-bold uppercase block">
                        Danh sách đồ uống
                      </span>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[#333333] py-1">
                          <div>
                            <span className="font-semibold">
                              {item.quantity}x {item.product.name}
                            </span>
                            <span className="text-[#333333]/60 block text-[11px] font-mono">
                              Size {item.size.name}
                              {item.toppings.length > 0
                                ? ` • Topping: ${item.toppings.map((t) => t.name).join(', ')}`
                                : ''}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#035542]">
                            {formatCurrency(item.totalPrice)}
                          </span>
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
                        <span>Tổng tiền đã trả</span>
                        <span className="font-mono text-[#035542]">{formatCurrency(order.total)}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-2">
                      {(user.role === 'barista' || user.role === 'admin') && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => advanceOrderStatus(order.id)}
                          className="touch-target h-9 px-3.5 rounded-full liquid-glass border border-emerald-900/15 text-[#035542] text-xs font-bold flex items-center gap-1.5 hover:bg-white transition-colors cursor-pointer shadow-xs"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Quầy: Chuyển bước ({order.status} →)</span>
                        </button>
                      )}

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
