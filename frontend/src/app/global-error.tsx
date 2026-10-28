'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body className="antialiased bg-stone-100 min-h-screen text-black flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <h2 className="text-base font-bold">Đã xảy ra sự cố!</h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-emerald-800 text-white rounded text-sm font-medium"
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
