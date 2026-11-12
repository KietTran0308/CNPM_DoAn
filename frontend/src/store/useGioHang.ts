import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartLine } from '../api';

export interface MaGiamGia {
    code: string;
    discount: number;
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
    minOrderValue: number;
    validFrom: string;
    validTo: string;
}

export interface TrangThaiGioHang {
    cartLines: CartLine[];
    appliedPromo: MaGiamGia | null;
    promoCodeInput: string;
    promoError: string | null;

    addToCart: (line: CartLine) => void;
    updateCartQty: (itemId: string, delta: number) => void;
    updateCartItem: (itemId: string, updated: Partial<CartLine>) => void;
    removeCartItem: (itemId: string) => void;
    setPromoCodeInput: (code: string) => void;
    setPromoError: (error: string | null) => void;
    applyPromo: (promo: MaGiamGia | null) => void;
    removePromo: () => void;
    clearCart: () => void;

    getTotalCartCount: () => number;
    getRawSubtotal: () => number;
    getDiscountAmount: () => number;
    getTotalCartPrice: () => number;
    getProductQtyInCart: (productId: string) => number;
}

export const useGioHang = create<TrangThaiGioHang>()(
    persist(
        (set, get) => ({
            cartLines: [],
            appliedPromo: null,
            promoCodeInput: '',
            promoError: null,

            addToCart: (newLine) => {
                set((state) => {
                    const toppingsKey = [...newLine.toppings].sort().join(',');
                    const trimmedNote = (newLine.note || '').trim();

                    const existingIndex = state.cartLines.findIndex(
                        (line) =>
                            line.item.productId === newLine.item.productId &&
                            line.item.size === newLine.item.size &&
                            [...line.toppings].sort().join(',') === toppingsKey &&
                            line.sugar === newLine.sugar &&
                            line.ice === newLine.ice &&
                            (line.note || '') === trimmedNote
                    );

                    const productQty = state.cartLines
                        .filter(line => line.item.productId === newLine.item.productId)
                        .reduce((sum, line) => sum + line.item.qty, 0);
                    const allowed = Math.max(0, Math.min(100, newLine.item.qty,
                        newLine.stock - productQty));
                    if (allowed === 0) return state;
                    if (existingIndex > -1) {
                        const updated = [...state.cartLines];
                        const newQty = Math.min(100, updated[existingIndex].item.qty + allowed);
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            item: {
                                ...updated[existingIndex].item,
                                qty: newQty,
                                lineTotal: updated[existingIndex].unitPrice * newQty,
                            },
                        };
                        return { cartLines: updated };
                    }

                    return { cartLines: [...state.cartLines, {
                        ...newLine, item: { ...newLine.item, qty: allowed,
                            lineTotal: newLine.unitPrice * allowed },
                    }] };
                });
            },

            updateCartQty: (itemId, delta) => {
                set((state) => ({
                    cartLines: state.cartLines
                        .map((line) => {
                            if (line.item.id === itemId) {
                                const newQty = line.item.qty + delta;
                                if (delta > 0) {
                                    const productTotal = state.cartLines
                                        .filter((l) => l.item.productId === line.item.productId)
                                        .reduce((sum, l) => sum + l.item.qty, 0);
                                    if (productTotal + 1 > line.stock) {
                                        return line;
                                    }
                                }
                                if (newQty <= 0) return null;
                                if (newQty > 100) return line;
                                return {
                                    ...line,
                                    item: {
                                        ...line.item,
                                        qty: newQty,
                                        lineTotal: line.unitPrice * newQty,
                                    },
                                };
                            }
                            return line;
                        })
                        .filter((line): line is CartLine => line !== null),
                }));
            },

            updateCartItem: (itemId, updated) => {
                set((state) => {
                    const targetIdx = state.cartLines.findIndex((l) => l.item.id === itemId);
                    if (targetIdx === -1) return state;

                    const existingLine = state.cartLines[targetIdx];
                    const mergedLine: CartLine = {
                        ...existingLine,
                        ...updated,
                        item: {
                            ...existingLine.item,
                            ...(updated.item || {}),
                            id: existingLine.item.id,
                            productId: updated.item?.productId || existingLine.item.productId,
                        },
                    };

                    mergedLine.item.qty = Math.min(100, mergedLine.item.qty);
                    if (mergedLine.item.qty <= 0) {
                        return {
                            cartLines: state.cartLines.filter((l) => l.item.id !== itemId),
                        };
                    }

                    const toppingsKey = [...mergedLine.toppings].sort().join(',');
                    const trimmedNote = (mergedLine.note || '').trim();

                    const duplicateIdx = state.cartLines.findIndex(
                        (line, idx) =>
                            idx !== targetIdx &&
                            line.item.productId === mergedLine.item.productId &&
                            line.item.size === mergedLine.item.size &&
                            [...line.toppings].sort().join(',') === toppingsKey &&
                            line.sugar === mergedLine.sugar &&
                            line.ice === mergedLine.ice &&
                            (line.note || '').trim() === trimmedNote
                    );

                    if (duplicateIdx > -1) {
                        const nextLines = [...state.cartLines];
                        const dupLine = nextLines[duplicateIdx];
                        const combinedQty = Math.min(100, dupLine.stock, dupLine.item.qty + mergedLine.item.qty);
                        nextLines[duplicateIdx] = {
                            ...dupLine,
                            item: {
                                ...dupLine.item,
                                qty: combinedQty,
                                lineTotal: dupLine.unitPrice * combinedQty,
                            },
                        };
                        nextLines.splice(targetIdx, 1);
                        return { cartLines: nextLines };
                    }

                    const nextLines = [...state.cartLines];
                    nextLines[targetIdx] = {
                        ...mergedLine,
                        item: {
                            ...mergedLine.item,
                            lineTotal: mergedLine.unitPrice * mergedLine.item.qty,
                        },
                    };
                    return { cartLines: nextLines };
                });
            },

            removeCartItem: (itemId) => {
                set((state) => ({
                    cartLines: state.cartLines.filter((l) => l.item.id !== itemId),
                }));
            },

            setPromoCodeInput: (code) => set({ promoCodeInput: code }),
            setPromoError: (error) => set({ promoError: error }),
            applyPromo: (promo) => set({ appliedPromo: promo, promoError: null }),
            removePromo: () =>
                set({ appliedPromo: null, promoCodeInput: '', promoError: null }),
            clearCart: () =>
                set({ cartLines: [], appliedPromo: null, promoCodeInput: '', promoError: null }),

            getTotalCartCount: () => {
                return get().cartLines.reduce((sum, line) => sum + line.item.qty, 0);
            },

            getRawSubtotal: () => {
                return get().cartLines.reduce((sum, line) => sum + line.item.lineTotal, 0);
            },

            getDiscountAmount: () => {
                const subtotal = get().getRawSubtotal();
                const promo = get().appliedPromo;
                if (!promo) return 0;
                if (subtotal < promo.minOrderValue ||
                    Date.now() < new Date(promo.validFrom).getTime() ||
                    Date.now() >= new Date(promo.validTo).getTime()) return 0;
                return Math.min(subtotal, promo.discountType === 'PERCENT'
                    ? Math.round(subtotal * promo.discountValue / 100)
                    : promo.discountValue);
            },

            getTotalCartPrice: () => {
                const subtotal = get().getRawSubtotal();
                const discount = get().getDiscountAmount();
                return Math.max(0, subtotal - discount);
            },

            getProductQtyInCart: (productId: string) => {
                return get()
                    .cartLines.filter((line) => line.item.productId === productId)
                    .reduce((sum, line) => sum + line.item.qty, 0);
            },
        }),
        {
            name: 'brewlite_cart_zustand',
            version: 3,
            migrate: () => ({cartLines: [], appliedPromo: null, promoCodeInput: '', promoError: null}),
            storage: createJSONStorage(() =>
                typeof localStorage !== 'undefined'
                    ? localStorage
                    : {
                        getItem: () => null,
                        setItem: () => {},
                        removeItem: () => {},
                    }
            ),
        }
    )
);
