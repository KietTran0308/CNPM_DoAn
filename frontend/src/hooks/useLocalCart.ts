// frontend/src/hooks/useLocalCart.ts
import { useEffect, useRef } from 'react';
import { CartItem } from '../types/cart';
import { useCartStore } from '../stores';

const CART_STORAGE_KEY = 'app_shopping_cart_v1';

export const useLocalCart = () => {
  const cart = useCartStore((s) => s.items);
  // Giả sử useCartStore có action setItems hoặc replaceCart để nạp toàn bộ danh sách item
  // Nếu store dùng tên khác, bạn thay thế hàm tương ứng tại đây.
  const setCartItems = useCartStore((s) => (s as any).setItems || (s as any).replaceCart);

  const isHydratedRef = useRef(false);

  // 1. Khôi phục giỏ hàng từ localStorage khi component mount lần đầu
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsedItems: CartItem[] = JSON.parse(stored);
        if (Array.isArray(parsedItems) && typeof setCartItems === 'function') {
          setCartItems(parsedItems);
        }
      }
    } catch (error) {
      console.error('[useLocalCart] Lỗi đọc dữ liệu từ localStorage:', error);
    } finally {
      isHydratedRef.current = true;
    }
  }, [setCartItems]);

  // 2. Lưu giỏ hàng vào localStorage mỗi khi state `cart` thay đổi
  useEffect(() => {
    // Chỉ lưu sau khi đã hoàn tất bước khôi phục ban đầu để tránh ghi đè mảng rỗng lên dữ liệu cũ
    if (!isHydratedRef.current) return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('[useLocalCart] Lỗi lưu dữ liệu vào localStorage:', error);
    }
  }, [cart]);

  // 3. Đồng bộ dữ liệu giỏ hàng giữa các tab trình duyệt
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY && event.newValue) {
        try {
          const updatedItems: CartItem[] = JSON.parse(event.newValue);
          if (Array.isArray(updatedItems) && typeof setCartItems === 'function') {
            setCartItems(updatedItems);
          }
        } catch (error) {
          console.error('[useLocalCart] Lỗi đồng bộ đa tab:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setCartItems]);

  return {
    isHydrated: isHydratedRef.current,
  };
};