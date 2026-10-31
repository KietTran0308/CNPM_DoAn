import React, { useState, useMemo } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product, User, formatPrice, removeVietnameseTones } from '../api';
import { ANH_MAC_DINH, layDuongDanAnh } from '../hinhAnh';
import { ThanhDieuHuong } from '../components/ThanhDieuHuong';

interface ThucDonProps {
  user: User | null;
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  onNavigateHistory: () => void;
  onLogout: () => void;
  products: Product[];
  productsLoading: boolean;
  onOpenProductDetail: (productId: number) => void;
  totalCartCount: number;
  onViewCart: () => void;
  onQuickAddProduct?: (product: Product) => void;
}

export const ThucDon: React.FC<ThucDonProps> = ({
  user,
  menuOpen,
  setMenuOpen,
  onNavigateHistory,
  onLogout,
  products,
  productsLoading,
  onOpenProductDetail,
  totalCartCount,
  onViewCart,
  onQuickAddProduct,
}) => {
  const [tuKhoaTimKiem, setTuKhoaTimKiem] = useState<string>('');
  const [danhMucDangChon, setDanhMucDangChon] = useState<string>('Tất cả');
  const [idVuaThemNhanh, setIdVuaThemNhanh] = useState<number | null>(null);
  const [anhLoi, setAnhLoi] = useState<Record<number, boolean>>({});
  const anhDuPhong = layDuongDanAnh(ANH_MAC_DINH);

  const danhSachDanhMuc = useMemo(() => {
    const goc = ['Tất cả', 'Cà phê', 'Trà'];
    products.forEach((p) => {
      if (p.category && !goc.includes(p.category)) {
        goc.push(p.category);
      }
    });
    return goc;
  }, [products]);

  const danhSachMonDaLoc = useMemo(() => {
    const tuKhoaChuanHoa = removeVietnameseTones(tuKhoaTimKiem);

    return products.filter((item) => {
      const dungDanhMuc =
        danhMucDangChon === 'Tất cả' || item.category === danhMucDangChon;
      if (!dungDanhMuc) return false;

      if (!tuKhoaChuanHoa) return true;

      const tenKhongDau = removeVietnameseTones(item.name);
      const moTaKhongDau = removeVietnameseTones(item.description || '');
      const danhMucKhongDau = removeVietnameseTones(item.category || '');

      return (
        tenKhongDau.includes(tuKhoaChuanHoa) ||
        moTaKhongDau.includes(tuKhoaChuanHoa) ||
        danhMucKhongDau.includes(tuKhoaChuanHoa)
      );
    });
  }, [products, danhMucDangChon, tuKhoaTimKiem]);

  const datLaiBoLoc = () => {
    setTuKhoaTimKiem('');
    setDanhMucDangChon('Tất cả');
  };

  const xuLyThemNhanh = (e: React.MouseEvent, item: Product) => {
    e.stopPropagation();
    if (item.stock <= 0 || !onQuickAddProduct) return;
    onQuickAddProduct(item);
    setIdVuaThemNhanh(item.id);
    setTimeout(() => {
      setIdVuaThemNhanh((prev) => (prev === item.id ? null : prev));
    }, 900);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between space-y-6">
      <div className="space-y-5">
        <ThanhDieuHuong
          user={user}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onNavigateHistory={onNavigateHistory}
          onLogout={onLogout}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/80">
          <div className="relative flex-1">
            <input
              type="text"
              value={tuKhoaTimKiem}
              onChange={(e) => setTuKhoaTimKiem(e.target.value)}
              placeholder="Tìm tên món hoặc hương vị (vd: muối, sen vàng, cốt dừa...)"
              aria-label="Tìm kiếm món"
              className="w-full pl-3.5 pr-9 py-2.5 bg-stone-50 border border-neutral-200/80 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 transition-colors"
            />
            {tuKhoaTimKiem && (
              <button
                type="button"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={() => setTuKhoaTimKiem('')}
                className="w-6 h-6 rounded-lg text-neutral-400 hover:text-emerald-900 hover:bg-emerald-50/70 flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono cursor-pointer transition-colors"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none shrink-0">
            {danhSachDanhMuc.map((cat) => {
              const soLuong =
                cat === 'Tất cả'
                  ? products.length
                  : products.filter((p) => p.category === cat).length;
              const dangChon = danhMucDangChon === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDanhMucDangChon(cat)}
                  className={`px-3.5 py-2 text-xs sm:text-sm rounded-lg border transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    dangChon
                      ? 'bg-emerald-800 text-white font-medium border-emerald-800'
                      : 'bg-white text-neutral-600 border-neutral-200/80 hover:bg-emerald-50/70 hover:text-emerald-900 hover:border-emerald-800/30'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      dangChon ? 'text-emerald-100' : 'text-neutral-400'
                    }`}
                  >
                    {soLuong}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {productsLoading ? (
            <div className="text-center text-sm py-16 text-neutral-500 col-span-full bg-white border border-neutral-200/80 rounded-xl">
              Đang tải thực đơn...
            </div>
          ) : danhSachMonDaLoc.length === 0 ? (
            <div className="col-span-full py-14 px-4 text-center bg-white border border-neutral-200/80 rounded-xl space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-900">
                  Không tìm thấy món phù hợp
                </p>
                <p className="text-xs text-neutral-500">
                  Không có kết quả cho{' '}
                  {tuKhoaTimKiem ? `từ khóa "${tuKhoaTimKiem}"` : 'bộ lọc hiện tại'}
                  {danhMucDangChon !== 'Tất cả' ? ` trong danh mục "${danhMucDangChon}"` : ''}.
                </p>
              </div>
              <button
                type="button"
                onClick={datLaiBoLoc}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-800 text-white text-xs sm:text-sm font-medium hover:bg-emerald-700 cursor-pointer transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            danhSachMonDaLoc.map((item) => {
              const hetHang = item.stock <= 0;
              const vuaThem = idVuaThemNhanh === item.id;
              const loiAnh = anhLoi[item.id];
              const duongDanAnh = layDuongDanAnh(item.imageUrl) || anhDuPhong;

              return (
                <div
                  key={item.id}
                  onClick={() => onOpenProductDetail(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenProductDetail(item.id);
                    }
                  }}
                  className="w-full bg-white border border-neutral-200/80 rounded-xl overflow-hidden flex flex-col justify-between text-left cursor-pointer hover:border-emerald-800/40 transition-colors"
                >
                  <div>
                    <div className="w-full bg-[#115e3b] border-b border-neutral-200/80 overflow-hidden relative flex items-center justify-center">
                      {loiAnh ? (
                        <div className="w-full aspect-square bg-stone-50 text-neutral-400 text-xs flex items-center justify-center">
                          Ảnh
                        </div>
                      ) : (
                        <img
                          src={duongDanAnh}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            if (anhDuPhong && !e.currentTarget.src.endsWith(anhDuPhong)) {
                              e.currentTarget.src = anhDuPhong;
                            } else {
                              setAnhLoi((prev) => ({ ...prev, [item.id]: true }));
                            }
                          }}
                          className="w-full h-auto object-contain block"
                        />
                      )}
                    </div>

                    <div className="p-2.5 sm:p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-1 sm:gap-2 flex-wrap">
                        {item.category ? (
                          <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded bg-emerald-50/70 text-emerald-900 font-medium truncate max-w-[60%]">
                            {item.category}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span
                          className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded font-medium shrink-0 ${
                            hetHang
                              ? 'bg-stone-100 text-neutral-400'
                              : 'bg-emerald-50/70 text-emerald-900'
                          }`}
                        >
                          {hetHang ? 'Hết hàng' : `Còn ${item.stock}`}
                        </span>
                      </div>

                      <div className="font-semibold text-neutral-900 text-xs sm:text-base leading-snug pt-0.5 line-clamp-2">
                        {item.name}
                      </div>

                      {item.description && (
                        <p className="text-[11px] sm:text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-2.5 sm:px-4 pb-2.5 sm:pb-4 pt-2 flex items-center justify-between gap-1.5 sm:gap-2 border-t border-neutral-100">
                    <span className="font-mono tabular-nums font-bold text-xs sm:text-base text-emerald-800">
                      {formatPrice(item.price)}
                    </span>

                    {onQuickAddProduct && (
                      <button
                        type="button"
                        disabled={hetHang}
                        aria-label={`Thêm nhanh ${item.name}`}
                        title="Thêm nhanh vào giỏ (Size S, 100% đường/đá)"
                        onClick={(e) => xuLyThemNhanh(e, item)}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                          vuaThem
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : hetHang
                            ? 'bg-stone-100 text-neutral-300 border-neutral-200/80 cursor-not-allowed'
                            : 'bg-emerald-50/70 text-emerald-900 border-emerald-800/20 hover:bg-emerald-800 hover:text-white hover:border-emerald-800'
                        }`}
                      >
                        {vuaThem ? 'Đã thêm' : '+'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="sticky bottom-4 z-20 pt-2">
        <div className="bg-white/95 backdrop-blur-xs p-3 sm:p-4 rounded-xl border border-neutral-200/80 shadow-sm flex items-center justify-between gap-4">
          <div className="hidden sm:block text-xs text-neutral-600">
            Đã chọn <strong className="font-mono text-emerald-900">{totalCartCount}</strong> món trong giỏ hàng
          </div>
          <button
            type="button"
            onClick={onViewCart}
            className="w-full sm:w-auto sm:min-w-[240px] ml-auto py-2.5 px-5 bg-emerald-800 text-white font-medium text-sm rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Xem giỏ hàng ({totalCartCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThucDon;
