/**
 * =====================================================================
 * PRODUCT API SERVICE — product.api.ts
 * =====================================================================
 * Cung cấp các hàm gọi API cho sản phẩm:
 *   - getProducts()      → GET /products       (danh sách tất cả sản phẩm)
 *   - getProductById()   → GET /products/:id   (chi tiết một sản phẩm)
 *   - getProductOptions()→ GET /products/options (sizes & toppings từ DB)
 *
 * Tự động chuyển đổi dữ liệu backend → Product frontend.
 * Hỗ trợ chế độ mock (NEXT_PUBLIC_USE_MOCK_API=true).
 */

import type { Product, ProductApiResponse, ProductOptionsResponse, Size, Topping } from '../types/product';

// ---------------------------------------------------------------
// 1. CẤU HÌNH API
// ---------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

/** Giá trị thay thế mặc định khi ảnh bị lỗi */
const FALLBACK_IMAGE = '/artisan_hero_food_1791967258188.jpg';

// ---------------------------------------------------------------
// 2. HELPER: FETCH CÓ XỬ LÝ LỖI
// ---------------------------------------------------------------

async function apiFetch<T>(path: string): Promise<T> {
  let response: Response;
  try {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('brewlite_auth_token')
      : null;

    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    response = await fetch(`${BASE_URL}${path}`, {
      headers,
      cache: 'no-store',
    });
  } catch {
    throw new Error(
      `Không kết nối được backend tại ${BASE_URL}. ` +
      `Kiểm tra server hoặc bật NEXT_PUBLIC_USE_MOCK_API=true.`
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message || `Lỗi API: HTTP ${response.status}`
    );
  }

  return body as T;
}

// ---------------------------------------------------------------
// 3. MAPPING: RAW API → PRODUCT
// ---------------------------------------------------------------

/**
 * Chuyển đổi dữ liệu thô từ backend thành đối tượng Product chuẩn.
 * Backend dùng `code` làm định danh (ví dụ: 'vn-1'), frontend dùng `id`.
 */
export function mapProductFromApi(raw: ProductApiResponse): Product {
  const CATEGORY_NAMES: Record<string, string> = {
    coffee_viet: 'Cà phê Việt Nam',
    coffee_machine: 'Cà phê pha máy',
    tea: 'Trà & Trà sữa',
    bakery: 'Bánh ngọt & Bánh mì',
    ice_cream: 'Kem Gelato thủ công',
  };

  const category = (raw.category || 'coffee_viet') as Product['category'];

  // Chuẩn hóa đường dẫn ảnh
  const rawImage = raw.imageUrl ?? raw.image ?? FALLBACK_IMAGE;
  const image = String(rawImage).replace('/src/assets/images/', '/images/');

  return {
    id: String(raw.code ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    category,
    categoryName: raw.categoryName ?? CATEGORY_NAMES[category] ?? 'Khác',
    sectionCaption: raw.sectionCaption,
    description: raw.description ?? '',
    basePrice: Number(raw.price ?? raw.basePrice ?? 0),
    image: image || FALLBACK_IMAGE,
    isPopular: raw.isPopular ?? false,
    calories: raw.calories,
  };
}

// ---------------------------------------------------------------
// 4. MOCK DATA (dùng khi NEXT_PUBLIC_USE_MOCK_API=true)
// ---------------------------------------------------------------

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'vn-1',
    name: 'Cà phê đen đá',
    category: 'coffee_viet',
    categoryName: 'Cà phê Việt Nam',
    description: 'Robusta mộc truyền thống, đậm đà và sảng khoái',
    basePrice: 29000,
    image: FALLBACK_IMAGE,
    isPopular: true,
  },
  {
    id: 'vn-2',
    name: 'Cà phê sữa đá',
    category: 'coffee_viet',
    categoryName: 'Cà phê Việt Nam',
    description: 'Sữa đặc nguyên chất hòa quyện với cà phê Robusta',
    basePrice: 35000,
    image: FALLBACK_IMAGE,
    isPopular: true,
  },
  {
    id: 'tea-1',
    name: 'Trà đào cam sả',
    category: 'tea',
    categoryName: 'Trà & Trà sữa',
    description: 'Trà xanh tươi kết hợp đào mọng nước và cam sả thơm',
    basePrice: 45000,
    image: FALLBACK_IMAGE,
    isPopular: true,
  },
  {
    id: 'bakery-1',
    name: 'Croissant bơ Pháp',
    category: 'bakery',
    categoryName: 'Bánh ngọt & Bánh mì',
    description: 'Bánh sừng bò nướng giòn, thơm bơ Anchor nguyên chất',
    basePrice: 39000,
    image: FALLBACK_IMAGE,
  },
];

