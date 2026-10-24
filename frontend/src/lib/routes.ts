/**
 * Bảng route của app (SPA chạy trong Next App Router).
 * Dùng chung cho: khởi tạo màn hình (giao-dien-store), nút Back/Forward (AppContext)
 * và các file app/orders/page.tsx, app/orders/[id]/page.tsx.
 */
export type ScreenId =
  | 'menu' | 'cart' | 'checkout' | 'confirmation' | 'orders' | 'account' | 'rewards' | 'vouchers';

const STATIC_PATHS: Record<Exclude<ScreenId, 'confirmation'>, string> = {
  menu: '/',
  cart: '/',
  checkout: '/thanh-toan',
  orders: '/orders', // Lịch sử đơn
  account: '/tai-khoan',
  rewards: '/diem-thuong',
  vouchers: '/uu-dai',
};

/** Đường dẫn của một màn hình. Màn xác nhận có id đơn → /orders/<id>. */
export const pathForScreen = (screen: ScreenId, orderId?: string | null): string => {
  if (screen === 'confirmation') return orderId ? `/orders/${encodeURIComponent(orderId)}` : '/orders';
  return STATIC_PATHS[screen] ?? '/';
};

export interface ParsedRoute {
  screen: ScreenId;
  orderId: string | null;
}

/** Đọc pathname → màn hình + id đơn (nếu có). Vẫn hiểu các URL cũ (/don-hang, /xac-nhan). */
export const parsePath = (pathname: string): ParsedRoute => {
  const path = pathname.replace(/\/+$/, '') || '/';
  const detail = path.match(/^\/orders\/([^/]+)$/);
  if (detail) return { screen: 'confirmation', orderId: decodeURIComponent(detail[1]) };
  switch (path) {
    case '/orders':
    case '/don-hang':
      return { screen: 'orders', orderId: null };
    case '/xac-nhan':
      return { screen: 'confirmation', orderId: null };
    case '/tai-khoan':
      return { screen: 'account', orderId: null };
    case '/diem-thuong':
      return { screen: 'rewards', orderId: null };
    case '/uu-dai':
      return { screen: 'vouchers', orderId: null };
    case '/thanh-toan':
      return { screen: 'checkout', orderId: null };
    default:
      return { screen: 'menu', orderId: null };
  }
};
