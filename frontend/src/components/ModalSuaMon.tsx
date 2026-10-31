import React from 'react';
import { SizeType, ToppingType, SugarType, IceType } from '../types';
import { formatPrice } from '../api';

interface ModalSuaMonProps {
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
  setEditQty?: (qty: number) => void;
  editMaxStock?: number;
  editUnitPrice: number;
  getSizeExtra: (size: SizeType) => number;
  onClose: () => void;
  onSave: () => void;
}

export const ModalSuaMon: React.FC<ModalSuaMonProps> = ({
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
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 w-full max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto space-y-5 shadow-lg">
        <div className="flex justify-between items-start pb-3 border-b border-neutral-200/80">
          <div>
            <h3 className="font-semibold text-base text-neutral-900">Chỉnh sửa tùy chọn món</h3>
            <div className="text-xs text-neutral-500 mt-0.5">
              {editProductName} · Giá cơ bản:{' '}
              <span className="font-mono tabular-nums font-semibold text-emerald-800">
                {formatPrice(editBasePrice)}
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg border border-neutral-200/80 text-xs text-neutral-600 hover:text-emerald-900 hover:bg-emerald-50/70 cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>

        <div>
          <div className="text-xs font-medium text-neutral-700 mb-2">Kích cỡ (Size)</div>
          <div className="grid grid-cols-3 gap-2">
            {(['S', 'M', 'L'] as SizeType[]).map((size) => {
              const extra = getSizeExtra(size);
              const label = extra === 0 ? 'Size S (+0đ)' : `Size ${size} (+${formatPrice(extra)})`;
              const isSelected = editSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setEditSize(size)}
                  className={`py-2 px-2.5 text-xs border rounded-lg text-center cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-800 text-white font-medium border-emerald-800'
                      : 'bg-white text-neutral-600 border-neutral-200/80 hover:bg-emerald-50/70 hover:text-emerald-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-neutral-700 mb-2">Topping thêm</div>
          <div className="grid grid-cols-2 gap-2">
            {(['Trân châu', 'Kem'] as ToppingType[]).map((name) => {
              const extra = name === 'Trân châu' ? '+5.000đ' : '+10.000đ';
              const isChecked = editToppings.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onToggleEditTopping(name)}
                  className={`py-2 px-3 text-xs border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-emerald-800 text-white font-medium border-emerald-800'
                      : 'bg-white text-neutral-600 border-neutral-200/80 hover:bg-emerald-50/70 hover:text-emerald-900'
                  }`}
                >
                  <span>{name}</span>
                  <span className="font-mono text-[11px] opacity-85">{extra}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-neutral-700 mb-2">Mức đường</div>
            <div className="grid grid-cols-5 gap-1.5">
              {(['100%', '70%', '50%', '30%', 'Ít đường'] as SugarType[]).map((sugar) => (
                <button
                  key={sugar}
                  type="button"
                  onClick={() => setEditSugar(sugar)}
                  className={`py-1.5 text-[11px] border rounded-lg text-center cursor-pointer transition-colors ${
                    editSugar === sugar
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
            <div className="text-xs font-medium text-neutral-700 mb-2">Mức đá</div>
            <div className="grid grid-cols-5 gap-1.5">
              {(['100%', '70%', '50%', 'Ít đá', 'Đá riêng'] as IceType[]).map((ice) => (
                <button
                  key={ice}
                  type="button"
                  onClick={() => setEditIce(ice)}
                  className={`py-1.5 text-[11px] border rounded-lg text-center cursor-pointer transition-colors ${
                    editIce === ice
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

        {setEditQty && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-neutral-700">Số lượng</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditQty(Math.max(1, editQty - 1))}
                className="w-7 h-7 rounded-lg border border-neutral-200/80 bg-white hover:bg-emerald-50/70 hover:text-emerald-900 flex items-center justify-center text-neutral-700 text-xs font-mono cursor-pointer transition-colors"
              >
                -
              </button>
              <span className="w-7 text-center font-mono text-xs font-semibold text-neutral-900 tabular-nums">
                {editQty}
              </span>
              <button
                type="button"
                disabled={editQty >= editMaxStock}
                onClick={() => setEditQty(Math.min(editMaxStock, editQty + 1))}
                className="w-7 h-7 rounded-lg border border-neutral-200/80 bg-white hover:bg-emerald-50/70 hover:text-emerald-900 flex items-center justify-center text-neutral-700 text-xs font-mono cursor-pointer disabled:opacity-40 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1.5 text-neutral-700">
            Ghi chú cho quán
          </label>
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Ví dụ: Ít ngọt, lấy đá riêng..."
            rows={2}
            className="w-full p-2.5 border border-neutral-200/80 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 resize-none rounded-lg transition-colors"
          />
        </div>

        <div className="pt-3 border-t border-neutral-200/80 flex justify-between items-center text-xs">
          <span className="text-neutral-500">Thành tiền mới ({editQty} ly):</span>
          <span className="font-mono tabular-nums font-bold text-base text-emerald-800">
            {formatPrice(editUnitPrice * editQty)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 border border-neutral-200/80 bg-white text-neutral-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-stone-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSave}
            className="w-full py-2.5 bg-emerald-800 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};
