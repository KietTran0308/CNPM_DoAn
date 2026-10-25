// frontend/src/__tests__/cart.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CartDrawer } from '../components/CartDrawer';
import { useCart } from '../context/CartContext';

jest.mock('../context/CartContext', () => ({
  useCart: jest.fn(),
}));

const mockUseCart = useCart as jest.Mock;

const mockCartItems = [
  {
    cartItemId: 'item-1',
    productId: 'prod-1',
    name: 'Matcha Latte Đá Xay',
    image: 'https://via.placeholder.com/64',
    size: { id: 'size-l', name: 'L', extraPrice: 10000 },
    toppings: [
      { id: 'top-1', name: 'Trân châu trắng', price: 5000 },
      { id: 'top-2', name: 'Kem cheese', price: 10000 },
    ],
    iceLevel: '70%',
    sugarLevel: '50%',
    quantity: 2,
    unitPrice: 60000, // 35k base + 10k size + 15k toppings
    totalPrice: 120000, // 60k * 2
  },
  {
    cartItemId: 'item-2',
    productId: 'prod-2',
    name: 'Trà Đào Cam Sả',
    image: 'https://via.placeholder.com/64',
    size: { id: 'size-m', name: 'M', extraPrice: 0 },
    toppings: [],
    iceLevel: '100%',
    sugarLevel: '70%',
    quantity: 1,
    unitPrice: 45000,
    totalPrice: 45000,
  },
];

describe('CartDrawer Component Tests', () => {
  const mockCloseCart = jest.fn();
  const mockUpdateQuantity = jest.fn();
  const mockRemoveFromCart = jest.fn();
  const mockOnCheckout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Không render khi isCartOpen = false', () => {
    mockUseCart.mockReturnValue({
      isCartOpen: false,
      cart: [],
      cartCount: 0,
      cartSubtotal: 0,
      discount: 0,
      pointsDiscount: 0,
      cartTotal: 0,
    });

    const { container } = render(<CartDrawer />);
    expect(container.firstChild).toBeNull();
  });

  test('2. Hiển thị thông báo khi giỏ hàng trống', () => {
    mockUseCart.mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart,
      cart: [],
      cartCount: 0,
      cartSubtotal: 0,
      discount: 0,
      pointsDiscount: 0,
      cartTotal: 0,
    });

    render(<CartDrawer />);
    expect(screen.getByText('Chưa có món nào trong giỏ hàng')).toBeInTheDocument();
  });

  test('3. Hiển thị đầy đủ danh sách món, size, topping và kiểm tra tính tổng tiền chuẩn xác', () => {
    // Tạm tính: 120,000 + 45,000 = 165,000
    // Giảm voucher: 20,000 | Điểm thưởng: 5,000
    // Tổng tiền cuối: 140,000
    mockUseCart.mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart,
      cart: mockCartItems,
      cartCount: 3,
      cartSubtotal: 165000,
      discount: 20000,
      pointsDiscount: 5000,
      cartTotal: 140000,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    render(<CartDrawer onCheckout={mockOnCheckout} />);

    // Kiểm tra tên món & topping
    expect(screen.getByText('Matcha Latte Đá Xay')).toBeInTheDocument();
    expect(screen.getByText(/Trân châu trắng, Kem cheese/)).toBeInTheDocument();
    expect(screen.getByText('Trà Đào Cam Sả')).toBeInTheDocument();
    expect(screen.getByText('Không có')).toBeInTheDocument();

    // Kiểm tra hiển thị tiền tệ (tạm tính, giảm giá, tổng thanh toán)
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent(/165\.000/);
    expect(screen.getByTestId('cart-discount')).toHaveTextContent(/-20\.000/);
    expect(screen.getByTestId('cart-points-discount')).toHaveTextContent(/-5\.000/);
    expect(screen.getByTestId('cart-total')).toHaveTextContent(/140\.000/);
  });

  test('4. Tăng/giảm số lượng và xóa món hoạt động đúng', () => {
    mockUseCart.mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart,
      cart: mockCartItems,
      cartCount: 3,
      cartSubtotal: 165000,
      discount: 0,
      pointsDiscount: 0,
      cartTotal: 165000,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    render(<CartDrawer />);

    // Nút tăng của item-1
    const increaseBtn1 = screen.getByLabelText('Tăng số lượng Matcha Latte Đá Xay');
    fireEvent.click(increaseBtn1);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('item-1', 1);

    // Nút giảm của item-1 (quantity = 2 nên không bị disable)
    const decreaseBtn1 = screen.getByLabelText('Giảm số lượng Matcha Latte Đá Xay');
    fireEvent.click(decreaseBtn1);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('item-1', -1);

    // Nút giảm của item-2 (quantity = 1 nên phải bị disable)
    const decreaseBtn2 = screen.getByLabelText('Giảm số lượng Trà Đào Cam Sả');
    expect(decreaseBtn2).toBeDisabled();

    // Xoá món 1
    const removeBtn1 = screen.getByLabelText('Xoá Matcha Latte Đá Xay');
    fireEvent.click(removeBtn1);
    expect(mockRemoveFromCart).toHaveBeenCalledWith('item-1');
  });

  test('5. Bấm nút Thanh toán ngay sẽ đóng Drawer và gọi callback onCheckout', () => {
    mockUseCart.mockReturnValue({
      isCartOpen: true,
      closeCart: mockCloseCart,
      cart: mockCartItems,
      cartCount: 3,
      cartSubtotal: 165000,
      discount: 0,
      pointsDiscount: 0,
      cartTotal: 165000,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    render(<CartDrawer onCheckout={mockOnCheckout} />);

    const checkoutBtn = screen.getByRole('button', { name: /Thanh toán ngay \(3 món\)/i });
    fireEvent.click(checkoutBtn);

    expect(mockCloseCart).toHaveBeenCalledTimes(1);
    expect(mockOnCheckout).toHaveBeenCalledTimes(1);
  });
});