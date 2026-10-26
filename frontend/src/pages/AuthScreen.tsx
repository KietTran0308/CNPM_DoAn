/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AuthScreenProps {
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

export const AuthScreen: React.FC<AuthScreenProps> = ({
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
  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        <div className="text-center font-bold text-lg pb-3 border-b border-gray-400">
          BrewLite
        </div>

        <div className="mt-6 space-y-4">
          <div className="text-center font-bold text-sm">
            {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </div>

          {authError && (
            <div className="text-xs text-red-600 text-center border border-red-400 p-1.5 bg-stone-100">
              {authError}
            </div>
          )}

          <form onSubmit={onAuthSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => {
                  setAuthEmail(e.target.value);
                  setAuthError(null);
                }}
                placeholder="Email (ví dụ: user@brewlite.vn)"
                required
                className="w-full p-2 border border-gray-400 bg-stone-100 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => {
                  setAuthPassword(e.target.value);
                  setAuthError(null);
                }}
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                required
                className="w-full p-2 border border-gray-400 bg-stone-100 text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 mt-2 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900"
            >
              {authLoading
                ? 'Đang xử lý...'
                : authMode === 'login'
                ? 'Đăng nhập'
                : 'Đăng ký'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError(null);
              }}
              className="text-xs text-black underline cursor-pointer"
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
