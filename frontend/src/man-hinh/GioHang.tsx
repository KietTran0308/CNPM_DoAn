import React from 'react';
import { ArrowLeft } from 'lucide-react';
import {
    User,
    formatPrice,
    CartLine,
    SizeType,
    ToppingType,
    SugarType,
    IceType,
    DEFAULT_TOPPINGS,
    ToppingItem,
} from '../api';

export interface ModalSuaMonProps {
    editingItemId: string | null;
    toppings?: ToppingItem[];
    editProductName: string;
    editBasePrice: number;
    editSize: SizeType;
    setEditSize: (size: SizeType) => void;
    editToppings: ToppingType[];
    onToggleEditTopping: (topping: ToppingType) => void;
    editSugar: SugarType;
    setEditSugar: (sugar: SugarType) => void;
    editIce: IceType;
    setEditIce: (ice: IceType) => void;
    editNote: string;
    setEditNote: (note: string) => void;
    editQty: number;
    setEditQty?: (qty: number) => void;
    editMaxStock?: number;
    editUnitPrice: number;
    getSizeExtra: (size: SizeType) => number;
    onClose: () => void;
    onSave: () => void;
}

export const ModalSuaMon: React.FC<ModalSuaMonProps> = ({
                                                            editingItemId,
                                                            toppings = DEFAULT_TOPPINGS,
                                                            editProductName,
                                                            editBasePrice,
                                                            editSize,
                                                            setEditSize,
                                                            editToppings,
                                                            onToggleEditTopping,
                                                            editSugar,
                                                            setEditSugar,
                                                            editIce,
                                                            setEditIce,
                                                            editNote,
                                                            setEditNote,
                                                            editQty,
                                                            setEditQty,
                                                            editMaxStock = 50,
                                                            editUnitPrice,
                                                            getSizeExtra,
                                                            onClose,
                                                            onSave,
                                                        }) => {
    if (!editingItemId) return null;

    return (
        <div className="fixed inset-0 bg-neutral-900/40 z-50 p-4 sm:p-6 flex items-center justify-center">
            <div className="bg-[#FBF9F5] border border-[#E2D9C0] rounded-2xl p-5 sm:p-6 w-full max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto space-y-5 shadow-lg">
                <div className="flex justify-between items-start pb-3 border-b border-[#E2D9C0]">
                    <div>
                        <h3 className="font-semibold text-base text-[#124E35]">Chỉnh sửa tùy chọn món</h3>
                        <div className="text-xs text-neutral-600 mt-0.5">
                            {editProductName} · Giá cơ bản:{' '}
                            <span className="font-mono tabular-nums font-semibold text-[#124E35]">
                {formatPrice(editBasePrice)}
              </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label="Đóng"
                        onClick={onClose}
                        className="px-2.5 py-1 rounded-lg border border-[#D5CCB4] bg-[#EDE6D1] text-xs font-medium text-[#124E35] hover:bg-[#124E35] hover:text-[#F5F0E1] cursor-pointer transition-colors"
                    >
                        Đóng
                    </button>
                </div>

                <div>
                    <div className="text-xs font-semibold text-[#124E35] mb-2">Kích cỡ (Size)</div>
                    <div className="grid grid-cols-3 gap-2">
                        {(['S', 'M', 'L'] as SizeType[]).map((size) => {
                            const extra = getSizeExtra(size);
                            const label = `Size ${size} (${extra > 0 ? '+' : ''}${formatPrice(extra)})`;
                            const isSelected = editSize === size;
                            return (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => setEditSize(size)}
                                    className={`py-2 px-2.5 text-xs border rounded-lg text-center cursor-pointer transition-colors ${
                                        isSelected
                                            ? 'bg-[#124E35] text-[#F5F0E1] font-semibold border-[#124E35]'
                                            : 'bg-[#EDE6D1] text-[#124E35] font-medium border-[#D5CCB4] hover:bg-[#124E35] hover:text-[#F5F0E1]'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <div className="text-xs font-semibold text-[#124E35] mb-2">
                        Topping thêm ({editToppings.length} đã chọn)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {toppings.map((t) => {
                            const isChecked = editToppings.includes(t.name);
                            return (
                                <button
                                    key={t.code}
                                    type="button"
                                    onClick={() => onToggleEditTopping(t.name)}
                                    className={`py-2 px-3 text-xs border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                                        isChecked
                                            ? 'bg-[#124E35] text-[#F5F0E1] font-semibold border-[#124E35]'
                                            : 'bg-[#EDE6D1] text-[#124E35] font-medium border-[#D5CCB4] hover:bg-[#124E35] hover:text-[#F5F0E1]'
                                    }`}
                                >
                                    <span className="truncate pr-1">{t.name}</span>
                                    <span className="font-mono text-[11px] shrink-0 opacity-85">+{formatPrice(t.price)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="text-xs font-semibold text-[#124E35] mb-2">Mức đường</div>
                        <div className="grid grid-cols-5 gap-1.5">
                            {(['100%', '70%', '50%', '30%', 'Ít đường'] as SugarType[]).map((sugar) => (
                                <button
                                    key={sugar}
                                    type="button"
                                    onClick={() => setEditSugar(sugar)}
                                    className={`py-1.5 text-[11px] border rounded-lg text-center cursor-pointer transition-colors ${
                                        editSugar === sugar
                                            ? 'bg-[#124E35] text-[#F5F0E1] font-semibold border-[#124E35]'
                                            : 'bg-[#EDE6D1] text-[#124E35] font-medium border-[#D5CCB4] hover:bg-[#124E35] hover:text-[#F5F0E1]'
                                    }`}
                                >
                                    {sugar}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-semibold text-[#124E35] mb-2">Mức đá</div>
                        <div className="grid grid-cols-5 gap-1.5">
                            {(['100%', '70%', '50%', 'Ít đá', 'Đá riêng'] as IceType[]).map((ice) => (
                                <button
                                    key={ice}
                                    type="button"
                                    onClick={() => setEditIce(ice)}
                                    className={`py-1.5 text-[11px] border rounded-lg text-center cursor-pointer transition-colors ${
                                        editIce === ice
                                            ? 'bg-[#124E35] text-[#F5F0E1] font-semibold border-[#124E35]'
                                            : 'bg-[#EDE6D1] text-[#124E35] font-medium border-[#D5CCB4] hover:bg-[#124E35] hover:text-[#F5F0E1]'
                                    }`}
                                >
                                    {ice}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {setEditQty && (
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-[#124E35]">Số lượng</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setEditQty(Math.max(1, editQty - 1))}
                                className="w-7 h-7 rounded-lg border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] flex items-center justify-center text-[#124E35] text-xs font-mono font-semibold cursor-pointer transition-colors"
                            >
                                -
                            </button>
                            <span className="w-7 text-center font-mono text-xs font-semibold text-[#124E35] tabular-nums">
                {editQty}
              </span>
                            <button
                                type="button"
                                disabled={editQty >= editMaxStock}
                                onClick={() => setEditQty(Math.min(editMaxStock, editQty + 1))}
                                className="w-7 h-7 rounded-lg border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] flex items-center justify-center text-[#124E35] text-xs font-mono font-semibold cursor-pointer disabled:opacity-40 transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-semibold mb-1.5 text-[#124E35]">
                        Ghi chú cho quán
                    </label>
                    <textarea
                        value={editNote}
                        maxLength={250}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Ví dụ: Ít ngọt, lấy đá riêng..."
                        rows={2}
                        className="w-full p-2.5 border border-[#D5CCB4] bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#124E35] focus:ring-1 focus:ring-[#124E35] resize-none rounded-lg transition-colors"
                    />
                </div>

                <div className="pt-3 border-t border-[#E2D9C0] flex justify-between items-center text-xs">
                    <span className="text-neutral-600">Thành tiền mới ({editQty} ly):</span>
                    <span className="font-mono tabular-nums font-bold text-base text-[#124E35]">
            {formatPrice(editUnitPrice * editQty)}
          </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 border border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35] text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#E2D9C0] transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        className="w-full py-2.5 bg-[#124E35] text-[#F5F0E1] text-xs font-semibold rounded-lg cursor-pointer hover:opacity-95 transition-colors"
                    >
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
};

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
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#FBF9F5] rounded-xl border border-[#E2D9C0]">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        aria-label="Quay lại thực đơn"
                        onClick={onBack}
                        className="w-9 h-9 rounded-lg border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] text-[#124E35] flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-base sm:text-lg text-[#124E35]">
            Giỏ hàng {tongSoLy > 0 && `(${tongSoLy})`}
          </span>
                </div>

                <div className="flex items-center gap-2.5">
                    {cartLines.length > 0 && onClearCart && (
                        <button
                            type="button"
                            onClick={onClearCart}
                            className="px-3 py-1.5 rounded-lg border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] text-[#124E35] font-medium text-xs sm:text-sm cursor-pointer transition-colors"
                        >
                            Xóa tất cả
                        </button>
                    )}
                    <span className="text-xs sm:text-sm font-mono tabular-nums border border-[#D5CCB4] px-3 py-1.5 rounded-lg bg-[#EDE6D1] text-[#124E35] font-medium">
            Điểm: <span className="font-semibold text-[#124E35]">{user?.loyaltyPoints ?? 0}</span>
          </span>
                </div>
            </div>

            {editSuccessToast && (
                <div className="px-4 py-2.5 bg-[#EDE6D1] border border-[#D5CCB4] rounded-xl text-center text-xs sm:text-sm text-[#124E35] font-semibold">
                    Đã lưu thay đổi tùy chọn món thành công
                </div>
            )}

            {cartLines.length === 0 ? (
                <div className="py-16 px-4 text-center bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl space-y-3">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#124E35]">Giỏ hàng của bạn đang trống</p>
                        <p className="text-xs text-neutral-600">
                            Hãy chọn những món cà phê và trà yêu thích từ thực đơn.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[#124E35] text-[#F5F0E1] text-xs sm:text-sm font-semibold hover:opacity-95 cursor-pointer transition-colors"
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
                                className="p-4 sm:p-5 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl text-xs sm:text-sm space-y-3"
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="min-w-0 space-y-1">
                                        <div className="font-semibold text-neutral-900 text-sm sm:text-base">
                                            {line.productName}{' '}
                                            <span className="text-xs sm:text-sm font-normal text-neutral-600">
                        (Size {line.item.size}) · x{line.item.qty}
                      </span>
                                        </div>
                                        {(line.toppings.length > 0 || line.sugar || line.ice) && (
                                            <div className="text-xs text-neutral-600">
                                                {line.toppings.length > 0 && `Topping: ${line.toppings.join(', ')} · `}
                                                Đường: {line.sugar} · Đá: {line.ice}
                                            </div>
                                        )}
                                        {line.note && (
                                            <div className="text-xs text-neutral-600 italic">
                                                Ghi chú: &ldquo;{line.note}&rdquo;
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                    <span className="font-mono tabular-nums font-bold text-sm sm:text-base text-[#124E35] block">
                      {formatPrice(line.item.lineTotal)}
                    </span>
                                        {line.item.qty > 1 && (
                                            <span className="font-mono tabular-nums text-[11px] text-neutral-500">
                        {formatPrice(line.unitPrice)} / ly
                      </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2.5 border-t border-[#E2D9C0]">
                                    <button
                                        type="button"
                                        onClick={() => onOpenEditModal(line)}
                                        className="px-3 py-1.5 border border-[#D5CCB4] bg-[#EDE6D1] rounded-lg text-xs text-[#124E35] font-semibold cursor-pointer hover:bg-[#124E35] hover:text-[#F5F0E1] transition-colors"
                                    >
                                        Tùy chỉnh
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            aria-label="Giảm số lượng"
                                            onClick={() => onUpdateCartQty(line.item.id, -1)}
                                            className="w-8 h-8 border border-[#D5CCB4] bg-[#EDE6D1] rounded-lg flex items-center justify-center text-[#124E35] font-mono font-semibold hover:bg-[#124E35] hover:text-[#F5F0E1] cursor-pointer transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="w-7 text-center font-mono tabular-nums font-semibold text-[#124E35]">
                      {line.item.qty}
                    </span>
                                        <button
                                            type="button"
                                            aria-label="Tăng số lượng"
                                            onClick={() => onUpdateCartQty(line.item.id, 1)}
                                            disabled={line.item.qty >= line.stock}
                                            className="w-8 h-8 border border-[#D5CCB4] bg-[#EDE6D1] rounded-lg flex items-center justify-center text-[#124E35] font-mono font-semibold hover:bg-[#124E35] hover:text-[#F5F0E1] cursor-pointer disabled:opacity-40 transition-colors"
                                        >
                                            +
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Xóa món"
                                            onClick={() => onRemoveCartItem(line.item.id)}
                                            className="px-2.5 py-1.5 border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] text-[#124E35] font-medium rounded-lg cursor-pointer ml-1 transition-colors text-xs"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl p-5 space-y-4">
                        <h2 className="font-semibold text-sm sm:text-base text-[#124E35] pb-2.5 border-b border-[#E2D9C0]">
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
                                    placeholder="Nhập mã giảm giá BrewLite"
                                    disabled={appliedPromo !== null}
                                    className="flex-1 px-3 py-2 border border-[#D5CCB4] rounded-lg bg-white text-xs text-neutral-900 uppercase font-mono placeholder:text-neutral-400 focus:outline-none focus:border-[#124E35] focus:ring-1 focus:ring-[#124E35] disabled:bg-[#EDE6D1] disabled:text-[#124E35] transition-colors"
                                />
                                {appliedPromo ? (
                                    <button
                                        type="button"
                                        onClick={onRemovePromo}
                                        className="px-3 py-2 border border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35] text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#124E35] hover:text-[#F5F0E1] shrink-0 transition-colors"
                                    >
                                        Bỏ mã
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={!promoCodeInput.trim()}
                                        className="px-3.5 py-2 bg-[#124E35] text-[#F5F0E1] text-xs font-semibold rounded-lg cursor-pointer hover:opacity-95 disabled:bg-neutral-200 disabled:text-neutral-400 shrink-0 transition-colors"
                                    >
                                        Áp dụng
                                    </button>
                                )}
                            </form>
                            {promoError && (
                                <div className="text-xs text-neutral-600 mt-1.5">{promoError}</div>
                            )}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[#E2D9C0]">
                            <div className="flex justify-between items-center text-xs sm:text-sm text-neutral-600">
                                <span>Tạm tính ({tongSoLy} món)</span>
                                <span className="font-mono tabular-nums text-neutral-900">
                  {formatPrice(rawSubtotal)}
                </span>
                            </div>
                            {appliedPromo && (
                                <div className="flex justify-between items-center text-xs sm:text-sm text-[#124E35] font-semibold">
                                    <span>Ưu đãi ({appliedPromo.code})</span>
                                    <span className="font-mono tabular-nums">-{formatPrice(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2.5 border-t border-[#E2D9C0]">
                                <span className="font-semibold text-sm text-[#124E35]">Tổng thanh toán</span>
                                <span className="font-mono tabular-nums font-bold text-lg text-[#124E35]">
                  {formatPrice(totalCartPrice)}
                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onCheckout}
                            disabled={cartLines.length === 0}
                            className="w-full py-3 bg-[#124E35] text-[#F5F0E1] font-semibold text-sm rounded-lg cursor-pointer hover:opacity-95 transition-colors"
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

