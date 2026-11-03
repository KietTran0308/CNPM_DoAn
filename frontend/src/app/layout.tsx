import type { Metadata } from 'next';
import { LOGO, BACKGROUND } from '../hinhAnh';
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
      <body
        style={{
          backgroundImage: `url('${BACKGROUND}')`,
          backgroundSize: '100% auto',
          backgroundPosition: 'top center',
          backgroundRepeat: 'repeat-y',
        }}
        className="w-full min-h-screen antialiased bg-[#124E35] text-neutral-900 selection:bg-[#124E35] selection:text-[#F5F0E1]"
      >
        {children}
      </body>
    </html>
  );
}

