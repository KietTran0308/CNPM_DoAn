import { api, DEFAULT_USER } from '../src/api';

describe('Kiểm tra chức năng API và Giỏ hàng ứng dụng BrewLite', () => {
  beforeEach(() => {
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

  test('Lấy danh sách thực đơn mặc định gồm 14 món', async () => {
    const products = await api.getProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(14);
    expect(products[0].name).toBe('Cà phê sữa');

    const caPheMuoi = products.find((p) => p.name === 'Cà Phê Muối Huế');
    expect(caPheMuoi).toBeDefined();
    expect(caPheMuoi?.price).toBe(39000);
    expect(caPheMuoi?.category).toBe('Cà phê');

    const traSenVang = products.find((p) => p.name === 'Trà Sen Vàng Kem Cheese');
    expect(traSenVang).toBeDefined();
    expect(traSenVang?.price).toBe(49000);
    expect(traSenVang?.category).toBe('Trà');
  });

  test('Lấy chi tiết từng món theo ID', async () => {
    const item = await api.getProductById(1);
    expect(item).not.toBeNull();
    expect(item?.id).toBe(1);
    expect(item?.price).toBe(35000);

    const caPheTrung = await api.getProductById(6);
    expect(caPheTrung).not.toBeNull();
    expect(caPheTrung?.name).toBe('Cà Phê Trứng Hà Nội');
    expect(caPheTrung?.price).toBe(45000);

    const khongTonTai = await api.getProductById(999);
    expect(khongTonTai).toBeNull();
  });

  test('Đăng ký tài khoản mới kiểm tra định dạng email và khởi tạo 0 điểm', async () => {
    await expect(api.register('invalid-email', '123456')).rejects.toThrow(
      'Email không đúng định dạng'
    );

    await expect(api.register('test@brewlite.vn', '12345')).rejects.toThrow(
      'Mật khẩu phải có ít nhất 6 ký tự'
    );

    const result = await api.register('newuser@brewlite.vn', 'password123');
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('newuser@brewlite.vn');
    expect(result.user.loyaltyPoints).toBe(0);
  });

  test('Đăng nhập tài khoản thành công', async () => {
    const result = await api.login('khachhang@brewlite.vn', '123456');
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('khachhang@brewlite.vn');
    expect(result.user.loyaltyPoints).toBe(DEFAULT_USER.loyaltyPoints);
  });

  test('Tạo đơn hàng mới với trạng thái PENDING', async () => {
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

  test('Thanh toán đơn hàng và chống trừ tiền trùng lặp bằng Idempotency-Key', async () => {
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

  test('Xử lý giao dịch không thành công trả về PAYMENT_FAILED', async () => {
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

  test('Lấy danh sách lịch sử đơn hàng của người dùng', async () => {
    const orders = await api.getMyOrders();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
  });

  test('Kiểm tra quy tắc chuyển trạng thái đơn hàng hợp lệ', async () => {
    const { assertTransition, InvalidStateTransitionError } = await import('../src/api');

    expect(() => assertTransition('PAID', 'PREPARING')).not.toThrow();
    expect(() => assertTransition('PREPARING', 'READY')).not.toThrow();
    expect(() => assertTransition('READY', 'COMPLETED')).not.toThrow();

    expect(() => assertTransition('PAID', 'COMPLETED')).toThrow(InvalidStateTransitionError);
    expect(() => assertTransition('PREPARING', 'COMPLETED')).toThrow(InvalidStateTransitionError);
    expect(() => assertTransition('COMPLETED', 'READY')).toThrow(InvalidStateTransitionError);
  });

  test('Cập nhật trạng thái đơn hàng qua các bước pha chế', async () => {
    const res = await api.transitionOrderStatus('1041', 'PREPARING');
    expect(res.order.status).toBe('PREPARING');

    const resReady = await api.transitionOrderStatus('1041', 'READY');
    expect(resReady.order.status).toBe('READY');
    expect(resReady.message).toContain(
      'Đồ uống của bạn đã pha xong. Mời bạn đến quầy đọc mã đơn #1041 để nhận nước.'
    );

    await expect(api.transitionOrderStatus('1041', 'PREPARING')).rejects.toThrow(
      'Lỗi chuyển trạng thái'
    );
  });

  test('Quản lý giỏ hàng với useGioHang (thêm, sửa tùy chọn, áp mã ưu đãi, xóa giỏ)', async () => {
    const { useGioHang } = await import('../src/store/useGioHang');

    useGioHang.getState().clearCart();
    expect(useGioHang.getState().cartLines.length).toBe(0);

    useGioHang.getState().addToCart({
      item: {
        id: 'item_test_1',
        orderId: '',
        productId: 1,
        size: 'M',
        qty: 1,
        lineTotal: 40000,
      },
      productName: 'Cà phê sữa',
      toppings: ['Trân châu'],
      sugar: '100%',
      ice: '100%',
      unitPrice: 40000,
      stock: 10,
    });

    expect(useGioHang.getState().getTotalCartCount()).toBe(1);
    expect(useGioHang.getState().getRawSubtotal()).toBe(40000);

    useGioHang.getState().updateCartQty('item_test_1', 1);
    expect(useGioHang.getState().getTotalCartCount()).toBe(2);
    expect(useGioHang.getState().getRawSubtotal()).toBe(80000);

    useGioHang.getState().updateCartItem('item_test_1', {
      sugar: '70%',
      ice: '50%',
      toppings: ['Trân châu', 'Kem'],
      unitPrice: 50000,
    });
    expect(useGioHang.getState().cartLines[0].sugar).toBe('70%');
    expect(useGioHang.getState().cartLines[0].ice).toBe('50%');
    expect(useGioHang.getState().getRawSubtotal()).toBe(100000);

    useGioHang.getState().applyPromo({ code: 'BREW10', discount: 10000 });
    expect(useGioHang.getState().getDiscountAmount()).toBe(10000);
    expect(useGioHang.getState().getTotalCartPrice()).toBe(90000);

    useGioHang.getState().clearCart();
    expect(useGioHang.getState().cartLines.length).toBe(0);
    expect(useGioHang.getState().getTotalCartPrice()).toBe(0);
  });

  test('Tìm kiếm tiếng Việt không dấu chính xác trên thực đơn', async () => {
    const { removeVietnameseTones } = await import('../src/api');

    expect(removeVietnameseTones('Cà Phê Muối Huế')).toBe('ca phe muoi hue');
    expect(removeVietnameseTones('Trà Ô Long Nhãn Nhục Hạt Chia')).toBe(
      'tra o long nhan nhuc hat chia'
    );

    const products = await api.getProducts();
    const tuKhoa = removeVietnameseTones('muoi hue');
    const ketQua = products.filter((p) =>
      removeVietnameseTones(p.name).includes(tuKhoa)
    );
    expect(ketQua.length).toBe(1);
    expect(ketQua[0].name).toBe('Cà Phê Muối Huế');
  });

  test('Quản lý hình ảnh tập trung trong src/hinhAnh.ts hoạt động đồng bộ với menu', async () => {
    const { LOGO, ANH_MAC_DINH, ANH_MON_NUOC, layDuongDanAnh } = await import('../src/hinhAnh');
    expect(LOGO).toBeDefined();
    expect(typeof ANH_MAC_DINH).toBe('string');
    expect(ANH_MAC_DINH.length).toBeGreaterThan(0);
    expect(ANH_MON_NUOC.caPheMuoi).toBeDefined();
    expect(ANH_MON_NUOC.traSenVang).toBeDefined();
    expect(layDuongDanAnh('public/images/logo.png')).toBe('/images/logo.png');

    const products = await api.getProducts();
    const caPheMuoi = products.find((p) => p.name === 'Cà Phê Muối Huế');
    expect(caPheMuoi?.imageUrl).toBe(ANH_MON_NUOC.caPheMuoi);
  });
});

