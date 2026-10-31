import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { User, OrderStatus, formatPrice } from '../api';
import { CartLine } from '../types';

interface ThanhToanProps {
  user: User | null;
  totalCartPrice: number;
  cartLines: CartLine[];
  stockError: string | null;
  setStockError: (err: string | null) => void;
  checkoutStatus: OrderStatus | null;
  checkoutLoading: boolean;
  paymentMethod: 'wallet' | 'bank';
  setPaymentMethod: (method: 'wallet' | 'bank') => void;
  walletType: 'MoMo' | 'VNPay';
  setWalletType: (type: 'MoMo' | 'VNPay') => void;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  onCardNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExpiryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCvvChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackToCart: () => void;
  onRetryPayment: () => void;
  onCancelCurrentOrder: () => void;
  onConfirmPay: () => void;
}

export const ThanhToan: React.FC<ThanhToanProps> = ({
  user,
  totalCartPrice,
  cartLines,
  stockError,
  setStockError,
  checkoutStatus,
  checkoutLoading,
  paymentMethod,
  setPaymentMethod,
  walletType,
  setWalletType,
  cardNumber,
  cardExpiry,
  cardCvv,
  onCardNumberChange,
  onExpiryChange,
  onCvvChange,
  onBackToCart,
  onRetryPayment,
  onCancelCurrentOrder,
  onConfirmPay,
}) => {
  return (
    <div className="w-full flex-1 flex flex-col space-y-5">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white rounded-xl border border-neutral-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Quay lại giỏ hàng"
            onClick={onBackToCart}
            className="w-9 h-9 rounded-lg border border-neutral-200/80 bg-white hover:bg-emerald-50/70 hover:text-emerald-900 text-neutral-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-base sm:text-lg text-neutral-900">
            Thanh toán đơn hàng
          </span>
        </div>
        <span className="text-xs sm:text-sm font-mono tabular-nums border border-emerald-800/15 px-3 py-1.5 rounded-lg bg-emerald-50/70 text-emerald-900">
          Điểm: <span className="font-semibold text-emerald-900">{user?.loyaltyPoints ?? 0}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          {stockError && (
            <div className="border border-neutral-200/80 p-4 bg-white rounded-xl text-center space-y-2">
              <div className="text-xs sm:text-sm font-medium text-neutral-900">{stockError}</div>
              <button
                type="button"
                onClick={() => {
                  setStockError(null);
                  onBackToCart();
                }}
                className="text-xs sm:text-sm text-emerald-800 hover:text-emerald-700 underline cursor-pointer font-medium"
              >
                Quay lại Giỏ hàng để điều chỉnh
              </button>
            </div>
          )}

          {checkoutStatus === 'PAYMENT_FAILED' && (
            <div className="border border-neutral-200/80 p-4 bg-white rounded-xl text-center space-y-2.5">
              <div className="text-xs sm:text-sm font-semibold text-neutral-900">
                Giao dịch chưa thành công
              </div>
              <div className="text-xs text-neutral-500">
                Vui lòng kiểm tra lại phương thức thanh toán hoặc thử lại.
              </div>
              <div className="flex justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onRetryPayment}
                  className="px-4 py-2 bg-emerald-800 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors"
                >
                  Thử lại
                </button>
                <button
                  type="button"
                  onClick={onCancelCurrentOrder}
                  className="px-4 py-2 border border-neutral-200/80 bg-white text-neutral-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  Hủy đơn
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-neutral-200/80 rounded-xl p-5 space-y-3.5">
            <div className="text-sm font-semibold text-neutral-900 pb-2 border-b border-neutral-200/80">
              Chọn phương thức thanh toán
            </div>

            <div
              className={`p-4 border rounded-xl cursor-pointer transition-colors bg-white ${
                paymentMethod === 'wallet'
                  ? 'border-emerald-800'
                  : 'border-neutral-200/80 hover:border-emerald-800/40'
              }`}
              onClick={() => setPaymentMethod('wallet')}
            >
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-neutral-900">
                <span>Ví điện tử (MoMo / VNPay QR)</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-medium ${
                    paymentMethod === 'wallet'
                      ? 'bg-emerald-50/70 text-emerald-900'
                      : 'text-neutral-400'
                  }`}
                >
                  {paymentMethod === 'wallet' ? 'Đang chọn' : 'Chọn'}
                </span>
              </div>

              {paymentMethod === 'wallet' && (
                <div className="pt-3.5 mt-3.5 border-t border-neutral-200/80 space-y-3.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['MoMo', 'VNPay'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWalletType(type);
                        }}
                        className={`py-2.5 text-xs sm:text-sm border rounded-lg cursor-pointer text-center transition-colors ${
                          walletType === type
                            ? 'bg-emerald-800 text-white font-medium border-emerald-800'
                            : 'bg-white text-neutral-600 border-neutral-200/80 hover:bg-emerald-50/70 hover:text-emerald-900'
                        }`}
                      >
                        Ví {type}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 text-center space-y-2">
                    <div className="w-36 h-36 mx-auto border border-neutral-200/80 rounded-xl p-3 bg-white flex items-center justify-center">
                      <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full text-emerald-950"
                        fill="currentColor"
                      >
                        <rect
                          x="6"
                          y="6"
                          width="26"
                          height="26"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <rect x="13" y="13" width="12" height="12" />
                        <rect
                          x="68"
                          y="6"
                          width="26"
                          height="26"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <rect x="75" y="13" width="12" height="12" />
                        <rect
                          x="6"
                          y="68"
                          width="26"
                          height="26"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <rect x="13" y="75" width="12" height="12" />
                        <rect x="38" y="8" width="5" height="5" />
                        <rect x="48" y="8" width="5" height="5" />
                        <rect x="58" y="8" width="5" height="5" />
                        <rect x="38" y="18" width="5" height="5" />
                        <rect x="53" y="18" width="5" height="5" />
                        <rect x="43" y="28" width="5" height="5" />
                        <rect x="58" y="28" width="5" height="5" />
                        <rect x="8" y="38" width="5" height="5" />
                        <rect x="18" y="38" width="5" height="5" />
                        <rect x="28" y="38" width="5" height="5" />
                        <rect x="38" y="38" width="10" height="10" />
                        <rect x="58" y="38" width="5" height="5" />
                        <rect x="68" y="38" width="10" height="5" />
                        <rect x="88" y="38" width="5" height="5" />
                        <rect x="8" y="48" width="5" height="5" />
                        <rect x="23" y="48" width="5" height="5" />
                        <rect x="33" y="48" width="5" height="5" />
                        <rect x="53" y="48" width="10" height="10" />
                        <rect x="73" y="48" width="5" height="5" />
                        <rect x="88" y="48" width="5" height="5" />
                        <rect x="8" y="58" width="5" height="5" />
                        <rect x="28" y="58" width="5" height="5" />
                        <rect x="38" y="58" width="5" height="5" />
                        <rect x="68" y="58" width="5" height="5" />
                        <rect x="78" y="58" width="5" height="5" />
                        <rect x="88" y="58" width="5" height="5" />
                        <rect x="38" y="68" width="10" height="5" />
                        <rect x="53" y="68" width="5" height="5" />
                        <rect x="63" y="68" width="5" height="5" />
                        <rect x="78" y="68" width="10" height="5" />
                        <rect x="43" y="78" width="5" height="5" />
                        <rect x="58" y="78" width="10" height="5" />
                        <rect x="73" y="78" width="5" height="5" />
                        <rect x="88" y="78" width="5" height="5" />
                        <rect x="38" y="88" width="5" height="5" />
                        <rect x="48" y="88" width="10" height="5" />
                        <rect x="68" y="88" width="5" height="5" />
                        <rect x="83" y="88" width="10" height="5" />
                      </svg>
                    </div>

                    <p className="text-xs text-neutral-600">
                      Quét mã bằng ứng dụng <strong className="text-emerald-900">{walletType}</strong>
                    </p>
                    <p className="text-[11px] font-mono text-neutral-400">
                      Nội dung: BREW-{totalCartPrice}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`p-4 border rounded-xl cursor-pointer transition-colors bg-white ${
                paymentMethod === 'bank'
                  ? 'border-emerald-800'
                  : 'border-neutral-200/80 hover:border-emerald-800/40'
              }`}
              onClick={() => setPaymentMethod('bank')}
            >
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-neutral-900">
                <span>Thẻ ngân hàng (Visa, Master, Napas)</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-medium ${
                    paymentMethod === 'bank'
                      ? 'bg-emerald-50/70 text-emerald-900'
                      : 'text-neutral-400'
                  }`}
                >
                  {paymentMethod === 'bank' ? 'Đang chọn' : 'Chọn'}
                </span>
              </div>

              {paymentMethod === 'bank' && (
                <div
                  className="pt-3.5 mt-3.5 border-t border-neutral-200/80 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Số thẻ</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={onCardNumberChange}
                      placeholder="0000 0000 0000 0000"
                      className="w-full p-2.5 border border-neutral-200/80 rounded-lg bg-white text-xs sm:text-sm text-neutral-900 font-mono focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Ngày hết hạn</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={onExpiryChange}
                        placeholder="MM/YY"
                        className="w-full p-2.5 border border-neutral-200/80 rounded-lg bg-white text-xs sm:text-sm text-neutral-900 font-mono focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Mã bảo mật CVV</label>
                      <input
                        type="password"
                        maxLength={3}
                        value={cardCvv}
                        onChange={onCvvChange}
                        placeholder="CVV"
                        className="w-full p-2.5 border border-neutral-200/80 rounded-lg bg-white text-xs sm:text-sm text-neutral-900 font-mono focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-6 bg-white border border-neutral-200/80 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm sm:text-base text-neutral-900 pb-2.5 border-b border-neutral-200/80">
            Chi tiết đơn thanh toán
          </h2>

          {cartLines.length > 0 && (
            <div className="space-y-2.5 pb-3 border-b border-neutral-200/80">
              {cartLines.map((line) => (
                <div key={line.item.id} className="flex justify-between items-start gap-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-medium text-neutral-900">
                      {line.productName}{' '}
                      <span className="font-normal text-neutral-500">
                        (Size {line.item.size}) · x{line.item.qty}
                      </span>
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-neutral-700 shrink-0">
                    {formatPrice(line.item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs sm:text-sm text-neutral-600 font-medium">
              Tổng số tiền thanh toán
            </span>
            <span className="font-mono tabular-nums font-bold text-lg text-emerald-800">
              {formatPrice(totalCartPrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={onConfirmPay}
            disabled={checkoutLoading || cartLines.length === 0}
            className="w-full py-3 bg-emerald-800 text-white font-medium text-sm rounded-lg cursor-pointer hover:bg-emerald-700 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
          >
            {checkoutLoading
              ? 'Đang xử lý giao dịch...'
              : `Xác nhận thanh toán · ${formatPrice(totalCartPrice)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThanhToan;
