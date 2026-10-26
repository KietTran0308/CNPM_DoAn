/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, formatPrice } from '../api';
import { CartLine } from '../types';

interface CartScreenProps {
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
  onApplyPromo: (e: React.FormEvent) => void;
  onRemovePromo: () => void;
  onCheckout: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
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
  onApplyPromo,
  onRemovePromo,
  onCheckout,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        {/* Header: Giỏ hàng & ← */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-400">
          <button
            onClick={onBack}
            className="font-bold text-base cursor-pointer"
          >
            ←
          </button>
          <span className="font-bold text-base">Giỏ hàng</span>
          <span className="text-xs font-mono border border-gray-400 px-1.5 py-0.5 rounded bg-stone-100 font-medium">
            Điểm: {user?.loyaltyPoints ?? 0}
          </span>
        </div>

        {/* Thông báo cập nhật món thành công */}
        {editSuccessToast && (
          <div className="mt-3 p-1.5 bg-emerald-50 border border-emerald-600 rounded text-center text-xs text-emerald-800 font-medium">
            ✓ Đã lưu thay đổi món thành công!
          </div>
        )}

        {/* Danh sách các món trong giỏ: [Tên món] [Size] [Topping] x[Số lượng] */}
        <div className="mt-4 space-y-2">
          {cartLines.length === 0 ? (
            <div className="text-center text-sm py-8 text-gray-500">
              Giỏ hàng trống
            </div>
          ) : (
            cartLines.map((line) => (
              <div
                key={line.item.id}
                className="p-2.5 bg-stone-100 border border-gray-400 rounded text-xs space-y-1.5"
              >
                <div className="flex justify-between items-start font-medium">
                  <div>
                    <div>
                      {line.productName} ({line.item.size}) x{line.item.qty}
                    </div>
                    {(line.toppings.length > 0 || line.sugar || line.ice) && (
                      <div className="text-[11px] text-gray-600 mt-0.5">
                        {line.toppings.length > 0 && `Topping: ${line.toppings.join(', ')} • `}
                        Đường: {line.sugar} • Đá: {line.ice}
                      </div>
                    )}
                    {line.note && (
                      <div className="text-[10px] text-gray-500 italic mt-0.5">
                        Ghi chú: {line.note}
                      </div>
                    )}
                  </div>
                  <span className="font-mono shrink-0 ml-2">
                    {formatPrice(line.item.lineTotal)}
                  </span>
                </div>

                <div className="flex justify-end items-center gap-2 pt-1 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(line)}
                    className="px-2 py-0.5 border border-gray-400 bg-white text-xs font-medium cursor-pointer hover:bg-stone-200 mr-auto"
                  >
                    [Sửa]
                  </button>
                  <button
                    onClick={() => onUpdateCartQty(line.item.id, -1)}
                    className="px-2 py-0.5 border border-gray-400 bg-white font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono">{line.item.qty}</span>
                  <button
                    onClick={() => onUpdateCartQty(line.item.id, 1)}
                    disabled={line.item.qty >= line.stock}
                    className="px-2 py-0.5 border border-gray-400 bg-white font-bold cursor-pointer disabled:text-gray-400"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemoveCartItem(line.item.id)}
                    className="px-2 py-0.5 border border-gray-400 bg-white text-red-700 cursor-pointer ml-1"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Áp mã giảm giá hợp lệ (Khuyến mãi) - Mục 2 */}
        {cartLines.length > 0 && (
          <div className="mt-3.5 pt-2 border-t border-gray-300">
            <form onSubmit={onApplyPromo} className="flex gap-1.5">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => {
                  setPromoCodeInput(e.target.value);
                  setPromoError(null);
                }}
                placeholder="Mã giảm giá (BREW10, GIAM10K)"
                disabled={appliedPromo !== null}
                className="flex-1 p-1.5 border border-gray-400 bg-white text-xs uppercase font-mono focus:outline-none disabled:bg-stone-200"
              />
              {appliedPromo ? (
                <button
                  type="button"
                  onClick={onRemovePromo}
                  className="px-2.5 py-1.5 border border-gray-400 bg-white text-red-700 text-xs font-medium cursor-pointer hover:bg-stone-200 shrink-0"
                >
                  Xóa mã
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!promoCodeInput.trim()}
                  className="px-3 py-1.5 bg-emerald-800 text-white text-xs font-medium rounded cursor-pointer hover:bg-emerald-900 disabled:bg-gray-300 disabled:text-gray-500 shrink-0"
                >
                  Áp dụng
                </button>
              )}
            </form>
            {promoError && (
              <div className="text-[11px] text-red-600 mt-1 font-medium">
                {promoError}
              </div>
            )}
          </div>
        )}

        {/* Đường kẻ phân cách & Tổng tiền */}
        {cartLines.length > 0 && (
          <div className="mt-3">
            <div className="text-center text-gray-500 tracking-widest text-xs select-none">
              – - - - - - - - -
            </div>
            <div className="mt-2 space-y-1">
              {appliedPromo && (
                <>
                  <div className="flex justify-between items-center text-xs text-gray-700">
                    <span>Tạm tính:</span>
                    <span className="font-mono">{formatPrice(rawSubtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-emerald-800 font-medium">
                    <span>Giảm giá ({appliedPromo.code}):</span>
                    <span className="font-mono">-{formatPrice(discountAmount)}</span>
                  </div>
                </>
              )}
              <div className="text-center font-bold text-sm pt-1">
                Tổng: {formatPrice(totalCartPrice)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nút dưới cùng: Thanh toán */}
      <div className="pt-4">
        <button
          onClick={onCheckout}
          disabled={cartLines.length === 0}
          className={`w-full py-2.5 font-medium text-sm rounded ${
            cartLines.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-800 text-white cursor-pointer hover:bg-emerald-900'
          }`}
        >
          Thanh toán
        </button>
      </div>
    </div>
  );
};
