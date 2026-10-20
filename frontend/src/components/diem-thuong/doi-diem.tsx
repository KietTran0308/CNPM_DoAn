import React, { useState } from 'react';
import {
  dichVuDiemThuong,
  DANH_MUC_PHAN_THUONG,
  PhanThuongDoiDiem,
} from '../../services/dich-vu-diem-thuong';
import { formatCurrency } from '../../utils';
import {
  Gift,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Clock,
  X,
  Loader2,
  Coffee,
  Ticket,
} from 'lucide-react';

interface DoiDiemProps {
  diemHienCo: number;
  onDoiThanhCong: (thongBao: string) => void;
  onChuyenSangVoucher?: () => void;
}

export const DoiDiem: React.FC<DoiDiemProps> = ({
  diemHienCo,
  onDoiThanhCong,
  onChuyenSangVoucher,
}) => {
  const [selectedPhanThuong, setSelectedPhanThuong] = useState<PhanThuongDoiDiem | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleOpenConfirm = (pt: PhanThuongDoiDiem) => {
    if (diemHienCo < pt.soDiemCanDoi) {
      setActionMessage({
        text: `Số dư điểm không đủ để đổi "${pt.tenPhanThuong}" (còn thiếu ${pt.soDiemCanDoi - diemHienCo} điểm).`,
        isError: true,
      });
      setTimeout(() => setActionMessage(null), 4000);
      return;
    }
    setSelectedPhanThuong(pt);
    setIsConfirmModalOpen(true);
  };

  const handleExecuteRedeem = async () => {
    if (!selectedPhanThuong || isProcessing) return;

    setIsProcessing(true);
    // Simulating async network request
    await new Promise((r) => setTimeout(r, 300));

    const result = await dichVuDiemThuong.doiPhanThuong(selectedPhanThuong);
    setIsProcessing(false);
    setIsConfirmModalOpen(false);

    if (result.thanhCong) {
      onDoiThanhCong(result.thongBao);
      setActionMessage({ text: result.thongBao, isError: false });
    } else {
      setActionMessage({ text: result.thongBao, isError: true });
    }

    setSelectedPhanThuong(null);
    setTimeout(() => setActionMessage(null), 5000);
  };

  return (
    <div className="space-y-4">
      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-[16px] text-xs font-semibold flex items-center justify-between border animate-in fade-in duration-150 ${
            actionMessage.isError
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          {onChuyenSangVoucher && !actionMessage.isError && (
            <button
              type="button"
              onClick={onChuyenSangVoucher}
              className="text-[11px] underline font-bold hover:text-emerald-950 cursor-pointer ml-2"
            >
              Xem kho ưu đãi →
            </button>
          )}
        </div>
      )}

      {/* Grid of Reward Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {DANH_MUC_PHAN_THUONG.map((pt) => {
          const duDiem = diemHienCo >= pt.soDiemCanDoi;
          const conThieu = pt.soDiemCanDoi - diemHienCo;

          return (
            <div
              key={pt.id}
              className={`p-4 rounded-[18px] border transition-all flex flex-col justify-between ${
                duDiem
                  ? 'bg-white hover:border-[#145C4B]/40 shadow-xs'
                  : 'bg-stone-50/70 border-black/5 opacity-85'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      duDiem
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {pt.soDiemCanDoi} điểm
                  </span>

                  <span className="text-[11px] font-mono font-bold text-[#145C4B]">
                    Ưu đãi: -{formatCurrency(pt.giaTriUuDai)}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#252525] mb-1">{pt.tenPhanThuong}</h3>
                <p className="text-xs text-[#252525]/70 leading-relaxed mb-3">{pt.moTa}</p>

                <div className="space-y-1 text-[11px] text-[#252525]/60 pt-2 border-t border-black/5">
                  <div className="flex justify-between">
                    <span>Điều kiện đơn tối thiểu:</span>
                    <span className="font-semibold text-[#252525]">
                      {formatCurrency(pt.donToiThieu)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hạn sử dụng phiếu:</span>
                    <span className="font-semibold text-[#252525]">{pt.hanSuDung}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-2.5 border-t border-black/5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#252525]/70">
                  {duDiem ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đủ điều kiện đổi
                    </span>
                  ) : (
                    <span className="text-stone-500">Còn thiếu {conThieu} điểm</span>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenConfirm(pt)}
                  disabled={!duDiem}
                  className={`touch-target px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    duDiem
                      ? 'bg-[#145C4B] hover:bg-[#035542] text-white shadow-xs active:scale-95'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  Đổi điểm
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && selectedPhanThuong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[24px] p-6 shadow-2xl border border-black/10">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/5">
              <div className="flex items-center gap-2 text-[#145C4B]">
                <Gift className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#252525]">Xác nhận đổi phần thưởng</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isProcessing}
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#252525] hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#252525]">
              <div className="p-3.5 rounded-[16px] bg-[#FAF9F5] border border-black/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#252525]/70">Phần thưởng:</span>
                  <span className="font-bold text-sm text-[#145C4B]">
                    {selectedPhanThuong.tenPhanThuong}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#252525]/70">Giá trị giảm:</span>
                  <span className="font-mono font-bold text-amber-600">
                    -{formatCurrency(selectedPhanThuong.giaTriUuDai)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#252525]/70">Số điểm sẽ bị trừ:</span>
                  <span className="font-mono font-bold text-red-600">
                    -{selectedPhanThuong.soDiemCanDoi} điểm
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-black/5">
                  <span className="text-[#252525]/70">Số dư điểm sau đổi:</span>
                  <span className="font-mono font-bold text-[#252525]">
                    {diemHienCo - selectedPhanThuong.soDiemCanDoi} điểm
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-[#252525]/70 leading-relaxed space-y-1">
                <p>• Phiếu ưu đãi mới sẽ được lưu trực tiếp vào Kho voucher của bạn.</p>
                <p>• Hạn dùng: {selectedPhanThuong.hanSuDung}.</p>
                <p>• Áp dụng khi nhận tại quầy cho đơn hàng từ {formatCurrency(selectedPhanThuong.donToiThieu)}.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-black/5">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isProcessing}
                className="touch-target px-4 py-2 rounded-full border border-black/10 text-xs font-bold uppercase tracking-wider text-[#252525] hover:bg-stone-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteRedeem}
                disabled={isProcessing}
                className="touch-target px-5 py-2.5 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Xác nhận đổi điểm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
