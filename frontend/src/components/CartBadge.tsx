// frontend/src/components/CartBadge.tsx
import React from 'react';
import { useCart } from '../context/CartContext';

interface CartBadgeProps {
  /** Tuỳ chọn giới hạn hiển thị tối đa, mặc định 99 (hiện 99+) */
  maxCount?: number;
  /** Class tuỳ biến cho wrapper button */
  className?: string;
}

export const CartBadge: React.FC<CartBadgeProps> = ({
  maxCount = 99,
  className = '',
}) => {
  const { cartCount, openCart } = useCart();

  const displayCount = cartCount > maxCount ? `${maxCount}+` : cartCount;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Giỏ hàng có ${cartCount} món`}
      className={`relative inline-flex items-center justify-center p-2 text-gray-700 transition-colors hover:text-amber-600 focus:outline-none ${className}`}
    >
      {/* Icon giỏ hàng SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>

      {/* Huy hiệu hiển thị số lượng (chỉ hiện khi có ít nhất 1 món) */}
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
          {displayCount}
        </span>
      )}
    </button>
  );
};