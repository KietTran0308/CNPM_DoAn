import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import {
    Product,
    User,
    formatPrice,
    ANH_MAC_DINH,
    layDuongDanAnh,
    SizeType,
    ToppingType,
    SugarType,
    IceType,
    DEFAULT_TOPPINGS,
    ToppingItem,
} from '../api';

interface ChiTietMonProps {
    selectedProduct: Product;
    toppings?: ToppingItem[];
    user: User | null;
    detailLoading: boolean;
    stockNotice: string | null;
    selectedSize: SizeType;
    setSelectedSize: (size: SizeType) => void;
    selectedToppings: ToppingType[];
    toggleTopping: (topping: ToppingType) => void;
    selectedSugar: SugarType;
    setSelectedSugar: (sugar: SugarType) => void;
    selectedIce: IceType;
    setSelectedIce: (ice: IceType) => void;
    customerNote: string;
    setCustomerNote: (note: string) => void;
    selectedQty?: number;
    setSelectedQty?: (qty: number) => void;
    currentUnitPrice: number;
    addingToCart: boolean;
    onAddToCart: () => void;
    onBack: () => void;
}

export const ChiTietMon: React.FC<ChiTietMonProps> = ({
                                                          selectedProduct,
                                                          toppings = DEFAULT_TOPPINGS,
                                                          user,
                                                          detailLoading,
                                                          stockNotice,
                                                          selectedSize,
                                                          setSelectedSize,
                                                          selectedToppings,
                                                          toggleTopping,
                                                          selectedSugar,
                                                          setSelectedSugar,
                                                          selectedIce,
                                                          setSelectedIce,
                                                          customerNote,
                                                          setCustomerNote,
                                                          selectedQty = 1,
                                                          setSelectedQty,
                                                          currentUnitPrice,
                                                          addingToCart,
                                                          onAddToCart,
                                                          onBack,
                                                      }) => {
    const [loiAnh, setLoiAnh] = useState(false);
    const tongTamTinh = currentUnitPrice * selectedQty;
    const anhDuPhong = layDuongDanAnh(ANH_MAC_DINH);
    const duongDanAnh = layDuongDanAnh(selectedProduct.imageUrl) || anhDuPhong;

    return (
        <div className="w-full flex-1 flex flex-col space-y-5">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#FBF9F5] rounded-xl border border-[#E2D9C0]">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        aria-label="Quay lại thực đơn"
                        onClick={onBack}
                        className="w-9 h-9 rounded-lg border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] text-[#124E35] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-base sm:text-lg text-[#124E35] truncate">
            {selectedProduct.name}
          </span>
                </div>
                <span className="text-xs sm:text-sm font-mono tabular-nums border border-[#D5CCB4] px-3 py-1.5 rounded-lg bg-[#EDE6D1] text-[#124E35] font-medium shrink-0">
          Điểm: <span className="font-semibold text-[#124E35]">{user?.loyaltyPoints ?? 0}</span>
        </span>
            </div>

            {detailLoading ? (
                <div className="text-center text-sm py-16 text-[#124E35] bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl font-medium">
                    Đang tải chi tiết món...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    <div className="lg:col-span-5 lg:sticky lg:top-6 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl overflow-hidden">
                        <div className="w-full bg-[#124E35] border-b border-[#E2D9C0] overflow-hidden flex items-center justify-center">
                            {loiAnh ? (
                                <div className="w-full aspect-square bg-[#EDE6D1] text-[#124E35] text-xs flex items-center justify-center">
                                    Ảnh
                                </div>
                            ) : (
                                <img
                                    src={duongDanAnh}
                                    alt={selectedProduct.name}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        if (anhDuPhong && !e.currentTarget.src.endsWith(anhDuPhong)) {
                                            e.currentTarget.src = anhDuPhong;
                                        } else {
                                            setLoiAnh(true);
                                        }
                                    }}
                                    className="w-full h-auto object-contain block"
                                />
                            )}
                        </div>

                        <div className="p-5 space-y-2.5">
                            <div className="flex items-center justify-between gap-2 text-xs">
                                {selectedProduct.category ? (
                                    <span className="px-2.5 py-0.5 rounded bg-[#EDE6D1] border border-[#D5CCB4] text-[#124E35] text-xs font-semibold">
                    {selectedProduct.category}
                  </span>
                                ) : (
                                    <span />
                                )}
                                <span className="px-2.5 py-0.5 rounded bg-[#EDE6D1] border border-[#D5CCB4] text-[#124E35] text-xs font-semibold">
                  {selectedProduct.isActive === false ? 'Ngừng bán' : selectedProduct.stock <= 0 ? 'Hết hàng' : 'Có thể đặt · kiểm tra khi thanh toán'}
                </span>
                            </div>

                            <h1 className="font-semibold text-lg sm:text-xl text-neutral-900">
                                {selectedProduct.name}
                            </h1>

                            {selectedProduct.description && (
                                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                                    {selectedProduct.description}
                                </p>
                            )}

                            <div className="pt-2 border-t border-[#E2D9C0] flex items-center justify-between text-xs sm:text-sm text-neutral-700">
                                <span>Giá gốc</span>
                                <span className="font-mono tabular-nums font-bold text-base text-[#124E35]">
                  {formatPrice(selectedProduct.price)}
                </span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl p-5 sm:p-6 space-y-5">
                        {stockNotice && (
                            <div className="text-xs sm:text-sm text-[#124E35] font-medium text-center border border-[#D5CCB4] p-3 rounded-xl bg-[#EDE6D1]">
                                {stockNotice}
                            </div>
                        )}

                        <div>
                            <div className="text-xs sm:text-sm font-semibold text-[#124E35] mb-2.5">
                                Chọn kích cỡ (Size)
                            </div>
                            <div className="grid grid-cols-3 gap-2.5">
                                {(['S', 'M', 'L'] as SizeType[]).map(size => ({
                                    size, label: `Size ${size}`, price: selectedProduct.sizePrices?.[size] ?? selectedProduct.price,
                                })).map(({ size, label, price }) => {
                                    const isActive = selectedSize === size;
                                    return (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => setSelectedSize(size)}
                                            className={`p-2.5 text-xs sm:text-sm border rounded-lg text-center cursor-pointer flex flex-col items-center justify-center transition-colors ${
                                                isActive
                                                    ? 'bg-[#124E35] text-[#F5F0E1] font-semibold border-[#124E35]'
                                                    : 'bg-[#EDE6D1] text-[#124E35] font-medium border-[#D5CCB4] hover:bg-[#124E35] hover:text-[#F5F0E1]'
                                            }`}
                                        >
                                            <span>{label}</span>
                                            <span
                                                className={`text-[11px] font-mono tabular-nums mt-0.5 ${
                                                    isActive ? 'text-[#F5F0E1]/90' : 'text-[#124E35]/80'
                                                }`}
                                            >
                        {formatPrice(price)}
                      </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs sm:text-sm font-semibold text-[#124E35] mb-2.5">
                                Chọn Topping ({selectedToppings.length} đã chọn)
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                                {toppings.map((t) => {
                                    const isChecked = selectedToppings.includes(t.name);
                                    return (
                                        <button
                                            key={t.code}
                                            type="button"
                                            onClick={() => toggleTopping(t.name)}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs sm:text-sm font-semibold text-[#124E35] mb-2">Mức đường</div>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {(['100%', '70%', '50%', '30%', 'Ít đường'] as SugarType[]).map((sugar) => (
                                        <button
                                            key={sugar}
                                            type="button"
                                            onClick={() => setSelectedSugar(sugar)}
                                            className={`py-2 text-[11px] sm:text-xs border rounded-lg text-center cursor-pointer transition-colors ${
                                                selectedSugar === sugar
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
                                <div className="text-xs sm:text-sm font-semibold text-[#124E35] mb-2">Mức đá</div>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {(['100%', '70%', '50%', 'Ít đá', 'Đá riêng'] as IceType[]).map((ice) => (
                                        <button
                                            key={ice}
                                            type="button"
                                            onClick={() => setSelectedIce(ice)}
                                            className={`py-2 text-[11px] sm:text-xs border rounded-lg text-center cursor-pointer transition-colors ${
                                                selectedIce === ice
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

                        {setSelectedQty && (
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs sm:text-sm font-semibold text-[#124E35]">Số lượng ly</span>
                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                                        className="w-8 h-8 rounded-lg border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] flex items-center justify-center text-[#124E35] text-xs font-mono font-semibold cursor-pointer transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center font-mono text-sm font-semibold text-[#124E35] tabular-nums">
                    {selectedQty}
                  </span>
                                    <button
                                        type="button"
                                        disabled={selectedQty >= selectedProduct.stock}
                                        onClick={() =>
                                            setSelectedQty(Math.min(selectedProduct.stock, selectedQty + 1))
                                        }
                                        className="w-8 h-8 rounded-lg border border-[#D5CCB4] bg-[#EDE6D1] hover:bg-[#124E35] hover:text-[#F5F0E1] flex items-center justify-center text-[#124E35] text-xs font-mono font-semibold cursor-pointer disabled:opacity-40 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs sm:text-sm font-semibold mb-2 text-[#124E35]">
                                Ghi chú cho quán (Tùy chọn)
                            </label>
                            <textarea
                                value={customerNote}
                                maxLength={250}
                                onChange={(e) => setCustomerNote(e.target.value)}
                                placeholder="Ví dụ: Ít ngọt, nhiều đá riêng..."
                                rows={2}
                                className="w-full p-3 border border-[#D5CCB4] bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#124E35] focus:ring-1 focus:ring-[#124E35] resize-none rounded-lg transition-colors"
                            />
                        </div>

                        <div className="pt-4 border-t border-[#E2D9C0] space-y-3">
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-neutral-600">Tổng tạm tính ({selectedQty} ly):</span>
                                <span className="font-mono tabular-nums font-bold text-lg text-[#124E35]">
                  {formatPrice(tongTamTinh)}
                </span>
                            </div>

                            <button
                                type="button"
                                onClick={onAddToCart}
                                disabled={selectedProduct.stock <= 0 || selectedProduct.isActive === false || addingToCart}
                                className="w-full py-3 bg-[#124E35] text-[#F5F0E1] font-semibold text-sm rounded-lg cursor-pointer hover:opacity-95 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span>
                  {selectedProduct.isActive === false
                      ? 'Món tạm ngừng bán'
                      : selectedProduct.stock <= 0
                          ? 'Hết hàng'
                          : addingToCart
                              ? 'Đang thêm vào giỏ...'
                              : `Thêm vào giỏ · ${formatPrice(tongTamTinh)}`}
                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChiTietMon;

