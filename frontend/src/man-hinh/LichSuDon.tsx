import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Order, OrderStatus, Product, User, formatPrice } from '../api';
import { TienTrinhDon } from '../components/TienTrinhDon';

interface LichSuDonProps {
  user: User | null;
  orderHistory: Order[];
  historyLoading: boolean;
  products: Product[];
  onBackToMenu: () => void;
  onTransition: (orderId: string, targetStatus: OrderStatus) => void;
  onRetryFromHistory: (orderId: string) => void;
  statusNotice?: { type: 'success' | 'error' | 'ready'; message: string; orderId?: string } | null;
  onClearNotice?: () => void;
}

export const LichSuDon: React.FC<LichSuDonProps> = ({
  user,
  orderHistory,
  historyLoading,
  products,
  onBackToMenu,
  onTransition,
  onRetryFromHistory,
  statusNotice,
  onClearNotice,
}) => {
  const layTenTrangThai = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'PAID':
        return 'Đã thanh toán';
      case 'PREPARING':
        return 'Đang pha chế';
      case 'READY':
        return 'Sẵn sàng lấy nước';
      case 'COMPLETED':
        return 'Đã hoàn tất';
      case 'PAYMENT_FAILED':
        return 'Thanh toán lỗi';
      case 'CANCELLED':
        return 'Đã hủy';
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between space-y-5">
      <div className="space-y-5">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white rounded-xl border border-neutral-200/80">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Quay lại thực đơn"
              onClick={onBackToMenu}
              className="w-9 h-9 rounded-lg border border-neutral-200/80 bg-white hover:bg-emerald-50/70 hover:text-emerald-900 text-neutral-700 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-base sm:text-lg text-neutral-900">
              Theo dõi & Lịch sử đơn
            </span>
          </div>
          <span className="text-xs sm:text-sm font-mono tabular-nums border border-emerald-800/15 px-3 py-1.5 rounded-lg bg-emerald-50/70 text-emerald-900">
            Điểm: <span className="font-semibold text-emerald-900">{user?.loyaltyPoints ?? 0}</span>
          </span>
        </div>

        {statusNotice && statusNotice.type !== 'error' && (
          <div className="px-4 py-3 rounded-xl border border-emerald-800/20 bg-emerald-50/70 text-emerald-900 text-xs sm:text-sm flex justify-between items-start gap-2">
            <span className="leading-relaxed">{statusNotice.message}</span>
            {onClearNotice && (
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={onClearNotice}
                className="text-emerald-800 hover:text-emerald-950 px-1 cursor-pointer shrink-0 font-mono"
              >
                ×
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {historyLoading ? (
            <div className="col-span-full text-center text-sm py-16 text-neutral-500 bg-white border border-neutral-200/80 rounded-xl">
              Đang tải danh sách đơn hàng...
            </div>
          ) : orderHistory.length === 0 ? (
            <div className="col-span-full py-16 px-4 text-center bg-white border border-neutral-200/80 rounded-xl space-y-2">
              <div className="text-sm font-medium text-neutral-900">Chưa có đơn hàng nào</div>
              <div className="text-xs text-neutral-500">
                Các đơn hàng bạn đặt sẽ được hiển thị và cập nhật tiến trình tại đây.
              </div>
            </div>
          ) : (
            orderHistory.map((order) => {
              const status = order.status;
              const choPhepKhachThaoTac =
                status === 'PENDING' || status === 'PAYMENT_FAILED' || status === 'PAID';

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 bg-white border border-neutral-200/80 rounded-xl text-xs sm:text-sm space-y-3.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-mono font-semibold text-sm sm:text-base text-neutral-900 block">
                        Đơn #{order.id}
                      </span>
                      <div className="text-xs text-neutral-500 font-mono mt-0.5">
                        {order.createdAt}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium ${
                        status === 'CANCELLED'
                          ? 'border-neutral-200/80 bg-stone-100 text-neutral-400 line-through'
                          : 'border-emerald-800/20 bg-emerald-50/70 text-emerald-900'
                      }`}
                    >
                      {layTenTrangThai(status)}
                    </span>
                  </div>

                  <TienTrinhDon
                    status={status}
                    onNextStep={
                      status === 'PAID' || status === 'PREPARING'
                        ? () =>
                            onTransition(
                              order.id,
                              status === 'PAID' ? 'PREPARING' : 'READY'
                            )
                        : undefined
                    }
                  />

                  {status === 'READY' && (
                    <div className="px-3.5 py-3 bg-emerald-50/70 border border-emerald-800/20 text-emerald-900 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="leading-relaxed">
                        Đồ uống của bạn đã pha xong. Mời bạn đến quầy đọc mã đơn{' '}
                        <strong className="font-mono">#{order.id}</strong> để nhận nước.
                      </span>
                      <button
                        type="button"
                        onClick={() => onTransition(order.id, 'COMPLETED')}
                        className="px-3.5 py-2 bg-emerald-800 text-white font-medium text-xs rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors shrink-0"
                      >
                        Đã nhận nước
                      </button>
                    </div>
                  )}

                  {order.items && order.items.length > 0 && (
                    <div className="py-2.5 border-y border-neutral-200/80 space-y-2">
                      {order.items.map((item) => {
                        const product = products.find((p) => p.id === item.productId);
                        const name = product ? product.name : `Món #${item.productId}`;
                        return (
                          <div
                            key={item.id}
                            className="flex justify-between items-start text-xs sm:text-sm text-neutral-900"
                          >
                            <div>
                              <span className="font-medium">
                                {name}{' '}
                                <span className="font-normal text-neutral-500">
                                  (Size {item.size}) · x{item.qty}
                                </span>
                              </span>
                              {(item.sugar || item.ice) && (
                                <div className="text-xs text-neutral-500">
                                  Đường: {item.sugar || '100%'} · Đá: {item.ice || '100%'}
                                </div>
                              )}
                              {item.note && (
                                <div className="text-xs text-neutral-500 italic">
                                  Ghi chú: &ldquo;{item.note}&rdquo;
                                </div>
                              )}
                            </div>
                            <span className="font-mono tabular-nums text-neutral-700 shrink-0 ml-2">
                              {formatPrice(item.lineTotal)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-neutral-500">Tổng thanh toán</span>
                    <span className="font-mono tabular-nums font-bold text-base text-emerald-800">
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  {choPhepKhachThaoTac && (
                    <div className="pt-2.5 border-t border-neutral-200/80 flex flex-wrap gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => onTransition(order.id, 'CANCELLED')}
                        className="px-3.5 py-1.5 border border-neutral-200/80 bg-white rounded-lg text-xs text-neutral-600 cursor-pointer hover:bg-stone-50 hover:text-neutral-900 transition-colors"
                      >
                        Hủy đơn
                      </button>
                      {(status === 'PENDING' || status === 'PAYMENT_FAILED') && (
                        <button
                          type="button"
                          onClick={() => onRetryFromHistory(order.id)}
                          className="px-3.5 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-emerald-700 transition-colors"
                        >
                          Thử lại thanh toán
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onBackToMenu}
          className="w-full sm:w-auto sm:min-w-[220px] py-2.5 px-5 bg-emerald-800 text-white font-medium text-sm rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors"
        >
          Về thực đơn chính
        </button>
      </div>
    </div>
  );
};

export default LichSuDon;
