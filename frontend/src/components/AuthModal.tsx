import React from 'react';
import { X, ShieldCheck, LogOut, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { HartzlerWordmark } from './HartzlerBrand';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, openAuthModal, user, logout, isInitialized, authNotice } = useAuthContext();
  const { setCurrentScreen } = useApp();

  if (!isAuthModalOpen) return null;

  const tabClass = (tab: 'login' | 'register') =>
    `flex-1 py-1.5 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
      authModalTab === tab ? 'bg-white text-[#145C4B] shadow-xs' : 'text-[#333333]/70 hover:text-[#145C4B]'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[var(--backdrop-blur-glass)] animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={closeAuthModal} />

      <div className="relative z-10 w-full max-w-md liquid-glass liquid-glass-modal rounded-[20px] border border-white/90 shadow-2xl overflow-hidden bg-white/90">
        {/* Header */}
        <div className="p-5 border-b border-black/5 flex items-center justify-between bg-white/70 backdrop-blur-[var(--backdrop-blur-glass)]">
          <div className="flex items-center gap-2.5">
            <HartzlerWordmark size="sm" />
          </div>
          <button
            onClick={closeAuthModal}
            aria-label="Đóng"
            className="w-8 h-8 rounded-full border border-black/10 hover:border-black/20 flex items-center justify-center text-[#333333] hover:text-[#035542] bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isInitialized ? (
          <div role="status" className="p-8 flex flex-col items-center gap-2 text-[#145C4B]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-bold uppercase">Đang kiểm tra phiên đăng nhập...</span>
          </div>
        ) : user ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-[16px] bg-white/70 border border-white/80 shadow-xs">
              <div className="w-11 h-11 rounded-full bg-[#145C4B] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#333333] truncate">{user.fullName}</h3>
                <p className="text-xs text-[#333333]/70 font-mono truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#145C4B] bg-emerald-900/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-[#145C4B]" /> ĐÃ ĐĂNG NHẬP{user.role === 'admin' ? ' • QUẢN TRỊ' : user.role === 'barista' ? ' • NHÂN VIÊN' : ''}
                  </span>
                  <span className="text-[10px] font-bold text-[#145C4B]">
                    Hạng: {user.membershipTier || 'Standard'} ({user.loyaltyPoints || 0}đ)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  closeAuthModal();
                  setCurrentScreen('account');
                }}
                className="flex-1 py-3 px-4 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white font-bold text-xs cursor-pointer hover:brightness-105 shadow-sm text-center transition-all"
              >
                XEM HỒ SƠ TÀI KHOẢN
              </button>
              <button
                type="button"
                onClick={logout}
                className="py-3 px-4 rounded-full liquid-glass border border-red-500/20 text-[#c93b2b] font-bold text-xs hover:bg-red-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" /> ĐĂNG XUẤT
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Chuyển đổi Đăng nhập / Đăng ký */}
            <div className="flex rounded-full bg-stone-100 p-1 mb-5 border border-black/5">
              <button type="button" onClick={() => openAuthModal('login')} className={tabClass('login')}>
                ĐĂNG NHẬP
              </button>
              <button type="button" onClick={() => openAuthModal('register')} className={tabClass('register')}>
                ĐĂNG KÝ
              </button>
            </div>

            {authNotice && (
              <div role="alert" className="mb-4 p-3 rounded-[12px] bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authNotice}</span>
              </div>
            )}

            {/*key = tab*/}
            {authModalTab === 'login' ? (
              <LoginForm key="login" onSuccess={closeAuthModal} onSwitchToRegister={() => openAuthModal('register')} />
            ) : (
              <RegisterForm key="register" onSuccess={closeAuthModal} onSwitchToLogin={() => openAuthModal('login')} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
