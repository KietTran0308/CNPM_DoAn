import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils';
import {
  XCircle,
  RotateCcw,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';

export const PaymentFailureModal: React.FC = () => {
  const {
    isPaymentFailedModalOpen,
    closePaymentFailedModal,
    failedReason,
    cartTotal,
    cart,
    setCurrentScreen,
  } = useApp();

  if (!isPaymentFailedModalOpen) return null;

  const handleRetryPayment = () => {
    closePaymentFailedModal();
    setCurrentScreen('checkout');
  };

  const handlePickOtherMethod = () => {
    closePaymentFailedModal();
    setCurrentScreen('checkout');
  };

  const handleReturnToCart = () => {
    closePaymentFailedModal();
    setCurrentScreen('cart');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[var(--backdrop-blur-glass)] animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={closePaymentFailedModal} />

      {/* Liquid Glass Dialog Container */}
      <div className="relative z-10 w-full max-w-md liquid-glass liquid-glass-modal rounded-[20px] border border-white/90 shadow-2xl overflow-hidden">
        {/* Header Indicator */}
        <div className="p-6 text-center border-b border-black/5 bg-gradient-to-b from-red-500/10 via-amber-200/10 to-transparent">
          <div className="w-14 h-14 rounded-full bg-red-100/80 text-[#c93b2b] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <XCircle className="w-8 h-8 stroke-[2.2]" />
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-red-100 text-[#c93b2b] mb-2">
            Giao dịch gián đoạn
          </span>

          <h2 className="text-xl font-bold uppercase text-[#333333] tracking-tight">
            Thanh toán không thành công
          </h2>

          <p className="text-xs text-[#333333]/80 mt-2 p-3 rounded-[20px] text-left font-mono bg-white/70 backdrop-blur-[var(--backdrop-blur-glass)] border border-black/5">
            {failedReason || 'Giao dịch bị từ chối bởi ngân hàng hoặc thời gian chờ thanh toán đã hết hạn.'}
          </p>
        </div>

        {/* Retained Cart Assurance */}
        <div className="p-5 space-y-3.5">
          <div className="flex items-center gap-2.5 p-3 rounded-[14px] bg-emerald-50/70 border border-emerald-200 text-[#035542] text-xs font-semibold">
            <ShoppingBag className="w-4 h-4 text-[#035542] flex-shrink-0" />
            <span>
              Giỏ hàng ({cart.reduce((s, i) => s + i.quantity, 0)} món) vẫn được giữ nguyên để bạn thử lại.
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#333333] px-1 font-semibold">
            <span className="text-[#333333]/70">Tổng số tiền:</span>
            <span className="font-mono font-bold text-base text-[#035542]">
              {formatCurrency(cartTotal)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleRetryPayment}
              className="w-full py-3.5 px-4 rounded-full liquid-glass-emerald text-white hover:brightness-105 active:scale-[0.98] font-bold text-xs sm:text-sm uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử thanh toán lại ngay</span>
            </button>

            <button
              type="button"
              onClick={handlePickOtherMethod}
              className="w-full py-3 px-4 rounded-full liquid-glass border border-black/10 hover:bg-white text-[#333333] font-bold text-xs sm:text-sm uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <CreditCard className="w-4 h-4 text-[#035542]" />
              <span>Chọn phương thức khác</span>
            </button>

            <button
              type="button"
              onClick={handleReturnToCart}
              className="w-full py-2.5 px-4 rounded-full text-xs font-semibold text-[#333333]/70 hover:text-[#035542] cursor-pointer text-center"
            >
              Quay về giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
