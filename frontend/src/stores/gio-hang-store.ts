import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, SizeOption, ToppingOption } from '../types';
import { DEFAULT_VOUCHERS, DEFAULT_BRANCHES as BRANCHES } from '../constants';
import { USE_MOCK_API } from '../services/api';
import type { VoucherItem } from '../types';

export interface TrangThaiGioHang {
  items: CartItem[];
  voucherCode: string;
  discount: number;
  pointsDiscount: number;
  availableVouchers: VoucherItem[];
  setAvailableVouchers: (v: VoucherItem[]) => void;
  
  // Thông tin nhận nước tại quầy (In-Store Pickup)
  pickupBranch: string;
  pickupTimeType: 'asap' | 'scheduled';
  scheduledTime: string;
  pickupNote: string;
  
  // Hành động thao tác giỏ hàng
  addToCart: (itemData: Omit<CartItem, 'cartItemId' | 'totalPrice'>) => void;
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
  applyVoucher: (code: string) => { success: boolean; message: string };
  resetVoucher: () => void;
  cancelVoucher: () => void;
  setPointsDiscount: (discount: number) => void;
  setPickupBranch: (branch: string) => void;
  setPickupTimeType: (type: 'asap' | 'scheduled') => void;
  setScheduledTime: (time: string) => void;
  setPickupNote: (note: string) => void;
  
