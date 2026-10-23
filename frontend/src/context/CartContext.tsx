// frontend/src/context/CartContext.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { CartItem, SizeOption, ToppingOption } from '../types/cart';
import { useCartStore, useUiStore } from '../stores';
import { useLocalCart } from '../hooks/useLocalCart';

export interface CartContextType {
  // Giỏ hàng & Thao tác
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'cartItemId' | 'totalPrice'>) => void;
  updateCartItem: (
    cartItemId: string,
    updatedData: {
      size: SizeOption;
      toppings: ToppingOption[];
      iceLevel: '0%' | '30%' | '50%' | '100%';
      sugarLevel: '0%' | '30%' | '50%' | '100%';
      note?: string;
      quantity: number;
      unitPrice: number;
    }
  ) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;

  // Tính toán chi phí
  cartCount: number;
  cartSubtotal: number;
  voucherCode: string;
  discount: number;
  pointsDiscount: number;
  setPointsDiscount: (amount: number) => void;
  applyVoucher: (code: string) => { success: boolean; message: string };
  cartTotal: number;

  // Nhận hàng
  pickupBranch: string;
  setPickupBranch: (b: string) => void;
  pickupTimeType: 'asap' | 'scheduled';
  setPickupTimeType: (t: 'asap' | 'scheduled') => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  pickupNote: string;
  setPickupNote: (n: string) => void;

  // UI Modal / Drawer
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Đồng bộ giỏ hàng với LocalStorage
  useLocalCart();

  const cart = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addToCart);
  const updateCartItem = useCartStore((s) => s.updateCartItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const voucherCode = useCartStore((s) => s.voucherCode);
  const discount = useCartStore((s) => s.discount);
  const pointsDiscount = useCartStore((s) => s.pointsDiscount);
  const setPointsDiscount = useCartStore((s) => s.setPointsDiscount);
  const applyVoucher = useCartStore((s) => s.applyVoucher);

  const pickupBranch = useCartStore((s) => s.pickupBranch);
  const setPickupBranch = useCartStore((s) => s.setPickupBranch);
  const pickupTimeType = useCartStore((s) => s.pickupTimeType);
  const setPickupTimeType = useCartStore((s) => s.setPickupTimeType);
  const scheduledTime = useCartStore((s) => s.scheduledTime);
  const setScheduledTime = useCartStore((s) => s.setScheduledTime);
  const pickupNote = useCartStore((s) => s.pickupNote);
  const setPickupNote = useCartStore((s) => s.setPickupNote);

  const isCartOpen = useUiStore((s) => s.isCartOpen);
  const openCart = useUiStore((s) => s.openCart);
  const closeCart = useUiStore((s) => s.closeCart);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.totalPrice, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => Math.max(0, cartSubtotal - discount - pointsDiscount),
    [cartSubtotal, discount, pointsDiscount]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateCartItem,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        voucherCode,
        discount,
        pointsDiscount,
        setPointsDiscount,
        applyVoucher,
        cartTotal,
        pickupBranch,
        setPickupBranch,
        pickupTimeType,
        setPickupTimeType,
        scheduledTime,
        setScheduledTime,
        pickupNote,
        setPickupNote,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};