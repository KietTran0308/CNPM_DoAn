// frontend/src/components/CartDrawer.tsx
import React from 'react';
import { useCart } from '../context/CartContext';
import { CartItem } from '../types';

interface CartDrawerProps {
  onCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const {
    isCartOpen,
    closeCart,
    cart,
    cartCount,
    cartSubtotal,
    discount,
    pointsDiscount,
    cartTotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  if (!isCartOpen) return null;

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Lớp nền mờ */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={closeCart} 
      />

      {/* Drawer Container */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            Giỏ hàng <span className="text-sm font-normal text-gray-500">({cartCount} món)</span>
          </h2>
          <button
            onClick={closeCart}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Đóng giỏ hàng"
          >
            ✕
          </button>
        </div>

        {/* Danh sách món */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 px-5">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-500">
              <p>Chưa có món nào trong giỏ hàng</p>
            </div>
          ) : (
            cart.map((item: CartItem) => (
              <div key={item.cartItemId} className="py-4">
                {/* 1. Tên món & Nút xoá */}
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Xoá
                  </button>
                </div>

                {/* 2. Size & 3. Topping */}
                <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                  <p>
                    <span className="font-medium text-gray-700">Size:</span> {item.size.name}
                    {item.size.extraPrice > 0 && ` (+${formatVND(item.size.extraPrice)})`}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Topping:</span>{' '}
                    {item.toppings && item.toppings.length > 0
                      ? item.toppings.map((t) => t.name).join(', ')
                      : 'Không có'}
                  </p>
                </div>

                {/* 4. Số lượng & 5. Tổng tiền món */}
                <div className="mt-3 flex items-center justify-between">
                  {/* Bộ điều khiển số lượng */}
                  <div className="flex items-center rounded border border-gray-300">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, -1)}
                      disabled={item.quantity <= 1}
                      className="h-7 w-7 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-gray-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, 1)}
                      className="h-7 w-7 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  {/* Giá từng món = (đơn giá + option) * số lượng */}
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-700">
                      {formatVND(item.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Tổng tiền thanh toán */}
        {cart.length > 0 && (
          <div className="border-t bg-gray-50 p-5 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span className="font-medium">{formatVND(cartSubtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá voucher</span>
                  <span>-{formatVND(discount)}</span>
                </div>
              )}

              {pointsDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Điểm thưởng</span>
                  <span>-{formatVND(pointsDiscount)}</span>
                </div>
              )}

              {/* Tổng tiền cuối cùng */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                <span>Tổng tiền:</span>
                <span className="text-lg text-amber-600">{formatVND(cartTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                closeCart();
                onCheckout?.();
              }}
              className="w-full rounded-lg bg-amber-600 py-3 font-semibold text-white shadow hover:bg-amber-700 transition-colors"
            >
              Thanh toán ngay ({cartCount} món)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};