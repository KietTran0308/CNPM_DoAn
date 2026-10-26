/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Product, Order, OrderItem, Payment, OrderStatus } from '../api';

// Query Keys
export const BREW_KEYS = {
  products: ['products'] as const,
  product: (id: number) => ['product', id] as const,
  orders: ['orders'] as const,
};

// 1. Hook lấy danh sách sản phẩm (GET /products)
export function useProductsQuery() {
  return useQuery<Product[]>({
    queryKey: BREW_KEYS.products,
    queryFn: () => api.getProducts(),
    staleTime: 1000 * 60 * 5, // 5 phút cache
  });
}

// 2. Hook lấy chi tiết 1 sản phẩm (GET /products/:id)
export function useProductQuery(id: number) {
  return useQuery<Product | null>({
    queryKey: BREW_KEYS.product(id),
    queryFn: () => api.getProductById(id),
    enabled: Boolean(id),
  });
}

// 3. Hook lấy lịch sử đơn hàng (GET /orders/me)
export function useOrderHistoryQuery() {
  return useQuery<Order[]>({
    queryKey: BREW_KEYS.orders,
    queryFn: () => api.getMyOrders(),
    staleTime: 1000 * 30, // 30s cache
  });
}

// 4. Mutation tạo đơn hàng mới (POST /orders)
export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ items, total }: { items: OrderItem[]; total: number }) =>
      api.createOrder(items, total),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BREW_KEYS.orders });
    },
  });
}

// 5. Mutation thanh toán (POST /payments)
export function useProcessPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentPayload,
      simulateStatus,
    }: {
      paymentPayload: Payment;
      simulateStatus?: OrderStatus;
    }) => api.processPayment(paymentPayload, simulateStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BREW_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: BREW_KEYS.products });
    },
  });
}

// 6. Mutation chuyển trạng thái đơn hàng (PATCH /orders/:id/status)
export function useTransitionOrderMutation() {
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
      queryClient.invalidateQueries({ queryKey: BREW_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: BREW_KEYS.products });
    },
  });
}
