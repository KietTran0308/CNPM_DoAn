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
import { useCartStore, useUiStore } from '../stores';
import { useAuthContext } from './AuthContext';
import { parsePath } from '../lib/routes';
import { useProducts, useOrders } from '../hooks';

export interface AppContextType {
  // Auth
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
  isOrdersLoading: boolean;
  isOrdersFetching: boolean;
  isOrdersError: boolean;
  refetchOrders: () => void;
  /** Id đơn đang xem ở màn xác nhận (URL /orders/:id) */
  viewedOrderId: string | null;
  openOrderDetail: (orderId: string) => void;
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
  useEffect(() => {
    const handlePopState = () => {
      // URL → màn hình (gồm /orders và /orders/:id). Dùng setState để không đẩy thêm history.
      const { screen, orderId } = parsePath(window.location.pathname);
      useUiStore.setState({ currentScreen: screen, viewedOrderId: orderId });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auth: nguồn dữ liệu là AuthContext (AppContext chỉ chuyển tiếp để component cũ dùng useApp vẫn chạy)
  const {
    user,
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
    redeemPoints,
  } = useAuthContext();

  // Zustand UI Store
  const currentScreen = useUiStore((s) => s.currentScreen);
  const setCurrentScreen = useUiStore((s) => s.setCurrentScreen);
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
  const viewedOrderId = useUiStore((s) => s.viewedOrderId);
  const openOrderDetail = useUiStore((s) => s.openOrderDetail);
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
  const { orders, isLoading: isOrdersLoading, isFetching: isOrdersFetching, isError: isOrdersError, refetch: refetchOrders, latestOrder, createOrder, advanceOrderStatus, reOrder, cancelOrder, isCancelling } = useOrders();
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
    isOrdersLoading,
    isOrdersFetching,
    isOrdersError,
    refetchOrders: () => { void refetchOrders(); },
    viewedOrderId,
    openOrderDetail,
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