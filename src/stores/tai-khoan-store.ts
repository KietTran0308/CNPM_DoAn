/**
 * =====================================================================
 * STORE QUẢN LÝ TÀI KHOẢN & PHIÊN ĐĂNG NHẬP (REAL AUTH STORE)
 * =====================================================================
 * Loại bỏ toàn bộ demo mock data. Kết nối trực tiếp Backend SQL qua authApi.
 */

import { create } from 'zustand';
import { User, MembershipTier } from '../types';
import { authApi, tokenStorage } from '../services/api';

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
  redeemPoints: (points: number) => Promise<{ success: boolean; message: string; remainingPoints?: number }>;
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
    set({ user: null, isAuthModalOpen: false });
  },

  // Cập nhật hồ sơ trên SQL Database
  updateUser: async (patch: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    try {
      set({ isLoading: true });
      const res = await authApi.updateProfile({
        fullName: patch.fullName || currentUser.fullName,
        phone: patch.phone || currentUser.phone,
        avatar: patch.avatar || currentUser.avatar,
        favoriteBranch: patch.favoriteBranch || currentUser.favoriteBranch,
      });
      set({ user: res.user, isLoading: false });
    } catch (err) {
      console.error('[Update Profile Error]', err);
      set({ isLoading: false });
    }
  },

  // Đổi điểm thưởng trực tiếp trên SQL Database
  redeemPoints: async (points: number) => {
    const currentUser = get().user;
    if (!currentUser) {
      return { success: false, message: 'Vui lòng đăng nhập để thực hiện đổi điểm thưởng.' };
    }

    if ((currentUser.loyaltyPoints || 0) < points) {
      return {
        success: false,
        message: `Số điểm của bạn (${currentUser.loyaltyPoints || 0}đ) chưa đủ để đổi quà này.`,
      };
    }

    try {
      set({ isLoading: true });
      const res = await authApi.redeemPoints(points, `Đổi ưu đãi ${points} điểm`);
      set((state) => ({
        isLoading: false,
        user: state.user
          ? {
              ...state.user,
              loyaltyPoints: res.remainingPoints,
              membershipTier: tinhHangThanhVien(res.remainingPoints),
            }
          : null,
      }));
      return {
        success: true,
        message: 'Đổi điểm thưởng thành công!',
        remainingPoints: res.remainingPoints,
      };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, message: err.message || 'Lỗi khi đổi điểm thưởng.' };
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
