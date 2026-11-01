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
        <div className="flex justify-between items-center px-3 py-2 rounded-lg border border-[#D5CCB4] bg-[#F4EFE0] text-xs">
          <span className="text-[#124E35] font-medium">Trạng thái đơn hàng</span>
          <span className="px-2.5 py-0.5 rounded-md border border-[#D5CCB4] bg-[#EDE6D1] text-[11px] font-semibold text-[#124E35]">
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
      <div className="flex justify-between items-center text-[11px] text-neutral-600">
        <span className="font-medium text-[#124E35]">Tiến trình đơn hàng</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono tabular-nums text-[#124E35] font-semibold">
            Bước {currentStep}/4 · {tenBuocHienTai}
          </span>
          {(status === 'PAID' || status === 'PREPARING') && onNextStep && (
            <button
              type="button"
              onClick={onNextStep}
              className="w-6 h-6 rounded-md border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] text-[#124E35] font-mono text-xs flex items-center justify-center cursor-pointer transition-colors leading-none font-semibold"
            >
              →
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {cacBuoc.map((st) => {
          const isCurrent = currentStep === st.num;

          const cardStyle = isCurrent
            ? 'border-[#124E35] bg-[#124E35] text-[#F5F0E1]'
            : 'border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35]';

          return (
            <div
              key={st.num}
              className={`p-2 border rounded-lg transition-colors flex flex-col justify-between min-h-[50px] ${cardStyle}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono font-semibold">Bước {st.num}</span>
              </div>
              <div className="mt-1">
                <div className="text-[11px] font-semibold leading-tight truncate">{st.title}</div>
                <div className="text-[10px] opacity-85 leading-tight truncate mt-0.5">
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

