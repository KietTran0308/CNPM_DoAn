/**
 * Trang chủ Brew Lite — Hiển thị Menu đồ uống
 *
 * Server Component: export metadata SEO.
 * Render BrewLiteClientRoot (Client Component) để lazy-load App
 * với ssr: false, tránh lỗi hydration do context/localStorage.
 * Component MenuPage (trong App) tự động gọi API và hiển thị sản phẩm.
 */
import type { Metadata } from 'next';
import BrewLiteClientRoot from './BrewLiteClientRoot';

export const metadata: Metadata = {
  title: 'Brew Lite — Thực đơn đồ uống & bánh ngọt',
  description:
    'Khám phá thực đơn cà phê Việt Nam, trà sữa, kem Gelato và bánh ngọt tươi tại Brew Lite. Đặt hàng trực tuyến, nhận tại quầy nhanh chóng.',
  keywords: ['cà phê', 'trà sữa', 'bánh ngọt', 'kem gelato', 'brew lite', 'thực đơn'],
  openGraph: {
    title: 'Brew Lite — Thực đơn đồ uống & bánh ngọt',
    description: 'Cà phê mộc, trà trái cây, bánh nướng thơm & kem Gelato mịn mát.',
    type: 'website',
  },
};



/**
 * Trang chủ — Entry point của ứng dụng.
 * Menu sản phẩm được hiển thị bên trong App → MenuPage.
 */
export default function Home() {
  return <BrewLiteClientRoot />;
}
