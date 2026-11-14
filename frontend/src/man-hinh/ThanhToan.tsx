import React from 'react';
import { ArrowLeft, CreditCard, Wallet } from 'lucide-react';
import { User, Order, Product, OrderStatus, formatPrice, CartLine } from '../api';
import { MaQrZalopay } from './MaQrZalopay';

const DEMO_PAYMENTS = process.env.NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS === 'true';

export interface ZalopayCheckout {
    orderId: string;
    orderCode?: number | string | null;
    amount: number; // Số tiền chính thức của đơn do Backend trả về.
    qrCode: string | null;
    paymentUrl: string | null;
    expiresAt?: string | null;
}

interface ThanhToanProps {
    user: User | null;
    rawSubtotal?: number;
    discountAmount?: number;
    totalCartPrice: number;
    cartLines: CartLine[];
    checkoutOrder?: Order | null;
    productCatalog?: Product[];
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
    walletType: 'MoMo' | 'ZaloPay';
    setWalletType: (type: 'MoMo' | 'ZaloPay') => void;
    onBackToCart: () => void;
    onRetryPayment: () => void;
    onCancelCurrentOrder: () => void;
    onConfirmPay: () => void;
    onVerifyZalopay?: () => void;
    zalopayVerifying?: boolean;
    zalopayCheckout?: ZalopayCheckout | null;
    showZalopayQr?: boolean;
    onRevealZalopayQr?: () => void;
    zalopayMessage?: string | null;
    zalopayNeedsReconciliation?: boolean;
}

