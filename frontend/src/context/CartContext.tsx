import React, { createContext, useContext, useMemo } from 'react';
import { CartItem, SizeOption, ToppingOption } from '../types';
import { useCartStore, useUiStore } from '../stores';

export interface CartContextType {
  // Cart Items & Actions (useCartStore)
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'cartItemId' | 'totalPrice'>) => void;
  updateCartItem: (
    cartItemId: string,
    updatedData: {
      size: SizeOption;
      toppings: ToppingOption[];
      iceLevel: '0%' | '30%' | '50%' | '100%';
      sugarLevel: '0%' | '30%' | '50%' | '100%';
      note: string;
      quantity: number;
      unitPrice: number;
    }
  ) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;

  // Pricing & Calculations
  cartCount: number;
  cartSubtotal: number;
  voucherCode: string;
  discount: number;
  pointsDiscount: number;
  setPointsDiscount: (amount: number) => void;
  applyVoucher: (code: string) => { success: boolean; message: string };
  cartTotal: number;

  // In-Store Pickup Options (useCartStore)
  pickupBranch: string;
  setPickupBranch: (b: string) => void;
  pickupTimeType: 'asap' | 'scheduled';
  setPickupTimeType: (t: 'asap' | 'scheduled') => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  pickupNote: string;
  setPickupNote: (n: string) => void;

  // Cart UI States (useUiStore)
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  editingCartItem: CartItem | null;
  openEditCartItem: (item: CartItem) => void;
  closeEditCartItem: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Cart Items & Discounts từ CartStore
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

  // 2. Pickup Config từ CartStore
  const pickupBranch = useCartStore((s) => s.pickupBranch);
  const setPickupBranch = useCartStore((s) => s.setPickupBranch);
  const pickupTimeType = useCartStore((s) => s.pickupTimeType);
  const setPickupTimeType = useCartStore((s) => s.setPickupTimeType);
  const scheduledTime = useCartStore((s) => s.scheduledTime);
  const setScheduledTime = useCartStore((s) => s.setScheduledTime);
  const pickupNote = useCartStore((s) => s.pickupNote);
  const setPickupNote = useCartStore((s) => s.setPickupNote);

  // 3. Cart Drawers & Edit Modal từ UiStore
  const isCartOpen = useUiStore((s) => s.isCartOpen);
  const openCart = useUiStore((s) => s.openCart);
  const closeCart = useUiStore((s) => s.closeCart);
  const editingCartItem = useUiStore((s) => s.editingCartItem);
  const openEditCartItem = useUiStore((s) => s.openEditCartItem);
  const closeEditCartItem = useUiStore((s) => s.closeEditCartItem);

  // 4. Computed Values (dùng useMemo để tránh tính toán lại không cần thiết)
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

  const value: CartContextType = {
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
    editingCartItem,
    openEditCartItem,
    closeEditCartItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};