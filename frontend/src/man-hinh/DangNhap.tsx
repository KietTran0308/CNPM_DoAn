import React, { useState } from 'react';
import { LOGO, layDuongDanAnh } from '../hinhAnh';

interface DangNhapProps {
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  authError: string | null;
  setAuthError: (error: string | null) => void;
  authLoading: boolean;
  onAuthSubmit: (e: React.FormEvent) => void;
}

export const DangNhap: React.FC<DangNhapProps> = ({
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  authLoading,
  onAuthSubmit,
}) => {
  const [loiLogo, setLoiLogo] = useState(false);
  const duongDanLogo = layDuongDanAnh(LOGO.chinh);

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center py-8 sm:py-12">
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-auto space-y-6 shadow-xs">
        <div className="text-center pb-5 border-b border-neutral-200/80 space-y-3">
          {duongDanLogo && !loiLogo ? (
            <img
              src={duongDanLogo}
              alt="Logo BrewLite"
              referrerPolicy="no-referrer"
              onError={() => setLoiLogo(true)}
              className="w-14 h-14 rounded-xl object-cover border border-neutral-200/80 bg-stone-50 mx-auto"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-emerald-800 text-white text-base font-semibold flex items-center justify-center mx-auto">
              B
            </div>
          )}
          <div>
            <h1 className="font-semibold text-xl tracking-tight text-emerald-900">BrewLite</h1>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <h2 className="font-semibold text-sm text-neutral-900">
              {authMode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
            </h2>
          </div>

          {authError && (
            <div className="text-xs text-neutral-800 text-center border border-neutral-200/80 p-2.5 rounded-lg bg-stone-50">
              {authError}
            </div>
          )}

          <form onSubmit={onAuthSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => {
                  setAuthEmail(e.target.value);
                  setAuthError(null);
                }}
                placeholder="khachhang@brewlite.vn"
                required
                className="w-full px-3 py-2.5 border border-neutral-200/80 rounded-lg bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Mật khẩu</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => {
                  setAuthPassword(e.target.value);
                  setAuthError(null);
                }}
                placeholder="Tối thiểu 6 ký tự"
                required
                className="w-full px-3 py-2.5 border border-neutral-200/80 rounded-lg bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 mt-1 bg-emerald-800 text-white font-medium text-sm rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors"
            >
              {authLoading
                ? 'Đang xử lý...'
                : authMode === 'login'
                ? 'Đăng nhập'
                : 'Đăng ký'}
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError(null);
              }}
              className="text-xs text-emerald-800 hover:text-emerald-700 font-medium underline cursor-pointer transition-colors"
            >
              {authMode === 'login'
                ? 'Chưa có tài khoản? Chuyển sang Đăng ký'
                : 'Đã có tài khoản? Chuyển sang Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DangNhap;
