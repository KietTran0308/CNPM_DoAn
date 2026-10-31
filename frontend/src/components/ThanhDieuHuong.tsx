import React, { useState } from 'react';
import { User } from '../api';
import { LOGO, layDuongDanAnh } from '../hinhAnh';

interface ThanhDieuHuongProps {
  user: User | null;
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  onNavigateHistory: () => void;
  onLogout: () => void;
}

export const ThanhDieuHuong: React.FC<ThanhDieuHuongProps> = ({
  user,
  menuOpen,
  setMenuOpen,
  onNavigateHistory,
  onLogout,
}) => {
  const [loiLogo, setLoiLogo] = useState(false);
  const duongDanLogo = layDuongDanAnh(LOGO.chinh);

  return (
    <header className="flex justify-between items-center px-4 sm:px-6 py-3.5 bg-white rounded-xl border border-neutral-200/80 shadow-xs relative">
      <div className="flex items-center gap-3 shrink-0">
        {duongDanLogo && !loiLogo ? (
          <img
            src={duongDanLogo}
            alt="Logo BrewLite"
            referrerPolicy="no-referrer"
            onError={() => setLoiLogo(true)}
            className="w-9 h-9 rounded-xl object-cover border border-neutral-200/80 bg-stone-50"
          />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white text-sm font-semibold flex items-center justify-center">
            B
          </div>
        )}
        <span className="font-semibold text-lg tracking-tight text-emerald-900 whitespace-nowrap">
          BrewLite
        </span>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div className="text-xs sm:text-sm text-emerald-900 font-mono tabular-nums px-3 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-800/15">
          Điểm: <span className="font-semibold text-emerald-900">{user?.loyaltyPoints ?? 0}</span>
        </div>
        <button
          type="button"
          aria-label="Mở menu tài khoản"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-medium cursor-pointer transition-colors select-none ${
            menuOpen
              ? 'bg-emerald-800 text-white border-emerald-800'
              : 'border-neutral-200/80 bg-white hover:bg-emerald-50/70 hover:text-emerald-900 hover:border-emerald-800/30 text-neutral-700'
          }`}
        >
          {menuOpen ? 'Đóng' : 'Tài khoản'}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-0 top-14 w-56 bg-white border border-neutral-200/80 rounded-xl shadow-md z-30 text-xs overflow-hidden">
          <div className="p-3 border-b border-neutral-200/80 bg-emerald-50/70">
            <div className="text-[11px] text-neutral-500">Tài khoản đang đăng nhập</div>
            <div className="text-neutral-900 font-medium truncate mt-0.5">{user?.email}</div>
            <div className="font-mono tabular-nums text-emerald-900 font-medium mt-1">
              Điểm tích lũy: {user?.loyaltyPoints ?? 0} điểm
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onNavigateHistory();
            }}
            className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/70 hover:text-emerald-900 border-b border-neutral-200/80 text-neutral-700 cursor-pointer transition-colors font-medium"
          >
            Lịch sử đơn hàng
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full text-left px-3.5 py-2.5 hover:bg-stone-50 text-neutral-600 hover:text-neutral-900 cursor-pointer transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
};
