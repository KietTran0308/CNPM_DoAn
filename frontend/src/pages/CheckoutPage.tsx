// frontend/src/pages/CheckoutPage.tsx
import React, { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { CartItem } from '../types/cart';
import { createOrderApi, CreateOrderPayload } from '../services/order.api';
import { processPaymentApi, PaymentMethod } from '../services/payment.api';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  description: string;
  badge?: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'momo',
    name: 'Ví MoMo',
    description: 'Thanh toán trực tiếp qua cổng ứng dụng MoMo',
    badge: 'Phổ biến',
  },
  {
    id: 'zalopay',
    name: 'Ví ZaloPay',
    description: 'Quét mã QR hoặc thanh toán qua ứng dụng ZaloPay',
  },
  {
    id: 'vnpay',
    name: 'VNPAY-QR / Thẻ ATM nội địa',
    description: 'Hỗ trợ hơn 40 ngân hàng và ví VNPAY',
  },
  {
    id: 'credit_card',
    name: 'Thẻ Quốc tế (Visa / Mastercard)',
    description: 'Cổng thẻ bảo mật chuẩn 3D Secure',
  },
  {
    id: 'cod',
    name: 'Tiền mặt khi nhận món (COD)',
    description: 'Thanh toán khi nhận hàng hoặc nhận tại quầy',
  },
];

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartCount,
    cartSubtotal,
    discount,
    pointsDiscount,
    voucherCode,
    cartTotal,
    pickupBranch,
    pickupTimeType,
    scheduledTime,
    pickupNote,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('momo');
  
  // Quản lý trạng thái khóa nút đặt hàng
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Chống spam click: kiểm tra cả state lẫn ref đồng bộ
    if (isSubmittingRef.current || isSubmitting) return;
    if (cart.length === 0) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 2. Chuẩn bị payload đơn hàng
      const orderPayload: CreateOrderPayload = {
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
        },
        pickup: {
          branch: pickupBranch || 'Chi nhánh mặc định',
          timeType: pickupTimeType || 'asap',
          scheduledTime: pickupTimeType === 'scheduled' ? scheduledTime : undefined,
          note: pickupNote,
        },
        items: cart.map((item) => ({
          productId: item.productId,
          sizeId: item.size.id,
          toppingIds: item.toppings.map((t) => t.id),
          iceLevel: item.iceLevel,
          sugarLevel: item.sugarLevel,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          note: item.note,
        })),
        subtotal: cartSubtotal,
        discount,
        pointsDiscount,
        total: cartTotal,
        voucherCode: voucherCode || undefined,
        orderNote: orderNote.trim(),
      };

      // Gọi API POST /orders
      const orderResult = await createOrderApi(orderPayload);

      // Gọi API POST /payments
      const paymentResult = await processPaymentApi({
        orderId: orderResult.id,
        amount: cartTotal,
        method: selectedPayment,
        returnUrl: `${window.location.origin}/orders/${orderResult.id}/complete`,
      });

      // 3. Phân luồng điều hướng thành công:
      if (paymentResult.paymentUrl) {
        // Lưu ý: Không clear giỏ hàng ở đây nếu cổng thanh toán bên thứ ba có khả năng thất bại/hủy.
        // Giữ giỏ hàng, chỉ dọn giỏ hàng tại trang returnUrl khi backend xác nhận webhook thành công.
        window.location.href = paymentResult.paymentUrl;
      } else {
        // Đơn COD thành công -> xóa giỏ hàng và chuyển trang xác nhận
        clearCart();
        window.location.href = `/orders/${orderResult.id}/confirmation`;
      }
    } catch (err: any) {
      // 4. Khi gặp lỗi: GIỮ NGUYÊN GIỎ HÀNG, mở khóa nút đặt hàng để user thử lại
      setErrorMessage(
        err.message || 'Thanh toán không thành công. Giỏ hàng của bạn vẫn được giữ nguyên, vui lòng thử lại.'
      );
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🛒
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Giỏ hàng của bạn đang trống</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Vui lòng chọn món trước khi tiến hành thanh toán.
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
          Thanh toán đơn hàng
        </h1>

        {/* Thông báo lỗi & giữ giỏ hàng */}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start justify-between">
            <div className="flex gap-2">
              <span className="font-bold">⚠️</span>
              <div>
                <p className="font-semibold">Thao tác chưa hoàn tất</p>
                <p>{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitCheckout}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cột trái: Thông tin khách hàng & Phương thức thanh toán */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">
                  1. Thông tin người nhận
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      disabled={isSubmitting}
                      pattern="[0-9]{10,11}"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Ghi chú đơn hàng
                    </label>
                    <textarea
                      rows={2}
                      disabled={isSubmitting}
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Ví dụ: Mang lên tầng 3, gọi trước khi giao..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Lựa chọn phương thức thanh toán */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">
                  2. Chọn phương thức thanh toán
                </h2>
                <div className="space-y-3">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition ${
                        isSubmitting ? 'pointer-events-none opacity-60' : ''
                      } ${
                        selectedPayment === opt.id
                          ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-600'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          disabled={isSubmitting}
                          value={opt.id}
                          checked={selectedPayment === opt.id}
                          onChange={() => setSelectedPayment(opt.id)}
                          className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{opt.name}</span>
                            {opt.badge && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Cột phải: Danh sách món & Xác nhận */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                  <h2 className="text-base font-bold text-gray-900">Chi tiết giỏ hàng</h2>
                  <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full">
                    {cartCount} món
                  </span>
                </div>

                {/* Danh sách items */}
                <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto pr-1">
                  {cart.map((item: CartItem) => (
                    <div key={item.cartItemId} className="py-3 flex gap-3 first:pt-0">
                      <img
                        src={item.image || 'https://via.placeholder.com/64'}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover bg-gray-50 border border-gray-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {item.name}
                          </h4>
                          <span className="text-xs font-bold text-gray-900 ml-2 whitespace-nowrap">
                            {formatVND(item.totalPrice)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Size: {item.size.name} • SL: <span className="font-semibold text-gray-700">x{item.quantity}</span>
                        </p>
                        {item.toppings.length > 0 && (
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

                {/* Bảng tính chi phí */}
                <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span className="font-medium text-gray-900">{formatVND(cartSubtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Mã ưu đãi</span>
                      <span>-{formatVND(discount)}</span>
                    </div>
                  )}

                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm từ điểm</span>
                      <span>-{formatVND(pointsDiscount)}</span>
                    </div>
                  )}

                  <div className="border-t border-dashed border-gray-200 pt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-bold text-gray-900 block">Tổng thanh toán</span>
                      <span className="text-[11px] text-gray-400">Đã bao gồm thuế/phí</span>
                    </div>
                    <span className="text-xl font-extrabold text-amber-600">
                      {formatVND(cartTotal)}
                    </span>
                  </div>
                </div>

                {/* Nút đặt hàng: Ngăn click liên tục và hiển thị spinner */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full mt-6 py-3.5 rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-2 text-white ${
                    isSubmitting
                      ? 'bg-amber-400 cursor-not-allowed opacity-90'
                      : 'bg-amber-600 hover:bg-amber-700 active:scale-[0.99]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      <span>Đang xử lý đơn hàng...</span>
                    </>
                  ) : (
                    <span>Xác nhận & Đặt hàng ({formatVND(cartTotal)})</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;