export const ThanhToan: React.FC<ThanhToanProps> = ({
                                                        user,
                                                        rawSubtotal,
                                                        discountAmount = 0,
                                                        totalCartPrice,
                                                        cartLines,
                                                        checkoutOrder = null,
                                                        productCatalog = [],
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
                                                        onBackToCart,
                                                        onRetryPayment,
                                                        onCancelCurrentOrder,
                                                        onConfirmPay,
                                                        onVerifyZalopay,
                                                        zalopayVerifying = false,
                                                        zalopayCheckout = null,
                                                        showZalopayQr = false,
                                                        onRevealZalopayQr,
                                                        zalopayMessage = null,
                                                        zalopayNeedsReconciliation = false,
                                                    }) => {
    const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);
    React.useEffect(() => {
        if (!zalopayCheckout?.expiresAt) {
            setSecondsLeft(null);
            return;
        }
        const update = () => setSecondsLeft(Math.max(0, Math.ceil((Date.parse(zalopayCheckout.expiresAt!) - Date.now()) / 1000)));
        update();
        const interval = window.setInterval(update, 1000);
        return () => window.clearInterval(interval);
    }, [zalopayCheckout?.expiresAt]);
    const tamTinh =
        typeof rawSubtotal === 'number'
            ? rawSubtotal
            : cartLines.reduce((sum, l) => sum + l.item.lineTotal, 0);

    // Điểm có thể chi tiêu, không bao gồm điểm đã giữ cho đơn chưa thanh toán.
    const userPoints = user?.availablePoints ?? user?.loyaltyPoints ?? 0;
    const maxUsablePoints = Math.min(userPoints, Math.floor(totalCartPrice / 500));
    const actualPointsUsed = usePoints ? Math.min(Math.max(0, pointsToRedeem), maxUsablePoints) : 0;
    const pointsDiscount = actualPointsUsed * 500;
    const finalPayable = Math.max(0, totalCartPrice - pointsDiscount);
    // Đơn PENDING đã khóa giá/điểm/mã khuyến mãi trên Backend: chỉ cho xem,
    // không cho sửa sau khi tạo giao dịch ZaloPay.
    const locked = !!zalopayCheckout;
    const paidPoints = locked ? (checkoutOrder?.pointsUsed ?? 0) : actualPointsUsed;
    const paidPointsDiscount = locked ? (checkoutOrder?.pointsDiscount ?? paidPoints * 500) : pointsDiscount;
    const appliedCouponCode = locked ? checkoutOrder?.couponCode : appliedPromo?.code;
    const appliedCouponAmount = locked ? (checkoutOrder?.discountAmount ?? 0) : discountAmount;
    const displaySubtotal = locked ? (checkoutOrder?.subtotal ?? tamTinh) : tamTinh;
    const listedItems = locked && checkoutOrder?.items?.length ? checkoutOrder.items : null;


    // ZaloPay Sandbox có thể chỉ trả order_url mà không trả qr_code.
    // Theo tài liệu ZaloPay, mã QR cũng có thể mã hóa trực tiếp order_url.
    // Chỉ chấp nhận URL HTTPS thuộc tên miền ZaloPay do Backend cung cấp.
    const paymentUrl = (() => {
        if (!zalopayCheckout?.paymentUrl) return null;
        try {
            const url = new URL(zalopayCheckout.paymentUrl);
            return url.protocol === 'https:' &&
            (url.hostname === 'zalopay.vn' || url.hostname.endsWith('.zalopay.vn')) &&
            !url.username && !url.password && (!url.port || url.port === '443')
                ? url.toString() : null;
        } catch {
            return null;
        }
    })();
    const qrValue = zalopayCheckout?.qrCode || paymentUrl;
    const qrFromLink = !!zalopayCheckout && !zalopayCheckout.qrCode && !!paymentUrl;

    return (
        <div className="w-full flex-1 flex flex-col space-y-5">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#FBF9F5] rounded-xl border border-[#E2D9C0]">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        aria-label={zalopayCheckout || currentPendingOrderId ? "Xem lịch sử đơn" : "Quay lại giỏ hàng"}
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

            <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
                <div className="w-full space-y-4">
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
                                {currentPendingOrderId ? 'Kiểm tra đơn đang chờ trong Lịch sử' : 'Quay lại Giỏ hàng để điều chỉnh'}
                            </button>
                        </div>
                    )}

                    {/* Mỗi lựa chọn là một radio thực: click toàn bộ thẻ hoặc dùng bàn phím để chọn. */}
                    <div className="bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl p-5 space-y-4">
                        <div className="pb-3 border-b border-[#E2D9C0]">
                            <h2 className="text-sm sm:text-base font-semibold text-[#124E35]">
                                Chọn phương thức thanh toán
                            </h2>
                            <p className="mt-1 text-xs text-neutral-600">
                                Chọn một phương thức phù hợp để hoàn tất đơn hàng.
                            </p>
                        </div>

                        <fieldset disabled={locked} className="space-y-3">
                            <legend className="sr-only">Phương thức thanh toán</legend>

                            <label
                                className={`flex items-center gap-3 sm:gap-4 rounded-xl border px-4 py-3.5 transition-colors ${
                                    paymentMethod === 'wallet' && walletType === 'ZaloPay'
                                        ? 'border-[#124E35] bg-[#EDE6D1]/45 ring-1 ring-[#124E35]/20'
                                        : 'border-[#E2D9C0] bg-white hover:border-[#124E35]/60'
                                } ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDE6D1] text-[#124E35]">
                                    <Wallet className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-[#124E35]">Ví ZaloPay</span>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">
                                        Thanh toán bằng mã QR ZaloPay Sandbox
                                    </span>
                                </span>
                                <input
                                    type="radio"
                                    name="brewlite-payment-method"
                                    value="zalopay"
                                    checked={paymentMethod === 'wallet' && walletType === 'ZaloPay'}
                                    onChange={() => {
                                        setPaymentMethod('wallet');
                                        setWalletType('ZaloPay');
                                    }}
                                    className="h-5 w-5 shrink-0 accent-[#124E35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#124E35]"
                                />
                            </label>

                            <label
                                className={`flex items-center gap-3 sm:gap-4 rounded-xl border px-4 py-3.5 transition-colors ${
                                    !DEMO_PAYMENTS
                                        ? 'border-[#E2D9C0] bg-[#F3F0EA] opacity-65 cursor-not-allowed'
                                        : paymentMethod === 'wallet' && walletType === 'MoMo'
                                            ? 'border-[#124E35] bg-[#EDE6D1]/45 ring-1 ring-[#124E35]/20'
                                            : 'border-[#E2D9C0] bg-white hover:border-[#124E35]/60'
                                } ${locked ? 'cursor-not-allowed' : DEMO_PAYMENTS ? 'cursor-pointer' : ''}`}
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDE6D1] text-[#124E35]">
                                    <Wallet className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-[#124E35]">Ví MoMo</span>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">
                                        {DEMO_PAYMENTS ? 'Thanh toán mô phỏng, không chuyển tiền thật' : 'Chưa hỗ trợ thanh toán'}
                                    </span>
                                </span>
                                <input
                                    type="radio"
                                    name="brewlite-payment-method"
                                    value="momo"
                                    checked={paymentMethod === 'wallet' && walletType === 'MoMo'}
                                    disabled={!DEMO_PAYMENTS || locked}
                                    onChange={() => {
                                        setPaymentMethod('wallet');
                                        setWalletType('MoMo');
                                    }}
                                    className="h-5 w-5 shrink-0 accent-[#124E35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#124E35]"
                                />
                            </label>

                            <label
                                className={`flex items-center gap-3 sm:gap-4 rounded-xl border px-4 py-3.5 transition-colors ${
                                    !DEMO_PAYMENTS
                                        ? 'border-[#E2D9C0] bg-[#F3F0EA] opacity-65 cursor-not-allowed'
                                        : paymentMethod === 'bank'
                                            ? 'border-[#124E35] bg-[#EDE6D1]/45 ring-1 ring-[#124E35]/20'
                                            : 'border-[#E2D9C0] bg-white hover:border-[#124E35]/60'
                                } ${locked ? 'cursor-not-allowed' : DEMO_PAYMENTS ? 'cursor-pointer' : ''}`}
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDE6D1] text-[#124E35]">
                                    <CreditCard className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-[#124E35]">Thẻ ngân hàng</span>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">
                                        {DEMO_PAYMENTS ? 'Visa / Mastercard / Napas — mô phỏng, không dùng thẻ thật' : 'Chưa hỗ trợ thanh toán'}
                                    </span>
                                </span>
                                <input
                                    type="radio"
                                    name="brewlite-payment-method"
                                    value="bank"
                                    checked={paymentMethod === 'bank'}
                                    disabled={!DEMO_PAYMENTS || locked}
                                    onChange={() => setPaymentMethod('bank')}
                                    className="h-5 w-5 shrink-0 accent-[#124E35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#124E35]"
                                />
                            </label>
                        </fieldset>
                    </div>

                    {zalopayCheckout && (showZalopayQr || zalopayNeedsReconciliation || secondsLeft === 0) && (
                        <section aria-live="polite" className="rounded-xl border border-[#D5CCB4] bg-white p-4 space-y-3 text-center">
                            <h3 className="text-base font-semibold text-[#124E35]">Quét mã QR ZaloPay của đơn hàng</h3>
                            {showZalopayQr && !zalopayNeedsReconciliation && (secondsLeft === null || secondsLeft > 0) && qrValue && (
                                <>
                                    <MaQrZalopay
                                        value={qrValue}
                                        label={qrFromLink ? 'Mã QR từ liên kết thanh toán ZaloPay' : 'Mã QR thanh toán ZaloPay'}
                                    />
                                </>
                            )}
                            {showZalopayQr && !zalopayNeedsReconciliation && (secondsLeft === null || secondsLeft > 0) && !qrValue && (
                                <p className="text-xs text-amber-800">Chưa nhận được QR hoặc liên kết thanh toán hợp lệ từ Backend. Vui lòng kiểm tra trạng thái giao dịch.</p>
                            )}
                            {!zalopayNeedsReconciliation && secondsLeft !== null && (
                                <p className="text-xs font-semibold text-[#124E35]">
                                    Thời gian còn lại: {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                                </p>
                            )}
                            {showZalopayQr && !zalopayNeedsReconciliation && (secondsLeft === null || secondsLeft > 0) && paymentUrl && (
                                <a href={paymentUrl} target="_blank" rel="noopener noreferrer"
                                   className="inline-block rounded-lg border border-[#124E35] px-4 py-2 text-xs font-semibold text-[#124E35]">
                                    Mở ZaloPay bằng liên kết
                                </a>
                            )}
                            {secondsLeft === 0 && !zalopayNeedsReconciliation && (
                                <p className="text-xs font-semibold text-amber-800">QR đã hết thời gian hiệu lực. Không quét tiếp; chờ Backend kiểm tra và đối soát.</p>
                            )}
                            {zalopayNeedsReconciliation && (
                                <p className="text-xs font-semibold text-amber-800">Giao dịch cần đối soát. Không tạo thanh toán mới cho cùng đơn.</p>
                            )}
                            {onVerifyZalopay && (
                                <button type="button" onClick={onVerifyZalopay}
                                        disabled={zalopayVerifying}
                                        className="w-full rounded-lg bg-[#124E35] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                                    {zalopayVerifying ? 'Đang kiểm tra giao dịch...' : 'Tôi đã thanh toán – Kiểm tra kết quả'}
                                </button>
                            )}
                        </section>
                    )}

                </div>

                <div className="w-full bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl p-5 space-y-4">
                    <h2 className="font-semibold text-sm sm:text-base text-[#124E35] pb-2.5 border-b border-[#E2D9C0]">
                        Chi tiết đơn thanh toán
                    </h2>

                    {zalopayCheckout && <p className="text-xs text-[#124E35]">
                        Mã đơn: <strong>{zalopayCheckout.orderCode || zalopayCheckout.orderId}</strong>
                    </p>}
                    {listedItems?.length ? (
                        <div className="space-y-2.5 pb-3 border-b border-[#E2D9C0]">
                            {listedItems.map((item) => (
                                <div key={item.id} className="flex justify-between items-start gap-2 text-xs">
                                    <span className="font-medium text-neutral-900">
                                        {productCatalog.find(p => p.id === item.productId)?.name ?? 'Đồ uống'}
                                        <span className="font-normal text-neutral-600"> (Size {item.size}) · x{item.qty}</span>
                                    </span>
                                    <span className="font-mono tabular-nums text-[#124E35] font-medium shrink-0">{formatPrice(item.lineTotal)}</span>
                                </div>
                            ))}
                        </div>
                    ) : !locked && cartLines.length > 0 ? (
                        <div className="space-y-2.5 pb-3 border-b border-[#E2D9C0]">
                            {cartLines.map((line) => (
                                <div key={line.item.id} className="flex justify-between items-start gap-2 text-xs">
                                    <span className="font-medium text-neutral-900">
                                        {line.productName} <span className="font-normal text-neutral-600">(Size {line.item.size}) · x{line.item.qty}</span>
                                    </span>
                                    <span className="font-mono tabular-nums text-[#124E35] font-medium shrink-0">{formatPrice(line.item.lineTotal)}</span>
                                </div>
                            ))}
                        </div>
                    ) : locked ? (
                        <p className="text-xs text-neutral-600">Đơn đã lưu trên Backend. Xem chi tiết món trong Lịch sử đơn hàng.</p>
                    ) : null}
                    {locked ? (
                        <div className="rounded-lg border border-[#D5CCB4] bg-[#EDE6D1]/30 px-3 py-2 text-xs text-[#124E35]">
                            Mã giảm giá: {appliedCouponCode ? `${appliedCouponCode} (đã khóa theo đơn)` : 'Không áp dụng'}
                        </div>
                    ) : onApplyPromo && setPromoCodeInput && setPromoError && onRemovePromo && (
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
                            <span className="font-mono tabular-nums font-semibold">{locked ? `${paidPoints} điểm đã dùng` : `${userPoints} điểm khả dụng`}</span>
                        </div>

                        {!locked && (userPoints > 0 ? (
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
                        ))}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-neutral-600">
                            <span>Tạm tính</span>
                            <span className="font-mono tabular-nums text-neutral-800">
                {formatPrice(displaySubtotal)}
              </span>
                        </div>

                        {appliedCouponAmount > 0 && (
                            <div className="flex items-center justify-between text-xs text-[#124E35] font-semibold">
                                <span>Ưu đãi ({appliedCouponCode || "mã giảm giá"})</span>
                                <span className="font-mono tabular-nums">-{formatPrice(appliedCouponAmount)}</span>
                            </div>
                        )}

                        {paidPoints > 0 && (
                            <div className="flex items-center justify-between text-xs text-[#124E35] font-semibold">
                                <span>Đổi điểm thưởng ({paidPoints} điểm)</span>
                                <span className="font-mono tabular-nums">-{formatPrice(paidPointsDiscount)}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-[#E2D9C0]">
              <span className="text-xs sm:text-sm text-[#124E35] font-semibold">
                Tổng số tiền thanh toán
              </span>
                            <span className="font-mono tabular-nums font-bold text-lg text-[#124E35]">
                {formatPrice(zalopayCheckout?.amount ?? finalPayable)}
              </span>
                        </div>
                    </div>

                    {!zalopayCheckout && checkoutStatus === 'PAYMENT_FAILED' && (
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

                    {!zalopayCheckout && DEMO_PAYMENTS && finalPayable > 0 && !(paymentMethod === 'wallet' && walletType === 'ZaloPay') && <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer select-none pt-1">
                        <input
                            type="checkbox"
                            checked={simulatePaymentError}
                            onChange={(e) => setSimulatePaymentError(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-[#D5CCB4] text-[#124E35] focus:ring-[#124E35] cursor-pointer accent-[#124E35]"
                        />
                        <span>Mô phỏng lỗi giao dịch</span>
                    </label>}
                    {!zalopayCheckout && DEMO_PAYMENTS && <p className="text-xs text-amber-700">Ví MoMo và thẻ ngân hàng chỉ mô phỏng, không ghi nhận tiền thật.</p>}

                    <button
                        type="button"
                        onClick={zalopayCheckout && !showZalopayQr ? onRevealZalopayQr : onConfirmPay}
                        disabled={checkoutLoading || (zalopayCheckout
                            ? (showZalopayQr || zalopayNeedsReconciliation || secondsLeft === 0)
                            : cartLines.length === 0)}
                        className="w-full py-3 bg-[#124E35] text-[#F5F0E1] font-semibold text-sm rounded-lg cursor-pointer hover:opacity-95 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
                    >
                        {checkoutLoading
                            ? 'Đang xử lý giao dịch...'
                            : zalopayCheckout ? (showZalopayQr ? 'Đang chờ xác nhận từ ZaloPay' :
                                    (zalopayNeedsReconciliation || secondsLeft === 0 ? 'Giao dịch hết hạn / đang đối soát' : 'Hiển thị mã QR thanh toán'))
                                : finalPayable === 0 ? 'Xác nhận đơn 0đ (không qua cổng thanh toán)' : `Xác nhận thanh toán · ${formatPrice(finalPayable)}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThanhToan;
