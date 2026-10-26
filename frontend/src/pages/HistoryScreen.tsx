/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order, OrderStatus, Product, User, formatPrice } from '../api';
import { OrderStepper } from '../components/OrderStepper';

interface HistoryScreenProps {
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

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
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
  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        {/* Header: Lịch sử đơn hàng & ← */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-400">
          <button
            onClick={onBackToMenu}
            className="font-bold text-base cursor-pointer hover:opacity-75"
          >
            ←
          </button>
          <span className="font-bold text-base">Lịch sử đơn hàng</span>
          <span className="text-xs font-mono border border-gray-400 px-1.5 py-0.5 rounded bg-stone-100 font-medium">
            Điểm: {user?.loyaltyPoints ?? 0}
          </span>
        </div>

        {/* Banner thông báo nổi phản hồi kết quả chuyển trạng thái (chỉ hiện thông báo hợp lệ / mời nhận nước) */}
        {statusNotice && statusNotice.type !== 'error' && (
          <div
            className={`mt-3 p-2.5 rounded border text-xs font-medium ${
              statusNotice.type === 'ready'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-800'
                : 'bg-stone-100 text-black border-gray-400'
            }`}
          >
            <div className="flex justify-between items-start">
              <span>{statusNotice.message}</span>
              {onClearNotice && (
                <button
                  onClick={onClearNotice}
                  className="ml-2 font-mono text-[11px] underline cursor-pointer shrink-0"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        )}

        {/* Danh sách đơn hàng từ GET /orders/me */}
        <div className="mt-4 space-y-3">
          {historyLoading ? (
            <div className="text-center text-sm py-8 text-gray-500 font-mono">
              Đang tải danh sách đơn hàng...
            </div>
          ) : orderHistory.length === 0 ? (
            <div className="text-center text-sm py-8 text-gray-500 font-mono">
              Chưa có đơn hàng nào
            </div>
          ) : (
            orderHistory.map((order) => {
              const status = order.status;
              const hasActions = [
                'PENDING',
                'PAYMENT_FAILED',
                'PAID',
                'PREPARING',
                'READY',
              ].includes(status);

              return (
                <div
                  key={order.id}
                  className="p-3 bg-stone-100 border border-gray-400 rounded text-xs space-y-2.5"
                >
                  {/* Hàng 1 (Header thẻ): Mã đơn + thời gian (trái) và Nhãn trạng thái (phải) */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-sm">#{order.id}</span>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {order.createdAt}
                      </div>
                    </div>

                    {/* Nhãn trạng thái chuẩn Wireframe tối giản */}
                    <span
                      className={`font-mono px-2 py-0.5 rounded text-[11px] font-medium ${
                        status === 'PAID'
                          ? 'bg-emerald-800 text-white font-bold'
                          : status === 'READY'
                          ? 'bg-emerald-800 text-white font-bold'
                          : status === 'PREPARING'
                          ? 'bg-stone-200 text-black border border-black font-bold'
                          : status === 'COMPLETED'
                          ? 'bg-stone-200 text-gray-700 border border-gray-400'
                          : status === 'PAYMENT_FAILED'
                          ? 'bg-red-50 text-red-700 border border-red-400'
                          : 'bg-stone-200 text-black border border-gray-400'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* THANH TIẾN TRÌNH TRẠNG THÁI ĐƠN HÀNG (ORDER STEPPER) */}
                  <OrderStepper status={status} />

                  {/* THÔNG BÁO MỜI RA QUẦY LẤY NƯỚC KHI ĐƠN Ở TRẠNG THÁI READY */}
                  {status === 'READY' && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-800 text-emerald-900 rounded text-xs font-medium">
                      Đồ uống của bạn đã pha xong. Mời bạn đến quầy đọc mã đơn #{order.id} để nhận nước.
                    </div>
                  )}

                  {/* Hàng 2 (Danh sách món - OrderItem): [Tên món] ([size]) x[qty] và lineTotal */}
                  {order.items && order.items.length > 0 && (
                    <div className="py-1.5 border-y border-gray-300 space-y-1">
                      {order.items.map((item) => {
                        const product = products.find((p) => p.id === item.productId);
                        const name = product ? product.name : `Món #${item.productId}`;
                        return (
                          <div
                            key={item.id}
                            className="flex justify-between items-start text-[11px] text-gray-800"
                          >
                            <div>
                              <span>
                                {name} ({item.size}) x{item.qty}
                              </span>
                              {(item.sugar || item.ice) && (
                                <div className="text-[10px] text-gray-500">
                                  Đường: {item.sugar || '100%'} • Đá: {item.ice || '100%'}
                                </div>
                              )}
                              {item.note && (
                                <div className="text-[10px] text-gray-500 italic">
                                  Ghi chú: {item.note}
                                </div>
                              )}
                            </div>
                            <span className="font-mono text-gray-700 shrink-0 ml-2">
                              {formatPrice(item.lineTotal)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Hàng 3 (Tổng cộng): Tổng tiền và giá trị total in đậm */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-700">Tổng tiền:</span>
                    <span className="font-mono font-bold text-sm">
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  {/* Khu vực Nút bấm: Chỉ các bước chuyển trạng thái hợp lệ theo đúng luồng */}
                  {hasActions && (
                    <div className="pt-2 border-t border-gray-300 flex flex-wrap gap-1.5 justify-end">
                      {/* Nếu status là PENDING hoặc PAYMENT_FAILED */}
                      {(status === 'PENDING' || status === 'PAYMENT_FAILED') && (
                        <>
                          <button
                            onClick={() => onTransition(order.id, 'CANCELLED')}
                            className="px-2.5 py-1 border border-gray-400 bg-white rounded text-xs cursor-pointer hover:bg-stone-200"
                          >
                            Hủy đơn
                          </button>
                          <button
                            onClick={() => onRetryFromHistory(order.id)}
                            className="px-2.5 py-1 bg-emerald-800 text-white rounded text-xs font-medium cursor-pointer hover:bg-emerald-900"
                          >
                            Thử lại thanh toán
                          </button>
                        </>
                      )}

                      {/* Nếu status là PAID: Chỉ có Hủy đơn hoặc Nhận pha chế (PREPARING) */}
                      {status === 'PAID' && (
                        <>
                          <button
                            onClick={() => onTransition(order.id, 'CANCELLED')}
                            className="px-2.5 py-1 border border-gray-400 bg-white rounded text-xs cursor-pointer hover:bg-stone-200"
                          >
                            Hủy đơn
                          </button>
                          <button
                            onClick={() => onTransition(order.id, 'PREPARING')}
                            className="px-2.5 py-1 bg-stone-200 border border-gray-400 rounded text-xs font-medium cursor-pointer hover:bg-stone-300"
                          >
                            Pha chế (PREPARING) →
                          </button>
                        </>
                      )}

                      {/* Nếu status là PREPARING: Chuyển sang Pha xong (READY) */}
                      {status === 'PREPARING' && (
                        <button
                          onClick={() => onTransition(order.id, 'READY')}
                          className="px-2.5 py-1 bg-emerald-800 text-white rounded text-xs font-medium cursor-pointer hover:bg-emerald-900"
                        >
                          Pha xong (READY) →
                        </button>
                      )}

                      {/* Nếu status là READY: Chuyển sang Giao khách (COMPLETED) */}
                      {status === 'READY' && (
                        <button
                          onClick={() => onTransition(order.id, 'COMPLETED')}
                          className="px-2.5 py-1 bg-emerald-800 text-white rounded text-xs font-medium cursor-pointer hover:bg-emerald-900"
                        >
                          Giao khách (COMPLETED) ✓
                        </button>
                      )}
                    </div>
                  )}

                  {/* Thông báo nếu đơn đã ở trạng thái kết thúc */}
                  {status === 'COMPLETED' && (
                    <div className="pt-1 text-[11px] text-gray-500 font-mono text-right">
                      Trạng thái kết thúc: Đã giao thành công
                    </div>
                  )}
                  {status === 'CANCELLED' && (
                    <div className="pt-1 text-[11px] text-gray-500 font-mono text-right">
                      Trạng thái kết thúc: Đơn đã hủy
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Nút dưới cùng quay về Menu */}
      <div className="pt-4">
        <button
          onClick={onBackToMenu}
          className="w-full py-2.5 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
};
