import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  Coffee,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    closeCart,
    openEditCartItem,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    discount,
    voucherCode,
    applyVoucher,
    cartTotal,
    setCurrentScreen,
  } = useApp();

  const [inputCode, setInputCode] = useState(voucherCode);
  const [voucherMsg, setVoucherMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const res = applyVoucher(inputCode);
    setVoucherMsg({ text: res.message, isError: !res.success });
  };

  const handleProceedToCheckout = () => {
    closeCart();
    setCurrentScreen('checkout');
  };

  const totalQuantity = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-[var(--backdrop-blur-glass)] transition-opacity duration-200">
      <div className="fixed inset-0" onClick={closeCart} />

      {/* Cart Container with Liquid Glass finish */}
      <div className="relative z-10 w-full max-w-lg liquid-glass liquid-glass-drawer rounded-t-[20px] sm:rounded-[20px] border border-white/90 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between bg-white/70 backdrop-blur-[var(--backdrop-blur-glass)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-900/10 text-[#035542] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase text-[#333333] tracking-tight">Giỏ hàng của bạn</h2>
              <span className="text-xs text-[#035542] font-semibold">
                {cart.length > 0 ? `${totalQuantity} món đã chọn` : 'Chưa có món nào'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-[#333333]/70 hover:text-[#c93b2b] font-semibold px-2.5 py-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              >
                Xóa tất cả
              </button>
            )}
            <button
              onClick={closeCart}
              className="w-8 h-8 rounded-full border border-black/10 hover:border-black/20 flex items-center justify-center text-[#333333] bg-white/80 transition-colors cursor-pointer"
              aria-label="Đóng giỏ hàng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <Coffee className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-[#333333] text-base">Giỏ hàng đang trống</h3>
              <p className="text-xs text-[#333333]/70 mt-1 max-w-xs mx-auto">
                Hãy chọn món cà phê hoặc kem thủ công thơm ngon nhé!
              </p>
              <button
                onClick={() => {
                  closeCart();
                  setCurrentScreen('menu');
                }}
                className="mt-4 px-6 py-2 rounded-full liquid-glass-emerald text-white text-xs font-bold uppercase hover:brightness-105 transition-all cursor-pointer shadow-md"
              >
                Khám phá thực đơn
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="p-3.5 rounded-[16px] liquid-glass-card bg-white/80 border border-white/90 shadow-xs flex gap-3 items-start"
              >
                {/* Thumbnail */}
                <img
                  src={item.product.image} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/artisan_hero_food_1791967258188.jpg"; }}
                  alt={item.product.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-[12px] object-cover flex-shrink-0 bg-stone-100"
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-[#333333] truncate">
                      {item.product.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-[#333333]/50 hover:text-[#c93b2b] p-1 transition-colors cursor-pointer"
                      title="Xóa món"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Size and customizations */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-mono text-[#333333]/80">
                    <span className="font-bold text-[#035542] bg-emerald-900/10 px-2 py-0.2 rounded-full">
                      Size {item.size.name}
                    </span>
                    <span className="bg-stone-100 px-2 py-0.2 rounded-full">
                      Đá: {item.iceLevel}
                    </span>
                    <span className="bg-stone-100 px-2 py-0.2 rounded-full">
                      Đường: {item.sugarLevel}
                    </span>
                  </div>

                  {item.toppings.length > 0 && (
                    <div className="mt-1 text-[11px] text-[#035542] font-semibold">
                      Topping: {item.toppings.map((t) => t.name).join(', ')}
                    </div>
                  )}

                  {item.note && (
                    <div className="mt-1 text-[11px] text-[#333333]/70 italic">
                      "{item.note}"
                    </div>
                  )}

                  {/* Edit Customizations Button */}
                  <div className="mt-1.5">
                    <button
                      type="button"
                      onClick={() => openEditCartItem(item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/5 hover:bg-emerald-900/15 text-[#035542] text-[11px] font-semibold transition-colors cursor-pointer border border-emerald-900/10 hover:border-emerald-900/25"
                      title="Chỉnh sửa topping, lượng đá, lượng đường, kích cỡ..."
                    >
                      <SlidersHorizontal className="w-3 h-3 text-[#035542]" />
                      <span>Sửa topping / đá / đường</span>
                    </button>
                  </div>

                  {/* Price & Quantity Stepper */}
                  <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between">
                    <span className="text-sm font-bold font-mono text-[#035542]">
                      {formatCurrency(item.totalPrice)}
                    </span>

                    <div className="flex items-center rounded-full bg-stone-100 border border-black/5 p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, -1)}
                        className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#333333] hover:text-[#035542] shadow-2xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold font-mono text-[#333333]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, 1)}
                        className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#333333] hover:text-[#035542] shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Promo code form */}
          {cart.length > 0 && (
            <div className="pt-2">
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-[#333333]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="MÃ ƯU ĐÃI (BREWLITE15)"
                    className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-black/10 text-xs font-mono font-bold uppercase text-[#333333] focus:border-[#035542] focus:outline-none focus:ring-2 focus:ring-[#035542]/10 shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full liquid-glass border border-emerald-900/20 text-[#035542] bg-white hover:bg-stone-50 text-xs font-bold uppercase transition-colors cursor-pointer shadow-xs"
                >
                  Áp dụng
                </button>
              </form>

              {voucherMsg && (
                <p
                  className={`mt-2 text-xs font-semibold flex items-center gap-1.5 ${
                    voucherMsg.isError ? 'text-[#c93b2b]' : 'text-[#035542]'
                  }`}
                >
                  {voucherMsg.isError ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {voucherMsg.text}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer with Calculations & Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-[var(--backdrop-blur-glass)] border-t border-black/5 space-y-3">
            <div className="space-y-1.5 text-xs text-[#333333]">
              <div className="flex justify-between">
                <span className="text-[#333333]/70">Tạm tính ({totalQuantity} món)</span>
                <span className="font-mono font-semibold">{formatCurrency(cartSubtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#035542]">
                  <span>Khuyến mãi ({voucherCode})</span>
                  <span className="font-mono font-semibold">- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#333333]/70">
                <span>Phí phục vụ quầy</span>
                <span className="font-mono font-semibold">0 Đ</span>
              </div>
              <div className="pt-2 border-t border-black/5 flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#333333]">TỔNG THANH TOÁN</span>
                <span className="text-xl font-black font-mono text-[#035542]">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            {/* Pill CTA Button */}
            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 px-6 rounded-full liquid-glass-emerald text-white hover:brightness-105 active:scale-[0.98] font-bold text-sm uppercase flex items-center justify-between transition-all cursor-pointer shadow-lg"
            >
              <span>TIẾN HÀNH THANH TOÁN</span>
              <div className="flex items-center gap-1 font-mono font-bold">
                <span>{formatCurrency(cartTotal)}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
