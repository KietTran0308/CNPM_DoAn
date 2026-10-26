/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartLine } from '../types';

export interface AppliedPromo {
  code: string;
  discount: number;
}

export interface CartState {
  cartLines: CartLine[];
  appliedPromo: AppliedPromo | null;
  promoCodeInput: string;
  promoError: string | null;

  // Actions
  addToCart: (line: CartLine) => void;
  updateCartQty: (itemId: string, delta: number) => void;
  updateCartItem: (itemId: string, updated: Partial<CartLine>) => void;
  removeCartItem: (itemId: string) => void;
  setPromoCodeInput: (code: string) => void;
  setPromoError: (error: string | null) => void;
  applyPromo: (promo: AppliedPromo | null) => void;
  removePromo: () => void;
  clearCart: () => void;

  // Computed helper getters
  getTotalCartCount: () => number;
  getRawSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotalCartPrice: () => number;
  getProductQtyInCart: (productId: number) => number;
}

export const useCartStore = create<CartState>()(
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

          if (existingIndex > -1) {
            const updated = [...state.cartLines];
            const newQty = updated[existingIndex].item.qty + newLine.item.qty;
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

          return { cartLines: [...state.cartLines, newLine] };
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
        set((state) => ({
          cartLines: state.cartLines.map((line) => {
            if (line.item.id === itemId) {
              return {
                ...line,
                ...updated,
                item: {
                  ...line.item,
                  ...(updated.item || {}),
                },
              };
            }
            return line;
          }),
        }));
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
        if (promo.code === 'BREW10') {
          return Math.round(subtotal * 0.1);
        }
        return Math.min(subtotal, promo.discount);
      },

      getTotalCartPrice: () => {
        const subtotal = get().getRawSubtotal();
        const discount = get().getDiscountAmount();
        return Math.max(0, subtotal - discount);
      },

      getProductQtyInCart: (productId: number) => {
        return get()
          .cartLines.filter((line) => line.item.productId === productId)
          .reduce((sum, line) => sum + line.item.qty, 0);
      },
    }),
    {
      name: 'brewlite_cart_zustand',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
