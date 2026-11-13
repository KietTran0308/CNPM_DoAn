'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../api';
import { MaQrZalopay } from '../../man-hinh/MaQrZalopay';
import { useGioHang } from '../../store/useGioHang';

type ViewState = 'loading' | 'pending' | 'paid' | 'failed' | 'reconciliation' | 'error';

export default function ZalopayQrPage() {
  const [state, setState] = useState<ViewState>('loading');
  const [qr, setQr] = useState<string | null>(null);
  const [message, setMessage] = useState('Đang lấy mã QR của giao dịch từ Backend...');
  const [expiry, setExpiry] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const clearCart = useGioHang(s => s.clearCart);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('orderId');
    if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
      setState('error'); setMessage('Thiếu mã đơn hàng hợp lệ. Hãy mở lại lịch sử đơn.');
      return;
    }
    let stopped = false;
    let checking = false;
    const check = async () => {
      if (stopped || checking) return;
      checking = true;
      try {
        const result = await api.getZalopayStatus(orderId);
        if (stopped) return;
        setExpiry(result.expiresAt || null);
        if (['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(result.orderStatus)) {
          setQr(null); setState('paid');
          setMessage('Thanh toán đã được Backend xác nhận thành công.');
          sessionStorage.removeItem('brewlite_create_key');
          sessionStorage.removeItem('brewlite_zalopay_order');
          clearCart();
          return;
        }
        if (result.requiresReconciliation || result.payment?.status === 'SUCCESS') {
          setQr(null); setState('reconciliation');
          setMessage('ZaloPay có thể đã nhận tiền nhưng đơn chưa hoàn tất. Liên hệ ADMIN đối soát, không thanh toán lại.');
          return;
        }
        if (result.payment?.status === 'FAILED') {
          setQr(null); setState('failed');
          setMessage('Giao dịch đã được hệ thống xác nhận thất bại. Hãy xem lịch sử đơn.');
          return;
        }
        if (result.orderStatus === 'CANCELLED' || result.orderStatus === 'PAYMENT_FAILED') {
          setQr(null); setState('reconciliation');
          setMessage('Đơn không còn chờ thanh toán. Hãy kiểm tra lịch sử đơn và đối soát giao dịch cũ.');
          return;
        }
        if (result.payment?.status === 'PENDING' && result.payment.method === 'ZALOPAY') {
          const expired = result.expiresAt && Date.parse(result.expiresAt) <= Date.now();
          if (expired || result.awaitingGateway) {
            setQr(null); setState('reconciliation');
            setMessage('Giao dịch đã hết thời gian thanh toán hoặc quá hạn xác nhận. Không quét tiếp và không tạo giao dịch khác; yêu cầu ADMIN đối soát.');
            return;
          }
          if (result.payment.qrCode) {
            setQr(result.payment.qrCode); setUrl(result.payment.paymentUrl || null);
            setState('pending');
            setMessage('Dùng ứng dụng ZaloPay hoặc ngân hàng hỗ trợ để quét QR. Không quét lại sau khi đã trả tiền.');
            return;
          }
          if (result.payment.paymentUrl) {
            setUrl(result.payment.paymentUrl); setQr(null); setState('pending');
            setMessage('Giao dịch có đường dẫn thanh toán ZaloPay, chưa có QR.');
            return;
          }
          setQr(null); setState('reconciliation');
          setMessage('Giao dịch đã tạo nhưng không lưu QR/URL. Cần ADMIN đối soát, không tạo giao dịch mới.');
          return;
        }
        setQr(null); setState('reconciliation');
        setMessage('Không tìm thấy giao dịch QR đang chờ thanh toán. Hãy kiểm tra lịch sử đơn.');
      } catch (error: unknown) {
        if (stopped) return;
        setMessage(error instanceof Error ? error.message : 'Không thể kết nối Backend để kiểm tra trạng thái.');
        setState('error');
      } finally { checking = false; }
    };
    void check();
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void check(); }, 5000);
    return () => { stopped = true; window.clearInterval(interval); };
  }, [clearCart]);

  useEffect(() => {
    if (!expiry || state !== 'pending') return;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((Date.parse(expiry) - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [expiry, state]);

  return <main className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-4 text-[#124E35]">
    <section className="w-full max-w-lg space-y-4 rounded-2xl border border-[#DDD3BD] bg-white p-6 shadow-lg text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#124E35] text-white text-xl font-bold">B</div>
      <h1 className="text-2xl font-bold">Quét mã QR ZaloPay</h1>
      <p aria-live="polite" className="text-sm text-neutral-700">{message}</p>
      {state === 'loading' && <p>Đang xác minh giao dịch...</p>}
      {state === 'pending' && qr && <MaQrZalopay value={qr} />}
      {state === 'pending' && secondsLeft !== null && <p className="text-sm font-semibold">
        Thời gian còn lại: {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
      </p>}
      {state === 'pending' && url && <a href={url} className="inline-block rounded-lg border border-[#124E35] px-4 py-2">Mở ZaloPay bằng liên kết</a>}
      {state === 'pending' && <p className="text-xs text-neutral-500">Trang tự kiểm tra kết quả khoảng 5 giây/lần. Chỉ callback/đối soát đã xác thực mới được cập nhật đơn hàng.</p>}
      {state === 'paid' && <p className="font-semibold text-green-700">Đã thanh toán thành công</p>}
      {['failed', 'error', 'reconciliation'].includes(state) && <p className="text-sm text-amber-800">Nếu đã trả tiền, không thực hiện lại; liên hệ cửa hàng để đối soát.</p>}
      <Link href="/" className="inline-block rounded-xl bg-[#124E35] px-5 py-3 font-medium text-white">Về BrewLite / Lịch sử đơn</Link>
    </section>
  </main>;
}
