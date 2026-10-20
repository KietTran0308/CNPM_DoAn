import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  Loader2,
} from 'lucide-react';
import { HartzlerWordmark } from './HartzlerBrand';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    openAuthModal,
    user,
    login,
    register,
    logout,
    setCurrentScreen,
  } = useApp();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Đăng nhập không thành công.');
      } else {
        setSuccessMsg('Đăng nhập thành công! Đang tải dữ liệu tài khoản...');
        setTimeout(() => {
          closeAuthModal();
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await register(regName, regEmail, regPassword, regPhone);
      if (!res.success) {
        setErrorMsg(res.error || 'Đăng ký không thành công.');
      } else {
        setSuccessMsg('Đăng ký tài khoản thành công và đã lưu vào Database!');
        setTimeout(() => {
          closeAuthModal();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[var(--backdrop-blur-glass)] animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={closeAuthModal} />

      {/* Liquid Glass Dialog Container */}
      <div className="relative z-10 w-full max-w-md liquid-glass liquid-glass-modal rounded-[20px] border border-white/90 shadow-2xl overflow-hidden bg-white/90">
        {/* Header */}
        <div className="p-5 border-b border-black/5 flex items-center justify-between bg-white/70 backdrop-blur-[var(--backdrop-blur-glass)]">
          <div className="flex items-center gap-2.5">
            <HartzlerWordmark size="sm" />
          </div>

          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full border border-black/10 hover:border-black/20 flex items-center justify-center text-[#333333] hover:text-[#035542] bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {user ? (
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
                    <ShieldCheck className="w-3 h-3 text-[#145C4B]" /> ĐÃ XÁC THỰC SQL
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
            {/* Tabs */}
            <div className="flex rounded-full bg-stone-100 p-1 mb-5 border border-black/5">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  openAuthModal('login');
                }}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
                  authModalTab === 'login'
                    ? 'bg-white text-[#145C4B] shadow-xs'
                    : 'text-[#333333]/70 hover:text-[#145C4B]'
                }`}
              >
                ĐĂNG NHẬP
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  openAuthModal('register');
                }}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
                  authModalTab === 'register'
                    ? 'bg-white text-[#145C4B] shadow-xs'
                    : 'text-[#333333]/70 hover:text-[#145C4B]'
                }`}
              >
                ĐĂNG KÝ
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-[12px] bg-red-50/90 border border-red-200 text-[#c93b2b] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-[12px] bg-emerald-50/90 border border-emerald-200 text-[#145C4B] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {authModalTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-[#333333] mb-1 flex items-center gap-1 uppercase">
                    <Mail className="w-3.5 h-3.5 text-[#145C4B]" /> Email đăng nhập *
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="vidu@email.com"
                    className="w-full px-3.5 py-2.5 rounded-full bg-white border border-black/10 text-xs text-[#333333] focus:border-[#145C4B] focus:outline-none focus:ring-2 focus:ring-[#145C4B]/10 shadow-xs"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[#333333] flex items-center gap-1 uppercase">
                      <Lock className="w-3.5 h-3.5 text-[#145C4B]" /> Mật khẩu *
                    </label>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full px-3.5 py-2.5 rounded-full bg-white border border-black/10 text-xs text-[#333333] focus:border-[#145C4B] focus:outline-none focus:ring-2 focus:ring-[#145C4B]/10 shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white hover:brightness-105 active:scale-[0.98] font-bold text-sm uppercase transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isLoading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP'}</span>
                </button>

                <div className="text-center text-xs text-[#333333] pt-2">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('register')}
                    className="text-[#145C4B] font-bold hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#333333] mb-1 flex items-center gap-1 uppercase">
                    <UserIcon className="w-3.5 h-3.5 text-[#145C4B]" /> Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 rounded-full bg-white border border-black/10 text-xs text-[#333333] focus:border-[#145C4B] focus:outline-none focus:ring-2 focus:ring-[#145C4B]/10 shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#333333] mb-1 flex items-center gap-1 uppercase">
                    <Mail className="w-3.5 h-3.5 text-[#145C4B]" /> Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="vidu@email.com"
                    className="w-full px-3.5 py-2.5 rounded-full bg-white border border-black/10 text-xs text-[#333333] focus:border-[#145C4B] focus:outline-none focus:ring-2 focus:ring-[#145C4B]/10 shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#333333] mb-1 flex items-center gap-1 uppercase">
                    <Phone className="w-3.5 h-3.5 text-[#145C4B]" /> Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-3.5 py-2.5 rounded-full bg-white border border-black/10 text-xs text-[#333333] focus:border-[#145C4B] focus:outline-none focus:ring-2 focus:ring-[#145C4B]/10 shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#333333] mb-1 flex items-center gap-1 uppercase">
                    <Lock className="w-3.5 h-3.5 text-[#145C4B]" /> Mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3.5 py-2.5 rounded-full bg-white border border-black/10 text-xs text-[#333333] focus:border-[#145C4B] focus:outline-none focus:ring-2 focus:ring-[#145C4B]/10 shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#333333] mb-1 flex items-center gap-1 uppercase">
                    <Lock className="w-3.5 h-3.5 text-[#145C4B]" /> Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full px-3.5 py-2.5 rounded-full bg-white border border-black/10 text-xs text-[#333333] focus:border-[#145C4B] focus:outline-none focus:ring-2 focus:ring-[#145C4B]/10 shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white hover:brightness-105 active:scale-[0.98] font-bold text-sm uppercase transition-all cursor-pointer mt-2 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isLoading ? 'ĐANG LƯU VÀO DATABASE...' : 'ĐĂNG KÝ TÀI KHOẢN'}</span>
                </button>

                <div className="text-center text-xs text-[#333333] pt-2">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="text-[#145C4B] font-bold hover:underline"
                  >
                    Đăng nhập
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
