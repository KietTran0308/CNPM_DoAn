/**
 * =====================================================================
 * DỊCH VỤ TÀI KHOẢN KHÁCH HÀNG (ACCOUNT SERVICE VIA REAL SQL API)
 * =====================================================================
 * Kết nối trực tiếp Backend SQL qua authApi, loại bỏ dữ liệu mẫu demo.
 */

import { User, UpdateUserProfilePayload, ChangePasswordPayload } from '../types';
import { authApi } from './api';

export const dichVuTaiKhoan = {
  /**
   * Lấy thông tin hồ sơ của tài khoản đang đăng nhập từ SQL Database
   */
  async layThongTinTaiKhoan(): Promise<User | null> {
    try {
      const res = await authApi.getMe();
      return res?.user || null;
    } catch {
      return null;
    }
  },

  /**
   * Cập nhật thông tin hồ sơ khách hàng trên SQL Database
   */
  async capNhatHoSo(payload: UpdateUserProfilePayload): Promise<User> {
    const res = await authApi.updateProfile(payload);
    return res.user;
  },

  /**
   * Đổi mật khẩu tài khoản
   */
  async doiMatKhau(payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> {
    const newPass = payload.newPassword || payload.newPass;
    const oldPass = payload.currentPassword || payload.oldPass;

    if (!oldPass || !newPass) {
      throw new Error('Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.');
    }

    if (newPass.length < 6) {
      throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
    }

    const res = await authApi.changePassword(payload);
    return {
      success: true,
      message: res.message || 'Đổi mật khẩu thành công!',
    };
  },

  // Phương thức tiếng Anh
  async getProfile(): Promise<User | null> {
    return this.layThongTinTaiKhoan();
  },

  async updateProfile(payload: UpdateUserProfilePayload): Promise<User> {
    return this.capNhatHoSo(payload);
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> {
    return this.doiMatKhau(payload);
  },
};

export const accountService = dichVuTaiKhoan;
export default dichVuTaiKhoan;
