import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { formatCurrency } from '../utils';
import {
  Search,
  ShoppingBag,
  ArrowRight,
  ArrowDown,
  Coffee,
  X,
  Sparkles,
  Flame,
  IceCream,
  Croissant,
  CupSoda,
} from 'lucide-react';
import { DecorativeWaveGlyph } from './HartzlerBrand';
import { ProductCard } from './ProductCard';

export const MenuPage: React.FC = () => {
  const { openProductDetail, cartCount, cartTotal, openCart, products, isProductsLoading } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const displayProducts = products || [];

  const categories = [
    {
      id: 'all',
      label: 'TẤT CẢ MÓN',
      icon: Sparkles,
      count: displayProducts.length,
    },
    {
      id: 'coffee_viet',
      label: 'CÀ PHÊ VIỆT',
      icon: Coffee,
      count: displayProducts.filter((p) => p.category === 'coffee_viet').length,
    },
    {
      id: 'coffee_machine',
      label: 'CÀ PHÊ MÁY',
      icon: Flame,
      count: displayProducts.filter((p) => p.category === 'coffee_machine').length,
    },
    {
      id: 'tea',
      label: 'TRÀ & TRÀ SỮA',
      icon: CupSoda,
      count: displayProducts.filter((p) => p.category === 'tea').length,
    },
    {
      id: 'bakery',
      label: 'BÁNH NGỌT',
      icon: Croissant,
      count: displayProducts.filter((p) => p.category === 'bakery').length,
    },
    {
      id: 'ice_cream',
      label: 'KEM GELATO',
      icon: IceCream,
      count: displayProducts.filter((p) => p.category === 'ice_cream').length,
    },
  ];

  // Curated Signature highlights (1 Cà phê Việt, 1 Trà trái cây, 1 Bánh nướng/Kem)
  const featuredSpecials = useMemo(() => {
    const c = displayProducts.find((p) => p.id === 'vn-2' || (p.category === 'coffee_viet' && p.isPopular));
    const t = displayProducts.find((p) => p.id === 'tea-1' || (p.category === 'tea' && p.isPopular));
    const b = displayProducts.find((p) => p.id === 'bakery-1' || p.id === 'ice-1');
    return [c, t, b].filter(Boolean) as Product[];
  }, [displayProducts]);

  const filteredProducts = useMemo(() => {
    return displayProducts.filter((item) => {
      let matchCat = true;
      if (selectedCategory !== 'all') {
        matchCat = item.category === selectedCategory;
      }
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sectionCaption &&
          item.sectionCaption.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery, displayProducts]);

  return (
    <div className="pb-32 sm:pb-36 w-full overflow-x-hidden font-sans">
      {/* 1. EDITORIAL SPLIT HERO: BREW LITE Premium Minimalist Food Visual */}
      <section className="relative pt-2 sm:pt-4 pb-3 sm:pb-5 mb-2 sm:mb-4 overflow-hidden">
        {/* Subtle Watermark Display Type */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-4 select-none pointer-events-none text-center font-billboard text-[clamp(44px,9vw,110px)] text-[#56dddb]/10 leading-none tracking-widest z-0 overflow-hidden"
        >
          BREW LITE
        </div>

        <div className="relative z-10 fluid-container">
          <div className="liquid-glass rounded-[24px] p-4 sm:p-6 lg:p-7 border border-white/80 shadow-md bg-gradient-to-br from-[#FAF9F5] via-[#FAF9F5]/95 to-[#E8F5F0]/60">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">

              {/* Left Column: Editorial Typography & Primary CTA (5 cols on lg) */}
              <div className="lg:col-span-5 flex flex-col justify-center text-left order-2 lg:order-1">
                {/* Brand Kicker with Subtle Liquid Glass */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#145C4B]/10 text-[#145C4B] text-[11px] font-bold uppercase tracking-[0.14em] mb-2.5 w-fit border border-[#145C4B]/15 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#145C4B] animate-pulse" />
                  <span>BREW LITE CAFÉ</span>
                </div>

                {/* Editorial Headline: Friendly, appetizing, authentic Vietnamese vibe */}
                <h1 className="text-2xl sm:text-3xl lg:text-[2.2rem] font-black text-[#252525] tracking-tight leading-[1.2] mb-2.5">
                  “Cà phê ngon, bánh xinh, ngày thêm vui.”
                </h1>

                {/* Narrative Subtitle */}
                <p className="text-xs sm:text-sm text-[#252525]/80 leading-relaxed mb-5 max-w-lg">
                  Khởi đầu ngày mới với ly cà phê đậm đà, thưởng thức chiếc bánh ngọt thơm mềm hay tự thưởng cho mình một phần kem mát lạnh. Chọn món yêu thích và tận hưởng theo cách của bạn.
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('full-menu');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="touch-target group inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Xem thực đơn</span>
                    <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('coffee_viet');
                      const el = document.getElementById('full-menu');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="touch-target inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-3 rounded-full liquid-glass border border-emerald-900/15 text-[#145C4B] hover:bg-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>Món bán chạy</span>
                  </button>
                </div>

                {/* Quality Notes / Subtle Highlights */}
                <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-black/5 text-[#252525]">
                  <div>
                    <span className="block text-[11px] font-bold uppercase text-[#145C4B] tracking-wide">
                      Cà Phê Mộc
                    </span>
                    <span className="text-[10px] text-[#252525]/65 leading-tight block mt-0.5">
                      Robusta & Arabica đậm đà
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase text-[#145C4B] tracking-wide">
                      Gelato Tươi
                    </span>
                    <span className="text-[10px] text-[#252525]/65 leading-tight block mt-0.5">
                      Nông sản Việt tự nhiên
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase text-[#145C4B] tracking-wide">
                      Bánh Nướng
                    </span>
                    <span className="text-[10px] text-[#252525]/65 leading-tight block mt-0.5">
                      Mới ra lò mỗi sớm mai
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Showcase (7 cols on lg) */}
              <div className="lg:col-span-7 order-1 lg:order-2">
                <div className="relative group">
                  {/* Outer subtle halo glow */}
                  <div className="absolute -inset-1 bg-gradient-to-tr from-[#145C4B]/15 via-[#56dddb]/15 to-[#f9e9a9]/20 rounded-[24px] blur-md opacity-70 group-hover:opacity-90 transition-opacity" />

                  {/* Main Food Photograph Container */}
                  <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] w-full rounded-[20px] overflow-hidden border border-white/90 shadow-xl bg-stone-100">
                    <img
                      src="/images/artisan_hero_food_1791967258188.jpg"
                      alt="Cà phê mộc, kem gelato mịn mát và bánh sừng bò nướng giòn thơm bơ nguyên chất tại Brew Lite"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                    />

                    {/* Subtle Liquid Glass Overlays */}
                    {/* Top Right Floating Badge */}
                    <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 liquid-glass rounded-full px-3 py-1 border border-white/80 shadow-md backdrop-blur-[16px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#145C4B]" />
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#145C4B]">
                        Món Mới Mỗi Ngày
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. STICKY SUB-HEADER: CATEGORY NAVIGATION & INTEGRATED SEARCH BAR */}
      <div className="sticky top-[64px] sm:top-[80px] z-30 py-2.5 mb-5 backdrop-blur-[16px] bg-[#FAF9F5]/90 border-y border-black/5 shadow-xs transition-all">
        <div className="fluid-container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Category Pills: Horizontal Scroll with Smooth Touch Experience */}
            <div
              role="tablist"
              aria-label="Danh mục món ăn"
              className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0"
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`touch-target px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-2 ${isActive
                        ? 'liquid-glass-emerald text-white shadow-md'
                        : 'bg-white/80 hover:bg-white text-[#035542] border border-black/5 hover:border-[#035542]/20 shadow-xs'
                      }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-900/10 text-[#035542]'
                        }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Search Bar: Compact & Responsive */}
            <div className="w-full md:w-72 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-[#035542]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm cà phê, trà, bánh, kem..."
                  className="w-full h-10 pl-10 pr-8 rounded-full bg-white/90 border border-black/10 focus:border-[#035542] text-xs font-semibold text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#035542]/15 transition-all placeholder:text-[#333333]/50 shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#333333]/60 hover:text-[#035542] cursor-pointer"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIGNATURE HIGHLIGHTS SECTION (Only when viewing All and no search) */}
      {!searchQuery && selectedCategory === 'all' && (
        <section className="mb-8 fluid-container">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#035542]" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#035542]">
                MÓN ĐẶC SẮC ĐƯỢC YÊU THÍCH TẠI BREW LITE
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#333333]/60 uppercase hidden sm:inline">
              Pha phin mộc & Tươi mới mỗi ngày
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {featuredSpecials.map((product) => (
              <ProductCard
                key={`feat-${product.id}`}
                product={product}
                onViewDetail={openProductDetail}
                variant="featured"
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. CATALOG GRID: FULL MENU ITEMS WITH LIQUID GLASS CARDS */}
      <section id="full-menu" className="fluid-container scroll-mt-24">
        {/* Catalog Section Header */}
        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <DecorativeWaveGlyph color="#035542" />
            <h2 className="text-base sm:text-lg font-bold uppercase text-[#333333] tracking-tight">
              {searchQuery
                ? `KẾT QUẢ TÌM KIẾM`
                : selectedCategory === 'all'
                  ? 'TẤT CẢ SẢN PHẨM'
                  : categories.find((c) => c.id === selectedCategory)?.label || 'THỰC ĐƠN'}
            </h2>
            <span className="text-xs font-mono font-semibold text-[#035542] bg-[#035542]/10 px-2.5 py-0.5 rounded-full">
              {filteredProducts.length} món
            </span>
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#035542] hover:underline font-semibold cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Loading Skeleton */}
        {isProductsLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="liquid-glass-card rounded-[20px] p-3 flex flex-col justify-between animate-pulse border border-white/60"
              >
                <div>
                  <div className="w-full aspect-square mb-2.5 rounded-[14px] bg-stone-200" />
                  <div className="h-2.5 w-16 bg-stone-200 rounded mb-1.5" />
                  <div className="h-4 w-3/4 bg-stone-200 rounded mb-1" />
                  <div className="h-3 w-full bg-stone-200 rounded" />
                </div>
                <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between">
                  <div className="h-4 w-14 bg-stone-200 rounded" />
                  <div className="h-7 w-14 bg-stone-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Grid: 2 cols on mobile, 3 on tablet, 4-5 on desktop */}
        {!isProductsLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetail={openProductDetail}
                variant="grid"
              />
            ))}
          </div>
        )}

        {/* Empty Search / Filter State */}
        {!isProductsLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12 liquid-glass rounded-[20px] p-8 max-w-md mx-auto border border-white/80 my-4 shadow-sm">
            <Coffee className="w-10 h-10 text-[#035542]/60 mx-auto mb-2.5" />
            <h4 className="font-bold text-[#333333] text-sm uppercase">Không tìm thấy món</h4>
            <p className="text-[#333333]/70 text-xs mt-1">
              Hãy thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="touch-target mt-4 px-5 py-2 liquid-glass-emerald text-white text-xs font-bold uppercase rounded-full shadow-md cursor-pointer hover:opacity-95"
            >
              Xem tất cả món
            </button>
          </div>
        )}
      </section>

      {/* 5. FLOATING CART BAR: Modern Liquid Glass Pill */}
      {cartCount > 0 && (
        <aside
          aria-label="Thanh giỏ hàng nổi"
          className="fixed bottom-[74px] md:bottom-8 inset-x-3 sm:inset-x-6 max-w-md mx-auto z-40 pointer-events-none"
        >
          <div className="pointer-events-auto w-full liquid-glass-emerald text-white rounded-full p-2 pl-4 shadow-xl border border-white/20">
            <div className="flex items-center justify-between gap-3">
              {/* Left Section: Shopping bag icon & clear price */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span className="absolute -top-1 -right-1 bg-[#f9e9a9] text-[#035542] text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center leading-tight">
                    {cartCount}
                  </span>
                </div>
                <div className="text-left truncate">
                  <span className="text-[10px] text-white/80 block uppercase tracking-wider truncate">
                    {cartCount} món trong giỏ
                  </span>
                  <span className="text-sm font-bold font-mono text-white leading-tight block">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Right Section: Button */}
              <button
                type="button"
                onClick={openCart}
                aria-label={`Xem giỏ hàng với ${cartCount} món, tổng cộng ${formatCurrency(cartTotal)}`}
                className="touch-target flex items-center gap-1.5 font-bold text-xs text-[#035542] bg-white hover:bg-stone-50 active:scale-95 px-4 py-2 rounded-full uppercase shrink-0 transition-all cursor-pointer shadow-md"
              >
                <span>XEM GIỎ</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
