import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SIZES, TOPPINGS } from '../constants';
import { menuApi, USE_MOCK_API } from '../services/api';
import { SizeOption, ToppingOption } from '../types';
import { formatCurrency } from '../utils';
import { X, Plus, Minus, Check } from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const {
    activeProductDetail,
    closeProductDetail,
    editingCartItem,
    closeEditCartItem,
    addToCart,
    updateCartItem,
    openCart,
  } = useApp();

  const isEditing = Boolean(editingCartItem);
  const product = editingCartItem ? editingCartItem.product : activeProductDetail;

  const [selectedSize, setSelectedSize] = useState<SizeOption>(SIZES[0]);
  const [selectedToppings, setSelectedToppings] = useState<ToppingOption[]>([]);
  const [iceLevel, setIceLevel] = useState<'0%' | '30%' | '50%' | '100%'>('50%');
  const [sugarLevel, setSugarLevel] = useState<'0%' | '30%' | '50%' | '100%'>('50%');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [dbSizes, setDbSizes] = useState<SizeOption[]>(USE_MOCK_API ? SIZES : []);
  const [dbToppings, setDbToppings] = useState<ToppingOption[]>(USE_MOCK_API ? TOPPINGS : []);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState('');

  useEffect(() => {
    if (editingCartItem) {
      setSelectedSize(editingCartItem.size);
      setSelectedToppings(editingCartItem.toppings || []);
      setIceLevel(editingCartItem.iceLevel);
      setSugarLevel(editingCartItem.sugarLevel);
      setQuantity(editingCartItem.quantity);
      setNote(editingCartItem.note || '');
    } else if (activeProductDetail) {
      setSelectedSize(SIZES[0]);
      setSelectedToppings([]);
      setIceLevel('50%');
      setSugarLevel('50%');
      setQuantity(1);
      setNote('');
    }
  }, [editingCartItem, activeProductDetail]);

  useEffect(() => {
    const current = editingCartItem?.product ?? activeProductDetail;
    if (!current || USE_MOCK_API) return;
    let cancelled = false;
    setOptionsLoading(true);
    setOptionsError('');
    setDbSizes([]);
    setDbToppings([]);
    menuApi.getOptions(current.id).then(options => {
      if (cancelled) return;
      const sizes = options.sizes.map(row => ({
        ...SIZES.find(s => s.id === row.size)!,
        extraPrice: Number(row.price) - current.basePrice,
      }));
      const toppings = options.toppings.map(row => ({
        id: row.id, name: row.name, price: Number(row.price),
      }));
      setDbSizes(sizes);
      setDbToppings(toppings);
      const oldSize = editingCartItem?.size.id ?? 'S';
      setSelectedSize(sizes.find(s => s.id === oldSize) ?? sizes[0] ?? SIZES[0]);
      if (editingCartItem) {
        const selectedIds = new Set(editingCartItem.toppings.map(t => t.id));
        setSelectedToppings(toppings.filter(t => selectedIds.has(t.id)));
      }
    }).catch(err => {
      if (!cancelled) setOptionsError(err instanceof Error ? err.message : 'Không tải được size và topping');
    }).finally(() => { if (!cancelled) setOptionsLoading(false); });
    return () => { cancelled = true; };
  }, [activeProductDetail?.id, editingCartItem?.cartItemId]);

  if (!product) return null;

  const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const unitPrice = product.basePrice + selectedSize.extraPrice + toppingsPrice;
  const totalPrice = unitPrice * quantity;

  const handleToggleTopping = (topping: ToppingOption) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.id === topping.id);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleClose = () => {
    if (isEditing) {
      closeEditCartItem();
      openCart();
    } else {
      closeProductDetail();
    }
  };

  const handleSave = () => {
    if (product.stock === 0 || (product.stock !== undefined && quantity > product.stock) ||
        optionsLoading || optionsError || (!USE_MOCK_API && !dbSizes.length)) return;
    if (isEditing && editingCartItem) {
      updateCartItem(editingCartItem.cartItemId, {
        size: selectedSize,
        toppings: selectedToppings,
        iceLevel,
        sugarLevel,
        note,
        quantity,
        unitPrice,
      });
      closeEditCartItem();
      openCart();
    } else {
      addToCart({
        product,
        size: selectedSize,
        toppings: selectedToppings,
        iceLevel,
        sugarLevel,
        note,
        quantity,
        unitPrice,
      });
      closeProductDetail();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-black/40 backdrop-blur-[16px] transition-opacity duration-200">
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Modal Container: Liquid Glass finish */}
      <div className="relative z-10 w-full max-w-full md:max-w-3xl lg:max-w-4xl liquid-glass rounded-t-[20px] md:rounded-[20px] border border-white/90 shadow-2xl overflow-hidden max-h-[92vh] md:max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Mobile Drag Indicator */}
        <div className="md:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-12 h-1 bg-black/20 rounded-full" />
        </div>

        {/* Top Control Bar */}
        <div className="px-5 py-3.5 border-b border-black/5 flex items-center justify-between bg-white/70 backdrop-blur-[16px] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#035542]">
              {isEditing ? 'CHỈNH SỬA TÙY CHỌN MÓN' : 'TÙY CHỈNH ĐỒ UỐNG'}
            </span>
            {isEditing && (
              <span className="text-[10px] bg-emerald-900/10 text-[#035542] font-semibold px-2 py-0.5 rounded-full">
                Đang sửa
              </span>
            )}
          </div>

          <button
            onClick={handleClose}
            className="touch-target w-8 h-8 rounded-full border border-black/10 hover:border-black/20 flex items-center justify-center text-[#333333] hover:text-[#035542] bg-white/80 transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Container */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Photo & Details */}
            <div className="md:col-span-5 flex flex-col">
              <div className="relative w-full aspect-square rounded-[20px] overflow-hidden bg-stone-100 mb-3.5 shadow-sm">
                <img
                  src={product.image} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/artisan_hero_food_1791967258188.jpg"; }}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-[16px] border border-white/80 text-[#035542] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs uppercase">
                  {product.categoryName}
                </div>
              </div>

              <div className="hidden md:block space-y-2">
                <h3 className="text-xl font-bold text-[#333333] leading-tight">
                  {product.name}
                </h3>
                <p className="text-xs text-[#333333]/70 leading-relaxed">
                  {product.description}
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-[#333333]/70">Giá niêm yết:</span>
                  <span className="text-base font-bold font-mono text-[#035542]">
                    {formatCurrency(product.basePrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Customizations & Controls */}
            <div className="md:col-span-7 space-y-4 sm:space-y-5">
              {/* Mobile Title & Price */}
              <div className="md:hidden">
                <h3 className="text-lg font-bold text-[#333333] leading-tight">
                  {product.name}
                </h3>
                <p className="text-xs text-[#333333]/70 mt-1 leading-relaxed">
                  {product.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[#333333]/70">Giá gốc:</span>
                  <span className="text-base font-bold font-mono text-[#035542]">
                    {formatCurrency(product.basePrice)}
                  </span>
                </div>
              </div>

              {/* Size Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#035542] uppercase tracking-wider block">
                  Chọn kích thước (Size)
                </label>

                {optionsLoading && <p role="status" className="text-xs">Đang tải size và topping từ hệ thống...</p>}
                {optionsError && <p role="alert" className="text-xs text-red-600">{optionsError}</p>}
                <div className="grid grid-cols-3 gap-2">
                  {(USE_MOCK_API ? SIZES : dbSizes).map((size) => {
                    const isSelected = selectedSize.id === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`touch-target p-2.5 rounded-[14px] text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'liquid-glass border-[#035542] ring-2 ring-[#035542]/20 shadow-xs'
                            : 'bg-white/70 hover:bg-white border border-black/5'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-[#333333] truncate">
                            {size.name}
                          </span>
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ml-1 ${
                              isSelected ? 'border-[#035542] bg-[#035542]' : 'border-black/20'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div className="mt-1 w-full flex items-baseline justify-between flex-wrap gap-0.5">
                          <span className="text-[10px] text-[#333333]/60 font-mono">{size.volume}</span>
                          <span className="text-[11px] font-mono font-bold text-[#035542]">
                            {size.extraPrice === 0 ? '+0đ' : `+${formatCurrency(size.extraPrice)}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topping Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#035542] uppercase tracking-wider block">
                  Thêm Topping tùy chọn
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(USE_MOCK_API ? TOPPINGS : dbToppings).map((topping) => {
                    const isChecked = selectedToppings.some((t) => t.id === topping.id);
                    return (
                      <div
                        key={topping.id}
                        onClick={() => handleToggleTopping(topping)}
                        className={`touch-target px-3 py-2 rounded-[12px] flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'liquid-glass border-[#035542] shadow-2xs'
                            : 'bg-white/60 hover:bg-white border border-black/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isChecked ? 'border-[#035542] bg-[#035542] text-white' : 'border-black/20'
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-semibold text-[#333333]">
                            {topping.name}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#035542]">
                          +{formatCurrency(topping.price)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ice & Sugar Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#333333]/70 uppercase block">Lượng đá</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['0%', '30%', '50%', '100%'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setIceLevel(lvl)}
                        className={`touch-target h-9 rounded-full text-xs font-semibold uppercase transition-all ${
                          iceLevel === lvl
                            ? 'bg-[#035542] text-white shadow-xs'
                            : 'bg-white/70 hover:bg-white text-[#333333] border border-black/5'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#333333]/70 uppercase block">Độ ngọt</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['0%', '30%', '50%', '100%'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSugarLevel(lvl)}
                        className={`touch-target h-9 rounded-full text-xs font-semibold uppercase transition-all ${
                          sugarLevel === lvl
                            ? 'bg-[#035542] text-white shadow-xs'
                            : 'bg-white/70 hover:bg-white text-[#333333] border border-black/5'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#333333]/70 uppercase block">
                  Ghi chú cho Barista
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Để riêng đá, ít béo..."
                  maxLength={100}
                  className="w-full h-10 px-3.5 rounded-full bg-white/90 border border-black/10 text-xs font-semibold text-[#333333] focus:border-[#035542] focus:outline-none focus:ring-2 focus:ring-[#035542]/10 shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-3.5 sm:p-4 bg-white/90 backdrop-blur-[16px] border-t border-black/5 flex items-center gap-3 shrink-0 pb-[max(12px,env(safe-area-inset-bottom))]">
          {/* Quantity Stepper */}
          <div className="flex items-center rounded-full bg-stone-100 border border-black/5 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="touch-target w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#333333] hover:text-[#035542] disabled:opacity-30 cursor-pointer shadow-2xs"
              aria-label="Giảm số lượng"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-bold font-mono text-[#333333]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(product.stock ?? Number.MAX_SAFE_INTEGER, q + 1))}
              disabled={product.stock !== undefined && quantity >= product.stock}
              className="touch-target w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#333333] hover:text-[#035542] cursor-pointer shadow-2xs"
              aria-label="Tăng số lượng"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pill CTA Button */}
          <button
            type="button"
            onClick={handleSave}
                  disabled={product.stock === 0 || (product.stock !== undefined && quantity > product.stock) || optionsLoading || !!optionsError || (!USE_MOCK_API && !dbSizes.length)}
            className="touch-target flex-1 h-12 px-5 rounded-full liquid-glass-emerald text-white hover:brightness-105 active:scale-[0.98] font-bold text-xs sm:text-sm uppercase flex items-center justify-between transition-all cursor-pointer shadow-lg"
          >
            <span>{isEditing ? 'Lưu thay đổi vào giỏ' : 'Thêm vào giỏ hàng'}</span>
            <span className="bg-white/20 px-3 py-1 rounded-full font-mono text-xs">
              {formatCurrency(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