// ---------------------------------------------------------------
// 5. PUBLIC API FUNCTIONS
// ---------------------------------------------------------------

/**
 * Lấy toàn bộ danh sách sản phẩm đang hoạt động.
 * Tương ứng: GET /products
 */
export async function getProducts(): Promise<Product[]> {
  if (USE_MOCK) {
    // Giả lập độ trễ mạng
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_PRODUCTS;
  }

  const raw = await apiFetch<ProductApiResponse[]>('/products');
  return Array.isArray(raw) ? raw.map(mapProductFromApi) : [];
}

/**
 * Lấy chi tiết một sản phẩm theo mã (code).
 * Tương ứng: GET /products/:code
 *
 * @param id - Mã sản phẩm (ví dụ: 'vn-1', 'tea-2')
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
  }

  try {
    const raw = await apiFetch<ProductApiResponse>(`/products/${encodeURIComponent(id)}`);
    return mapProductFromApi(raw);
  } catch {
    return null;
  }
}

/**
 * Lấy danh sách sizes và toppings từ backend.
 * Tương ứng: GET /products/options
 */
export async function getProductOptions(): Promise<{
  sizes: Size[];
  toppings: Topping[];
}> {
  if (USE_MOCK) {
    return {
      sizes: [
        { id: 'S', name: 'Nhỏ (S)', volume: '250ml', extraPrice: 0 },
        { id: 'M', name: 'Vừa (M)', volume: '350ml', extraPrice: 5000 },
        { id: 'L', name: 'Lớn (L)', volume: '500ml', extraPrice: 10000 },
      ],
      toppings: [
        { id: 'pearl', name: 'Trân châu đen', price: 10000 },
        { id: 'coconut_jelly', name: 'Thạch dừa', price: 8000 },
        { id: 'grass_jelly', name: 'Thạch cà phê', price: 8000 },
        { id: 'aloe', name: 'Lô hội', price: 10000 },
        { id: 'cream_cheese', name: 'Kem phô mai', price: 15000 },
      ],
    };
  }

  const raw = await apiFetch<ProductOptionsResponse>('/products/options');

  const sizes: Size[] = (raw.sizes ?? []).map((s) => ({
    id: (s.id || s.size || 'S') as 'S' | 'M' | 'L',
    name: s.size === 'S' ? 'Nhỏ (S)' : s.size === 'M' ? 'Vừa (M)' : 'Lớn (L)',
    volume: s.size === 'S' ? '250ml' : s.size === 'M' ? '350ml' : '500ml',
    extraPrice: Number(s.extraPrice ?? 0),
  }));

  const toppings: Topping[] = (raw.toppings ?? [])
    .filter((t) => t.isActive !== false)
    .map((t) => ({
      id: String(t.code ?? t.id ?? ''),
      name: String(t.name ?? ''),
      price: Number(t.price ?? 0),
    }));

  return { sizes, toppings };
}

// ---------------------------------------------------------------
// 6. OBJECT-STYLE EXPORT (tương thích với code cũ)
// ---------------------------------------------------------------

/** API sản phẩm theo dạng object (dùng như dichVuSanPham) */
export const productApi = {
  /** GET /products — Lấy tất cả sản phẩm */
  getProducts,
  /** GET /products/:id — Lấy chi tiết sản phẩm */
  getProductById,
  /** GET /products/options — Lấy sizes & toppings */
  getProductOptions,
};

export default productApi;
