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
              const label = extra === 0 ? 'Size S (+0đ)' : `Size ${size} (+${formatPrice(extra)})`;
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
          <div className="text-xs font-semibold text-[#124E35] mb-2">Topping thêm</div>
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
                      ? 'bg-[#124E35] text-[#F5F0E1] font-semibold border-[#124E35]'
                      : 'bg-[#EDE6D1] text-[#124E35] font-medium border-[#D5CCB4] hover:bg-[#124E35] hover:text-[#F5F0E1]'
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

