import React, { createContext, useContext, useEffect } from 'react';
import {
  CartItem,
  Order,
  PaymentMethodId,
  Product,
  User,
  SizeOption,
  ToppingOption,
  DeviceView,
  AppViewMode,
  BreakpointCategory,
} from '../types';
import { useCartStore, useUiStore, useAuthStore } from '../stores';
import { useProducts, useOrders } from '../hooks';

export interface AppContextType {
  // Auth (Zustand: useAuthStore)
  user: User | null;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  redeemPoints: (pts: number) => Promise<{ success: boolean; message: string; remainingPoints?: number }>;

  // Navigation & Views (Zustand: useUiStore)
  currentScreen: 'menu' | 'cart' | 'checkout' | 'confirmation' | 'orders' | 'account' | 'rewards' | 'vouchers';
  setCurrentScreen: (screen: 'menu' | 'cart' | 'checkout' | 'confirmation' | 'orders' | 'account' | 'rewards' | 'vouchers') => void;

  appViewMode: AppViewMode;
  setAppViewMode: (mode: AppViewMode) => void;
  deviceView: DeviceView;
  setDeviceView: (view: DeviceView) => void;
  viewportWidth: number;
  activeBreakpoint: BreakpointCategory;
  showGridOverlay: boolean;
  setShowGridOverlay: (show: boolean | ((prev: boolean) => boolean)) => void;
  branchName: string;
  setBranchName: (b: string) => void;

  // Cart & In-Store Pickup (Zustand: useCartStore)
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
  cartCount: number;
  cartSubtotal: number;
  voucherCode: string;
  discount: number;
  pointsDiscount: number;
  setPointsDiscount: (amount: number) => void;
  applyVoucher: (code: string) => { success: boolean; message: string };
  cartTotal: number;

  pickupBranch: string;
  setPickupBranch: (b: string) => void;
  pickupTimeType: 'asap' | 'scheduled';
  setPickupTimeType: (t: 'asap' | 'scheduled') => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  pickupNote: string;
  setPickupNote: (n: string) => void;

  // Modals & Drawers (Zustand: useUiStore)
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
  closePaymentFailedModal: () => void;

  // Orders (TanStack Query + Server State: orderService)
  orders: Order[];
  lastCreatedOrder: Order | null;
  failedReason: string | null;
  createOrder: (paymentMethod: PaymentMethodId, simulateFailure?: boolean, customCustomer?: { name: string; phone: string }) => Promise<{ success: boolean; order?: Order; error?: string }>;
  advanceOrderStatus: (orderId: string) => void;
  cancelOrder: (orderId: string) => Promise<Order>;
  isCancelling: boolean;
  reOrder: (order: Order) => void;

  // Server state data
  products: Product[];
  isProductsLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sync window viewport resizing into UiStore
  const setViewportWidth = useUiStore((state) => state.setViewportWidth);
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setViewportWidth]);

  // Sync browser popstate (back / forward buttons)
  const setCurrentScreen = useUiStore((s) => s.setCurrentScreen);
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/tai-khoan') setCurrentScreen('account');
      else if (path === '/diem-thuong') setCurrentScreen('rewards');
      else if (path === '/uu-dai') setCurrentScreen('vouchers');
      else if (path === '/don-hang') setCurrentScreen('orders');
      else if (path === '/thanh-toan') setCurrentScreen('checkout');
      else if (path === '/xac-nhan') setCurrentScreen('confirmation');
      else setCurrentScreen('menu');

    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentScreen]);

  // Zustand Auth Store
  const user = useAuthStore((s) => s.user);
  const isAuthModalOpen = useAuthStore((s) => s.isAuthModalOpen);
  const authModalTab = useAuthStore((s) => s.authModalTab);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const redeemPoints = useAuthStore((s) => s.redeemPoints);
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Zustand UI Store
  const currentScreen = useUiStore((s) => s.currentScreen);
  const appViewMode = useUiStore((s) => s.appViewMode);
  const setAppViewMode = useUiStore((s) => s.setAppViewMode);
  const deviceView = useUiStore((s) => s.deviceView);
  const setDeviceView = useUiStore((s) => s.setDeviceView);
  const viewportWidth = useUiStore((s) => s.viewportWidth);
  const activeBreakpoint = useUiStore((s) => s.getActiveBreakpoint());
  const showGridOverlay = useUiStore((s) => s.showGridOverlay);
  const setShowGridOverlay = useUiStore((s) => s.setShowGridOverlay);
  const branchName = useUiStore((s) => s.branchName);
  const setBranchName = useUiStore((s) => s.setBranchName);
  const activeProductDetail = useUiStore((s) => s.activeProductDetail);
  const openProductDetail = useUiStore((s) => s.openProductDetail);
  const closeProductDetail = useUiStore((s) => s.closeProductDetail);
  const editingCartItem = useUiStore((s) => s.editingCartItem);
  const openEditCartItem = useUiStore((s) => s.openEditCartItem);
  const closeEditCartItem = useUiStore((s) => s.closeEditCartItem);
  const isCartOpen = useUiStore((s) => s.isCartOpen);
  const openCart = useUiStore((s) => s.openCart);
  const closeCart = useUiStore((s) => s.closeCart);
  const isPaymentFailedModalOpen = useUiStore((s) => s.isPaymentFailedModalOpen);
  const failedReason = useUiStore((s) => s.failedReason);
  const closePaymentFailedModal = useUiStore((s) => s.closePaymentFailedModal);

  // Zustand Cart Store
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

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartTotal = Math.max(0, cartSubtotal - discount - pointsDiscount);

  // TanStack Query: Products & Orders
  const { products, isLoading: isProductsLoading } = useProducts();
  const { orders, latestOrder, createOrder, advanceOrderStatus, reOrder, cancelOrder, isCancelling } = useOrders();
  useEffect(() => {
    let active = true;
    import('../services/dich-vu-voucher').then(({ dichVuVoucher }) => {
      if (active) dichVuVoucher.layKhoVoucher().catch(console.error);
    });
    return () => { active = false; };
  }, [user?.id]);


  const value: AppContextType = {
    user,
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
    redeemPoints,

    currentScreen,
    setCurrentScreen,
    appViewMode,
    setAppViewMode,
    deviceView,
    setDeviceView,
    viewportWidth,
    activeBreakpoint,
    showGridOverlay,
    setShowGridOverlay,
    branchName,
    setBranchName,

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

    activeProductDetail,
    openProductDetail,
    closeProductDetail,
    editingCartItem,
    openEditCartItem,
    closeEditCartItem,
    isCartOpen,
    openCart,
    closeCart,
    isPaymentFailedModalOpen,
    closePaymentFailedModal,

    orders,
    lastCreatedOrder: latestOrder,
    failedReason,
    createOrder,
    advanceOrderStatus,
    cancelOrder,
    isCancelling,
    reOrder,

    products,
    isProductsLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
