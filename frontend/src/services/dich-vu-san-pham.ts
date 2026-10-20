/**
 * =====================================================================
 * DỊCH VỤ SẢN PHẨM & THỰC ĐƠN (MENU SERVICE VIA REAL SQL API)
 * =====================================================================
 * Gọi trực tiếp API Backend /api/menu kết nối bảng SQL menu_items.
 */

import { Product } from '../types';
import { menuApi } from './api';

export interface ThongTinDanhMuc {
  id: string;
  name: string;
  count: number;
}

export type CategoryInfo = ThongTinDanhMuc;

export const dichVuSanPham = {
  /**
   * Lấy toàn bộ danh sách sản phẩm từ SQL Database qua API
   */
  async layDanhSachSanPham(category?: string, search?: string): Promise<Product[]> {
    try {
      const data = await menuApi.getMenu(category, search);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('[Menu Service] Fetch from SQL failed:', err);
      throw err;
    }
  },

  /**
   * Lấy chi tiết món theo mã định danh (id)
   */
  async layChiTietSanPham(id: string): Promise<Product | null> {
    try {
      const item = await menuApi.getById(id);
      return item;
    } catch {
      return null;
    }
  },

  /**
   * Lấy danh mục sản phẩm kèm số lượng món
   */
  async layDanhMucSanPham(): Promise<ThongTinDanhMuc[]> {
    const list = await this.layDanhSachSanPham();
    const categoryMap = new Map<string, { name: string; count: number }>();

    list.forEach((product) => {
      const existing = categoryMap.get(product.category);
      if (existing) {
        existing.count += 1;
      } else {
        categoryMap.set(product.category, {
          name: product.categoryName,
          count: 1,
        });
      }
    });

    return Array.from(categoryMap.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      count: info.count,
    }));
  },

  async getProducts(): Promise<Product[]> {
    return this.layDanhSachSanPham();
  },

  async getProductById(id: string): Promise<Product | null> {
    return this.layChiTietSanPham(id);
  },
};

export const productService = dichVuSanPham;
export default dichVuSanPham;
