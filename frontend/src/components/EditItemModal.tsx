/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SizeType, ToppingType, SugarType, IceType } from '../types';
import { formatPrice } from '../api';

interface EditItemModalProps {
  editingItemId: string | null;
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
  editUnitPrice: number;
  getSizeExtra: (size: SizeType) => number;
  onClose: () => void;
  onSave: () => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  editingItemId,
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
  editUnitPrice,
  getSizeExtra,
  onClose,
  onSave,
}) => {
  if (!editingItemId) return null;

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 rounded-3xl p-3 sm:p-5 flex items-center justify-center">
      <div className="bg-white border border-gray-400 rounded-2xl p-4 w-full max-h-[92%] overflow-y-auto space-y-3.5 shadow-xl">
        {/* Header Modal: Tên món và giá cơ bản */}
        <div className="flex justify-between items-start pb-2 border-b border-gray-400">
          <div>
            <h3 className="font-bold text-sm text-black">Chỉnh sửa tùy chọn</h3>
            <div className="text-xs text-gray-600 mt-0.5">
              {editProductName} • Giá gốc: {formatPrice(editBasePrice)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-sm px-2 py-0.5 text-gray-500 hover:text-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Mục 1: Chọn lại Size (S, M, L) và giá tiền tương ứng */}
        <div>
          <div className="text-xs font-bold mb-1.5">1. Kích cỡ (Size)</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['S', 'M', 'L'] as SizeType[]).map((size) => {
              const extra = getSizeExtra(size);
              const label = extra === 0 ? 'S (+0đ)' : `${size} (+${formatPrice(extra)})`;
              const isSelected = editSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setEditSize(size)}
                  className={`p-2 text-xs border rounded text-center cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-stone-200 font-bold border-black'
                      : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mục 2: Tích chọn lại Topping (Trân châu, Kem...) */}
        <div>
          <div className="text-xs font-bold mb-1.5">2. Topping</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(['Trân châu', 'Kem'] as ToppingType[]).map((name) => {
              const extra = name === 'Trân châu' ? '+5.000đ' : '+10.000đ';
              const isChecked = editToppings.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onToggleEditTopping(name)}
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

        {/* Mục 3: Mức Đường & Mức Đá */}
        <div className="space-y-2.5">
          <div>
            <div className="text-xs font-bold mb-1.5">3. Mức Đường</div>
            <div className="grid grid-cols-5 gap-1">
              {(['100%', '70%', '50%', '30%', 'Ít đường'] as SugarType[]).map((sugar) => (
                <button
                  key={sugar}
                  type="button"
                  onClick={() => setEditSugar(sugar)}
                  className={`py-1.5 text-[11px] border rounded text-center cursor-pointer transition-colors ${
                    editSugar === sugar
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
                  onClick={() => setEditIce(ice)}
                  className={`py-1.5 text-[11px] border rounded text-center cursor-pointer transition-colors ${
                    editIce === ice
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
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Ghi chú yêu cầu đặc biệt..."
            rows={2}
            className="w-full p-2 border border-gray-400 bg-white text-xs placeholder:text-gray-400 focus:outline-none resize-none rounded"
          />
        </div>

        {/* Hiển thị Giá tiền đơn vị và Thành tiền */}
        <div className="pt-2 border-t border-gray-300 flex justify-between items-center text-xs">
          <span className="text-gray-700">Đơn giá mới (x{editQty}):</span>
          <span className="font-mono font-bold text-sm text-black">
            {formatPrice(editUnitPrice * editQty)}
          </span>
        </div>

        {/* 2 Nút hành động chân modal: [Hủy] và [Lưu thay đổi] */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 border border-gray-400 bg-white text-xs font-medium rounded cursor-pointer hover:bg-stone-200 text-center"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSave}
            className="w-full py-2 bg-emerald-800 text-white text-xs font-medium rounded cursor-pointer hover:bg-emerald-900 text-center"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};
