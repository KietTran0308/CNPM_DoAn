import React from 'react';
import type { Product } from '../types';
import { formatCurrency } from '../utils';
import { Plus, Star } from 'lucide-react';

// ---------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------

interface ProductCardProps {
  /** Dữ liệu sản phẩm cần hiển thị */
  product: Product;
  /** Callback khi nhấn nút "Xem chi tiết" / "Chọn" */
  onViewDetail: (product: Product) => void;
  /** Chế độ hiển thị: grid (card dọc) hoặc list (card ngang) */
  variant?: 'grid' | 'featured';
}

// ---------------------------------------------------------------
// COMPONENT: ProductCard
// ---------------------------------------------------------------

/**
 * Hiển thị thông tin một sản phẩm trong lưới thực đơn.
 *
 * Bao gồm:
 *  - Ảnh sản phẩm (với fallback khi lỗi)
 *  - Badge "Bán chạy" nếu isPopular
 *  - Tên danh mục, tên sản phẩm, mô tả ngắn
 *  - Giá cơ bản
 *  - Nút "Xem chi tiết" để mở ProductDetailModal
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetail,
  variant = 'grid',
}) => {
  const FALLBACK_IMAGE = '/images/artisan_hero_food_1791967258188.jpg';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  // ---- FEATURED VARIANT (dùng trong Signature Highlights) ----
  if (variant === 'featured') {
    return (
      <article
        onClick={() => onViewDetail(product)}
        className="liquid-glass-card rounded-[20px] p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 transition-all duration-300 border border-white/80 shadow-sm"
        aria-label={`Xem chi tiết ${product.name}`}
      >
        {/* Ảnh sản phẩm */}
        <div>
          <div className="relative w-full aspect-video sm:aspect-square rounded-[14px] overflow-hidden mb-3 bg-stone-100">
            <img
              src={product.image}
              onError={handleImageError}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Badge danh mục */}
            <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-[16px] border border-white/80 text-[#035542] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs uppercase">
              {product.categoryName}
            </div>
            {/* Badge bán chạy */}
            {product.isPopular && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#f9e9a9] text-[#035542] text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs border border-amber-300/40">
                <Star className="w-2.5 h-2.5 fill-current" />
                <span>Bán chạy</span>
              </div>
            )}
          </div>

          {/* Tên sản phẩm */}
          <h3 className="text-sm sm:text-base font-bold text-[#333333] group-hover:text-[#035542] transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Mô tả */}
          <p className="text-xs text-[#333333]/70 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Giá + Nút xem chi tiết */}
        <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between gap-2">
          <span className="font-mono text-base font-bold text-[#035542]">
            {formatCurrency(product.basePrice)}
          </span>

          <button
            type="button"
            id={`btn-view-detail-featured-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail(product);
            }}
            className="touch-target px-3.5 py-1.5 rounded-full liquid-glass border border-emerald-900/20 text-[#035542] hover:bg-white text-xs font-bold uppercase transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
            aria-label={`Xem chi tiết ${product.name}`}
          >
            <span>Chọn</span>
            <Plus className="w-3 h-3 stroke-[2.5]" />
          </button>
        </div>
      </article>
    );
  }

  // ---- GRID VARIANT (mặc định, dùng trong lưới sản phẩm chính) ----
  return (
    <article
      onClick={() => onViewDetail(product)}
      className="liquid-glass-card rounded-[20px] p-3 flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 border border-white/80"
      aria-label={`Xem chi tiết ${product.name}`}
    >
      <div>
        {/* Ảnh sản phẩm */}
        <div className="relative w-full aspect-square mb-2.5 overflow-hidden rounded-[14px] bg-stone-100">
          <img
            src={product.image}
            onError={handleImageError}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Badge bán chạy */}
          {product.isPopular && (
            <span className="absolute top-2 left-2 bg-[#f9e9a9] text-[#035542] text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs uppercase border border-amber-300/40">
              Bán chạy
            </span>
          )}
        </div>

        {/* Danh mục */}
        <span className="text-[10px] font-semibold uppercase text-[#035542] tracking-wider block">
          {product.categoryName}
        </span>

        {/* Tên sản phẩm */}
        <h4 className="text-xs sm:text-sm font-bold text-[#333333] group-hover:text-[#035542] transition-colors mt-0.5 line-clamp-1">
          {product.name}
        </h4>

        {/* Mô tả ngắn */}
        <p className="text-[11px] text-[#333333]/70 line-clamp-1 mt-0.5">
          {product.sectionCaption || product.description}
        </p>
      </div>

      {/* Giá + Nút xem chi tiết */}
      <div className="mt-3 pt-2.5 border-t border-black/5 w-full flex items-center justify-between gap-1">
        <span className="text-xs sm:text-sm font-bold font-mono text-[#035542] text-left truncate">
          {formatCurrency(product.basePrice)}
        </span>

        <button
          type="button"
          id={`btn-view-detail-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(product);
          }}
          className="touch-target h-7 sm:h-8 px-2.5 rounded-full liquid-glass border border-emerald-900/15 text-[#035542] hover:bg-white text-[11px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-xs active:scale-95"
          aria-label={`Xem chi tiết ${product.name}`}
        >
          <span>Chọn</span>
          <Plus className="w-3 h-3 stroke-[2.5]" />
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
