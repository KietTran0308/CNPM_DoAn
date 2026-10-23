/**
 * =====================================================================
 * STORE QUẢN LÝ TÀI KHOẢN & PHIÊN ĐĂNG NHẬP (REAL AUTH STORE)
 * =====================================================================
 * Loại bỏ toàn bộ demo mock data. Kết nối trực tiếp Backend SQL qua authApi.
 */

// @ts-ignore
import { create } from 'zustand';
import { User, MembershipTier } from '../types';
import { authApi } from '../services/auth.api';
import { tokenStorage } from '../services/http';
import { queryClient } from '../lib/nha-cung-cap-truy-van';

export interface TrangThaiTaiKhoan {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';

  // Điều khiển Modal
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;

  // Hành động xác thực thực tế với Backend SQL
  initAuth: () => Promise<void>;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => Promise<void>;
  setUser: (user: User) => void;
  redeemPoints: (points: number) => Promise<{ success: boolean; message: string; remainingPoints?: number; voucherCode?: string }>;
  addLoyaltyPoints: (points: number) => void;
  setFavoriteBranch: (branch: string) => void;
}

export type AuthState = TrangThaiTaiKhoan;

export const tinhHangThanhVien = (points: number): MembershipTier => {
  if (points >= 600) return 'Diamond';
  if (points >= 300) return 'Gold';
  if (points >= 100) return 'Silver';
  return 'Standard';
};

export const useTaiKhoanStore = create<TrangThaiTaiKhoan>((set, get) => ({
  // Khởi tạo hoàn toàn TRỐNG (null), không có tài khoản demo
  user: null,
  isLoading: false,
  isAuthModalOpen: false,
  authModalTab: 'login',

  openAuthModal: (tab = 'login') => {
    set({ authModalTab: tab, isAuthModalOpen: true });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false });
  },

  // Khôi phục phiên làm việc thực tế từ JWT token nếu có
  initAuth: async () => {
    const token = tokenStorage.get();
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      const res = await authApi.getMe();
      if (res && res.user) {
        set({ user: res.user, isLoading: false });
      } else {
        tokenStorage.remove();
        set({ user: null, isLoading: false });
      }
    } catch {
      tokenStorage.remove();
      set({ user: null, isLoading: false });
    }
  },

  // Đăng nhập thực tế
  login: async (email, pass) => {
    if (!email || !pass) {
      return { success: false, error: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' };
    }

    try {
      set({ isLoading: true });
      const res = await authApi.login({ email, password: pass });
      set({ user: res.user, isAuthModalOpen: false, isLoading: false });
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Đăng nhập không thành công.' };
    }
  },

  // Đăng ký tài khoản thực tế vào SQL Database
  register: async (name, email, pass, phone) => {
    if (!name || !email || !pass) {
      return { success: false, error: 'Vui lòng cung cấp đầy đủ thông tin đăng ký.' };
    }

    try {
      set({ isLoading: true });
      const res = await authApi.register({
        fullName: name,
        email,
        password: pass,
        phone,
      });
      set({ user: res.user, isAuthModalOpen: false, isLoading: false });
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Đăng ký không thành công.' };
    }
  },

  // Đăng xuất và dọn sạch token
  logout: () => {
    authApi.logout();
    queryClient.removeQueries({ queryKey: ['voucher'] });
    queryClient.removeQueries({ queryKey: ['diem-thuong'] });
    queryClient.removeQueries({ queryKey: ['tai-khoan'] });
    queryClient.removeQueries({ queryKey: ['don-hang'] });
    set({ user: null, isAuthModalOpen: false });
  },

  setUser: (user) => set({ user }),

  // Cập nhật hồ sơ trên SQL Database
  updateUser: async (patch: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    try {
      set({ isLoading: true });
      const res = await authApi.updateProfile({
        fullName: patch.fullName || currentUser.fullName,
        phone: patch.phone ?? currentUser.phone,
        avatar: patch.avatar ?? currentUser.avatar,
        favoriteBranch: patch.favoriteBranch ?? currentUser.favoriteBranch,
      });
      set({ user: res.user, isLoading: false });
    } catch (err) {
      console.error('[Update Profile Error]', err);
      set({ isLoading: false });
    }
  },

  // Đổi phần thưởng trên server: KHÔNG tự trừ điểm hoặc tự cấp voucher tại client.
  redeemPoints: async (points: number) => {
    const rewardId: Record<number, string> = { 50: 'pt-50', 100: 'pt-100', 150: 'pt-150', 200: 'pt-200', 300: 'pt-300' };
    const chosen = rewardId[points];
    if (!chosen) return { success: false, message: 'Mức đổi điểm không được hỗ trợ' };
    try {
      const res = await authApi.redeemReward(chosen, crypto.randomUUID());
      const updated = await authApi.getMe();
      set({ user: updated.user });
      await queryClient.invalidateQueries({ queryKey: ['voucher'] });
      await queryClient.invalidateQueries({ queryKey: ['diem-thuong'] });
      return { success: true, message: res.message, remainingPoints: res.remainingPoints, voucherCode: res.voucherCode };
    } catch (err: any) {
      return { success: false, message: err.message || 'Không đổi được điểm' };
    }
  },

  addLoyaltyPoints: (pts: number) => {
    const currentUser = get().user;
    if (currentUser) {
      const newPoints = (currentUser.loyaltyPoints || 0) + pts;
      const newTier = tinhHangThanhVien(newPoints);
      set({
        user: {
          ...currentUser,
          loyaltyPoints: newPoints,
          membershipTier: newTier,
        },
      });
    }
  },

  setFavoriteBranch: (branch: string) => {
    const currentUser = get().user;
    if (currentUser) {
      get().updateUser({ favoriteBranch: branch });
    }
  },
}));

export const useAuthStore = useTaiKhoanStore;
