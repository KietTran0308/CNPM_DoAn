import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Khởi tạo QueryClient với cấu hình chuẩn cho ứng dụng đặt đồ uống
export const taoQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 1000 * 60 * 3, // Dữ liệu sản phẩm & chi nhánh tươi trong 3 phút
      },
    },
  });

export const queryClient = taoQueryClient();

interface NhaCungCapTruyVanProps {
  children: ReactNode;
  client?: QueryClient;
}

/**
 * Component Nhà cung cấp truy vấn React Query cho toàn ứng dụng
 */
export const NhaCungCapTruyVan: React.FC<NhaCungCapTruyVanProps> = ({
  children,
  client = queryClient,
}) => {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

export default NhaCungCapTruyVan;
