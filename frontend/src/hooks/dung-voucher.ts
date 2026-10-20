import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dichVuVoucher } from '../services/dich-vu-voucher';
import { useGioHangStore } from '../stores/gio-hang-store';
import { useGiaoDienStore } from '../stores/giao-dien-store';

export const KHOA_TRUY_VAN_VOUCHER = {
  all: ['voucher'] as const,
  khoVoucher: () => [...KHOA_TRUY_VAN_VOUCHER.all, 'kho-voucher'] as const,
};

/**
 * Hook quản lý kho phiếu giảm giá bằng React Query
 */
export const useDungVoucher = () => {
  const queryClient = useQueryClient();
  const applyVoucherToCart = useGioHangStore((state) => state.applyVoucher);
  const currentVoucherCode = useGioHangStore((state) => state.voucherCode);
  const openCart = useGiaoDienStore((state) => state.openCart);
  const showToast = useGiaoDienStore((state) => state.showToast);

  const {
    data: vouchers = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: KHOA_TRUY_VAN_VOUCHER.khoVoucher(),
    queryFn: dichVuVoucher.layDanhSachVoucher,
    staleTime: 1000 * 60 * 3,
  });

  const suDungVoucher = (code: string) => {
    const result = applyVoucherToCart(code);
    if (result.success) {
      showToast(result.message, 'success');
      openCart();
    } else {
      showToast(result.message, 'error');
    }
    return result;
  };

  return {
    vouchers,
    isLoading,
    refetch,
    currentVoucherCode,
    suDungVoucher,
  };
};

export default useDungVoucher;
