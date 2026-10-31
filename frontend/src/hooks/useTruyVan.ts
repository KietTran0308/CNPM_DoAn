import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Product, Order, OrderItem, Payment, OrderStatus } from '../api';

export const QUERY_KEYS = {
  danhSachMon: ['products'] as const,
  chiTietMon: (id: number) => ['product', id] as const,
  lichSuDon: ['orders'] as const,
};

export function useDanhSachMon() {
  return useQuery<Product[]>({
    queryKey: QUERY_KEYS.danhSachMon,
    queryFn: () => api.getProducts(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useChiTietMon(id: number) {
  return useQuery<Product | null>({
    queryKey: QUERY_KEYS.chiTietMon(id),
    queryFn: () => api.getProductById(id),
    enabled: Boolean(id),
  });
}

export function useLichSuDon() {
  return useQuery<Order[]>({
    queryKey: QUERY_KEYS.lichSuDon,
    queryFn: () => api.getMyOrders(),
    staleTime: 1000 * 30,
  });
}

export function useTaoDonHang() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ items, total }: { items: OrderItem[]; total: number }) =>
      api.createOrder(items, total),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lichSuDon });
    },
  });
}

export function useThanhToanDon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentPayload,
      trangThaiKetQua,
    }: {
      paymentPayload: Payment;
      trangThaiKetQua?: OrderStatus;
    }) => api.processPayment(paymentPayload, trangThaiKetQua),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lichSuDon });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.danhSachMon });
    },
  });
}

export function useCapNhatTrangThaiDon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      targetStatus,
    }: {
      orderId: string;
      targetStatus: OrderStatus;
    }) => api.transitionOrderStatus(orderId, targetStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lichSuDon });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.danhSachMon });
    },
  });
}
