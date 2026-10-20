import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dichVuDiemThuong } from '../services/dich-vu-diem-thuong';
import { useTaiKhoanStore } from '../stores/tai-khoan-store';
import { useGiaoDienStore } from '../stores/giao-dien-store';

export const KHOA_TRUY_VAN_DIEM_THUONG = {
  all: ['diem-thuong'] as const,
  lichSu: () => [...KHOA_TRUY_VAN_DIEM_THUONG.all, 'lich-su'] as const,
  phanThuong: () => [...KHOA_TRUY_VAN_DIEM_THUONG.all, 'phan-thuong'] as const,
};

/**
 * Hook quản lý điểm thưởng và đổi quà bằng React Query
 */
export const useDungDiemThuong = () => {
  const queryClient = useQueryClient();
  const user = useTaiKhoanStore((state) => state.user);
  const showToast = useGiaoDienStore((state) => state.showToast);

  // 1. Lấy lịch sử giao dịch điểm
  const {
    data: history = [],
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: KHOA_TRUY_VAN_DIEM_THUONG.lichSu(),
    queryFn: dichVuDiemThuong.layLichSuGiaoDich,
  });

  // 2. Lấy danh mục phần thưởng có thể đổi
  const { data: rewards = [] } = useQuery({
    queryKey: KHOA_TRUY_VAN_DIEM_THUONG.phanThuong(),
    queryFn: dichVuDiemThuong.layDanhMucPhanThuong,
  });

  // 3. Mutation đổi điểm nhận voucher
  const redeemMutation = useMutation({
    mutationFn: (rewardId: string) => dichVuDiemThuong.doiPhanThuongTheoId(rewardId),
    onSuccess: (res) => {
      if (res.success) {
        showToast(res.message, 'success');
        queryClient.invalidateQueries({ queryKey: KHOA_TRUY_VAN_DIEM_THUONG.lichSu() });
      } else {
        showToast(res.message, 'error');
      }
    },
    onError: (err: any) => {
      showToast(err.message || 'Lỗi khi đổi điểm thưởng', 'error');
    },
  });

  const doiPhanThuong = async (rewardId: string) => {
    return await redeemMutation.mutateAsync(rewardId);
  };

  return {
    currentPoints: user?.loyaltyPoints || 0,
    membershipTier: user?.membershipTier || 'Standard',
    history,
    rewards,
    isLoadingHistory,
    refetchHistory,
    doiPhanThuong,
    isRedeeming: redeemMutation.isPending,
  };
};

export default useDungDiemThuong;
