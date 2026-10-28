import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-100 text-black">
      <div className="text-center space-y-3">
        <h2 className="text-xl font-bold">404 - Không tìm thấy trang</h2>
        <p className="text-sm text-stone-600">Trang bạn yêu cầu không tồn tại.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-emerald-800 text-white rounded text-sm font-medium"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
