import { api, DEFAULT_PRODUCTS, DEFAULT_USER } from '../src/api';

describe('Frontend API Client & Mock Fallback Tests', () => {
  beforeEach(() => {
    // Clear in-memory localStorage mock
    const store: Record<string, string> = {};
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          for (const key of Object.keys(store)) delete store[key];
        },
      },
      writable: true,
      configurable: true,
    });
  });

  test('GET /products: Trả về danh sách sản phẩm mẫu khi server offline', async () => {
    const products = await api.getProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(DEFAULT_PRODUCTS.length);
    expect(products[0].name).toBe('Cà phê sữa');
  });

  test('GET /products/:id: Trả về đúng sản phẩm theo id', async () => {
    const item = await api.getProductById(1);
    expect(item).not.toBeNull();
    expect(item?.id).toBe(1);
    expect(item?.price).toBe(35000);

    const nonExistent = await api.getProductById(999);
    expect(nonExistent).toBeNull();
  });

  test('POST /auth/register: Kiểm tra validation và khởi tạo user mới với loyaltyPoints: 0', async () => {
    // Email không hợp lệ
    await expect(api.register('invalid-email', '123456')).rejects.toThrow(
      'Email không đúng định dạng'
    );

    // Mật khẩu ngắn hơn 6 ký tự
    await expect(api.register('test@brewlite.vn', '12345')).rejects.toThrow(
      'Mật khẩu phải có ít nhất 6 ký tự'
    );

    // Đăng ký thành công
    const result = await api.register('newuser@brewlite.vn', 'password123');
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('newuser@brewlite.vn');
    expect(result.user.loyaltyPoints).toBe(0);
  });

  test('POST /auth/login: Đăng nhập thành công trả về thông tin user và JWT', async () => {
    const result = await api.login('khachhang@brewlite.vn', '123456');
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('khachhang@brewlite.vn');
    expect(result.user.loyaltyPoints).toBe(DEFAULT_USER.loyaltyPoints);
  });

  test('POST /orders: Tạo đơn hàng với trạng thái ban đầu PENDING', async () => {
    const order = await api.createOrder(
      [
        {
          id: 'item_1',
          orderId: '',
          productId: 1,
          size: 'M',
          qty: 2,
          lineTotal: 70000,
        },
      ],
      70000
    );
    expect(order.orderId).toBeDefined();
    expect(order.status).toBe('PENDING');
  });

  test('POST /payments: Xử lý thanh toán, cờ Idempotency-Key và tích lũy điểm thưởng', async () => {
    const key = 'test_key_' + Date.now();
    const res1 = await api.processPayment({
      id: 'pay_1',
      orderId: '1041',
      idempotencyKey: key,
      amount: 100000,
      method: 'MOMO',
    });

    expect(res1.status).toBe('PAID');
    expect(res1.isDuplicate).toBe(false);

    // Gửi lại cùng idempotencyKey -> trả về cờ isDuplicate: true
    const res2 = await api.processPayment({
      id: 'pay_1_dup',
      orderId: '1041',
      idempotencyKey: key,
      amount: 100000,
      method: 'MOMO',
    });

    expect(res2.status).toBe('PAID');
    expect(res2.isDuplicate).toBe(true);
  });

  test('POST /payments: Giả lập lỗi thanh toán (simulateStatus = PAYMENT_FAILED)', async () => {
    const key = 'fail_key_' + Date.now();
    const res = await api.processPayment(
      {
        id: 'pay_fail',
        orderId: '1042',
        idempotencyKey: key,
        amount: 50000,
        method: 'VNPAY',
      },
      'PAYMENT_FAILED'
    );

    expect(res.status).toBe('PAYMENT_FAILED');
  });

  test('GET /orders/me: Lấy lịch sử đơn hàng', async () => {
    const orders = await api.getMyOrders();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
  });

  test('Order State Machine: Cho phép các chuyển đổi hợp lệ và chặn thao tác nhảy cóc sai quy tắc', async () => {
    const { assertTransition, InvalidStateTransitionError } = await import('../src/api');

    // Chuyển đổi tuần tự hợp lệ
    expect(() => assertTransition('PAID', 'PREPARING')).not.toThrow();
    expect(() => assertTransition('PREPARING', 'READY')).not.toThrow();
    expect(() => assertTransition('READY', 'COMPLETED')).not.toThrow();

    // Chặn nhảy cóc từ PAID sang COMPLETED
    expect(() => assertTransition('PAID', 'COMPLETED')).toThrow(InvalidStateTransitionError);

    // Chặn nhảy cóc từ PREPARING sang COMPLETED
    expect(() => assertTransition('PREPARING', 'COMPLETED')).toThrow(InvalidStateTransitionError);

    // Chặn chuyển đổi từ trạng thái kết thúc COMPLETED
    expect(() => assertTransition('COMPLETED', 'READY')).toThrow(InvalidStateTransitionError);
  });

  test('PATCH /orders/:id/status: Cập nhật trạng thái và trả về thông báo quầy khi READY', async () => {
    const res = await api.transitionOrderStatus('1041', 'PREPARING');
    expect(res.order.status).toBe('PREPARING');

    const resReady = await api.transitionOrderStatus('1041', 'READY');
    expect(resReady.order.status).toBe('READY');
    expect(resReady.message).toContain('Đồ uống của bạn đã pha xong. Mời bạn đến quầy đọc mã đơn #1041 để nhận nước.');

    // Thử chuyển đổi sai quy tắc qua api.transitionOrderStatus sẽ ném lỗi
    await expect(api.transitionOrderStatus('1041', 'PREPARING')).rejects.toThrow('Lỗi State Machine');
  });
});
