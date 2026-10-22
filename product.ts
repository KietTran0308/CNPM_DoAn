/**
 * =====================================================================
 * ĐỊNH NGHĨA KIỂU DỮ LIỆU SẢN PHẨM (PRODUCT TYPES)
 * =====================================================================
 * Chứa các interface/type cho Product, Size, Topping và danh mục sản phẩm.
 * Re-export từ types/index.ts để dùng chung toàn ứng dụng.
 */

// ---------------------------------------------------------------
// 1. DANH MỤC SẢN PHẨM
// ---------------------------------------------------------------

/** Các danh mục sản phẩm được hỗ trợ */
export type ProductCategory =
  | 'coffee_viet'
  | 'coffee_machine'
  | 'tea'
  | 'bakery'
  | 'ice_cream';

/** Tên hiển thị tiếng Việt cho từng danh mục */
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  coffee_viet: 'Cà phê Việt Nam',
  coffee_machine: 'Cà phê pha máy',
  tea: 'Trà & Trà sữa',
  bakery: 'Bánh ngọt & Bánh mì',
  ice_cream: 'Kem Gelato thủ công',
};

// ---------------------------------------------------------------
// 2. SIZE (KÍCH THƯỚC)
// ---------------------------------------------------------------

/** ID kích thước: S (nhỏ), M (vừa), L (lớn) */
export type SizeId = 'S' | 'M' | 'L';

/** Một lựa chọn kích thước đồ uống */
export interface Size {
  /** Mã kích thước: 'S' | 'M' | 'L' */
  id: SizeId;
  /** Tên hiển thị, ví dụ: "Nhỏ (S)" */
  name: string;
  /** Thể tích, ví dụ: "250ml" */
  volume: string;
  /** Giá thêm so với giá gốc (đồng) */
  extraPrice: number;
}

// Alias tương thích với types/index.ts
export type SizeOption = Size;

// ---------------------------------------------------------------
// 3. TOPPING
// ---------------------------------------------------------------

/** Một topping có thể thêm vào đồ uống */
export interface Topping {
  /** Mã topping, ví dụ: 'pearl', 'coconut_jelly' */
  id: string;
  /** Tên hiển thị, ví dụ: "Trân châu đen" */
  name: string;
  /** Giá topping (đồng) */
  price: number;
}

// Alias tương thích với types/index.ts
export type ToppingOption = Topping;

// ---------------------------------------------------------------
// 4. SẢN PHẨM (PRODUCT)
// ---------------------------------------------------------------

/** Thông tin đầy đủ của một sản phẩm trên thực đơn */
export interface Product {
  /** Mã sản phẩm (code từ DB, ví dụ: 'vn-1', 'tea-2') */
  id: string;
  /** Tên sản phẩm */
  name: string;
  /** Danh mục (category key) */
  category: ProductCategory;
  /** Tên danh mục hiển thị tiếng Việt */
  categoryName: string;
  /** Mô tả ngắn hiển thị trong card */
  sectionCaption?: string;
  /** Mô tả chi tiết */
  description: string;
  /** Giá cơ bản (size S, không topping) - đơn vị: đồng */
  basePrice: number;
  /** Đường dẫn ảnh sản phẩm */
  image: string;
  /** Đánh dấu món bán chạy */
  isPopular?: boolean;
  /** Số calo (nếu có) */
  calories?: number;
  /** Nhãn tìm kiếm bổ sung */
  tags?: string[];
}

// ---------------------------------------------------------------
// 5. RESPONSE TỪNG SẢN PHẨM TỪ API
// ---------------------------------------------------------------

/** Cấu trúc raw trả về từ GET /products hoặc GET /products/:code */
export interface ProductApiResponse {
  id?: string | number;
  code?: string;
  name: string;
  category?: string;
  categoryName?: string;
  sectionCaption?: string;
  description?: string;
  price?: string | number;
  basePrice?: string | number;
  imageUrl?: string;
  image?: string;
  isPopular?: boolean;
  isActive?: boolean;
  calories?: number;
}

// ---------------------------------------------------------------
// 6. OPTIONS API (SIZES + TOPPINGS TỪ BACKEND)
// ---------------------------------------------------------------

/** Response của GET /products/options */
export interface ProductOptionsResponse {
  sizes: Array<{
    id: string;
    size: string;
    extraPrice: string | number;
  }>;
  toppings: Array<{
    id?: string;
    code?: string;
    name: string;
    price: string | number;
    isActive?: boolean;
  }>;
}

// ---------------------------------------------------------------
// 7. ALIAS TIẾNG VIỆT
// ---------------------------------------------------------------

export type SanPham = Product;
export type KichThuoc = Size;
export type TuyChonTopping = Topping;
