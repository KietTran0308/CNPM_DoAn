'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../api';
import { useGioHang } from '../../store/useGioHang';

type State = 'checking' | 'paid' | 'failed' | 'unknown';

export default function ZalopayResultPage() {
  const [state, setState] = useState<State>('checking');
  const [message, setMessage] = useState('Đang xác nhận thanh toán với máy chủ...');
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeQr, setResumeQr] = useState<string | null>(null);
  const clearCart = useGioHang(s => s.clearCart);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('orderId');
    if (!orderId) {
      setState('unknown'); setMessage('Thông tin chuyển hướng không hợp lệ. Hãy mở lịch sử đơn để kiểm tra.');
      return;
    }
    let stopped = false;
    let attempts = 0;
    const check = async () => {
      if (stopped) return;
      attempts++;
      try {
        // Chỉ tin trạng thái trong DB sau IPN, không lấy kết quả từ query URL trình duyệt.
        const result = await api.getZalopayStatus(orderId);
        if (stopped) return;
        if (result.orderStatus === 'PAID' || result.orderStatus === 'PREPARING' ||
            result.orderStatus === 'READY' || result.orderStatus === 'COMPLETED') {
          setState('paid');
          setMessage('Đơn hàng đã được hệ thống xác nhận thanh toán thành công.');
          sessionStorage.removeItem('brewlite_create_key');
          sessionStorage.removeItem('brewlite_zalopay_order');
          clearCart();
          return;
        }
        if (result.payment?.status === 'PENDING' && result.payment.method === 'ZALOPAY') {
          setResumeUrl(result.payment.paymentUrl || null);
          setResumeQr(result.payment.qrCode ? orderId : null);
        } else {
          setResumeUrl(null); setResumeQr(null);
        }
        if (result.requiresReconciliation) {
          setState('unknown');
          setMessage('ZaloPay đã báo nhận tiền nhưng cửa hàng chưa hoàn tất đơn. KHÔNG thanh toán lần nữa; hãy liên hệ quản trị viên để đối soát hoặc hoàn tiền.');
          return;
        }
        if (result.payment?.status === 'FAILED') {
          setState('failed'); setMessage('ZaloPay báo giao dịch thất bại. Bạn có thể quay về đơn hàng để thanh toán lại.');
          return;
        }
        if (attempts >= 15) {
          setState('unknown');
          setMessage(result.awaitingGateway
            ? 'Giao dịch ZaloPay đang quá hạn xác nhận. Không thanh toán lại; hãy yêu cầu quản trị viên đối soát.'
            : 'Chưa nhận được callback xác nhận. Không thanh toán lại ngay; hãy kiểm tra lịch sử đơn hoặc liên hệ cửa hàng.');
          return;
        }
      } catch (error) {
        if (attempts >= 15) {
          setState('unknown'); setMessage('Không thể kiểm tra giao dịch. Hãy đăng nhập và xem lịch sử đơn hàng.');
          return;
        }
      }
      if (!stopped) window.setTimeout(check, 2000);
    };
    void check();
    return () => { stopped = true; };
  }, [clearCart]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FBF9F5] p-5">
      <section className="max-w-lg w-full rounded-xl border border-[#DDD3BD] bg-white p-7 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-[#124E35]">Kết quả thanh toán ZaloPay</h1>
        <p className="my-6 text-[#333]">{message}</p>
        {state === 'checking' && <p aria-live="polite">Đang xử lý...</p>}
        {state === 'unknown' && resumeQr && <Link href={`/?resumeZalopay=${encodeURIComponent(resumeQr)}`}
          className="inline-block rounded-lg border border-[#124E35] px-5 py-3 mr-2 text-[#124E35]">
          Về trang Thanh toán để hiện lại QR
        </Link>}
        {state === 'unknown' && !resumeQr && resumeUrl && <a href={resumeUrl}
          className="inline-block rounded-lg border border-[#124E35] px-5 py-3 mr-2 text-[#124E35]">
          Mở lại ZaloPay (cùng giao dịch)
        </a>}
        <Link href="/" className="inline-block rounded-lg bg-[#124E35] px-5 py-3 text-white">
          {state === 'paid' ? 'Về trang chủ' : 'Về BrewLite và xem lịch sử đơn'}
        </Link>
      </section>
    </main>
  );
}
