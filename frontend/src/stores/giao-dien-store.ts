import { create } from 'zustand';
import { AppViewMode, BreakpointCategory, DeviceView, Product, CartItem } from '../types';
import { parsePath, pathForScreen, ScreenId } from '../lib/routes';

export interface ThongBaoToast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type ToastNotification = ThongBaoToast;

export interface TrangThaiGiaoDien {
  // Đơn đang xem ở màn xác nhận (/orders/:id)
  viewedOrderId: string | null;
  setViewedOrderId: (id: string | null) => void;
  /** Mở màn chi tiết/xác nhận của một đơn: đổi màn hình + URL /orders/<id>. */
  openOrderDetail: (orderId: string) => void;

  // Điều hướng và màn hình
  currentScreen: 'menu' | 'cart' | 'checkout' | 'confirmation' | 'orders' | 'account' | 'rewards' | 'vouchers';
  setCurrentScreen: (screen: 'menu' | 'cart' | 'checkout' | 'confirmation' | 'orders' | 'account' | 'rewards' | 'vouchers') => void;
  appViewMode: AppViewMode;
  setAppViewMode: (mode: AppViewMode) => void;
  deviceView: DeviceView;
  setDeviceView: (view: DeviceView) => void;
  viewportWidth: number;
  setViewportWidth: (width: number) => void;
  showGridOverlay: boolean;
  setShowGridOverlay: (show: boolean | ((prev: boolean) => boolean)) => void;
  branchName: string;
  setBranchName: (name: string) => void;

  // Hộp thoại & Ngăn kéo
  activeProductDetail: Product | null;
  openProductDetail: (product: Product) => void;
  closeProductDetail: () => void;
  
  editingCartItem: CartItem | null;
  openEditCartItem: (item: CartItem) => void;
  closeEditCartItem: () => void;
  
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  isPaymentFailedModalOpen: boolean;
  failedReason: string | null;
  openPaymentFailedModal: (reason: string) => void;
  closePaymentFailedModal: () => void;

  // Thông báo nhanh Toast
  toast: ThongBaoToast | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;

  // Tính toán breakpoint responsive
  getActiveBreakpoint: () => BreakpointCategory;
}

export type UiState = TrangThaiGiaoDien;

const layManHinhBanDau = (): ScreenId => {
  if (typeof window !== 'undefined') return parsePath(window.location.pathname).screen;
  return 'menu';
};

const layIdDonBanDau = (): string | null => {
  if (typeof window !== 'undefined') return parsePath(window.location.pathname).orderId;
  return null;
};

const pushPath = (path: string, state: unknown) => {
  if (typeof window !== 'undefined' && window.location.pathname !== path) {
    window.history.pushState(state, '', path);
  }
};

export const useGiaoDienStore = create<TrangThaiGiaoDien>((set, get) => ({
  currentScreen: layManHinhBanDau(),
  viewedOrderId: layIdDonBanDau(),
  setViewedOrderId: (viewedOrderId) => set({ viewedOrderId }),
  setCurrentScreen: (currentScreen) => {
    set({ currentScreen });
    pushPath(pathForScreen(currentScreen, get().viewedOrderId), { screen: currentScreen });
  },
  openOrderDetail: (orderId) => {
    set({ viewedOrderId: orderId, currentScreen: 'confirmation' });
    pushPath(pathForScreen('confirmation', orderId), { screen: 'confirmation', orderId });
  },

  appViewMode: 'app',
  setAppViewMode: (appViewMode) => set({ appViewMode }),
  deviceView: 'fluid',
  setDeviceView: (deviceView) => set({ deviceView }),
  viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
  setViewportWidth: (viewportWidth) => set({ viewportWidth }),
  showGridOverlay: false,
  setShowGridOverlay: (arg) =>
    set((state) => ({
      showGridOverlay: typeof arg === 'function' ? arg(state.showGridOverlay) : arg,
    })),
  branchName: 'BrewLite Trương Định (Q.3, TP.HCM)',
  setBranchName: (branchName) => set({ branchName }),

  // Hộp thoại
  activeProductDetail: null,
  openProductDetail: (product) => set({ activeProductDetail: product }),
  closeProductDetail: () => set({ activeProductDetail: null }),

  editingCartItem: null,
  openEditCartItem: (item) => set({ editingCartItem: item, isCartOpen: false }),
  closeEditCartItem: () => set({ editingCartItem: null }),

  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),

  isPaymentFailedModalOpen: false,
  failedReason: null,
  openPaymentFailedModal: (reason) =>
    set({ isPaymentFailedModalOpen: true, failedReason: reason }),
  closePaymentFailedModal: () =>
    set({ isPaymentFailedModalOpen: false, failedReason: null }),

  // Toast
  toast: null,
  showToast: (message, type = 'success') => {
    const id = Date.now().toString();
    set({ toast: { id, message, type } });
    setTimeout(() => {
      if (get().toast?.id === id) {
        set({ toast: null });
      }
    }, 3000);
  },
  hideToast: () => set({ toast: null }),

  // Breakpoint helper
  getActiveBreakpoint: () => {
    const { deviceView, viewportWidth } = get();
    const effectiveWidth =
      deviceView === 'mobile-320'
        ? 320
        : deviceView === 'mobile-375'
        ? 375
        : deviceView === 'mobile-430'
        ? 430
        : deviceView === 'tablet-768'
        ? 768
        : deviceView === 'laptop-1024'
        ? 1024
        : deviceView === 'desktop-1440'
        ? 1440
        : viewportWidth;

    if (effectiveWidth < 768) return 'mobile';
    if (effectiveWidth < 1024) return 'tablet';
    if (effectiveWidth < 1440) return 'laptop';
    return 'desktop';
  },
}));

export const useUiStore = useGiaoDienStore;
export default useGiaoDienStore;