  // Phương thức tính toán
  getCartCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

export type CartState = TrangThaiGioHang;

const GIO_HANG_KHOI_TAO: CartItem[] = [];

// Hàm kiểm tra lại tính hợp lệ của voucher theo tổng tiền giỏ hàng hiện tại
const kiemTraLaiVoucher = (
  items: CartItem[],
  currentCode: string
): { voucherCode: string; discount: number; reason?: string } => {
  if (!currentCode) return { voucherCode: '', discount: 0 };
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const found = useGioHangStore.getState().availableVouchers.find((v) => v.code === currentCode);
  if (found) {
    if (subtotal < found.minOrder) {
      return {
        voucherCode: '',
        discount: 0,
        reason: `Mã ${currentCode} đã tự động hủy do giỏ hàng thấp hơn mức tối thiểu ${found.minOrder.toLocaleString('vi-VN')}đ.`,
      };
    }
    return { voucherCode: currentCode, discount: found.discountAmount };
  }

  if (USE_MOCK_API && currentCode === 'BREWFIRST') {
    if (subtotal < 30000) {
      return { voucherCode: '', discount: 0, reason: 'Mã ưu đãi bị hủy do đơn dưới 30.000đ.' };
    }
    return { voucherCode: currentCode, discount: 15000 };
  }

  return { voucherCode: '', discount: 0 };
};

export const useGioHangStore = create<TrangThaiGioHang>()(
  persist(
    (set, get) => ({
      items: GIO_HANG_KHOI_TAO,
      voucherCode: '',
      discount: 0,
      pointsDiscount: 0,
      availableVouchers: USE_MOCK_API ? DEFAULT_VOUCHERS : [],
      setAvailableVouchers: (vouchers) => set({ availableVouchers: vouchers }),
      pickupBranch: BRANCHES[0].name,
      pickupTimeType: 'asap',
      scheduledTime: 'Lấy ngay (khoảng 5 - 10 phút)',
      pickupNote: '',

      addToCart: (itemData) => {
        const cartItemId = `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const validQuantity = Math.max(1, Math.floor(itemData.quantity || 1));
        const totalPrice = itemData.unitPrice * validQuantity;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (it) =>
            it.product.id === itemData.product.id &&
            it.size.id === itemData.size.id &&
            it.iceLevel === itemData.iceLevel &&
            it.sugarLevel === itemData.sugarLevel &&
            JSON.stringify(it.toppings.map((t) => t.id).sort()) ===
              JSON.stringify(itemData.toppings.map((t) => t.id).sort()) &&
            (it.note || '') === (itemData.note || '')
        );

        let newItems: CartItem[];
        if (existingIndex > -1) {
          newItems = [...currentItems];
          const item = newItems[existingIndex];
          const newQty = item.quantity + validQuantity;
          newItems[existingIndex] = {
            ...item,
            quantity: newQty,
            totalPrice: item.unitPrice * newQty,
          };
        } else {
          newItems = [
            ...currentItems,
            { ...itemData, quantity: validQuantity, cartItemId, totalPrice },
          ];
        }

        const vCheck = kiemTraLaiVoucher(newItems, get().voucherCode);
        set({
          items: newItems,
          voucherCode: vCheck.voucherCode,
          discount: vCheck.discount,
        });
      },

      updateCartItem: (cartItemId, updatedData) => {
        const currentItems = get().items;
        const validQuantity = Math.max(1, Math.floor(updatedData.quantity || 1));
        const newItems = currentItems.map((item) => {
          if (item.cartItemId === cartItemId) {
            const totalPrice = updatedData.unitPrice * validQuantity;
            return {
              ...item,
              ...updatedData,
              quantity: validQuantity,
              totalPrice,
            };
          }
          return item;
        });

        const vCheck = kiemTraLaiVoucher(newItems, get().voucherCode);
        set({
          items: newItems,
          voucherCode: vCheck.voucherCode,
          discount: vCheck.discount,
        });
      },

      updateQuantity: (cartItemId, delta) => {
        const currentItems = get().items;
        const newItems = currentItems
          .map((item) => {
            if (item.cartItemId === cartItemId) {
              const newQty = item.quantity + delta;
              if (newQty <= 0) return null;
              return {
                ...item,
                quantity: newQty,
                totalPrice: item.unitPrice * newQty,
              };
            }
            return item;
          })
          .filter(Boolean) as CartItem[];

        const vCheck = kiemTraLaiVoucher(newItems, get().voucherCode);
        set({
          items: newItems,
          voucherCode: vCheck.voucherCode,
          discount: vCheck.discount,
        });
      },

      removeFromCart: (cartItemId) => {
        const newItems = get().items.filter((item) => item.cartItemId !== cartItemId);
        const vCheck = kiemTraLaiVoucher(newItems, get().voucherCode);
        set({
          items: newItems,
          voucherCode: vCheck.voucherCode,
          discount: vCheck.discount,
        });
      },

      clearCart: () => {
        set({
          items: [],
          voucherCode: '',
          discount: 0,
          pointsDiscount: 0,
          pickupNote: '',
        });
      },

      applyVoucher: (code) => {
        const clean = code.trim().toUpperCase();
        if (!clean) {
          return { success: false, message: 'Vui lòng nhập mã ưu đãi.' };
        }
        const subtotal = get().getSubtotal();
        if (subtotal <= 0) {
          return { success: false, message: 'Giỏ hàng đang trống, không thể áp dụng ưu đãi.' };
        }

        const found = get().availableVouchers.find((v) => v.code === clean);
        if (found) {
          if (subtotal < found.minOrder) {
            return {
              success: false,
              message: `Mã ${clean} chỉ áp dụng cho đơn từ ${found.minOrder.toLocaleString('vi-VN')}đ (tạm tính hiện tại: ${subtotal.toLocaleString('vi-VN')}đ).`,
            };
          }
          set({ voucherCode: clean, discount: found.discountAmount });
          return {
            success: true,
            message: `Áp dụng thành công mã ${clean}! Giảm ${found.discountAmount.toLocaleString('vi-VN')}đ.`,
          };
        }

        if (USE_MOCK_API && clean === 'BREWFIRST') {
          if (subtotal < 30000) {
            return {
              success: false,
              message: 'Mã BREWFIRST chỉ áp dụng cho đơn từ 30.000đ.',
            };
          }
          set({ voucherCode: clean, discount: 15000 });
          return { success: true, message: 'Đã áp dụng mã ưu đãi giảm 15.000đ cho đơn hàng BrewLite!' };
        }

        return { success: false, message: 'Mã voucher không hợp lệ hoặc đã hết hạn.' };
      },

      resetVoucher: () => {
        set({ voucherCode: '', discount: 0 });
      },

      cancelVoucher: () => {
        set({ voucherCode: '', discount: 0 });
      },

      setPointsDiscount: (amount) => {
        set({ pointsDiscount: Math.max(0, amount) });
      },

      setPickupBranch: (branch) => {
        set({ pickupBranch: branch });
      },

      setPickupTimeType: (type) => {
        set({
          pickupTimeType: type,
          scheduledTime: type === 'asap' ? 'Lấy ngay (khoảng 5 - 10 phút)' : 'Hẹn lấy sau 20 phút',
        });
      },

      setScheduledTime: (time) => {
        set({ scheduledTime: time });
      },

      setPickupNote: (note) => {
        set({ pickupNote: note });
      },

      getCartCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const voucherDiscount = get().discount;
        const ptsDiscount = get().pointsDiscount;
        return Math.max(0, subtotal - voucherDiscount - ptsDiscount);
      },
    }),
    {
      name: 'brewlite_cart_store_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        voucherCode: state.voucherCode,
        discount: state.discount,
        pointsDiscount: state.pointsDiscount,
        pickupBranch: state.pickupBranch,
        pickupTimeType: state.pickupTimeType,
        scheduledTime: state.scheduledTime,
      }),
    }
  )
);

export const useCartStore = useGioHangStore;
export default useGioHangStore;
