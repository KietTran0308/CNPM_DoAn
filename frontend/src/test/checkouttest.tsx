// frontend/src/__tests__/checkout.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CheckoutPage } from '../pages/CheckoutPage';
import { useCart } from '../context/CartContext';
import { createOrderApi } from '../services/order.api';
import { processPaymentApi } from '../services/payment.api';

jest.mock('../context/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('../services/order.api', () => ({
  createOrderApi: jest.fn(),
}));

jest.mock('../services/payment.api', () => ({
  processPaymentApi: jest.fn(),
}));

const mockUseCart = useCart as jest.Mock;
const mockCreateOrderApi = createOrderApi as jest.Mock;
const mockProcessPaymentApi = processPaymentApi as jest.Mock;

const mockCartItems = [
  {
    cartItemId: 'item-1',
    productId: 'prod-1',
    name: 'Matcha Latte Đá Xay',
    image: 'https://via.placeholder.com/64',
    size: { id: 'size-l', name: 'L', extraPrice: 10000 },
    toppings: [{ id: 'top-1', name: 'Trân châu trắng', price: 5000 }],
    iceLevel: '70%',
    sugarLevel: '50%',
    quantity: 2,
    unitPrice: 50000,
    totalPrice: 100000,
    note: 'Ít ngọt',
  },
];

describe('CheckoutPage Component Tests', () => {
  const mockClearCart = jest.fn();
  const originalLocation = window.location;

  beforeAll(() => {
    delete (window as any).location;
    (window as any).location = {
      origin: 'http://localhost:3000',
      href: '',
    };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = '';
    mockUseCart.mockReturnValue({
      cart: mockCartItems,
      cartCount: 2,
      cartSubtotal: 100000,
      discount: 15000,
      pointsDiscount: 5000,
      voucherCode: 'MATCHA15',
      cartTotal: 80000,
      pickupBranch: 'Chi nhánh Quận 1',
      pickupTimeType: 'asap',
      scheduledTime: undefined,
      pickupNote: 'Lấy tại quầy',
      clearCart: mockClearCart,
    });
  });

  test('1. Hiển thị màn hình trống khi giỏ hàng không có sản phẩm', () => {
    mockUseCart.mockReturnValue({
      cart: [],
      cartCount: 0,
      cartSubtotal: 0,
      discount: 0,
      pointsDiscount: 0,
      cartTotal: 0,
    });

    render(<CheckoutPage />);
    expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quay lại thực đơn/i })).toHaveAttribute('href', '/');
  });

  test('2. Kiểm tra hiển thị tổng tiền: Tạm tính, Giảm giá, Điểm thưởng và Tổng thanh toán', () => {
    render(<CheckoutPage />);

    expect(screen.getByText('Matcha Latte Đá Xay')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-subtotal')).toHaveTextContent(/100\.000/);
    expect(screen.getByTestId('checkout-discount')).toHaveTextContent(/-15\.000/);
    expect(screen.getByTestId('checkout-points-discount')).toHaveTextContent(/-5\.000/);
    expect(screen.getByTestId('checkout-total')).toHaveTextContent(/80\.000/);
  });

  test('3. Đặt hàng thành công với COD -> gọi clearCart và chuyển trang xác nhận', async () => {
    mockCreateOrderApi.mockResolvedValueOnce({ id: 'ORD-12345' });
    mockProcessPaymentApi.mockResolvedValueOnce({ status: 'SUCCESS' }); // COD không có paymentUrl

    render(<CheckoutPage />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
      target: { value: 'Nguyễn Thành Đạt' },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: '0912345678' },
    });

    // Chọn phương thức COD
    const codRadio = screen.getByDisplayValue('cod');
    fireEvent.click(codRadio);

    const submitBtn = screen.getByRole('button', { name: /Xác nhận & Đặt hàng/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateOrderApi).toHaveBeenCalledTimes(1);
      expect(mockProcessPaymentApi).toHaveBeenCalledWith({
        orderId: 'ORD-12345',
        amount: 80000,
        method: 'cod',
        returnUrl: 'http://localhost:3000/orders/ORD-12345/complete',
      });
      expect(mockClearCart).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('/orders/ORD-12345/confirmation');
    });
  });

  test('4. Đặt hàng qua cổng ví điện tử (MoMo) -> chuyển tới paymentUrl và KHÔNG xoá giỏ hàng sớm', async () => {
    mockCreateOrderApi.mockResolvedValueOnce({ id: 'ORD-999' });
    mockProcessPaymentApi.mockResolvedValueOnce({
      paymentUrl: 'https://test-payment.momo.vn/pay/ORD-999',
    });

    render(<CheckoutPage />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
      target: { value: 'Nguyễn Văn A' },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: '0987654321' },
    });

    const submitBtn = screen.getByRole('button', { name: /Xác nhận & Đặt hàng/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockClearCart).not.toHaveBeenCalled();
      expect(window.location.href).toBe('https://test-payment.momo.vn/pay/ORD-999');
    });
  });

  test('5. Xử lý lỗi thanh toán (API thất bại) -> Hiển thị thông báo lỗi, giữ nguyên giỏ hàng và mở khoá nút thử lại', async () => {
    mockCreateOrderApi.mockResolvedValueOnce({ id: 'ORD-ERR' });
    mockProcessPaymentApi.mockRejectedValueOnce(
      new Error('Giao dịch bị từ chối bởi cổng thanh toán MoMo.')
    );

    render(<CheckoutPage />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
      target: { value: 'Nguyễn Văn B' },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: '0909111222' },
    });

    const submitBtn = screen.getByRole('button', { name: /Xác nhận & Đặt hàng/i });
    fireEvent.click(submitBtn);

    // Chờ thông báo lỗi xuất hiện
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText('Giao dịch bị từ chối bởi cổng thanh toán MoMo.')
      ).toBeInTheDocument();
    });

    // Giỏ hàng tuyệt đối không bị xoá
    expect(mockClearCart).not.toHaveBeenCalled();

    // Nút đặt hàng được mở khoá để người dùng bấm thử lại
    expect(submitBtn).not.toBeDisabled();
  });

  test('6. Chống spam click nhiều lần liên tiếp khi đang xử lý đơn hàng', async () => {
    let resolveOrder: any;
    mockCreateOrderApi.mockReturnValue(
      new Promise((resolve) => {
        resolveOrder = resolve;
      })
    );

    render(<CheckoutPage />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
      target: { value: 'Trần Văn C' },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: '0911222333' },
    });

    const submitBtn = screen.getByRole('button', { name: /Xác nhận & Đặt hàng/i });
    
    // Click liên tiếp 3 lần
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    expect(mockCreateOrderApi).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Đang xử lý đơn hàng...')).toBeInTheDocument();
  });
});