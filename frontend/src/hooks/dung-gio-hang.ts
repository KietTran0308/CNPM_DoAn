import { useGioHangStore } from '../stores/gio-hang-store';

/**
 * Hook truy xuất và thao tác giỏ hàng phía client (dùng Zustand)
 */
export const useDungGioHang = () => {
  const items = useGioHangStore((state) => state.items);
  const voucherCode = useGioHangStore((state) => state.voucherCode);
  const discount = useGioHangStore((state) => state.discount);
  const pointsDiscount = useGioHangStore((state) => state.pointsDiscount);
  const pickupBranch = useGioHangStore((state) => state.pickupBranch);
  const pickupTimeType = useGioHangStore((state) => state.pickupTimeType);
  const scheduledTime = useGioHangStore((state) => state.scheduledTime);
  const pickupNote = useGioHangStore((state) => state.pickupNote);

  const addToCart = useGioHangStore((state) => state.addToCart);
  const updateCartItem = useGioHangStore((state) => state.updateCartItem);
  const updateQuantity = useGioHangStore((state) => state.updateQuantity);
  const removeFromCart = useGioHangStore((state) => state.removeFromCart);
  const clearCart = useGioHangStore((state) => state.clearCart);
  const applyVoucher = useGioHangStore((state) => state.applyVoucher);
  const resetVoucher = useGioHangStore((state) => state.resetVoucher);
  const setPointsDiscount = useGioHangStore((state) => state.setPointsDiscount);
  const setPickupBranch = useGioHangStore((state) => state.setPickupBranch);
  const setPickupTimeType = useGioHangStore((state) => state.setPickupTimeType);
  const setScheduledTime = useGioHangStore((state) => state.setScheduledTime);
  const setPickupNote = useGioHangStore((state) => state.setPickupNote);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartTotal = Math.max(0, cartSubtotal - discount - pointsDiscount);

  return {
    cart: items,
    items,
    voucherCode,
    discount,
    pointsDiscount,
    pickupBranch,
    pickupTimeType,
    scheduledTime,
    pickupNote,
    cartCount,
    cartSubtotal,
    cartTotal,
    addToCart,
    updateCartItem,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyVoucher,
    resetVoucher,
    setPointsDiscount,
    setPickupBranch,
    setPickupTimeType,
    setScheduledTime,
    setPickupNote,
    isEmpty: items.length === 0,
  };
};

export const useCart = useDungGioHang;
export default useDungGioHang;
