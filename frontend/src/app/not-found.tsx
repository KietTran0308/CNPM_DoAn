import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50 text-neutral-900">
      <div className="bg-white border border-neutral-200/80 rounded-xl p-6 text-center space-y-3 max-w-sm w-full">
        <h2 className="text-xl font-bold text-neutral-900">404 - Không tìm thấy trang</h2>
        <p className="text-sm text-neutral-500">Trang bạn yêu cầu không tồn tại.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
