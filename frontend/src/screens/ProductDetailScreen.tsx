/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product, User, formatPrice } from '../api';
import { SizeType, ToppingType, SugarType, IceType } from '../types';

interface ProductDetailScreenProps {
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
  currentUnitPrice: number;
  addingToCart: boolean;
  onAddToCart: () => void;
  onBack: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
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
  currentUnitPrice,
  addingToCart,
  onAddToCart,
  onBack,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        {/* Header: ← [Tên món] */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-400">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="font-bold mr-2 text-base cursor-pointer"
            >
              ←
            </button>
            <span className="font-bold text-base">{selectedProduct.name}</span>
          </div>
          <span className="text-xs font-mono border border-gray-400 px-1.5 py-0.5 rounded bg-stone-100 font-medium">
            Điểm: {user?.loyaltyPoints ?? 0}
          </span>
        </div>

        {detailLoading ? (
          <div className="text-center text-sm py-8 text-gray-500">
            Đang tải...
          </div>
        ) : (
          <div className="mt-3 space-y-3.5 flex-1 overflow-y-auto max-h-[440px] pr-0.5">
            {stockNotice && (
              <div className="text-xs text-red-600 text-center border border-red-400 p-1.5 bg-stone-100">
                {stockNotice}
              </div>
            )}

            {/* Thông tin món & Ảnh sản phẩm */}
            <div className="flex items-center gap-3 p-2 bg-stone-100 border border-gray-400 rounded">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-14 h-14 object-cover rounded border border-gray-300 bg-stone-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-sm truncate">{selectedProduct.name}</div>
                  {selectedProduct.category && (
                    <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded border border-stone-300 font-medium shrink-0">
                      {selectedProduct.category}
                    </span>
                  )}
                </div>
                {selectedProduct.description && (
                  <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                    {selectedProduct.description}
                  </div>
                )}
                <div className="text-xs text-gray-600 mt-1">
                  Giá gốc: <span className="font-mono font-medium">{formatPrice(selectedProduct.price)}</span>
                </div>
              </div>
            </div>

            {/* Mục 1: Chọn Size (Thẻ hiển thị rõ mức giá cộng thêm) */}
            <div>
              <div className="text-xs font-bold mb-1.5">1. Chọn Size</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { size: 'S' as SizeType, label: 'S (+0đ)', price: selectedProduct.price },
                  { size: 'M' as SizeType, label: 'M (+5.000đ)', price: selectedProduct.price + 5000 },
                  { size: 'L' as SizeType, label: 'L (+10.000đ)', price: selectedProduct.price + 10000 },
                ].map(({ size, label, price }) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`p-2 text-xs border rounded text-center cursor-pointer flex flex-col items-center justify-center transition-colors ${
                      selectedSize === size
                        ? 'bg-stone-200 font-bold border-black'
                        : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                    }`}
                  >
                    <span className="font-bold text-xs">{label}</span>
                    <span className="text-[10px] text-gray-600 font-mono mt-0.5">
                      {formatPrice(price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mục 2: Chọn Topping (Hiển thị rõ mức giá cộng thêm) */}
            <div>
              <div className="text-xs font-bold mb-1.5">2. Chọn Topping</div>
              <div className="grid grid-cols-2 gap-2">
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
                      className={`p-2 text-xs border rounded text-center cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-stone-200 font-bold border-black'
                          : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                      }`}
                    >
                      {isChecked ? `[✓] ${name} (${extra})` : `[ ] ${name} (${extra})`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mục 3: Mức Đường & Mức Đá (Ice & Sugar Options) */}
            <div className="space-y-2.5">
              <div>
                <div className="text-xs font-bold mb-1.5">3. Mức Đường</div>
                <div className="grid grid-cols-5 gap-1">
                  {(['100%', '70%', '50%', '30%', 'Ít đường'] as SugarType[]).map((sugar) => (
                    <button
                      key={sugar}
                      type="button"
                      onClick={() => setSelectedSugar(sugar)}
                      className={`py-1.5 text-[11px] border rounded text-center cursor-pointer transition-colors ${
                        selectedSugar === sugar
                          ? 'bg-stone-200 font-bold border-black'
                          : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                      }`}
                    >
                      {sugar}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold mb-1.5">4. Mức Đá</div>
                <div className="grid grid-cols-5 gap-1">
                  {(['100%', '70%', '50%', 'Ít đá', 'Đá riêng'] as IceType[]).map((ice) => (
                    <button
                      key={ice}
                      type="button"
                      onClick={() => setSelectedIce(ice)}
                      className={`py-1.5 text-[11px] border rounded text-center cursor-pointer transition-colors ${
                        selectedIce === ice
                          ? 'bg-stone-200 font-bold border-black'
                          : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                      }`}
                    >
                      {ice}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mục 4: Ô Ghi chú cho quán */}
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-800">
                Ghi chú cho quán (Ví dụ: Ít ngọt, nhiều đá riêng...)
              </label>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Ghi chú yêu cầu đặc biệt..."
                rows={2}
                className="w-full p-2 border border-gray-400 bg-white text-xs placeholder:text-gray-400 focus:outline-none resize-none rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* Dưới cùng: Tổng tạm tính trực quan & Nút Thêm vào giỏ */}
      <div className="pt-3 border-t border-gray-300 mt-2 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-700">Tổng tạm tính:</span>
          <span className="font-mono font-bold text-base text-black">
            {formatPrice(currentUnitPrice)}
          </span>
        </div>

        <button
          onClick={onAddToCart}
          disabled={selectedProduct.stock <= 0 || addingToCart}
          className="w-full py-2.5 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {selectedProduct.stock <= 0
            ? 'Hết hàng'
            : addingToCart
            ? 'Đang thêm...'
            : `Thêm vào giỏ • ${formatPrice(currentUnitPrice)}`}
        </button>
      </div>
    </div>
  );
};

export default ProductDetailScreen;
