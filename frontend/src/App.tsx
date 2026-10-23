'use client';

import React from 'react';
import { NhaCungCapTruyVan } from './lib/nha-cung-cap-truy-van';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { MenuPage } from './components/MenuPage';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { OrderConfirmationPage } from './components/OrderConfirmationPage';
import { OrderHistoryPage } from './components/OrderHistoryPage';
import { PaymentFailureModal } from './components/PaymentFailureModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { AccountProfilePage } from './components/account/AccountProfilePage';
import { TrangDiemThuong } from './components/diem-thuong/diem-thuong';
import { useGiaoDienStore } from './stores';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { USE_MOCK_API } from './services/api';

const AppContent: React.FC = () => {
  const { currentScreen } = useApp();
  const toast = useGiaoDienStore((s) => s.toast);
  const hideToast = useGiaoDienStore((s) => s.hideToast);

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return <MenuPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'confirmation':
        return <OrderConfirmationPage />;
      case 'orders':
        return <OrderHistoryPage />;
      case 'account':
        return <AccountProfilePage />;
      case 'rewards':
      case 'vouchers':
        return <TrangDiemThuong />;
      case 'cart':
        return <MenuPage />;
      default:
        return <MenuPage />;
    }
  };

  return (
    <div className="min-h-screen text-[#252525] flex flex-col font-sans relative selection:bg-[#56dddb]/30 selection:text-[#145C4B] bg-[#FAF9F5] overflow-x-hidden">
      {/* Toast Notification Container */}
      {toast && (
        <aside
          aria-label="Thông báo hệ thống"
          className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-3 duration-200"
        >
          <div
            className={`p-3.5 rounded-[16px] shadow-xl border flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-900/90 text-white border-red-700/50'
                : toast.type === 'info'
                ? 'bg-stone-900/90 text-white border-white/20'
                : 'bg-[#145C4B]/95 text-white border-white/20'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-300" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 shrink-0 text-amber-300" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
            )}
            <p className="text-xs font-medium leading-snug flex-1">{toast.message}</p>
            <button
              onClick={hideToast}
              aria-label="Đóng thông báo"
              className="text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {USE_MOCK_API && (
        <div role="status" className="w-full bg-amber-100 text-amber-950 text-center text-xs sm:text-sm font-semibold p-2 border-b border-amber-200">
          BẢN DEMO FRONTEND — Đăng ký, đơn hàng và thanh toán chỉ mô phỏng, không chuyển tiền thật.
        </div>
      )}

      {/* Brand Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col items-center">
        <div className="w-full">
          <div className="fluid-container py-3 sm:py-5">
            <div className="main-content-wrapper w-full liquid-glass rounded-[24px] p-3 sm:p-6 lg:p-8 shadow-xl border border-white/80 transition-all bg-white/70 backdrop-blur-[16px]">
              {renderCurrentScreen()}
            </div>
          </div>
        </div>
      </main>

      {/* Real Café Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <ProductDetailModal />
      <CartDrawer />
      <PaymentFailureModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <NhaCungCapTruyVan>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </NhaCungCapTruyVan>
  );
}
