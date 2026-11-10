import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { User, OrderStatus, formatPrice, CartLine } from '../api';

interface ThanhToanProps {
    user: User | null;
    rawSubtotal?: number;
    discountAmount?: number;
    totalCartPrice: number;
    cartLines: CartLine[];
    promoCodeInput?: string;
    setPromoCodeInput?: (code: string) => void;
    appliedPromo?: { code: string; discount: number } | null;
    promoError?: string | null;
    setPromoError?: (error: string | null) => void;
    onApplyPromo?: (e: React.FormEvent) => void;
    onRemovePromo?: () => void;
    usePoints?: boolean;
    setUsePoints?: (val: boolean) => void;
    pointsToRedeem?: number;
    setPointsToRedeem?: (points: number) => void;
    stockError: string | null;
    setStockError: (err: string | null) => void;
    currentPendingOrderId?: string | null;
    checkoutStatus: OrderStatus | null;
    checkoutLoading: boolean;
    simulatePaymentError: boolean;
    setSimulatePaymentError: (val: boolean) => void;
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
                                                        rawSubtotal,
                                                        discountAmount = 0,
                                                        totalCartPrice,
                                                        cartLines,
                                                        promoCodeInput = '',
                                                        setPromoCodeInput,
                                                        appliedPromo = null,
                                                        promoError = null,
                                                        setPromoError,
                                                        onApplyPromo,
                                                        onRemovePromo,
                                                        usePoints = false,
                                                        setUsePoints,
                                                        pointsToRedeem = 0,
                                                        setPointsToRedeem,
                                                        stockError,
                                                        setStockError,
                                                        currentPendingOrderId,
                                                        checkoutStatus,
                                                        checkoutLoading,
                                                        simulatePaymentError,
                                                        setSimulatePaymentError,
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
    const tamTinh =
        typeof rawSubtotal === 'number'
            ? rawSubtotal
            : cartLines.reduce((sum, l) => sum + l.item.lineTotal, 0);

    const userPoints = user?.loyaltyPoints ?? 0;
    const maxUsablePoints = Math.min(userPoints, Math.floor(totalCartPrice / 500));
    const actualPointsUsed = usePoints ? Math.min(Math.max(0, pointsToRedeem), maxUsablePoints) : 0;
    const pointsDiscount = actualPointsUsed * 500;
    const finalPayable = Math.max(0, totalCartPrice - pointsDiscount);

