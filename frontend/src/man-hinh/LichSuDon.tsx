import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Order, OrderStatus, Product, User, formatPrice } from '../api';

const DEMO_PAYMENTS = process.env.NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS === 'true';

export interface TienTrinhDonProps {
    status: OrderStatus;
    onNextStep?: () => void;
}

export const TienTrinhDon: React.FC<TienTrinhDonProps> = ({ status, onNextStep }) => {
    const layBuocHienTai = (st: OrderStatus): number => {
        switch (st) {
            case 'PAID':
                return 1;
            case 'PREPARING':
                return 2;
            case 'READY':
                return 3;
            case 'COMPLETED':
                return 4;
            default:
                return 0;
        }
    };

    const currentStep = layBuocHienTai(status);

    if (currentStep === 0) {
        let label = 'Chờ thanh toán';

        if (status === 'PAYMENT_FAILED') {
            label = 'Thanh toán chưa hoàn tất';
        } else if (status === 'CANCELLED') {
            label = 'Đơn đã hủy';
        }

        return (
            <div className="py-1">
                <div className="flex justify-between items-center px-3 py-2 rounded-lg border border-[#D5CCB4] bg-[#F4EFE0] text-xs">
                    <span className="text-[#124E35] font-medium">Trạng thái đơn hàng</span>
                    <span className="px-2.5 py-0.5 rounded-md border border-[#D5CCB4] bg-[#EDE6D1] text-[11px] font-semibold text-[#124E35]">
            {label}
          </span>
                </div>
            </div>
        );
    }

    const cacBuoc = [
        { num: 1, title: 'Đã nhận', desc: 'Chuyển quầy' },
        { num: 2, title: 'Đang pha chế', desc: 'Chuẩn bị món' },
        { num: 3, title: 'Sẵn sàng', desc: 'Mời lấy nước' },
        { num: 4, title: 'Hoàn tất', desc: 'Đã giao' },
    ];

    const tenBuocHienTai = cacBuoc.find((b) => b.num === currentStep)?.title || '';

    return (
        <div className="py-1 space-y-2">
            <div className="flex justify-between items-center text-[11px] text-neutral-600">
                <span className="font-medium text-[#124E35]">Tiến trình đơn hàng</span>
                <div className="flex items-center gap-1.5">
          <span className="font-mono tabular-nums text-[#124E35] font-semibold">
            Bước {currentStep}/4 · {tenBuocHienTai}
          </span>
                    {(status === 'PAID' || status === 'PREPARING') && onNextStep && (
                        <button
                            type="button"
                            onClick={onNextStep}
                            className="w-6 h-6 rounded-md border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] text-[#124E35] font-mono text-xs flex items-center justify-center cursor-pointer transition-colors leading-none font-semibold"
                        >
                            →
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
                {cacBuoc.map((st) => {
                    const isCurrent = currentStep === st.num;

                    const cardStyle = isCurrent
                        ? 'border-[#124E35] bg-[#124E35] text-[#F5F0E1]'
                        : 'border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35]';

                    return (
                        <div
                            key={st.num}
                            className={`p-2 border rounded-lg transition-colors flex flex-col justify-between min-h-[50px] ${cardStyle}`}
                        >
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-mono font-semibold">Bước {st.num}</span>
                            </div>
                            <div className="mt-1">
                                <div className="text-[11px] font-semibold leading-tight truncate">{st.title}</div>
                                <div className="text-[10px] opacity-85 leading-tight truncate mt-0.5">
                                    {st.desc}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface LichSuDonProps {
    user: User | null;
    orderHistory: Order[];
    historyLoading: boolean;
    products: Product[];
    onBackToMenu: () => void;
    onTransition: (orderId: string, targetStatus: OrderStatus) => void;
    onRetryFromHistory: (orderId: string, method: 'ZALOPAY' | 'WALLET' | 'CARD') => void;
    statusNotice?: { type: 'success' | 'error' | 'ready'; message: string; orderId?: string } | null;
    onClearNotice?: () => void;
}

export const LichSuDon: React.FC<LichSuDonProps> = ({
                                                        user,
                                                        orderHistory,
                                                        historyLoading,
                                                        products,
                                                        onBackToMenu,
                                                        onTransition,
                                                        onRetryFromHistory,
                                                        statusNotice,
                                                        onClearNotice,
                                                    }) => {
    const [retryMethodByOrder, setRetryMethodByOrder] = useState<Record<string, 'ZALOPAY' | 'WALLET' | 'CARD'>>({});
    const layTenTrangThai = (status: OrderStatus) => {
        switch (status) {
            case 'PENDING':
                return 'Chờ xử lý';
            case 'PAID':
                return 'Đã thanh toán';
            case 'PREPARING':
                return 'Đang pha chế';
            case 'READY':
                return 'Sẵn sàng lấy nước';
            case 'COMPLETED':
                return 'Đã hoàn tất';
            case 'PAYMENT_FAILED':
                return 'Thanh toán lỗi';
            case 'CANCELLED':
                return 'Đã hủy';
        }
    };

    return (
        <div className="w-full flex-1 flex flex-col justify-between space-y-5">
            <div className="space-y-5">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#FBF9F5] rounded-xl border border-[#E2D9C0]">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Quay lại thực đơn"
                            onClick={onBackToMenu}
                            className="w-9 h-9 rounded-lg border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] text-[#124E35] flex items-center justify-center cursor-pointer transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-base sm:text-lg text-[#124E35]">
              Theo dõi & Lịch sử đơn
            </span>
                    </div>
                    <span className="text-xs sm:text-sm font-mono tabular-nums border border-[#D5CCB4] px-3 py-1.5 rounded-lg bg-[#EDE6D1] text-[#124E35] font-medium">
            Điểm: <span className="font-semibold text-[#124E35]">{user?.loyaltyPoints ?? 0}</span>
          </span>
                </div>

                {statusNotice && (
                    <div className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium flex justify-between items-start gap-2 ${statusNotice.type === 'error' ? 'border-red-300 bg-red-50 text-red-800' : 'border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35]'}`}>
                        <span className="leading-relaxed">{statusNotice.message}</span>
                        {onClearNotice && (
                            <button
                                type="button"
                                aria-label="Đóng thông báo"
                                onClick={onClearNotice}
                                className="text-[#124E35] hover:opacity-80 px-1 cursor-pointer shrink-0 font-mono font-bold"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                    {historyLoading ? (
                        <div className="col-span-full text-center text-sm py-16 text-[#124E35] bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl font-medium">
                            Đang tải danh sách đơn hàng...
                        </div>
                    ) : orderHistory.length === 0 ? (
                        <div className="col-span-full py-16 px-4 text-center bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl space-y-2">
                            <div className="text-sm font-semibold text-[#124E35]">Chưa có đơn hàng nào</div>
                            <div className="text-xs text-neutral-600">
                                Các đơn hàng bạn đặt sẽ được hiển thị và cập nhật tiến trình tại đây.
                            </div>
                        </div>
                    ) : (
                        orderHistory.map((order) => {
                            const status = order.status;
                            const choPhepKhachThaoTac =
                                status === 'PENDING' || status === 'PAYMENT_FAILED' || status === 'PAID';
                            const coTheHuy = !order.pendingZalopay && !order.paidWithZalopay;
                            const coTheThuLai = !order.pendingZalopay && !order.paidWithZalopay;

                            return (
                                <div
                                    key={order.id}
                                    className="p-4 sm:p-5 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl text-xs sm:text-sm space-y-3.5"
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                      <span className="font-mono font-semibold text-sm sm:text-base text-[#124E35] block">
                        Đơn #{order.orderCode ?? order.id}
                      </span>
                                            <div className="text-xs text-neutral-500 font-mono mt-0.5">
                                                {order.createdAt}
                                            </div>
                                        </div>

                                        <span
                                            className={`px-2.5 py-1 rounded-md border text-xs font-semibold ${
                                                status === 'CANCELLED'
                                                    ? 'border-neutral-200 bg-stone-100 text-neutral-400 line-through'
                                                    : 'border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35]'
                                            }`}
                                        >
                      {layTenTrangThai(status)}
                    </span>
                                    </div>

                                    <TienTrinhDon status={status} />
                                    {status === 'READY' && <div className="px-3 py-3 bg-[#EDE6D1] rounded-lg text-xs">
                                        Đồ uống đã pha xong. Vui lòng tới quầy nhận đơn #{order.orderCode ?? order.id}.
                                    </div>}

                                    {order.items && order.items.length > 0 && (
                                        <div className="py-2.5 border-y border-[#E2D9C0] space-y-2">
                                            {order.items.map((item) => {
                                                const product = products.find((p) => p.id === item.productId);
                                                const name = product ? product.name : `Món #${item.productId}`;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="flex justify-between items-start text-xs sm:text-sm text-neutral-900"
                                                    >
                                                        <div>
                              <span className="font-medium">
                                {name}{' '}
                                  <span className="font-normal text-neutral-600">
                                  (Size {item.size}) · x{item.qty}
                                </span>
                              </span>
                                                            {item.toppings && item.toppings.length > 0 && (
                                                                <div className="text-xs text-neutral-600">
                                                                    Topping: {item.toppings.map((t) =>
                                                                    `${t.name || `#${t.toppingId}`}${t.servings > 1 ? ` ×${t.servings}` : ''}`
                                                                ).join(', ')}
                                                                </div>
                                                            )}
                                                            {(item.sugar || item.ice) && (
                                                                <div className="text-xs text-neutral-600">
                                                                    Đường: {item.sugar || '100%'} · Đá: {item.ice || '100%'}
                                                                </div>
                                                            )}
                                                            {item.note && (
                                                                <div className="text-xs text-neutral-600 italic">
                                                                    Ghi chú: &ldquo;{item.note}&rdquo;
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="font-mono tabular-nums text-[#124E35] font-medium shrink-0 ml-2">
                              {formatPrice(item.lineTotal)}
                            </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                        <span className="text-neutral-600">Tổng thanh toán</span>
                                        <span className="font-mono tabular-nums font-bold text-base text-[#124E35]">
                      {formatPrice(order.total)}
                    </span>
                                    </div>

                                    {choPhepKhachThaoTac && (
                                        <div className="pt-2.5 border-t border-[#E2D9C0] flex flex-wrap gap-2 justify-end">
                                            {coTheHuy ? <button
                                                type="button"
                                                onClick={() => onTransition(order.id, 'CANCELLED')}
                                                className="px-3.5 py-1.5 border border-[#D5CCB4] bg-[#EDE6D1] rounded-lg text-xs font-semibold text-[#124E35] cursor-pointer hover:bg-[#124E35] hover:text-[#F5F0E1] transition-colors"
                                            >
                                                Hủy đơn
                                            </button> : <span className="text-xs text-amber-700 py-1.5">
                                                {order.paidWithZalopay
                                                    ? 'ZaloPay đã thu tiền: liên hệ cửa hàng để kiểm tra/hoàn tiền.'
                                                    : 'ZaloPay đang chờ xác nhận: không hủy hoặc thanh toán lại.'}
                                            </span>}
                                            {coTheThuLai && (status === 'PENDING' || status === 'PAYMENT_FAILED') && (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {order.total > 0 && (
                                                        <select
                                                            aria-label={`Phương thức thanh toán đơn ${order.orderCode ?? order.id}`}
                                                            value={retryMethodByOrder[order.id] || 'ZALOPAY'}
                                                            onChange={e => setRetryMethodByOrder(prev => ({...prev,
                                                                [order.id]: e.target.value as 'ZALOPAY' | 'WALLET' | 'CARD'}))}
                                                            className="px-2 py-1.5 border border-[#D5CCB4] rounded-lg text-xs bg-white text-[#124E35]"
                                                        >
                                                            <option value="ZALOPAY">ZaloPay</option>
                                                            {DEMO_PAYMENTS && <option value="WALLET">Ví mô phỏng</option>}
                                                            {DEMO_PAYMENTS && <option value="CARD">Thẻ mô phỏng</option>}
                                                        </select>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => onRetryFromHistory(order.id, retryMethodByOrder[order.id] || 'ZALOPAY')}
                                                        className="px-3.5 py-1.5 bg-[#124E35] text-[#F5F0E1] rounded-lg text-xs font-semibold cursor-pointer hover:opacity-95 transition-colors"
                                                    >
                                                        {order.total === 0 ? 'Hoàn tất đơn 0đ' : 'Thử lại thanh toán'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="pt-2 flex justify-end">
                <button
                    type="button"
                    onClick={onBackToMenu}
                    className="w-full sm:w-auto sm:min-w-[220px] py-2.5 px-5 bg-[#124E35] text-[#F5F0E1] font-semibold text-sm rounded-lg cursor-pointer hover:opacity-95 transition-colors"
                >
                    Về thực đơn chính
                </button>
            </div>
        </div>
    );
};

export default LichSuDon;

