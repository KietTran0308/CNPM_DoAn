import { useUiStore } from '../stores';

export const useUi = () => {
  const currentScreen = useUiStore((state) => state.currentScreen);
  const setCurrentScreen = useUiStore((state) => state.setCurrentScreen);
  const appViewMode = useUiStore((state) => state.appViewMode);
  const setAppViewMode = useUiStore((state) => state.setAppViewMode);
  const deviceView = useUiStore((state) => state.deviceView);
  const setDeviceView = useUiStore((state) => state.setDeviceView);
  const viewportWidth = useUiStore((state) => state.viewportWidth);
  const setViewportWidth = useUiStore((state) => state.setViewportWidth);
  const showGridOverlay = useUiStore((state) => state.showGridOverlay);
  const setShowGridOverlay = useUiStore((state) => state.setShowGridOverlay);
  const branchName = useUiStore((state) => state.branchName);
  const setBranchName = useUiStore((state) => state.setBranchName);

  const activeProductDetail = useUiStore((state) => state.activeProductDetail);
  const openProductDetail = useUiStore((state) => state.openProductDetail);
  const closeProductDetail = useUiStore((state) => state.closeProductDetail);

  const isCartOpen = useUiStore((state) => state.isCartOpen);
  const openCart = useUiStore((state) => state.openCart);
  const closeCart = useUiStore((state) => state.closeCart);

  const isPaymentFailedModalOpen = useUiStore((state) => state.isPaymentFailedModalOpen);
  const failedReason = useUiStore((state) => state.failedReason);
  const openPaymentFailedModal = useUiStore((state) => state.openPaymentFailedModal);
  const closePaymentFailedModal = useUiStore((state) => state.closePaymentFailedModal);

  const toast = useUiStore((state) => state.toast);
  const showToast = useUiStore((state) => state.showToast);
  const hideToast = useUiStore((state) => state.hideToast);

  const activeBreakpoint = useUiStore((state) => state.getActiveBreakpoint)();

  return {
    currentScreen,
    setCurrentScreen,
    appViewMode,
    setAppViewMode,
    deviceView,
    setDeviceView,
    viewportWidth,
    setViewportWidth,
    showGridOverlay,
    setShowGridOverlay,
    branchName,
    setBranchName,
    activeProductDetail,
    openProductDetail,
    closeProductDetail,
    isCartOpen,
    openCart,
    closeCart,
    isPaymentFailedModalOpen,
    failedReason,
    openPaymentFailedModal,
    closePaymentFailedModal,
    toast,
    showToast,
    hideToast,
    activeBreakpoint,
  };
};