    return (
        <div className="w-full flex-1 flex flex-col space-y-5">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#FBF9F5] rounded-xl border border-[#E2D9C0]">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        aria-label="Quay lại giỏ hàng"
                        onClick={onBackToCart}
                        className="w-9 h-9 rounded-lg border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] text-[#124E35] flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-base sm:text-lg text-[#124E35]">
            Thanh toán đơn hàng
          </span>
                </div>
                <div className="group relative">
          <span className="text-xs sm:text-sm font-mono tabular-nums border border-[#D5CCB4] px-3 py-1.5 rounded-lg bg-[#EDE6D1] text-[#124E35] font-medium cursor-help inline-block">
            Điểm: <span className="font-semibold text-[#124E35]">{userPoints}</span>
          </span>
                    <div className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-[#FBF9F5] border border-[#D5CCB4] rounded-xl shadow-lg text-xs text-[#124E35] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                        <div className="font-semibold text-sm border-b border-[#E2D9C0] pb-1.5 mb-2">
                            Cơ chế Tích điểm & Quy đổi
                        </div>
                        <div className="space-y-1.5 text-[11px] leading-relaxed">
                            <div>• <span className="font-semibold">Tích điểm:</span> Mỗi 10.000đ chi tiêu = +1 điểm thưởng</div>
                            <div>• <span className="font-semibold">Quy đổi:</span> 1 điểm = 500đ khi thanh toán đơn hàng</div>
                            <div className="pt-1.5 mt-1 border-t border-[#E2D9C0] font-medium">
                                Điểm hiện tại: <span className="font-bold">{userPoints} điểm</span> ({formatPrice(userPoints * 500)})
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-7 space-y-4">
                    {stockError && (
                        <div className="border border-[#D5CCB4] p-4 bg-[#EDE6D1] rounded-xl text-center space-y-2">
                            <div className="text-xs sm:text-sm font-semibold text-[#124E35]">{stockError}</div>
                            <button
                                type="button"
                                onClick={() => {
                                    setStockError(null);
                                    onBackToCart();
                                }}
                                className="text-xs sm:text-sm text-[#124E35] hover:opacity-80 underline cursor-pointer font-semibold"
                            >
                                Quay lại Giỏ hàng để điều chỉnh
                            </button>
                        </div>
                    )}

                    <div className="bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl p-5 space-y-3.5">
                        <div className="text-sm font-semibold text-[#124E35] pb-2 border-b border-[#E2D9C0]">
                            Chọn phương thức thanh toán
                        </div>

                        <div
                            className={`p-4 border rounded-xl cursor-pointer transition-colors bg-white ${
                                paymentMethod === 'wallet'
                                    ? 'border-[#124E35]'
                                    : 'border-[#E2D9C0] hover:border-[#124E35]/50'
                            }`}
                            onClick={() => setPaymentMethod('wallet')}
                        >
                            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#124E35]">
                                <span>Ví điện tử (Mô phỏng MoMo / VNPay)</span>
                                <span
                                    className={`text-xs px-2.5 py-0.5 rounded border font-semibold ${
                                        paymentMethod === 'wallet'
                                            ? 'bg-[#124E35] border-[#124E35] text-[#F5F0E1]'
                                            : 'bg-[#EDE6D1] border-[#D5CCB4] text-[#124E35]'
                                    }`}
                                >
                  {paymentMethod === 'wallet' ? 'Đang chọn' : 'Chọn'}
                </span>
                            </div>

                            {paymentMethod === 'wallet' && (
                                <div className="pt-3.5 mt-3.5 border-t border-[#E2D9C0] space-y-3.5">
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
                                                        ? 'bg-[#124E35] text-[#F5F0E1] font-semibold border-[#124E35]'
                                                        : 'bg-[#EDE6D1] text-[#124E35] font-medium border-[#D5CCB4] hover:bg-[#124E35] hover:text-[#F5F0E1]'
                                                }`}
                                            >
                                                Ví {type}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="pt-1 text-center space-y-2">
                                        <div className="w-36 h-36 mx-auto border border-[#D5CCB4] rounded-xl p-3 bg-[#FBF9F5] flex items-center justify-center">
                                            <svg
                                                viewBox="0 0 100 100"
                                                className="w-full h-full text-[#124E35]"
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
                                            Mã minh họa (không quét bằng ví thật) bằng ứng dụng <strong className="text-[#124E35]">{walletType}</strong>
                                        </p>
                                        <p className="text-[11px] font-mono text-neutral-500">
                                            Nội dung: BREW-{finalPayable}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            className={`p-4 border rounded-xl cursor-pointer transition-colors bg-white ${
                                paymentMethod === 'bank'
                                    ? 'border-[#124E35]'
                                    : 'border-[#E2D9C0] hover:border-[#124E35]/50'
                            }`}
                            onClick={() => setPaymentMethod('bank')}
                        >
                            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#124E35]">
                                <span>Thẻ ngân hàng (Visa, Master, Napas)</span>
                                <span
                                    className={`text-xs px-2.5 py-0.5 rounded border font-semibold ${
                                        paymentMethod === 'bank'
                                            ? 'bg-[#124E35] border-[#124E35] text-[#F5F0E1]'
                                            : 'bg-[#EDE6D1] border-[#D5CCB4] text-[#124E35]'
                                    }`}
                                >
                  {paymentMethod === 'bank' ? 'Đang chọn' : 'Chọn'}
                </span>
                            </div>

                            {paymentMethod === 'bank' && (
                                <div
                                    className="pt-3.5 mt-3.5 border-t border-[#E2D9C0] space-y-3"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div>
                                        <label className="block text-xs font-medium text-[#124E35] mb-1">Số thẻ</label>
                                        <input
                                            type="text"
                                            value={cardNumber}
                                            onChange={onCardNumberChange}
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full p-2.5 border border-[#D5CCB4] rounded-lg bg-white text-xs sm:text-sm text-neutral-900 font-mono focus:outline-none focus:border-[#124E35] focus:ring-1 focus:ring-[#124E35] transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-[#124E35] mb-1">Ngày hết hạn</label>
                                            <input
                                                type="text"
                                                value={cardExpiry}
                                                onChange={onExpiryChange}
                                                placeholder="MM/YY"
                                                className="w-full p-2.5 border border-[#D5CCB4] rounded-lg bg-white text-xs sm:text-sm text-neutral-900 font-mono focus:outline-none focus:border-[#124E35] focus:ring-1 focus:ring-[#124E35] transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[#124E35] mb-1">Mã bảo mật CVV</label>
                                            <input
                                                type="password"
                                                maxLength={3}
                                                value={cardCvv}
                                                onChange={onCvvChange}
                                                placeholder="CVV"
                                                className="w-full p-2.5 border border-[#D5CCB4] rounded-lg bg-white text-xs sm:text-sm text-neutral-900 font-mono focus:outline-none focus:border-[#124E35] focus:ring-1 focus:ring-[#124E35] transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 lg:sticky lg:top-6 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl p-5 space-y-4">
                    <h2 className="font-semibold text-sm sm:text-base text-[#124E35] pb-2.5 border-b border-[#E2D9C0]">
                        Chi tiết đơn thanh toán
                    </h2>

                    {cartLines.length > 0 && (
                        <div className="space-y-2.5 pb-3 border-b border-[#E2D9C0]">
                            {cartLines.map((line) => (
                                <div key={line.item.id} className="flex justify-between items-start gap-2 text-xs">
                                    <div className="min-w-0">
                    <span className="font-medium text-neutral-900">
                      {line.productName}{' '}
                        <span className="font-normal text-neutral-600">
                        (Size {line.item.size}) · x{line.item.qty}
                      </span>
                    </span>
                                    </div>
                                    <span className="font-mono tabular-nums text-[#124E35] font-medium shrink-0">
                    {formatPrice(line.item.lineTotal)}
                  </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {onApplyPromo && setPromoCodeInput && setPromoError && onRemovePromo && (
                        <div className="pb-3 border-b border-[#E2D9C0]">
                            <form onSubmit={onApplyPromo} className="flex gap-2">
                                <input
                                    type="text"
                                    value={promoCodeInput}
                                    onChange={(e) => {
                                        setPromoCodeInput(e.target.value);
                                        setPromoError(null);
                                    }}
                                    placeholder="Nhập mã giảm giá BrewLite"
                                    disabled={appliedPromo !== null || !!currentPendingOrderId}
                                    className="flex-1 px-3 py-2 border border-[#D5CCB4] rounded-lg bg-white text-xs text-neutral-900 uppercase font-mono placeholder:text-neutral-400 focus:outline-none focus:border-[#124E35] focus:ring-1 focus:ring-[#124E35] disabled:bg-[#EDE6D1] disabled:text-[#124E35] transition-colors"
                                />
                                {appliedPromo ? (
                                    <button
                                        type="button"
                                        onClick={onRemovePromo}
                                        disabled={!!currentPendingOrderId}
                                        className="px-3 py-2 border border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35] text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#124E35] hover:text-[#F5F0E1] shrink-0 transition-colors"
                                    >
                                        Bỏ mã
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={!promoCodeInput.trim() || !!currentPendingOrderId}
                                        className="px-3.5 py-2 bg-[#124E35] text-[#F5F0E1] text-xs font-semibold rounded-lg cursor-pointer hover:opacity-95 disabled:bg-neutral-200 disabled:text-neutral-400 shrink-0 transition-colors"
                                    >
                                        Áp dụng
                                    </button>
                                )}
                            </form>
                            {promoError && <div className="text-xs text-neutral-600 mt-1.5">{promoError}</div>}
                        </div>
                    )}

                    <div className="p-4 border border-[#D5CCB4] bg-[#EDE6D1]/40 rounded-xl space-y-3">
                        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#124E35]">
                            <span>Sử dụng điểm thưởng</span>
                            <span className="font-mono tabular-nums font-semibold">{userPoints} điểm</span>
                        </div>

                        {userPoints > 0 ? (
                            <div className="space-y-2.5">
                                <label className="flex items-center gap-2 text-xs text-[#124E35] cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={!!usePoints}
                                        disabled={!!currentPendingOrderId}
                                        onChange={(e) => {
                                            if (setUsePoints) {
                                                setUsePoints(e.target.checked);
                                                if (e.target.checked && setPointsToRedeem && pointsToRedeem === 0) {
                                                    setPointsToRedeem(maxUsablePoints);
                                                }
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-[#D5CCB4] text-[#124E35] focus:ring-[#124E35] cursor-pointer accent-[#124E35]"
                                    />
                                    <span>Dùng điểm thưởng giảm giá (1 điểm = 500đ)</span>
                                </label>

                                {usePoints && (
                                    <div className="pt-2 border-t border-[#D5CCB4]/60 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={0}
                                                max={maxUsablePoints}
                                                value={pointsToRedeem}
                                                disabled={!!currentPendingOrderId}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10) || 0;
                                                    const clamped = Math.max(0, Math.min(val, maxUsablePoints));
                                                    setPointsToRedeem?.(clamped);
                                                }}
                                                className="flex-1 px-3 py-1.5 border border-[#D5CCB4] rounded-lg bg-white text-xs font-mono text-neutral-900 focus:outline-none focus:border-[#124E35]"
                                                placeholder="Nhập số điểm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setPointsToRedeem?.(maxUsablePoints)}
                                                disabled={!!currentPendingOrderId}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35] hover:bg-[#124E35] hover:text-[#F5F0E1] transition-colors cursor-pointer"
                                            >
                                                Dùng toàn bộ
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-[#124E35]/80">
                                            <span>Tối đa cho đơn này: {maxUsablePoints} điểm</span>
                                            <span className="font-semibold font-mono text-[#124E35]">
                        -{formatPrice(pointsDiscount)}
                      </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-xs text-[#124E35]/70 italic">
                                Bạn chưa có điểm thưởng khả dụng (Mỗi 10.000đ thanh toán nhận +1 điểm).
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-neutral-600">
                            <span>Tạm tính</span>
                            <span className="font-mono tabular-nums text-neutral-800">
                {formatPrice(tamTinh)}
              </span>
                        </div>

                        {appliedPromo && (
                            <div className="flex items-center justify-between text-xs text-[#124E35] font-semibold">
                                <span>Ưu đãi ({appliedPromo.code})</span>
                                <span className="font-mono tabular-nums">-{formatPrice(discountAmount)}</span>
                            </div>
                        )}

                        {usePoints && actualPointsUsed > 0 && (
                            <div className="flex items-center justify-between text-xs text-[#124E35] font-semibold">
                                <span>Đổi điểm thưởng ({actualPointsUsed} điểm)</span>
                                <span className="font-mono tabular-nums">-{formatPrice(pointsDiscount)}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-[#E2D9C0]">
              <span className="text-xs sm:text-sm text-[#124E35] font-semibold">
                Tổng số tiền thanh toán
              </span>
                            <span className="font-mono tabular-nums font-bold text-lg text-[#124E35]">
                {formatPrice(finalPayable)}
              </span>
                        </div>
                    </div>

                    {checkoutStatus === 'PAYMENT_FAILED' && (
                        <div className="border border-[#D5CCB4] p-4 bg-[#EDE6D1] rounded-xl text-center space-y-2.5">
                            <div className="text-xs sm:text-sm font-semibold text-[#124E35]">
                                Giao dịch chưa thành công
                                {currentPendingOrderId ? ` (Đơn #${currentPendingOrderId})` : ''}
                            </div>
                            <div className="text-xs text-[#124E35]/85 leading-relaxed">
                                Đơn hàng đang ở trạng thái PAYMENT_FAILED. Giỏ hàng của bạn vẫn được giữ nguyên.
                            </div>
                            <div className="flex justify-center gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={onRetryPayment}
                                    className="px-4 py-2 bg-[#124E35] text-[#F5F0E1] text-xs font-semibold rounded-lg cursor-pointer hover:opacity-95 transition-colors"
                                >
                                    Thử lại
                                </button>
                                <button
                                    type="button"
                                    onClick={onCancelCurrentOrder}
                                    className="px-4 py-2 border border-[#D5CCB4] bg-[#FBF9F5] text-[#124E35] text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#E2D9C0] transition-colors"
                                >
                                    Hủy đơn
                                </button>
                            </div>
                        </div>
                    )}

                    <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer select-none pt-1">
                        <input
                            type="checkbox"
                            checked={simulatePaymentError}
                            onChange={(e) => setSimulatePaymentError(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-[#D5CCB4] text-[#124E35] focus:ring-[#124E35] cursor-pointer accent-[#124E35]"
                        />
                        <span>Mô phỏng lỗi giao dịch</span>
                    </label>

                    <button
                        type="button"
                        onClick={onConfirmPay}
                        disabled={checkoutLoading || cartLines.length === 0}
                        className="w-full py-3 bg-[#124E35] text-[#F5F0E1] font-semibold text-sm rounded-lg cursor-pointer hover:opacity-95 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
                    >
                        {checkoutLoading
                            ? 'Đang xử lý giao dịch...'
                            : `Xác nhận thanh toán · ${formatPrice(finalPayable)}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThanhToan;

