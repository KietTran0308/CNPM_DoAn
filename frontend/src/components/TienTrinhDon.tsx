import React from 'react';
import { OrderStatus } from '../api';

interface TienTrinhDonProps {
  status: OrderStatus;
  onNextStep?: () => void;
}

export const TienTrinhDon: React.FC<TienTrinhDonProps> = ({ status, onNextStep }) => {
  const layBuocHienTai = (st: OrderStatus): number => {
    switch (st) {
      case 'PAID':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = layBuocHienTai(status);

  if (currentStep === 0) {
    let label = 'Chờ thanh toán';

    if (status === 'PAYMENT_FAILED') {
      label = 'Thanh toán chưa hoàn tất';
    } else if (status === 'CANCELLED') {
      label = 'Đơn đã hủy';
    }

    return (
      <div className="py-1">
        <div className="flex justify-between items-center px-3 py-2 rounded-lg border border-neutral-200/80 bg-stone-50 text-xs">
          <span className="text-neutral-500">Trạng thái đơn hàng</span>
          <span className="px-2 py-0.5 rounded-md border border-neutral-200/80 bg-white text-[11px] font-medium text-neutral-700">
            {label}
          </span>
        </div>
      </div>
    );
  }

  const cacBuoc = [
    { num: 1, title: 'Đã nhận', desc: 'Chuyển quầy' },
    { num: 2, title: 'Đang pha chế', desc: 'Chuẩn bị món' },
    { num: 3, title: 'Sẵn sàng', desc: 'Mời lấy nước' },
    { num: 4, title: 'Hoàn tất', desc: 'Đã giao' },
  ];

  const tenBuocHienTai = cacBuoc.find((b) => b.num === currentStep)?.title || '';

  return (
    <div className="py-1 space-y-2">
      <div className="flex justify-between items-center text-[11px] text-neutral-500">
        <span>Tiến trình đơn hàng</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono tabular-nums text-emerald-900 font-medium">
            Bước {currentStep}/4 · {tenBuocHienTai}
          </span>
          {(status === 'PAID' || status === 'PREPARING') && onNextStep && (
            <button
              type="button"
              onClick={onNextStep}
              className="w-6 h-6 rounded-md border border-emerald-800/25 bg-emerald-50/80 hover:bg-emerald-800 hover:text-white text-emerald-900 font-mono text-xs flex items-center justify-center cursor-pointer transition-colors leading-none"
            >
              →
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {cacBuoc.map((st) => {
          const isCurrent = currentStep === st.num;
          const isDone = currentStep > st.num;

          let cardStyle = 'border-neutral-200/80 bg-white text-neutral-400';
          if (isCurrent) {
            cardStyle = 'border-emerald-800 bg-emerald-800 text-white';
          } else if (isDone) {
            cardStyle = 'border-emerald-800/20 bg-emerald-50/70 text-emerald-900';
          }

          return (
            <div
              key={st.num}
              className={`p-2 border rounded-lg transition-colors flex flex-col justify-between min-h-[50px] ${cardStyle}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono">Bước {st.num}</span>
              </div>
              <div className="mt-1">
                <div className="text-[11px] font-medium leading-tight truncate">{st.title}</div>
                <div className="text-[10px] opacity-80 leading-tight truncate mt-0.5">
                  {st.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
