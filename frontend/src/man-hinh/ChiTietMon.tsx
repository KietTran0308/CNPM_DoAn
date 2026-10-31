import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Product, User, formatPrice } from '../api';
import { ANH_MAC_DINH, layDuongDanAnh } from '../hinhAnh';
import { SizeType, ToppingType, SugarType, IceType } from '../types';

interface ChiTietMonProps {
  selectedProduct: Product;
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
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white rounded-xl border border-neutral-200/80">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="Quay lại thực đơn"
            onClick={onBack}
            className="w-9 h-9 rounded-lg border border-neutral-200/80 bg-white hover:bg-emerald-50/70 hover:text-emerald-900 text-neutral-700 flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-base sm:text-lg text-neutral-900 truncate">
            {selectedProduct.name}
          </span>
        </div>
        <span className="text-xs sm:text-sm font-mono tabular-nums border border-emerald-800/15 px-3 py-1.5 rounded-lg bg-emerald-50/70 text-emerald-900 shrink-0">
          Điểm: <span className="font-semibold text-emerald-900">{user?.loyaltyPoints ?? 0}</span>
        </span>
      </div>

      {detailLoading ? (
        <div className="text-center text-sm py-16 text-neutral-500 bg-white border border-neutral-200/80 rounded-xl">
          Đang tải chi tiết món...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-6 bg-white border border-neutral-200/80 rounded-xl overflow-hidden">
            <div className="w-full bg-[#115e3b] border-b border-neutral-200/80 overflow-hidden flex items-center justify-center">
              {loiAnh ? (
                <div className="w-full aspect-square bg-stone-50 text-neutral-400 text-xs flex items-center justify-center">
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
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                {selectedProduct.category ? (
                  <span className="px-2.5 py-0.5 rounded bg-emerald-50/70 text-emerald-900 text-xs font-medium">
                    {selectedProduct.category}
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-xs text-neutral-500">
                  Còn {selectedProduct.stock} ly
                </span>
              </div>

              <h1 className="font-semibold text-lg sm:text-xl text-neutral-900">
                {selectedProduct.name}
              </h1>

              {selectedProduct.description && (
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  {selectedProduct.description}
                </p>
              )}

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs sm:text-sm text-neutral-600">
                <span>Giá gốc</span>
                <span className="font-mono tabular-nums font-bold text-base text-emerald-800">
                  {formatPrice(selectedProduct.price)}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 space-y-5">
            {stockNotice && (
              <div className="text-xs sm:text-sm text-emerald-900 text-center border border-emerald-800/20 p-3 rounded-xl bg-emerald-50/70">
                {stockNotice}
              </div>
            )}

            <div>
              <div className="text-xs sm:text-sm font-medium text-neutral-700 mb-2.5">
                Chọn kích cỡ (Size)
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { size: 'S' as SizeType, label: 'Size S (+0đ)', price: selectedProduct.price },
                  {
                    size: 'M' as SizeType,
                    label: 'Size M (+5.000đ)',
                    price: selectedProduct.price + 5000,
                  },
                  {
                    size: 'L' as SizeType,
                    label: 'Size L (+10.000đ)',
                    price: selectedProduct.price + 10000,
                  },
                ].map(({ size, label, price }) => {
                  const isActive = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`p-2.5 text-xs sm:text-sm border rounded-lg text-center cursor-pointer flex flex-col items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-emerald-800 text-white font-medium border-emerald-800'
                          : 'bg-white text-neutral-600 border-neutral-200/80 hover:bg-emerald-50/70 hover:text-emerald-900'
                      }`}
                    >
                      <span>{label}</span>
                      <span
                        className={`text-[11px] font-mono tabular-nums mt-0.5 ${
                          isActive ? 'text-emerald-100' : 'text-neutral-500'
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
              <div className="text-xs sm:text-sm font-medium text-neutral-700 mb-2.5">
                Chọn Topping
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { name: 'Trân châu' as ToppingType, extra: '+5.000đ' },
                  { name: 'Kem' as ToppingType, extra: '+10.000đ' },
                ].map(({ name, extra }) => {
                  const isChecked = selectedToppings.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleTopping(name)}
                      className={`py-2.5 px-3.5 text-xs sm:text-sm border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-800 text-white font-medium border-emerald-800'
                          : 'bg-white text-neutral-600 border-neutral-200/80 hover:bg-emerald-50/70 hover:text-emerald-900'
                      }`}
                    >
                      <span>{name}</span>
                      <span className="font-mono text-xs opacity-85">{extra}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs sm:text-sm font-medium text-neutral-700 mb-2">Mức đường</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['100%', '70%', '50%', '30%', 'Ít đường'] as SugarType[]).map((sugar) => (
                    <button
                      key={sugar}
                      type="button"
                      onClick={() => setSelectedSugar(sugar)}
                      className={`py-2 text-[11px] sm:text-xs border rounded-lg text-center cursor-pointer transition-colors ${
                        selectedSugar === sugar
                          ? 'bg-emerald-800 text-white font-medium border-emerald-800'
                          : 'bg-white text-neutral-600 border-neutral-200/80 hover:bg-emerald-50/70 hover:text-emerald-900'
                      }`}
                    >
                      {sugar}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs sm:text-sm font-medium text-neutral-700 mb-2">Mức đá</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['100%', '70%', '50%', 'Ít đá', 'Đá riêng'] as IceType[]).map((ice) => (
                    <button
                      key={ice}
                      type="button"
                      onClick={() => setSelectedIce(ice)}
                      className={`py-2 text-[11px] sm:text-xs border rounded-lg text-center cursor-pointer transition-colors ${
                        selectedIce === ice
                          ? 'bg-emerald-800 text-white font-medium border-emerald-800'
                          : 'bg-white text-neutral-600 border-neutral-200/80 hover:bg-emerald-50/70 hover:text-emerald-900'
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
                <span className="text-xs sm:text-sm font-medium text-neutral-700">Số lượng ly</span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                    className="w-8 h-8 rounded-lg border border-neutral-200/80 bg-white hover:bg-emerald-50/70 hover:text-emerald-900 flex items-center justify-center text-neutral-700 text-xs font-mono cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono text-sm font-semibold text-neutral-900 tabular-nums">
                    {selectedQty}
                  </span>
                  <button
                    type="button"
                    disabled={selectedQty >= selectedProduct.stock}
                    onClick={() =>
                      setSelectedQty(Math.min(selectedProduct.stock, selectedQty + 1))
                    }
                    className="w-8 h-8 rounded-lg border border-neutral-200/80 bg-white hover:bg-emerald-50/70 hover:text-emerald-900 flex items-center justify-center text-neutral-700 text-xs font-mono cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-neutral-700">
                Ghi chú cho quán (Tùy chọn)
              </label>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Ví dụ: Ít ngọt, nhiều đá riêng..."
                rows={2}
                className="w-full p-3 border border-neutral-200/80 bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 resize-none rounded-lg transition-colors"
              />
            </div>

            <div className="pt-4 border-t border-neutral-200/80 space-y-3">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-neutral-500">Tổng tạm tính ({selectedQty} ly):</span>
                <span className="font-mono tabular-nums font-bold text-lg text-emerald-800">
                  {formatPrice(tongTamTinh)}
                </span>
              </div>

              <button
                type="button"
                onClick={onAddToCart}
                disabled={selectedProduct.stock <= 0 || addingToCart}
                className="w-full py-3 bg-emerald-800 text-white font-medium text-sm rounded-lg cursor-pointer hover:bg-emerald-700 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {selectedProduct.stock <= 0
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
