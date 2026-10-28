/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product, User, formatPrice } from '../api';
import { Navbar } from '../components/Navbar';

interface MenuScreenProps {
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
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
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
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('Tất cả');
  const categories = ['Tất cả', 'Cà phê', 'Trà'];

  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === 'Tất cả') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        {/* Header: BrewLite ≡ */}
        <Navbar
          user={user}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onNavigateHistory={onNavigateHistory}
          onLogout={onLogout}
        />

        {/* Bộ lọc danh mục: Tất cả, Cà phê, Trà */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const count =
              cat === 'Tất cả'
                ? products.length
                : products.filter((p) => p.category === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white font-medium border-emerald-800 shadow-sm'
                    : 'bg-stone-100 text-gray-700 border-gray-300 hover:bg-stone-200'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-emerald-900 text-white' : 'bg-stone-200 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Danh sách sản phẩm từ GET /products: 1 cột (Mobile), 2 cột (Tablet & Desktop) */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {productsLoading ? (
            <div className="text-center text-sm py-8 text-gray-500 col-span-full">
              Đang tải...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-sm py-8 text-gray-500 col-span-full">
              Không có sản phẩm trong danh mục này
            </div>
          ) : (
            filteredProducts.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpenProductDetail(item.id)}
                className="w-full p-2.5 bg-stone-100 border border-gray-400 rounded flex items-center justify-between gap-3 text-left text-sm cursor-pointer hover:bg-stone-200 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded border border-gray-300 bg-stone-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-medium truncate block">{item.name}</span>
                    {item.description && (
                      <span className="text-[11px] text-gray-500 line-clamp-1 block">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono shrink-0 font-medium">
                  {formatPrice(item.price)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Nút dưới cùng: Xem giỏ hàng (X) */}
      <div className="pt-4">
        <button
          onClick={onViewCart}
          className="w-full py-2.5 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900"
        >
          Xem giỏ hàng ({totalCartCount})
        </button>
      </div>
    </div>
  );
};

export default MenuScreen;
