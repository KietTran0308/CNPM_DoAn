import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dichVuTaiKhoan } from '../services/dich-vu-tai-khoan';
import { User, UpdateUserProfilePayload, ChangePasswordPayload } from '../types';
import { useTaiKhoanStore } from '../stores/tai-khoan-store';
import { useGiaoDienStore } from '../stores/giao-dien-store';

export const KHOA_TRUY_VAN_TAI_KHOAN = {
  all: ['tai-khoan'] as const,
  hoSo: () => [...KHOA_TRUY_VAN_TAI_KHOAN.all, 'ho-so'] as const,
};

export const ACCOUNT_KEYS = KHOA_TRUY_VAN_TAI_KHOAN;

/**
 * Hook quản lý thông tin tài khoản thành viên với React Query & Zustand
 */
export const useDungTaiKhoan = () => {
  const queryClient = useQueryClient();
  const authUser = useTaiKhoanStore((state) => state.user);
  const setUserStore = useTaiKhoanStore((state) => state.setUser);
  const logoutStore = useTaiKhoanStore((state) => state.logout);
  const redeemPointsStore = useTaiKhoanStore((state) => state.redeemPoints);
  const showToast = useGiaoDienStore((state) => state.showToast);

  // 1. Truy vấn thông tin người dùng qua React Query
  const {
    data: user = authUser,
    isLoading,
    isError,
    error,
    refetch: refetchAccount,
  } = useQuery<User | null>({
    queryKey: KHOA_TRUY_VAN_TAI_KHOAN.hoSo(),
    queryFn: dichVuTaiKhoan.layThongTinTaiKhoan,
    initialData: authUser,
    staleTime: 1000 * 60 * 5,
  });

  // 2. Mutation cập nhật thông tin hồ sơ
  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateUserProfilePayload) => dichVuTaiKhoan.capNhatHoSo(payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User | null>(KHOA_TRUY_VAN_TAI_KHOAN.hoSo(), updatedUser);
      setUserStore(updatedUser);
      showToast('Thông tin tài khoản đã được cập nhật thành công!', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.', 'error');
    },
  });

  // 3. Mutation đổi mật khẩu
  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) => dichVuTaiKhoan.doiMatKhau(payload),
    onSuccess: (res) => {
      showToast(res.message, 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin.', 'error');
    },
  });

  const updateProfile = async (payload: UpdateUserProfilePayload) => {
    return await updateProfileMutation.mutateAsync(payload);
  };

  const changePassword = async (payload: ChangePasswordPayload) => {
    return await changePasswordMutation.mutateAsync(payload);
  };

  return {
    user: authUser ?? user,
    isLoading,
    isError,
    error,
    refetchAccount,
    updateProfile,
    changePassword,
    logout: logoutStore,
    redeemPoints: redeemPointsStore,
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
  };
};

export const useAccount = useDungTaiKhoan;
export default useDungTaiKhoan;
