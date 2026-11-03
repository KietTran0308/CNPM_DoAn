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
    <header className="flex justify-between items-center px-4 sm:px-6 py-3 bg-[#FBF9F5] rounded-xl border border-[#E2D9C0] shadow-xs relative">
      <div className="flex items-center gap-3 shrink-0">
        {duongDanLogo && !loiLogo ? (
          <img
            src={duongDanLogo}
            alt="Logo BrewLite"
            referrerPolicy="no-referrer"
            onError={() => setLoiLogo(true)}
            className="h-12 w-12 sm:h-14 sm:w-auto object-contain shrink-0"
          />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-[#124E35] text-[#F5F0E1] text-base font-bold flex items-center justify-center">
            B
          </div>
        )}
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#124E35] whitespace-nowrap">
          BrewLite
        </span>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div className="text-xs sm:text-sm text-[#124E35] font-mono tabular-nums px-3 py-1.5 rounded-lg bg-[#EDE6D1] border border-[#D5CCB4] font-medium">
          Điểm: <span className="font-semibold text-[#124E35]">{user?.loyaltyPoints ?? 0}</span>
        </div>
        <button
          type="button"
          aria-label="Mở menu tài khoản"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold cursor-pointer transition-colors select-none ${
            menuOpen
              ? 'bg-[#124E35] text-[#F5F0E1] border-[#124E35]'
              : 'border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35] hover:bg-[#124E35] hover:text-[#F5F0E1] hover:border-[#124E35]'
          }`}
        >
          {menuOpen ? 'Đóng' : 'Tài khoản'}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-0 top-16 w-56 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl shadow-md z-30 text-xs overflow-hidden">
          <div className="p-3 border-b border-[#D5CCB4] bg-[#EDE6D1]">
            <div className="text-[11px] text-[#124E35]/80">Tài khoản đang đăng nhập</div>
            <div className="text-[#124E35] font-semibold truncate mt-0.5">{user?.email}</div>
            <div className="font-mono tabular-nums text-[#124E35] font-semibold mt-1">
              Điểm tích lũy: {user?.loyaltyPoints ?? 0} điểm
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onNavigateHistory();
            }}
            className="w-full text-left px-3.5 py-2.5 hover:bg-[#EDE6D1] text-[#124E35] border-b border-[#E2D9C0] cursor-pointer transition-colors font-semibold"
          >
            Lịch sử đơn hàng
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full text-left px-3.5 py-2.5 hover:bg-[#EDE6D1] text-[#124E35] cursor-pointer transition-colors font-medium"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
};

