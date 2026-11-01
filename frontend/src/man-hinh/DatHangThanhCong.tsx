import React from 'react';
import { Order, OrderStatus, User } from '../api';
import { TienTrinhDon } from '../components/TienTrinhDon';

interface DatHangThanhCongProps {
  lastOrder: Order | null;
  user: User | null;
  onBackToMenu: () => void;
  onViewHistory: () => void;
  onTransitionOrder?: (orderId: string, targetStatus: OrderStatus) => void;
  statusNotice?: { type: 'success' | 'error' | 'ready'; message: string } | null;
  onClearNotice?: () => void;
}

export const DatHangThanhCong: React.FC<DatHangThanhCongProps> = ({
  lastOrder,
  user,
  onBackToMenu,
  onViewHistory,
  onTransitionOrder,
  statusNotice,
  onClearNotice,
}) => {
  const trangThaiHienTai: OrderStatus = lastOrder ? lastOrder.status : 'PAID';
  const maDon = lastOrder ? lastOrder.id : '1042';
  const diemCongThem = Math.floor((lastOrder?.total || 0) / 10000);

  const layNhanTrangThai = (st: OrderStatus) => {
    switch (st) {
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
        return 'Thanh toán chưa hoàn tất';
      case 'CANCELLED':
        return 'Đã hủy';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center py-4 sm:py-8 space-y-5">
      <div className="space-y-4">
        {statusNotice && statusNotice.type !== 'error' && (
          <div className="px-4 py-3 rounded-xl border border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35] text-xs sm:text-sm font-medium flex justify-between items-start gap-2">
            <span className="leading-relaxed">{statusNotice.message}</span>
            {onClearNotice && (
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={onClearNotice}
                className="text-[#124E35] hover:opacity-80 px-1 cursor-pointer shrink-0 font-mono font-bold"
              >
                ×
              </button>
            )}
          </div>
        )}

        <div className="p-5 sm:p-6 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl text-center space-y-1.5">
          <h2 className="font-semibold text-lg sm:text-xl text-[#124E35]">
            Đặt đơn hàng thành công
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600">
            Đơn của bạn đã được thanh toán và chuyển xuống quầy pha chế
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4 sm:p-5 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl text-center">
            <span className="text-xs text-neutral-600 block">Mã đơn nhận nước</span>
            <span className="font-mono font-bold text-lg sm:text-xl text-[#124E35] mt-1 block">
              #{maDon}
            </span>
          </div>
          <div className="p-4 sm:p-5 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl text-center flex flex-col items-center justify-center">
            <span className="text-xs text-neutral-600 block">Trạng thái hiện tại</span>
            <span className="mt-1.5 px-3 py-1 rounded-md border border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35] text-xs sm:text-sm font-semibold">
              {layNhanTrangThai(trangThaiHienTai)}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl space-y-3">
          <TienTrinhDon
            status={trangThaiHienTai}
            onNextStep={
              onTransitionOrder && (trangThaiHienTai === 'PAID' || trangThaiHienTai === 'PREPARING')
                ? () =>
                    onTransitionOrder(
                      maDon,
                      trangThaiHienTai === 'PAID' ? 'PREPARING' : 'READY'
                    )
                : undefined
            }
          />
          {onTransitionOrder &&
            (trangThaiHienTai === 'PENDING' || trangThaiHienTai === 'PAID') && (
              <div className="pt-2 border-t border-[#E2D9C0] flex justify-end">
                <button
                  type="button"
                  onClick={() => onTransitionOrder(maDon, 'CANCELLED')}
                  className="px-3.5 py-1.5 border border-[#D5CCB4] bg-[#EDE6D1] rounded-lg text-xs font-semibold text-[#124E35] cursor-pointer hover:bg-[#124E35] hover:text-[#F5F0E1] transition-colors"
                >
                  Hủy đơn
                </button>
              </div>
            )}
        </div>

        {trangThaiHienTai === 'READY' && (
          <div className="p-4 bg-[#EDE6D1] border border-[#D5CCB4] text-[#124E35] rounded-xl text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="leading-relaxed font-medium">
              Đồ uống của bạn đã pha xong. Mời bạn đến quầy đọc mã đơn{' '}
              <strong className="font-mono">#{maDon}</strong> để nhận nước.
            </span>
            {onTransitionOrder && (
              <button
                type="button"
                onClick={() => onTransitionOrder(maDon, 'COMPLETED')}
                className="px-4 py-2 bg-[#124E35] text-[#F5F0E1] font-semibold text-xs sm:text-sm rounded-lg cursor-pointer hover:opacity-95 transition-colors shrink-0"
              >
                Đã nhận nước
              </button>
            )}
          </div>
        )}

        <div className="px-4 sm:px-5 py-3.5 rounded-xl bg-[#FBF9F5] border border-[#E2D9C0] flex items-center justify-between text-xs sm:text-sm">
          <span className="text-neutral-700">
            Điểm thưởng đơn này: <strong className="text-[#124E35]">+{diemCongThem} điểm</strong>
          </span>
          <span className="font-mono tabular-nums font-semibold text-[#124E35]">
            Tổng: {user?.loyaltyPoints ?? 0} điểm
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onBackToMenu}
          className="w-full py-3 border border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35] text-xs sm:text-sm font-semibold rounded-lg cursor-pointer hover:bg-[#124E35] hover:text-[#F5F0E1] transition-colors"
        >
          Về thực đơn chính
        </button>
        <button
          type="button"
          onClick={onViewHistory}
          className="w-full py-3 bg-[#124E35] text-[#F5F0E1] font-semibold text-sm rounded-lg cursor-pointer hover:opacity-95 transition-colors"
        >
          Theo dõi lịch sử đơn hàng
        </button>
      </div>
    </div>
  );
};

export default DatHangThanhCong;

