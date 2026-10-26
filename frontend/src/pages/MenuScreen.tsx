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

        {/* Danh sách sản phẩm từ GET /products: 1 cột (Mobile), 2 cột (Tablet & Desktop) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {productsLoading ? (
            <div className="text-center text-sm py-8 text-gray-500">
              Đang tải...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-sm py-8 text-gray-500">
              Không có sản phẩm
            </div>
          ) : (
            products.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpenProductDetail(item.id)}
                className="w-full p-2.5 bg-stone-100 border border-gray-400 rounded flex items-center justify-between gap-3 text-left text-sm cursor-pointer hover:bg-stone-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded border border-gray-300 bg-stone-200 shrink-0"
                  />
                  <span className="font-medium truncate">{item.name}</span>
                </div>
                <span className="font-mono shrink-0">
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
