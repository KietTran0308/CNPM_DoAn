'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body className="antialiased bg-stone-50 min-h-screen text-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white border border-neutral-200/80 rounded-xl p-6 text-center space-y-3 max-w-sm w-full">
          <h2 className="text-base font-bold text-neutral-900">Đã xảy ra sự cố!</h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
