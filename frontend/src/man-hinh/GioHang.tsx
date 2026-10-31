import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { User, formatPrice } from '../api';
import { CartLine } from '../types';

interface GioHangProps {
  cartLines: CartLine[];
  user: User | null;
  editSuccessToast: boolean;
  promoCodeInput: string;
  setPromoCodeInput: (code: string) => void;
  appliedPromo: { code: string; discount: number } | null;
  promoError: string | null;
  setPromoError: (error: string | null) => void;
  rawSubtotal: number;
  discountAmount: number;
  totalCartPrice: number;
  onBack: () => void;
  onOpenEditModal: (line: CartLine) => void;
  onUpdateCartQty: (itemId: string, delta: number) => void;
  onRemoveCartItem: (itemId: string) => void;
  onClearCart?: () => void;
  onApplyPromo: (e: React.FormEvent) => void;
  onRemovePromo: () => void;
  onCheckout: () => void;
}

export const GioHang: React.FC<GioHangProps> = ({
  cartLines,
  user,
  editSuccessToast,
  promoCodeInput,
  setPromoCodeInput,
  appliedPromo,
  promoError,
  setPromoError,
  rawSubtotal,
  discountAmount,
  totalCartPrice,
  onBack,
  onOpenEditModal,
  onUpdateCartQty,
  onRemoveCartItem,
  onClearCart,
  onApplyPromo,
  onRemovePromo,
  onCheckout,
}) => {
  const tongSoLy = cartLines.reduce((sum, l) => sum + l.item.qty, 0);

  return (
    <div className="w-full flex-1 flex flex-col space-y-5">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white rounded-xl border border-neutral-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Quay lại thực đơn"
            onClick={onBack}
            className="w-9 h-9 rounded-lg border border-neutral-200/80 bg-white hover:bg-emerald-50/70 hover:text-emerald-900 text-neutral-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-base sm:text-lg text-neutral-900">
            Giỏ hàng {tongSoLy > 0 && `(${tongSoLy})`}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {cartLines.length > 0 && onClearCart && (
            <button
              type="button"
              onClick={onClearCart}
              className="px-3 py-1.5 rounded-lg border border-neutral-200/80 bg-white hover:bg-stone-50 text-neutral-600 hover:text-neutral-900 text-xs sm:text-sm cursor-pointer transition-colors"
            >
              Xóa tất cả
            </button>
          )}
          <span className="text-xs sm:text-sm font-mono tabular-nums border border-emerald-800/15 px-3 py-1.5 rounded-lg bg-emerald-50/70 text-emerald-900">
            Điểm: <span className="font-semibold text-emerald-900">{user?.loyaltyPoints ?? 0}</span>
          </span>
        </div>
      </div>

      {editSuccessToast && (
        <div className="px-4 py-2.5 bg-emerald-50/70 border border-emerald-800/20 rounded-xl text-center text-xs sm:text-sm text-emerald-900 font-medium">
          Đã lưu thay đổi tùy chọn món thành công
        </div>
      )}

      {cartLines.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white border border-neutral-200/80 rounded-xl space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-900">Giỏ hàng của bạn đang trống</p>
            <p className="text-xs text-neutral-500">
              Hãy chọn những món cà phê và trà yêu thích từ thực đơn.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-emerald-800 text-white text-xs sm:text-sm font-medium hover:bg-emerald-700 cursor-pointer transition-colors"
          >
            Quay lại thực đơn
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 xl:col-span-8 space-y-3.5">
            {cartLines.map((line) => (
              <div
                key={line.item.id}
                className="p-4 sm:p-5 bg-white border border-neutral-200/80 rounded-xl text-xs sm:text-sm space-y-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="font-semibold text-neutral-900 text-sm sm:text-base">
                      {line.productName}{' '}
                      <span className="text-xs sm:text-sm font-normal text-neutral-500">
                        (Size {line.item.size}) · x{line.item.qty}
                      </span>
                    </div>
                    {(line.toppings.length > 0 || line.sugar || line.ice) && (
                      <div className="text-xs text-neutral-500">
                        {line.toppings.length > 0 && `Topping: ${line.toppings.join(', ')} · `}
                        Đường: {line.sugar} · Đá: {line.ice}
                      </div>
                    )}
                    {line.note && (
                      <div className="text-xs text-neutral-500 italic">
                        Ghi chú: &ldquo;{line.note}&rdquo;
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono tabular-nums font-bold text-sm sm:text-base text-emerald-800 block">
                      {formatPrice(line.item.lineTotal)}
                    </span>
                    {line.item.qty > 1 && (
                      <span className="font-mono tabular-nums text-[11px] text-neutral-500">
                        {formatPrice(line.unitPrice)} / ly
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-neutral-200/80">
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(line)}
                    className="px-3 py-1.5 border border-emerald-800/20 bg-emerald-50/70 rounded-lg text-xs text-emerald-900 font-medium cursor-pointer hover:bg-emerald-800 hover:text-white transition-colors"
                  >
                    Tùy chỉnh
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Giảm số lượng"
                      onClick={() => onUpdateCartQty(line.item.id, -1)}
                      className="w-8 h-8 border border-neutral-200/80 bg-white rounded-lg flex items-center justify-center text-neutral-700 font-mono hover:bg-emerald-50/70 hover:text-emerald-900 cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <span className="w-7 text-center font-mono tabular-nums font-semibold text-neutral-900">
                      {line.item.qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Tăng số lượng"
                      onClick={() => onUpdateCartQty(line.item.id, 1)}
                      disabled={line.item.qty >= line.stock}
                      className="w-8 h-8 border border-neutral-200/80 bg-white rounded-lg flex items-center justify-center text-neutral-700 font-mono hover:bg-emerald-50/70 hover:text-emerald-900 cursor-pointer disabled:opacity-40 transition-colors"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      aria-label="Xóa món"
                      onClick={() => onRemoveCartItem(line.item.id)}
                      className="px-2.5 py-1.5 border border-neutral-200/80 bg-white hover:bg-stone-50 text-neutral-600 hover:text-neutral-900 rounded-lg cursor-pointer ml-1 transition-colors text-xs"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 bg-white border border-neutral-200/80 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-sm sm:text-base text-neutral-900 pb-2.5 border-b border-neutral-200/80">
              Tóm tắt đơn hàng
            </h2>

            <div>
              <form onSubmit={onApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => {
                    setPromoCodeInput(e.target.value);
                    setPromoError(null);
                  }}
                  placeholder="Mã ưu đãi (BREW10 hoặc GIAM10K)"
                  disabled={appliedPromo !== null}
                  className="flex-1 px-3 py-2 border border-neutral-200/80 rounded-lg bg-white text-xs text-neutral-900 uppercase font-mono placeholder:text-neutral-400 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 disabled:bg-stone-100 disabled:text-neutral-500 transition-colors"
                />
                {appliedPromo ? (
                  <button
                    type="button"
                    onClick={onRemovePromo}
                    className="px-3 py-2 border border-neutral-200/80 bg-white text-neutral-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-stone-50 shrink-0 transition-colors"
                  >
                    Bỏ mã
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!promoCodeInput.trim()}
                    className="px-3.5 py-2 bg-emerald-800 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-emerald-700 disabled:bg-neutral-200 disabled:text-neutral-400 shrink-0 transition-colors"
                  >
                    Áp dụng
                  </button>
                )}
              </form>
              {promoError && (
                <div className="text-xs text-neutral-600 mt-1.5">{promoError}</div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-200/80">
              <div className="flex justify-between items-center text-xs sm:text-sm text-neutral-600">
                <span>Tạm tính ({tongSoLy} món)</span>
                <span className="font-mono tabular-nums text-neutral-900">
                  {formatPrice(rawSubtotal)}
                </span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between items-center text-xs sm:text-sm text-emerald-800 font-medium">
                  <span>Ưu đãi ({appliedPromo.code})</span>
                  <span className="font-mono tabular-nums">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2.5 border-t border-neutral-200/80">
                <span className="font-semibold text-sm text-neutral-900">Tổng thanh toán</span>
                <span className="font-mono tabular-nums font-bold text-lg text-emerald-800">
                  {formatPrice(totalCartPrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              disabled={cartLines.length === 0}
              className="w-full py-3 bg-emerald-800 text-white font-medium text-sm rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors"
            >
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GioHang;
