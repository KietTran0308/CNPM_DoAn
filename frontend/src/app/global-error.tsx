'use client';

import { BACKGROUND } from '../hinhAnh';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
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
        className="antialiased bg-[#124E35] min-h-screen text-neutral-900 flex items-center justify-center p-4"
      >
        <div className="bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl p-6 text-center space-y-3 max-w-sm w-full">
          <h2 className="text-base font-bold text-[#124E35]">Đã xảy ra sự cố</h2>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2.5 bg-[#124E35] hover:opacity-95 text-[#F5F0E1] rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
