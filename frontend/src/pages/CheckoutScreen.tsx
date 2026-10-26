/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, OrderStatus, formatPrice } from '../api';
import { CartLine } from '../types';

interface CheckoutScreenProps {
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
  simulateWalletError: boolean;
  setSimulateWalletError: (val: boolean) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
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
  simulateWalletError,
  setSimulateWalletError,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        {/* Header: Thanh toán & ← */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-400">
          <button
            onClick={onBackToCart}
            className="font-bold text-base cursor-pointer"
          >
            ←
          </button>
          <span className="font-bold text-base">Thanh toán</span>
          <span className="text-xs font-mono border border-gray-400 px-1.5 py-0.5 rounded bg-stone-100 font-medium">
            Điểm: {user?.loyaltyPoints ?? 0}
          </span>
        </div>

        <div className="mt-3 space-y-3.5">
          {/* Thông báo lỗi tồn kho (Product.stock) */}
          {stockError && (
            <div className="border border-red-500 p-2.5 bg-stone-100 rounded text-center space-y-1.5">
              <div className="text-xs font-bold text-red-700">
                {stockError}
              </div>
              <button
                onClick={() => {
                  setStockError(null);
                  onBackToCart();
                }}
                className="text-xs text-black underline cursor-pointer"
              >
                Quay lại Giỏ hàng để điều chỉnh
              </button>
            </div>
          )}

          {/* Thông báo trạng thái PAYMENT_FAILED nếu thanh toán gặp lỗi */}
          {checkoutStatus === 'PAYMENT_FAILED' && (
            <div className="border border-red-500 p-2.5 bg-stone-100 rounded text-center space-y-2">
              <div className="text-xs font-bold text-red-700">
                Trạng thái: PAYMENT_FAILED
              </div>
              <div className="text-xs text-red-600">
                Thanh toán thất bại, vui lòng thử lại!
              </div>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={onRetryPayment}
                  className="px-3 py-1 bg-emerald-800 text-white text-xs font-medium rounded cursor-pointer hover:bg-emerald-900"
                >
                  Thử lại
                </button>
                <button
                  onClick={onCancelCurrentOrder}
                  className="px-3 py-1 border border-gray-400 bg-white text-xs font-medium rounded cursor-pointer hover:bg-stone-200"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Tổng: [Tổng tiền]đ */}
          <div className="text-center font-bold text-sm">
            Tổng: {formatPrice(totalCartPrice)}
          </div>

          {/* Mục Phương thức (Mục 2) */}
          <div>
            <div className="text-xs font-bold text-center mb-2">
              Phương thức
            </div>
            <div className="space-y-2">
              {/* Tùy chọn A: (o) Ví điện tử */}
              <div
                className={`p-2.5 border rounded cursor-pointer transition-colors ${
                  paymentMethod === 'wallet'
                    ? 'bg-stone-200 border-black'
                    : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                }`}
                onClick={() => setPaymentMethod('wallet')}
              >
                <div className="text-xs font-medium">
                  {paymentMethod === 'wallet' ? '(o)' : '( )'} Ví điện tử
                </div>

                {paymentMethod === 'wallet' && (
                  <div className="pt-2 space-y-2.5">
                    {/* 2 nút chọn loại ví ngang nhau */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWalletType('MoMo');
                        }}
                        className={`py-1 text-xs border rounded cursor-pointer text-center ${
                          walletType === 'MoMo'
                            ? 'bg-white font-bold border-black'
                            : 'bg-stone-100 border-gray-400'
                        }`}
                      >
                        {walletType === 'MoMo' ? '(•)' : '( )'} MoMo
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWalletType('VNPay');
                        }}
                        className={`py-1 text-xs border rounded cursor-pointer text-center ${
                          walletType === 'VNPay'
                            ? 'bg-white font-bold border-black'
                            : 'bg-stone-100 border-gray-400'
                        }`}
                      >
                        {walletType === 'VNPay' ? '(•)' : '( )'} VNPay
                      </button>
                    </div>

                    {/* Khung Mã QR thanh toán chuẩn Wireframe */}
                    <div className="pt-1 text-center space-y-1.5">
                      <div className="w-36 h-36 mx-auto border border-gray-400 p-2 bg-white flex items-center justify-center">
                        {/* Authentic SVG QR Code */}
                        <svg
                          viewBox="0 0 100 100"
                          className="w-full h-full text-black"
                          fill="currentColor"
                        >
                          {/* Top-Left Finder */}
                          <rect x="6" y="6" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="4" />
                          <rect x="13" y="13" width="12" height="12" />
                          {/* Top-Right Finder */}
                          <rect x="68" y="6" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="4" />
                          <rect x="75" y="13" width="12" height="12" />
                          {/* Bottom-Left Finder */}
                          <rect x="6" y="68" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="4" />
                          <rect x="13" y="75" width="12" height="12" />
                          {/* Matrix modules */}
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

                      <p className="text-[11px] text-gray-700 leading-tight">
                        Quét mã QR bằng ứng dụng <span className="font-bold">{walletType}</span> để thanh toán
                      </p>
                      <p className="text-[10px] font-mono text-gray-500">
                        Nội dung: BREW-{totalCartPrice}
                      </p>

                      {/* Chế độ Demo: Giả lập lỗi thanh toán ví điện tử */}
                      <div
                        className="pt-2 mt-2 border-t border-gray-300 flex items-center justify-center gap-2 cursor-pointer select-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSimulateWalletError(!simulateWalletError);
                        }}
                      >
                        <input
                          type="checkbox"
                          id="simulateWalletError"
                          checked={simulateWalletError}
                          onChange={(e) => setSimulateWalletError(e.target.checked)}
                          className="cursor-pointer accent-red-700"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label
                          htmlFor="simulateWalletError"
                          className={`text-[11px] cursor-pointer ${
                            simulateWalletError ? 'text-red-700 font-bold' : 'text-gray-700'
                          }`}
                        >
                          Chế độ Demo: Giả lập lỗi thanh toán ví điện tử
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tùy chọn B: ( ) Thẻ ngân hàng */}
              <div
                className={`p-2.5 border rounded cursor-pointer transition-colors ${
                  paymentMethod === 'bank'
                    ? 'bg-stone-200 border-black'
                    : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                }`}
                onClick={() => setPaymentMethod('bank')}
              >
                <div className="text-xs font-medium">
                  {paymentMethod === 'bank' ? '(o)' : '( )'} Thẻ ngân hàng
                </div>

                {paymentMethod === 'bank' && (
                  <div className="pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                    {/* Ô 1: Số thẻ */}
                    <div>
                      <label className="block text-[10px] text-gray-600 mb-0.5">
                        Số thẻ
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={onCardNumberChange}
                        placeholder="0000 0000 0000 0000"
                        className="w-full p-1.5 border border-gray-400 bg-white text-xs font-mono focus:outline-none"
                      />
                    </div>

                    {/* Ô 2 & Ô 3: MM/YY và CVV chia đôi */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-600 mb-0.5">
                          MM/YY
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={onExpiryChange}
                          placeholder="MM/YY"
                          className="w-full p-1.5 border border-gray-400 bg-white text-xs font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-600 mb-0.5">
                          CVV
                        </label>
                        <input
                          type="password"
                          maxLength={3}
                          value={cardCvv}
                          onChange={onCvvChange}
                          placeholder="CVV"
                          className="w-full p-1.5 border border-gray-400 bg-white text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dòng chữ: Không dùng tiền mặt */}
          <div className="text-center text-xs text-gray-700 pt-1 font-medium">
            Không dùng tiền mặt
          </div>
        </div>
      </div>

      {/* Nút dưới cùng: Xác nhận trả */}
      <div className="pt-4">
        <button
          onClick={onConfirmPay}
          disabled={checkoutLoading || cartLines.length === 0}
          className="w-full py-2.5 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {checkoutLoading ? 'Đang xử lý...' : 'Xác nhận trả'}
        </button>
      </div>
    </div>
  );
};
