/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OrderStatus } from '../api';

interface OrderStepperProps {
  status: OrderStatus;
}

export const OrderStepper: React.FC<OrderStepperProps> = ({ status }) => {
  // Map standard 4-step state machine
  const getStepIndex = (st: OrderStatus): number => {
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
        return 0; // PENDING, PAYMENT_FAILED, CANCELLED
    }
  };

  const currentStep = getStepIndex(status);

  // If status is outside the 4 main progression steps
  if (currentStep === 0) {
    let label = 'Chờ xử lý';
    let style = 'bg-stone-200 text-black border-gray-400';
    if (status === 'PAYMENT_FAILED') {
      label = 'Thanh toán lỗi';
      style = 'bg-red-50 text-red-700 border-red-400';
    } else if (status === 'CANCELLED') {
      label = 'Đã hủy đơn';
      style = 'bg-stone-200 text-gray-500 border-gray-400 line-through';
    }

    return (
      <div className="py-2">
        <div className="flex justify-between items-center px-2 py-1.5 border rounded text-xs font-mono font-medium bg-stone-50 border-gray-300">
          <span className="text-[11px] text-gray-500 uppercase">Tiến trình đơn:</span>
          <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${style}`}>
            {status} ({label})
          </span>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, key: 'PAID', title: 'PAID', desc: 'Đã gửi quầy' },
    { num: 2, key: 'PREPARING', title: 'PREPARING', desc: 'Đang pha chế' },
    { num: 3, key: 'READY', title: 'READY', desc: 'Mời lấy nước' },
    { num: 4, key: 'COMPLETED', title: 'COMPLETED', desc: 'Đã nhận nước' },
  ];

  return (
    <div className="py-2 space-y-1.5">
      <div className="flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-wider">
        <span>Tiến trình đơn hàng</span>
        <span className="font-bold">
          {currentStep}/4: {status}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1 text-center font-mono">
        {steps.map((st) => {
          const isCurrent = currentStep === st.num;
          const isDone = currentStep > st.num;

          let stepStyle = 'border-gray-300 bg-white text-gray-400';
          if (isCurrent) {
            if (st.key === 'READY') {
              stepStyle = 'border-emerald-800 bg-emerald-800 text-white font-bold';
            } else {
              stepStyle = 'border-black bg-stone-200 text-black font-bold';
            }
          } else if (isDone) {
            stepStyle = 'border-gray-400 bg-stone-100 text-gray-700 font-medium';
          }

          return (
            <div
              key={st.num}
              className={`p-1.5 border rounded transition-all flex flex-col justify-between min-h-[48px] ${stepStyle}`}
            >
              <div className="text-[10px] leading-tight">
                {st.num}. {st.title}
              </div>
              <div className="text-[9px] mt-0.5 leading-tight opacity-90">
                {st.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
