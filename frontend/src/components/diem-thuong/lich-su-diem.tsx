import React, { useState, useEffect } from 'react';
import { GiaoDichDiem, dichVuDiemThuong } from '../../services/dich-vu-diem-thuong';
import { Clock, PlusCircle, MinusCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const LichSuDiem: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'CONG' | 'TRU'>('ALL');
  const [danhSach, setDanhSach] = useState<GiaoDichDiem[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { handleRefresh(); }, []);

  const handleRefresh = () => {
    dichVuDiemThuong.layLichSuGiaoDich().then(rows => { setDanhSach(rows); setError(null); })
      .catch(e => setError(e.message || 'Không tải được lịch sử điểm'));
  };

  const filteredList = danhSach.filter((item) => {
    if (filter === 'CONG') return item.loai === 'CONG';
    if (filter === 'TRU') return item.loai === 'TRU';
    return true;
  });

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      {/* Filter Tabs & Refresh Button */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: `Tất cả (${danhSach.length})` },
            {
              id: 'CONG',
              label: `Điểm cộng (+${danhSach.filter((i) => i.loai === 'CONG').length})`,
            },
            {
              id: 'TRU',
              label: `Điểm trừ (-${danhSach.filter((i) => i.loai === 'TRU').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-[#145C4B] text-white shadow-xs'
                  : 'bg-white text-[#252525]/70 border border-black/10 hover:border-black/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="text-xs text-[#145C4B] hover:underline font-semibold flex items-center gap-1 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* Transaction List */}
      {filteredList.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-[18px] bg-[#FAF9F5] border border-black/5">
          <Clock className="w-8 h-8 text-[#252525]/30 mx-auto mb-2" />
          <p className="text-xs font-bold text-[#252525] uppercase">Chưa có giao dịch điểm nào</p>
          <p className="text-[11px] text-[#252525]/60 mt-0.5">
            Các giao dịch cộng điểm khi đặt món và đổi ưu đãi sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredList.map((gd) => {
            const isCong = gd.loai === 'CONG';
            return (
              <div
                key={gd.id}
                className="p-3.5 rounded-[16px] bg-white border border-black/5 hover:border-black/15 transition-all flex items-start justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isCong ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {isCong ? (
                      <PlusCircle className="w-4 h-4" />
                    ) : (
                      <MinusCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-[#252525]/60 bg-stone-100 px-2 py-0.5 rounded-md">
                        {gd.maGiaoDich}
                      </span>
                      {gd.maLienQuan && (
                        <span className="font-mono text-[10px] text-[#145C4B] font-bold">
                          {gd.maLienQuan}
                        </span>
                      )}
                      <span className="text-[10px] text-[#252525]/50 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {gd.thoiGian}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#252525] mt-1.5 leading-snug">
                      {gd.noiDung}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-mono font-black text-sm block ${
                      isCong ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {isCong ? `+${gd.soDiem}` : gd.soDiem} điểm
                  </span>
                  <span className="text-[10px] text-[#252525]/50 font-mono block mt-0.5">
                    Số dư: {gd.soDuSau} điểm
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
