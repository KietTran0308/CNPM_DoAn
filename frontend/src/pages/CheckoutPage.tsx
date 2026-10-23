// frontend/src/pages/CheckoutPage.tsx
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { CartItem } from '../types/cart';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartCount,
    cartSubtotal,
    discount,
    pointsDiscount,
    cartTotal,
    pickupBranch,
    pickupTimeType,
    scheduledTime,
  } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'banking' | 'momo'>('cod');
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    // Gửi thông tin đơn hàng lên backend
    const payload = {
      customer: { name: customerName, phone: customerPhone },
      paymentMethod,
      orderNote,
      items: cart,
      subtotal: cartSubtotal,
      discount: discount + pointsDiscount,
      total: cartTotal,
      pickup: { branch: pickupBranch, timeType: pickupTimeType, scheduledTime },
    };

    console.log('Order Submitted:', payload);
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Đặt hàng thành công!');
    }, 1000);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🛒
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Giỏ hàng đang trống</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Bạn chưa chọn món nào để thanh toán. Hãy chọn món trước nhé!
          </p>
          <a
            href="/"
            className="inline-block w-full py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition"
          >
            Quay lại thực đơn
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8">
          Xác nhận đơn hàng & Thanh toán
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cột trái: Form thông tin nhận hàng & thanh toán */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>👤</span> Thông tin khách hàng
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Ghi chú đơn hàng
                  </label>
                  <textarea
                    rows={2}
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Ví dụ: Giao giờ nghỉ trưa, gọi trước khi đến..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>💳</span> Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                {[
                  { id: 'cod', label: 'Tiền mặt khi nhận món (COD)' },
                  { id: 'banking', label: 'Chuyển khoản ngân hàng (VietQR)' },
                  { id: 'momo', label: 'Ví điện tử MoMo' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      paymentMethod === item.id
                        ? 'border-amber-600 bg-amber-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={item.id}
                      checked={paymentMethod === item.id}
                      onChange={() => setPaymentMethod(item.id as any)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-800">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải: Danh sách món đã chọn + Tổng tiền */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <h2 className="text-lg font-bold text-gray-900">Món đã chọn</h2>
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full">
                  {cartCount} phần
                </span>
              </div>

              {/* Danh sách items */}
              <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto pr-1">
                {cart.map((item: CartItem) => (
                  <div key={item.cartItemId} className="py-3.5 flex gap-3 first:pt-0">
                    <img
                      src={item.image || 'https://via.placeholder.com/64'}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover bg-gray-50 border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {item.name}
                        </h3>
                        <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                          {formatVND(item.totalPrice)}
                        </span>
                      </div>

                      {/* Thông tin Size & Topping */}
                      <p className="text-xs text-gray-500 mt-0.5">
                        Size: {item.size.name} • SL: <span className="font-semibold text-gray-700">x{item.quantity}</span>
                      </p>
                      {item.toppings && item.toppings.length > 0 && (
                        <p className="text-xs text-gray-500 truncate">
                          Topping: {item.toppings.map((t) => t.name).join(', ')}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400">
                        Đá: {item.iceLevel} | Đường: {item.sugarLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chi tiết tính toán chi phí */}
              <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-medium text-gray-900">{formatVND(cartSubtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Mã giảm giá</span>
                    <span>-{formatVND(discount)}</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Điểm tích lũy</span>
                    <span>-{formatVND(pointsDiscount)}</span>
                  </div>
                )}

                <div className="border-t border-dashed border-gray-200 pt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-base font-bold text-gray-900 block">Tổng thanh toán</span>
                    <span className="text-[11px] text-gray-400">(Đã bao gồm VAT)</span>
                  </div>
                  <span className="text-xl font-extrabold text-amber-600">
                    {formatVND(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Nút đặt hàng */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full mt-6 py-3.5 bg-amber-600 text-white rounded-xl font-bold shadow-md hover:bg-amber-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : `Đặt hàng ngay • ${formatVND(cartTotal)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;