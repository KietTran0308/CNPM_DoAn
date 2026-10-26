/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order, OrderStatus, User } from '../api';
import { OrderStepper } from '../components/OrderStepper';

interface SuccessScreenProps {
  lastOrder: Order | null;
  user: User | null;
  onBackToMenu: () => void;
  onViewHistory: () => void;
  onTransitionOrder?: (orderId: string, targetStatus: OrderStatus) => void;
  statusNotice?: { type: 'success' | 'error' | 'ready'; message: string } | null;
  onClearNotice?: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  lastOrder,
  user,
  onBackToMenu,
  onViewHistory,
  onTransitionOrder,
  statusNotice,
  onClearNotice,
}) => {
  const currentStatus: OrderStatus = lastOrder ? lastOrder.status : 'PAID';
  const orderId = lastOrder ? lastOrder.id : '1042';

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="space-y-3 pt-2">
        {/* Banner Thông báo phản hồi trạng thái khi chuyển bước (tối giản, không icon) */}
        {statusNotice && statusNotice.type !== 'error' && (
          <div
            className={`p-2.5 rounded border text-xs font-medium ${
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
                  className="ml-2 font-mono text-[11px] underline cursor-pointer"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tiêu đề & Biểu tượng xác nhận tối giản */}
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold text-emerald-800">✓</div>
          <div className="font-bold text-sm">Xác nhận đơn hàng thành công</div>
          <div className="text-xs text-gray-600">
            Đơn của bạn đã được thanh toán và chuyển xuống quầy
          </div>
        </div>

        {/* Khung tóm tắt mã đơn & Trạng thái */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono font-medium">
          <div className="p-2 bg-stone-100 border border-gray-400 rounded text-center">
            <span className="text-[10px] text-gray-500 block">MÃ ĐƠN HÀNG</span>
            <span className="font-bold text-sm">#{orderId}</span>
          </div>
          <div className="p-2 bg-stone-100 border border-gray-400 rounded text-center">
            <span className="text-[10px] text-gray-500 block">TRẠNG THÁI HIỆN TẠI</span>
            <span
              className={`font-bold text-xs ${
                currentStatus === 'READY'
                  ? 'text-emerald-800'
                  : currentStatus === 'PAID'
                  ? 'text-black'
                  : 'text-gray-800'
              }`}
            >
              {currentStatus}
            </span>
          </div>
        </div>

        {/* THANH TIẾN TRÌNH TRẠNG THÁI ĐƠN HÀNG (ORDER STEPPER) */}
        <OrderStepper status={currentStatus} />

        {/* THÔNG BÁO MỜI RA QUẦY LẤY NƯỚC KHI ĐƠN Ở TRẠNG THÁI READY */}
        {currentStatus === 'READY' && (
          <div className="p-3 bg-emerald-50 border border-emerald-800 text-emerald-900 rounded text-xs font-medium text-center">
            Đồ uống của bạn đã pha xong. Mời bạn đến quầy đọc mã đơn #{orderId} để nhận nước.
          </div>
        )}

        {/* Dòng điểm thưởng tích lũy */}
        <div className="text-center text-xs text-emerald-800 font-mono font-medium">
          + {Math.floor((lastOrder?.total || 0) / 10000)} điểm tích lũy (Tổng: {user?.loyaltyPoints ?? 0} điểm)
        </div>

        {/* CÁC NÚT CHUYỂN TRẠNG THÁI HỢP LỆ THEO TIẾN TRÌNH */}
        {onTransitionOrder && (
          <div className="p-2.5 bg-stone-100 border border-gray-400 rounded text-xs space-y-2">
            <div className="flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-wider">
              <span>Tiến độ xử lý tại quầy</span>
              <span>{currentStatus}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-start">
              {currentStatus === 'PAID' && (
                <button
                  onClick={() => onTransitionOrder(orderId, 'PREPARING')}
                  className="px-2.5 py-1 bg-stone-200 border border-gray-400 rounded text-xs font-medium cursor-pointer hover:bg-stone-300"
                >
                  Nhận pha chế (PREPARING) →
                </button>
              )}

              {currentStatus === 'PREPARING' && (
                <button
                  onClick={() => onTransitionOrder(orderId, 'READY')}
                  className="px-2.5 py-1 bg-emerald-800 text-white rounded text-xs font-medium cursor-pointer hover:bg-emerald-900"
                >
                  Pha xong (READY) →
                </button>
              )}

              {currentStatus === 'READY' && (
                <button
                  onClick={() => onTransitionOrder(orderId, 'COMPLETED')}
                  className="px-2.5 py-1 bg-emerald-800 text-white rounded text-xs font-medium cursor-pointer hover:bg-emerald-900"
                >
                  Giao khách (COMPLETED) ✓
                </button>
              )}

              {currentStatus === 'COMPLETED' && (
                <div className="text-[11px] text-gray-600 italic">
                  Đơn hàng đã hoàn tất. Cảm ơn bạn đã đặt món tại BrewLite.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nút hành động chính */}
      <div className="pt-4 space-y-2">
        <button
          onClick={onViewHistory}
          className="w-full py-2.5 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900"
        >
          Theo dõi lịch sử đơn hàng
        </button>
        <button
          onClick={onBackToMenu}
          className="w-full py-2 border border-gray-400 bg-stone-100 text-black text-xs font-medium rounded cursor-pointer hover:bg-stone-200"
        >
          Về thực đơn chính
        </button>
      </div>
    </div>
  );
};
