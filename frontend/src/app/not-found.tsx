import Link from 'next/link';
import { BACKGROUND } from '../hinhAnh';

export default function NotFound() {
  return (
    <div
      style={{
        backgroundImage: `url('${BACKGROUND}')`,
        backgroundSize: '100% auto',
        backgroundPosition: 'top center',
        backgroundRepeat: 'repeat-y',
      }}
      className="min-h-screen flex items-center justify-center p-4 bg-[#124E35] text-neutral-900"
    >
      <div className="bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl p-6 text-center space-y-3 max-w-sm w-full">
        <h2 className="text-xl font-bold text-[#124E35]">404 - Không tìm thấy trang</h2>
        <p className="text-sm text-neutral-600">Trang bạn yêu cầu không tồn tại.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2.5 bg-[#124E35] hover:opacity-95 text-[#F5F0E1] rounded-lg text-sm font-semibold transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
