import React, { useState } from 'react';
import { dichVuVoucher, VoucherNguoiDung, TrangThaiVoucher } from '../../services/dich-vu-voucher';
import { formatCurrency } from '../../utils';
import { useApp } from '../../context/AppContext';
import {
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Coffee,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const DanhSachVoucher: React.FC = () => {
  const { cartSubtotal, applyVoucher, setCurrentScreen, openCart } = useApp();
  const [activeTab, setActiveTab] = useState<'coTheSuDung' | 'chuaDuDieuKien' | 'daSuDung' | 'daHetHan'>('coTheSuDung');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { coTheSuDung, chuaDuDieuKien, daSuDung, daHetHan } =
    dichVuVoucher.phanLoaiTheoGioHang(cartSubtotal);

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleApplyNow = (code: string) => {
    const res = applyVoucher(code);
    if (res.success) {
      setNotice(`Đã áp dụng mã [${code}] vào giỏ hàng thành công!`);
      setTimeout(() => setNotice(null), 3000);
      openCart();
    } else {
      setNotice(res.message);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const getListForCurrentTab = (): VoucherNguoiDung[] => {
    switch (activeTab) {
      case 'coTheSuDung':
        return coTheSuDung;
      case 'chuaDuDieuKien':
        return chuaDuDieuKien;
      case 'daSuDung':
        return daSuDung;
      case 'daHetHan':
        return daHetHan;
      default:
        return coTheSuDung;
    }
  };

  const currentList = getListForCurrentTab();

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      {notice && (
        <div className="p-3 rounded-[14px] bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[11px] underline opacity-70"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Categorized Tabs (4 groups as specified in requirement 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 'coTheSuDung', label: 'Có thể dùng', count: coTheSuDung.length },
          { id: 'chuaDuDieuKien', label: 'Chưa đủ ĐK', count: chuaDuDieuKien.length },
          { id: 'daSuDung', label: 'Đã sử dụng', count: daSuDung.length },
          { id: 'daHetHan', label: 'Đã hết hạn', count: daHetHan.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-2.5 rounded-[14px] text-xs font-semibold text-center transition-all cursor-pointer border ${
              activeTab === tab.id
                ? 'bg-[#145C4B] text-white border-[#145C4B] shadow-xs'
                : 'bg-white hover:bg-stone-50 text-[#252525]/70 border-black/10'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-[#252525]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Cart Subtotal Context Bar */}
      {cartSubtotal > 0 && (
        <div className="p-2.5 rounded-[12px] bg-[#FAF9F5] border border-black/5 flex items-center justify-between text-xs text-[#252525]">
          <span>
            Giá trị giỏ hàng hiện tại: <strong>{formatCurrency(cartSubtotal)}</strong>
          </span>
          <button
            type="button"
            onClick={openCart}
            className="text-[#145C4B] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Xem giỏ hàng</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Voucher Cards Grid */}
      {currentList.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-[18px] bg-[#FAF9F5] border border-black/5">
          <Tag className="w-8 h-8 text-[#252525]/30 mx-auto mb-2" />
          <p className="text-xs font-bold text-[#252525] uppercase">
            Không có phiếu giảm giá nào trong mục này
          </p>
          <p className="text-[11px] text-[#252525]/60 mt-0.5">
            Bạn có thể tích điểm để đổi thêm nhiều voucher hấp dẫn tại mục Đổi điểm.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((v) => {
            const isUsable = activeTab === 'coTheSuDung';
            const isInsufficient = activeTab === 'chuaDuDieuKien';
            const isUsed = activeTab === 'daSuDung';
            const isExpired = activeTab === 'daHetHan';

            return (
              <div
                key={v.id}
                className={`p-4 rounded-[18px] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isUsable
                    ? 'bg-white border-black/10 hover:border-[#145C4B]/40 shadow-xs'
                    : 'bg-stone-50/80 border-black/5 opacity-80'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-[#145C4B] bg-[#145C4B]/10 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {v.code}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(v.code)}
                      className="text-[10px] text-[#252525]/60 hover:text-[#145C4B] flex items-center gap-0.5 cursor-pointer"
                      title="Sao chép mã"
                    >
                      {copiedCode === v.code ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Chép mã</span>
                        </>
                      )}
                    </button>

                    {v.tag && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        {v.tag}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#252525]">{v.title}</h3>
                  <p className="text-xs text-[#252525]/70">{v.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#252525]/60 pt-1">
                    <span>
                      Mức giảm: <strong className="text-amber-700 font-mono">-{formatCurrency(v.discountAmount)}</strong>
                    </span>
                    <span>
                      Đơn tối thiểu: <strong>{formatCurrency(v.minOrder)}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      Hạn dùng: {v.expiry}
                    </span>
                  </div>

                  {/* Context status note */}
                  {isInsufficient && (
                    <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1 pt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>
                        Chưa đủ điều kiện: Cần thêm{' '}
                        <strong>{formatCurrency(v.minOrder - cartSubtotal)}</strong> để áp dụng.
                      </span>
                    </p>
                  )}

                  {isUsed && (
                    <p className="text-[11px] text-stone-500 font-mono pt-1">
                      Đã sử dụng lúc: {v.ngaySuDung} {v.maDonSuDung && `(Đơn ${v.maDonSuDung})`}
                    </p>
                  )}

                  {isExpired && (
                    <p className="text-[11px] text-red-600 font-medium pt-1">
                      Mã đã hết hạn sử dụng.
                    </p>
                  )}
                </div>

                {/* Right Action */}
                <div className="shrink-0 flex items-center gap-2">
                  {isUsable && (
                    <button
                      type="button"
                      onClick={() => handleApplyNow(v.code)}
                      className="w-full sm:w-auto touch-target px-4 py-2 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>Áp dụng ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
