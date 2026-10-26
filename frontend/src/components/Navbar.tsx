/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../api';

interface NavbarProps {
  user: User | null;
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  onNavigateHistory: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  menuOpen,
  setMenuOpen,
  onNavigateHistory,
  onLogout,
}) => {
  return (
    <div className="flex justify-between items-center pb-2 border-b border-gray-400 relative">
      <span className="font-bold text-base">BrewLite</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono border border-gray-400 px-2 py-0.5 rounded bg-stone-100 font-medium">
          Điểm: {user?.loyaltyPoints ?? 0}
        </span>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="font-bold text-lg px-2 cursor-pointer select-none"
        >
          ☰
        </button>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 top-8 w-48 bg-white border border-gray-400 shadow-none z-10 text-xs">
          <div className="p-2 border-b border-gray-300 bg-stone-50">
            <div className="text-gray-600 truncate">{user?.email}</div>
            <div className="font-bold font-mono text-emerald-800 mt-0.5">
              Điểm: {user?.loyaltyPoints ?? 0}
            </div>
          </div>
          <button
            onClick={() => {
              setMenuOpen(false);
              onNavigateHistory();
            }}
            className="w-full text-left p-2.5 hover:bg-stone-100 border-b border-gray-300 cursor-pointer"
          >
            Lịch sử đơn hàng
          </button>
          <button
            onClick={onLogout}
            className="w-full text-left p-2.5 hover:bg-stone-100 text-red-700 cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};
