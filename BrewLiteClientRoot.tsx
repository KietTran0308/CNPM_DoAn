'use client';

/**
 * BrewLiteClientRoot — Client Component wrapper
 *
 * Dùng dynamic import với ssr: false để tránh lỗi hydration
 * khi App dùng localStorage, window, Zustand, Context, v.v.
 * Phải là 'use client' mới được dùng next/dynamic với ssr: false.
 */
import dynamic from 'next/dynamic';

const BrewLiteApp = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Đang tải ứng dụng"
      className="min-h-screen grid place-items-center bg-[#FAF9F5]"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-10 h-10 rounded-full border-4 border-[#145C4B]/20 border-t-[#145C4B] animate-spin" />
        <p className="text-sm font-semibold text-[#145C4B] tracking-wide">
          Đang tải Brew Lite...
        </p>
      </div>
    </div>
  ),
});

export default function BrewLiteClientRoot() {
  return <BrewLiteApp />;
}
