import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewLite - Ứng dụng đặt cà phê không dùng tiền mặt',
  description:
    'BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.',
  openGraph: {
    title: 'BrewLite - Ứng dụng đặt cà phê không dùng tiền mặt',
    description:
      'BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased bg-stone-100 min-h-screen text-black">
        {children}
      </body>
    </html>
  );
}
