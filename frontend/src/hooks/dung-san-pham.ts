import { useQuery } from '@tanstack/react-query';
import { dichVuSanPham } from '../services/dich-vu-san-pham';
import { Product } from '../types';

export const KHOA_TRUY_VAN_SAN_PHAM = {
  all: ['san-pham'] as const,
  danhSach: () => [...KHOA_TRUY_VAN_SAN_PHAM.all, 'danh-sach'] as const,
  chiTiet: (id: string) => [...KHOA_TRUY_VAN_SAN_PHAM.all, 'chi-tiet', id] as const,
  danhMuc: () => [...KHOA_TRUY_VAN_SAN_PHAM.all, 'danh-muc'] as const,
};

export const PRODUCT_KEYS = KHOA_TRUY_VAN_SAN_PHAM;

/**
 * Hook truy vấn danh sách sản phẩm và danh mục bằng React Query
 */
export const useDungSanPham = () => {
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Product[]>({
    queryKey: KHOA_TRUY_VAN_SAN_PHAM.danhSach(),
    queryFn: () => dichVuSanPham.layDanhSachSanPham(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: categories = [] } = useQuery({
    queryKey: KHOA_TRUY_VAN_SAN_PHAM.danhMuc(),
    queryFn: () => dichVuSanPham.layDanhMucSanPham(),
    staleTime: 1000 * 60 * 10,
  });

  return {
    products: (products || []) as Product[],
    categories,
    isLoading,
    isError,
    error,
    refetch,
  };
};

/**
 * Hook truy vấn chi tiết một món đồ uống
 */
export const useDungChiTietSanPham = (productId: string | null) => {
  return useQuery({
    queryKey: KHOA_TRUY_VAN_SAN_PHAM.chiTiet(productId || ''),
    queryFn: () => (productId ? dichVuSanPham.layChiTietSanPham(productId) : null),
    enabled: !!productId,
  });
};

export const useProducts = useDungSanPham;
export const useProductDetail = useDungChiTietSanPham;
export default useDungSanPham;
