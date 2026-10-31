import type { Metadata } from 'next';
import { LOGO } from '../hinhAnh';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewLite',
  description: 'Đặt cà phê và trà trực tuyến tại BrewLite',
  icons: {
    icon: LOGO.favicon,
    shortcut: LOGO.favicon,
    apple: LOGO.favicon,
  },
  openGraph: {
    title: 'BrewLite',
    description: 'Đặt cà phê và trà trực tuyến tại BrewLite',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="w-full min-h-screen antialiased bg-stone-50 text-neutral-900 selection:bg-emerald-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
