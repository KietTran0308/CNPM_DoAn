'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getStoredToken, StaffOrder, StockIngredient,
    ReconciliationPayment, formatPrice } from '../../api';

export default function StaffPage() {
    const [role, setRole] = useState('');
    const [orders, setOrders] = useState<StaffOrder[]>([]);
    const [ingredients, setIngredients] = useState<StockIngredient[]>([]);
    const [reconciliation, setReconciliation] = useState<ReconciliationPayment[]>([]);
    const [quantity, setQuantity] = useState<Record<string,string>>({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const refresh = async (asRole = role) => {
        const [queue, stock] = await Promise.all([api.getStaffQueue(), api.getInventory()]);
        setOrders(queue); setIngredients(stock);
        if (asRole === 'ADMIN') setReconciliation(await api.getReconciliationQueue());
    };
    useEffect(() => {
        if (!getStoredToken()) { setError('Vui lòng đăng nhập trên trang chủ trước.'); return; }
        api.getMe().then(user => {
            if (!['STAFF', 'ADMIN'].includes(user.role || '')) {
                setError('Tài khoản không có quyền truy cập.'); return;
            }
            setRole(user.role || '');
            return refresh(user.role);
        }).catch(e => setError(e?.message || 'Không thể xác thực tài khoản'));
    }, []);
    // Đồng bộ queue/kho 15 giây/lần khi tab đang mở, không cần liên tục nhấn nút tải lại.
    useEffect(() => {
        if (!role) return;
        let active = true;
        const timer = window.setInterval(() => {
            if (document.visibilityState !== 'visible' || busy) return;
            Promise.all([api.getStaffQueue(), api.getInventory(),
                ...(role === 'ADMIN' ? [api.getReconciliationQueue()] : [])])
                .then(([queue, stock, payments]) => {
                    if (!active) return;
                    setOrders(queue as StaffOrder[]);
                    setIngredients(stock as StockIngredient[]);
                    if (role === 'ADMIN' && payments) setReconciliation(payments as ReconciliationPayment[]);
                }).catch(() => { /* Không xoá dữ liệu cũ khi lỗi mạng tạm thời. */ });
        }, 15000);
        return () => { active = false; window.clearInterval(timer); };
    }, [role, busy]);

    const updateOrder = async (id: string, status: 'PREPARING' | 'READY' | 'COMPLETED') => {
        setBusy(true);setError('');setNotice('');
        try { await api.updateStaffOrder(id,status); await refresh(); setNotice('Đã cập nhật trạng thái đơn'); }
        catch(e: any){setError(e.message);}finally{setBusy(false);}
    };
    const recheck = async (orderId: string) => {
        setBusy(true); setError(''); setNotice('');
        try {
            const result = await api.recheckZalopay(orderId);
            setNotice(result.message);
            await refresh();
        } catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    };
    const restock = async (id: string) => {
        const value = Number(quantity[id]);
        if (!Number.isFinite(value) || value <= 0) {setError('Nhập số lượng nguyên liệu hợp lệ');return;}
        setBusy(true);setError('');setNotice('');
        try { await api.restockIngredient(id,value,'Nhập kho từ màn hình nhân viên');await refresh();
            setQuantity(q => ({...q,[id]:''}));setNotice('Đã ghi nhận nhập kho và lịch sử biến động'); }
        catch(e: any){setError(e.message);}finally{setBusy(false);}
    };
    return <main className="min-h-screen bg-[#FBF9F5] text-[#124E35] p-6">
        <div className="mx-auto max-w-5xl space-y-6">
            <header className="flex items-center justify-between gap-4">
                <h1 className="font-bold text-2xl">BrewLite · Quầy & kho</h1>
                <Link href="/" className="underline">Quay về trang chủ</Link>
            </header>
            {error && <p role="alert" className="text-red-700">{error}</p>}
            {notice && <p role="status">{notice}</p>}
            {role && <>
                <button type="button" disabled={busy} onClick={() => void refresh().catch(e => setError(e.message))}
                    className="border rounded-lg px-3 py-2">Tải lại dữ liệu</button>
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Hàng đợi chế biến</h2>
                    {orders.length === 0 && <p>Hiện không có đơn chờ xử lý.</p>}
                    {orders.map(o => <article key={o.id} className="border rounded-lg p-4 bg-white space-y-2">
                        <div className="flex justify-between gap-2"><b>Đơn #{o.orderCode}</b>
                            <span>{o.status} · {formatPrice(Number(o.total))}</span></div>
                        <p className="text-sm">{o.orderItems.map(i=>`${i.product.name} × ${i.qty}`).join(', ')}</p>
                        {o.status !== 'READY' && <button type="button" disabled={busy}
                            onClick={() => void updateOrder(o.id,o.status === 'PAID' ? 'PREPARING' : 'READY')}
                            className="bg-[#124E35] text-white rounded-lg py-2 px-4">
                            {o.status === 'PAID' ? 'Bắt đầu pha chế' : 'Đã pha xong'}
                        </button>}
                        {o.status === 'READY' && <button type="button" disabled={busy}
                            onClick={() => void updateOrder(o.id,'COMPLETED')}
                            className="bg-[#124E35] text-white rounded-lg py-2 px-4">Đã phục vụ</button>}
                    </article>)}
                </section>
                <section className="space-y-3"><h2 className="text-lg font-semibold">Tồn kho nguyên liệu</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {ingredients.map(i => <div key={i.id} className="border bg-white rounded-lg p-3 space-y-2">
                            <div className="flex justify-between gap-3"><b>{i.name}</b><span>{i.stockQuantity} {i.unit}</span></div>
                            {i.stockQuantity <= i.minStockQuantity && <span className="text-red-700 text-sm">Cảnh báo tồn thấp</span>}
                            <div className="flex gap-2"><input aria-label={`Số lượng nhập ${i.name}`} type="number" min="0.001" step="0.001"
                                value={quantity[i.id] || ''} onChange={e => setQuantity(s=>({...s,[i.id]:e.target.value}))}
                                className="border rounded-lg px-2 py-1 w-28" placeholder="Số lượng"/>
                                <button type="button" disabled={busy} onClick={() => void restock(i.id)}
                                    className="border rounded-lg px-3 py-1">Nhập kho</button></div>
                        </div>)}
                    </div>
                </section>
                {role === 'ADMIN' && <section className="space-y-2">
                    <h2 className="text-lg font-semibold">Giao dịch ZaloPay cần đối soát</h2>
                    {reconciliation.length === 0 ? <p>Không có giao dịch bất thường trong danh sách.</p> :
                        reconciliation.map(x => <p key={x.id} className="bg-white border rounded-lg p-3">
                            Đơn #{x.order.orderCode} · {formatPrice(Number(x.amount))} · Gateway: {x.status}
                            · Đơn: {x.order.status} · Mã đối soát: {x.providerRef || x.id}
                            {x.method === 'ZALOPAY' ? <button type="button" disabled={busy} onClick={() => void recheck(x.orderId)}
                                className="ml-3 border rounded-lg px-2 py-1">Tra cứu ZaloPay</button>
                                : <span className="ml-3 text-amber-700">Giao dịch cổng cũ: đối soát thủ công</span>}
                        </p>)}
                    <p className="text-sm">Giao dịch chưa được xác minh phải tra cứu với ZaloPay trước khi kết thúc/hoàn tiền.
                        Không tự đánh dấu giao dịch thành công từ màn hình này.</p>
                </section>}
            </>}
        </div>
    </main>;
}
