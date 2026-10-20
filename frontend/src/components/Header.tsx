import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  User as UserIcon,
  Coffee,
  Clock,
  Menu as MenuIcon,
} from 'lucide-react';
import { formatCurrency } from '../utils';
import { HartzlerWordmark } from './HartzlerBrand';

export const Header: React.FC = () => {
  const {
    user,
    openAuthModal,
    cartCount,
    cartTotal,
    openCart,
    currentScreen,
    setCurrentScreen,
  } = useApp();

  return (
    <>
      {/* Main Responsive Header with Liquid Glass aesthetic */}
      <header className="liquid-glass sticky top-0 z-40 transition-all border-b border-white/60 bg-[#FAF9F5]/85 backdrop-blur-[20px] shadow-xs">
        <div className="fluid-container">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Wordmark */}
            <button
              onClick={() => setCurrentScreen('menu')}
              className="flex items-center gap-2.5 text-left cursor-pointer group touch-target p-1"
              aria-label="Brew Lite Trang chủ"
            >
              <HartzlerWordmark size="md" />
            </button>

            {/* Desktop & Tablet Navigation */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              <button
                onClick={() => {
                  setCurrentScreen('menu');
                  const el = document.getElementById('full-menu');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 text-[15px] font-semibold text-[#035542] hover:opacity-80 transition-opacity cursor-pointer touch-target px-3 py-1.5 rounded-full hover:bg-emerald-900/5"
                style={{ fontFamily: "'Work Sans', sans-serif" }}
                title="Khám phá thực đơn"
              >
                <span>MENU</span>
                <MenuIcon className="w-4 h-4 stroke-[2.2]" />
              </button>

              <button
                onClick={() => setCurrentScreen('orders')}
                className={`text-[14px] font-semibold tracking-wider transition-all cursor-pointer touch-target px-3.5 py-1.5 rounded-full ${
                  currentScreen === 'orders'
                    ? 'text-[#035542] bg-emerald-900/10 font-bold'
                    : 'text-[#333333]/80 hover:text-[#035542] hover:bg-black/5'
                }`}
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                LỊCH SỬ ĐƠN
              </button>

              <button
                onClick={() => setCurrentScreen('rewards')}
                className={`text-[14px] font-semibold tracking-wider transition-all cursor-pointer touch-target px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                  currentScreen === 'rewards' || currentScreen === 'vouchers'
                    ? 'text-[#035542] bg-emerald-900/10 font-bold'
                    : 'text-[#333333]/80 hover:text-[#035542] hover:bg-black/5'
                }`}
                style={{ fontFamily: "'Work Sans', sans-serif" }}
              >
                <span>ĐIỂM THƯỞNG</span>
                {user && (
                  <span className="bg-amber-100 text-amber-900 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-amber-300">
                    {user.loyaltyPoints ?? 0}đ
                  </span>
                )}
              </button>


              {/* Cart Button: Liquid Glass Pill with subtle glowing highlight */}
              <button
                onClick={openCart}
                className="relative touch-target px-4 py-2 rounded-full border border-emerald-900/20 bg-white/80 hover:bg-white text-[#035542] shadow-xs hover:shadow-md hover:border-emerald-900/40 active:scale-95 transition-all cursor-pointer text-xs lg:text-sm font-semibold tracking-wider flex items-center"
                title="Xem giỏ hàng"
                aria-label={`Xem giỏ hàng với ${cartCount} món`}
              >
                <ShoppingBag className="w-4 h-4 mr-1.5 shrink-0" />
                <span>GIỎ HÀNG</span>
                {cartCount > 0 && (
                  <span className="ml-2 bg-[#035542] text-white font-mono text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                    {cartCount}
                  </span>
                )}
                {cartCount > 0 && (
                  <span className="hidden xl:inline ml-2 pl-2 border-l border-[#035542]/20 font-mono text-xs font-bold">
                    {formatCurrency(cartTotal)}
                  </span>
                )}
              </button>

              {/* User Profile / Login */}
              {user ? (
                <button
                  onClick={() => setCurrentScreen('account')}
                  className={`touch-target px-3 py-1.5 rounded-full border transition-all cursor-pointer text-xs font-semibold flex items-center shadow-xs ${
                    currentScreen === 'account'
                      ? 'border-[#035542] bg-[#035542] text-white shadow-sm'
                      : 'border-black/10 bg-white/80 hover:bg-white text-[#035542]'
                  }`}
                  title={`Xem thông tin tài khoản của ${user.fullName}`}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-5 h-5 rounded-full object-cover mr-1.5 border border-white/50"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#035542] text-white flex items-center justify-center text-[10px] font-bold mr-1.5">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[90px] truncate">{user.fullName}</span>
                  {user.loyaltyPoints !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-300 text-stone-900 text-[10px] font-mono font-bold">
                      {user.loyaltyPoints}đ
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="touch-target px-4 py-2 rounded-full border border-black/10 bg-white/70 hover:bg-white text-[#333333] hover:text-[#035542] transition-all cursor-pointer text-xs font-semibold tracking-wider flex items-center shadow-xs"
                >
                  <UserIcon className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span>ĐĂNG NHẬP</span>
                </button>
              )}
            </nav>

            {/* Mobile Header Quick Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={openCart}
                className="relative touch-target w-10 h-10 rounded-full border border-emerald-900/20 bg-white/90 text-[#035542] flex items-center justify-center active:scale-95 transition-all shadow-xs"
                aria-label={`Giỏ hàng ${cartCount} món`}
              >
                <ShoppingBag className="w-4 h-4 text-[#035542]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#035542] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Floating Liquid Glass Navigation Dock: Sleek, centered, thumb-friendly */}
      <nav
        aria-label="Điều hướng di động nhanh"
        className="md:hidden fixed bottom-3 inset-x-3 max-w-sm mx-auto z-40 liquid-glass rounded-full border border-white/90 shadow-[0_10px_30px_-5px_rgba(3,85,66,0.15)] ring-1 ring-black/5 px-2 py-1.5"
      >
        <div className="grid grid-cols-4 items-center">
          {/* Tab 1: Thực đơn */}
          <button
            onClick={() => {
              if (currentScreen === 'menu') {
                const el = document.getElementById('full-menu');
                el?.scrollIntoView({ behavior: 'smooth' });
              } else {
                setCurrentScreen('menu');
              }
            }}
            className={`flex flex-col items-center justify-center py-1 touch-target rounded-full transition-colors ${
              currentScreen === 'menu' ? 'text-[#035542] font-bold bg-[#035542]/10' : 'text-[#333333]/70 hover:text-[#035542]'
            }`}
          >
            <Coffee className={`w-4 h-4 ${currentScreen === 'menu' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-semibold mt-0.5">Thực đơn</span>
          </button>

          {/* Tab 2: Đơn hàng */}
          <button
            onClick={() => setCurrentScreen('orders')}
            className={`flex flex-col items-center justify-center py-1 touch-target rounded-full transition-colors ${
              currentScreen === 'orders' ? 'text-[#035542] font-bold bg-[#035542]/10' : 'text-[#333333]/70 hover:text-[#035542]'
            }`}
          >
            <Clock className={`w-4 h-4 ${currentScreen === 'orders' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-semibold mt-0.5">Đơn hàng</span>
          </button>

          {/* Tab 3: Giỏ hàng */}
          <button
            onClick={openCart}
            className="flex flex-col items-center justify-center py-1 touch-target rounded-full text-[#035542] relative hover:bg-[#035542]/5 transition-colors"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#035542] text-white text-[9px] font-bold px-1 rounded-full min-w-3.5 text-center leading-tight">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Giỏ hàng</span>
          </button>

          {/* Tab 4: Tài khoản */}
          <button
            onClick={() => {
              if (user) {
                setCurrentScreen('account');
              } else {
                openAuthModal('login');
              }
            }}
            className={`flex flex-col items-center justify-center py-1 touch-target rounded-full transition-colors ${
              currentScreen === 'account'
                ? 'text-[#035542] font-bold bg-[#035542]/10'
                : 'text-[#333333]/70 hover:text-[#035542]'
            }`}
          >
            <UserIcon className={`w-4 h-4 ${currentScreen === 'account' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-semibold mt-0.5">
              {user ? 'Tài khoản' : 'Đăng nhập'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
