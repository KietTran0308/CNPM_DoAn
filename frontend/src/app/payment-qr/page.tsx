'use client';

// Tương thích URL cũ: không hiển thị QR ở một trang riêng nữa.
import { useEffect } from 'react';
import Link from 'next/link';

export default function LegacyZalopayQrPage() {
    useEffect(() => {
        const orderId = new URLSearchParams(window.location.search).get('orderId');
        const target = orderId && /^[0-9a-f-]{36}$/i.test(orderId)
            ? `/?resumeZalopay=${encodeURIComponent(orderId)}` : '/';
        window.location.replace(target);
    }, []);
    return <main className="min-h-screen flex items-center justify-center bg-[#FBF9F5] p-6">
        <div className="text-center space-y-3 text-[#124E35]">
            <p>Mã QR hiện được hiển thị trực tiếp trong màn hình Thanh toán.</p>
            <Link href="/" className="font-semibold underline">Quay về BrewLite</Link>
        </div>
    </main>;
}
