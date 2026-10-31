'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  api,
  Product,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  User,
  DEFAULT_PRODUCTS,
  DEFAULT_USER,
  assertTransition,
  getStoredToken,
  setStoredToken,
  getStoredUser,
  setStoredUser,
} from '../api';

import {
  Screen,
  SizeType,
  ToppingType,
  SugarType,
  IceType,
  CartLine,
} from '../types';

import { ModalSuaMon } from '../components/ModalSuaMon';
import { useGioHang } from '../store/useGioHang';
import { QUERY_KEYS } from '../hooks/useTruyVan';
import { DangNhap } from '../man-hinh/DangNhap';
import { ThucDon } from '../man-hinh/ThucDon';
import { ChiTietMon } from '../man-hinh/ChiTietMon';
import { GioHang } from '../man-hinh/GioHang';
import { ThanhToan } from '../man-hinh/ThanhToan';
import { DatHangThanhCong } from '../man-hinh/DatHangThanhCong';
import { LichSuDon } from '../man-hinh/LichSuDon';

function UngDungDatNuoc() {
  const queryClient = useQueryClient();
  const [manHinhHienTai, setManHinhHienTai] = useState<Screen>('auth');
  const [moMenuTaiKhoan, setMoMenuTaiKhoan] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product>(DEFAULT_PRODUCTS[2]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState<SizeType>('M');
  const [selectedToppings, setSelectedToppings] = useState<ToppingType[]>([]);
  const [selectedSugar, setSelectedSugar] = useState<SugarType>('100%');
  const [selectedIce, setSelectedIce] = useState<IceType>('100%');
  const [customerNote, setCustomerNote] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [stockNotice, setStockNotice] = useState<string | null>(null);

  const cartLines = useGioHang((s) => s.cartLines);
  const appliedPromo = useGioHang((s) => s.appliedPromo);
  const promoCodeInput = useGioHang((s) => s.promoCodeInput);
  const promoError = useGioHang((s) => s.promoError);
  const setPromoCodeInput = useGioHang((s) => s.setPromoCodeInput);
  const setPromoError = useGioHang((s) => s.setPromoError);
  const applyPromo = useGioHang((s) => s.applyPromo);
  const removePromo = useGioHang((s) => s.removePromo);
  const clearCart = useGioHang((s) => s.clearCart);
  const addLineToCart = useGioHang((s) => s.addToCart);
  const updateLineQty = useGioHang((s) => s.updateCartQty);
  const updateLineItem = useGioHang((s) => s.updateCartItem);
  const removeLineItem = useGioHang((s) => s.removeCartItem);
  const totalCartCount = useGioHang((s) => s.getTotalCartCount());
  const rawSubtotal = useGioHang((s) => s.getRawSubtotal());
  const discountAmount = useGioHang((s) => s.getDiscountAmount());
  const totalCartPrice = useGioHang((s) => s.getTotalCartPrice());

  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'bank'>('wallet');
  const [walletType, setWalletType] = useState<'MoMo' | 'VNPay'>('MoMo');
  const [cardNumber, setCardNumber] = useState('9704 1985 2468 1234');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [currentPendingOrderId, setCurrentPendingOrderId] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<OrderStatus | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<number>(0);
  const [editProductName, setEditProductName] = useState('');
  const [editBasePrice, setEditBasePrice] = useState(0);
  const [editSize, setEditSize] = useState<SizeType>('M');
  const [editToppings, setEditToppings] = useState<ToppingType[]>([]);
  const [editSugar, setEditSugar] = useState<SugarType>('100%');
  const [editIce, setEditIce] = useState<IceType>('100%');
  const [editNote, setEditNote] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editMaxStock, setEditMaxStock] = useState(50);
  const [editSuccessToast, setEditSuccessToast] = useState(false);

  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{
    type: 'success' | 'error' | 'ready';
    message: string;
    orderId?: string;
  } | null>(null);

  useEffect(() => {
    const existing = getStoredToken();
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    } else {
      setUser(DEFAULT_USER);
    }
    if (existing) {
      setToken(existing);
      setManHinhHienTai('menu');
      taiDanhSachMon();
    } else {
      setManHinhHienTai('auth');
    }
  }, []);

  const taiDanhSachMon = async () => {
    setProductsLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data || DEFAULT_PRODUCTS);
    } catch {
      setProducts(DEFAULT_PRODUCTS);
    } finally {
      setProductsLoading(false);
    }
  };

  const moChiTietMon = async (productId: number) => {
    setStockNotice(null);
    setDetailLoading(true);
    setManHinhHienTai('product-detail');
    setSelectedSize('S');
    setSelectedToppings([]);
    setSelectedSugar('100%');
    setSelectedIce('100%');
    setCustomerNote('');
    setSelectedQty(1);
    setAddingToCart(false);

    try {
      const product = await api.getProductById(productId);
      if (product) {
        setSelectedProduct(product);
      }
    } catch {
    } finally {
      setDetailLoading(false);
    }
  };

  const taiLichSuDon = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getMyOrders();
      setOrderHistory(data || []);
    } catch {
    } finally {
      setHistoryLoading(false);
    }
  };

  const capNhatLichSuDon = (updater: (prev: Order[]) => Order[]) => {
    setOrderHistory((prev) => {
      const updated = updater(prev);
      try {
        localStorage.setItem('brewlite_orders_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const xuLyDangNhapDangKy = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const emailTrimmed = authEmail.trim();
    if (!emailTrimmed || !authPassword.trim()) {
      setAuthError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setAuthError('Email không đúng định dạng');
      return;
    }

    if (authPassword.length < 6) {
      setAuthError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setAuthLoading(true);
    try {
      let res;
      if (authMode === 'login') {
        res = await api.login(authEmail, authPassword);
      } else {
        res = await api.register(authEmail, authPassword);
      }
      if (res.token) {
        setToken(res.token);
        setStoredToken(res.token);
        const loggedUser: User = res.user || {
          id: 'usr_' + Date.now().toString(36),
          email: authEmail.trim(),
          passwordHash: 'hash_masked',
          loyaltyPoints: 0,
        };
        setUser(loggedUser);
        setStoredUser(loggedUser);
        setManHinhHienTai('menu');
        taiDanhSachMon();
      } else {
        setAuthError('Xác thực không thành công.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setAuthLoading(false);
    }
  };

  const xuLyDangXuat = () => {
    setToken(null);
    setStoredToken(null);
    setUser(null);
    setStoredUser(null);
    setMoMenuTaiKhoan(false);
    setManHinhHienTai('auth');
  };

  const tinhGiaSize = (size: SizeType): number => {
    if (size === 'M') return 5000;
    if (size === 'L') return 10000;
    return 0;
  };

  const tinhGiaTopping = (toppings: ToppingType[]): number => {
    return toppings.reduce((sum, t) => {
      if (t === 'Trân châu') return sum + 5000;
      if (t === 'Kem') return sum + 10000;
      return sum;
    }, 0);
  };

  const donGiaHienTai =
    selectedProduct.price + tinhGiaSize(selectedSize) + tinhGiaTopping(selectedToppings);

  const chonTopping = (topping: ToppingType) => {
    setSelectedToppings((prev) =>
      prev.includes(topping) ? prev.filter((t) => t !== topping) : [...prev, topping]
    );
  };

  const laySoLuongMonTrongGio = (productId: number): number => {
    return cartLines
      .filter((line) => line.item.productId === productId)
      .reduce((sum, line) => sum + line.item.qty, 0);
  };

  const xuLyThemNhanhVaoGio = (product: Product) => {
    const soLuongHienCo = laySoLuongMonTrongGio(product.id);
    if (soLuongHienCo + 1 > product.stock) return;

    const newItem: OrderItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      orderId: '',
      productId: product.id,
      size: 'S',
      qty: 1,
      lineTotal: product.price,
      sugar: '100%',
      ice: '100%',
    };
    const newCartLine: CartLine = {
      item: newItem,
      productName: product.name,
      toppings: [],
      sugar: '100%',
      ice: '100%',
      unitPrice: product.price,
      stock: product.stock,
    };
    addLineToCart(newCartLine);
  };

  const xuLyThemVaoGio = () => {
    setStockNotice(null);

    const qtyToAdd = Math.max(1, selectedQty);
    const currentQtyInCart = laySoLuongMonTrongGio(selectedProduct.id);
    if (currentQtyInCart + qtyToAdd > selectedProduct.stock) {
      setStockNotice(`Số lượng món đã đạt mức tồn kho tối đa (${selectedProduct.stock}).`);
      return;
    }

    setAddingToCart(true);

    setTimeout(() => {
      const trimmedNote = customerNote.trim();
      const newItem: OrderItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        orderId: '',
        productId: selectedProduct.id,
        size: selectedSize,
        qty: qtyToAdd,
        lineTotal: donGiaHienTai * qtyToAdd,
        sugar: selectedSugar,
        ice: selectedIce,
        note: trimmedNote || undefined,
      };
      const newCartLine: CartLine = {
        item: newItem,
        productName: selectedProduct.name,
        toppings: selectedToppings,
        sugar: selectedSugar,
        ice: selectedIce,
        note: trimmedNote || undefined,
        unitPrice: donGiaHienTai,
        stock: selectedProduct.stock,
      };
      addLineToCart(newCartLine);

      setAddingToCart(false);
      setManHinhHienTai('menu');
    }, 300);
  };

  const moModalSuaMon = (line: CartLine) => {
    const prod = products.find((p) => p.id === line.item.productId);
    const basePrice = prod
      ? prod.price
      : Math.max(
          0,
          line.unitPrice -
            tinhGiaSize((line.item.size as SizeType) || 'S') -
            tinhGiaTopping(line.toppings)
        );
    setEditingItemId(line.item.id);
    setEditProductId(line.item.productId);
    setEditProductName(line.productName);
    setEditBasePrice(basePrice);
    setEditSize((line.item.size as SizeType) || 'M');
    setEditToppings([...line.toppings]);
    setEditSugar((line.sugar as SugarType) || '100%');
    setEditIce((line.ice as IceType) || '100%');
    setEditNote(line.note || '');
    setEditQty(line.item.qty);
    setEditMaxStock(prod ? prod.stock : line.stock);
  };

  const chonToppingKhiSua = (topping: ToppingType) => {
    setEditToppings((prev) =>
      prev.includes(topping) ? prev.filter((t) => t !== topping) : [...prev, topping]
    );
  };

  const donGiaSauKhiSua = editBasePrice + tinhGiaSize(editSize) + tinhGiaTopping(editToppings);

  const luuMonDaSuaTrongGio = () => {
    if (!editingItemId) return;
    const newUnitPrice = donGiaSauKhiSua;
    const newLineTotal = newUnitPrice * editQty;

    updateLineItem(editingItemId, {
      item: {
        id: editingItemId,
        orderId: '',
        productId: editProductId,
        size: editSize,
        qty: editQty,
        lineTotal: newLineTotal,
        sugar: editSugar,
        ice: editIce,
        note: editNote.trim() || undefined,
      },
      toppings: editToppings,
      sugar: editSugar,
      ice: editIce,
      note: editNote.trim() || undefined,
      unitPrice: newUnitPrice,
    });

    setEditingItemId(null);
    setEditSuccessToast(true);
    setTimeout(() => setEditSuccessToast(false), 2000);
  };

  useEffect(() => {
    if (appliedPromo?.code === 'GIAM10K' && rawSubtotal < 30000 && rawSubtotal > 0) {
      applyPromo(null);
      setPromoError('Mã giảm giá không hợp lệ');
    }
  }, [rawSubtotal, appliedPromo, applyPromo, setPromoError]);

  const xuLyApMaGiamGia = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'BREW10') {
      const discount = Math.round(rawSubtotal * 0.1);
      applyPromo({ code: 'BREW10', discount });
    } else if (code === 'GIAM10K') {
      if (rawSubtotal >= 30000) {
        applyPromo({ code: 'GIAM10K', discount: 10000 });
      } else {
        setPromoError('Mã giảm giá không hợp lệ');
      }
    } else {
      setPromoError('Mã giảm giá không hợp lệ');
    }
  };

  const xuLyNhapSoThe = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const xuLyNhapHanThe = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  const xuLyNhapCvv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardCvv(raw);
  };

  const dinhDangThoiGian = (d: Date = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const DD = pad(d.getDate());
    const MM = pad(d.getMonth() + 1);
    const YYYY = d.getFullYear();
    return `${hh}:${mm} - ${DD}/${MM}/${YYYY}`;
  };

  const xuLyXacNhanThanhToan = async () => {
    if (cartLines.length === 0) return;
    setCheckoutLoading(true);
    setStockError(null);

    for (const line of cartLines) {
      const prod = products.find((p) => p.id === line.item.productId);
      if (!prod || line.item.qty > prod.stock) {
        setStockError(`Sản phẩm ${line.productName} không đủ số lượng tồn kho`);
        setCheckoutLoading(false);
        return;
      }
    }

    try {
      let orderId = currentPendingOrderId;
      const orderItems: OrderItem[] = cartLines.map((line) => line.item);
      const createdAtFormatted = dinhDangThoiGian();

      if (!orderId) {
        const orderRes = await api.createOrder(orderItems, totalCartPrice);
        orderId = orderRes.orderId;
        setCurrentPendingOrderId(orderId);

        const pendingOrder: Order = {
          id: orderId,
          userId: user?.id || 'usr_me',
          status: 'PENDING',
          total: totalCartPrice,
          createdAt: createdAtFormatted,
          items: orderItems,
        };
        capNhatLichSuDon((prev) => [pendingOrder, ...prev.filter((o) => o.id !== orderId)]);
      }

      const idempotencyKey =
        'idemp_' + orderId + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      const methodString =
        paymentMethod === 'wallet'
          ? `Ví điện tử (${walletType})`
          : `Thẻ ngân hàng (${cardNumber.slice(-4)})`;

      const paymentPayload: Payment = {
        id: 'pay_' + Date.now().toString(36),
        orderId,
        idempotencyKey,
        amount: totalCartPrice,
        method: methodString,
      };

      const cleanCardDigits = cardNumber.replace(/\D/g, '');
      const loiTheNganHang = paymentMethod === 'bank' && cleanCardDigits.endsWith('0000');

      const targetStatus: OrderStatus = loiTheNganHang ? 'PAYMENT_FAILED' : 'PAID';
      const payRes = await api.processPayment(paymentPayload, targetStatus);

      if (payRes.status === 'PAID') {
        const paidOrder: Order = {
          id: orderId,
          userId: user?.id || 'usr_me',
          status: 'PAID',
          total: totalCartPrice,
          createdAt: createdAtFormatted,
          items: orderItems,
        };

        capNhatLichSuDon((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: 'PAID', items: o.items || orderItems } : o
          )
        );
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lichSuDon });

        if (!payRes.isDuplicate) {
          setProducts((prev) =>
            prev.map((p) => {
              const matchedLine = cartLines.find((l) => l.item.productId === p.id);
              if (matchedLine) {
                return { ...p, stock: Math.max(0, p.stock - matchedLine.item.qty) };
              }
              return p;
            })
          );

          const earnedPoints = Math.floor(totalCartPrice / 10000);
          if (user && earnedPoints > 0) {
            const updatedUser: User = {
              ...user,
              loyaltyPoints: user.loyaltyPoints + earnedPoints,
            };
            setUser(updatedUser);
            setStoredUser(updatedUser);
          }
        }

        setLastOrder(paidOrder);
        clearCart();
        setCurrentPendingOrderId(null);
        setCheckoutStatus(null);
        setManHinhHienTai('success');
      } else {
        capNhatLichSuDon((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'PAYMENT_FAILED' } : o))
        );
        setCheckoutStatus('PAYMENT_FAILED');
      }
    } catch {
      if (currentPendingOrderId) {
        capNhatLichSuDon((prev) =>
          prev.map((o) => (o.id === currentPendingOrderId ? { ...o, status: 'PAYMENT_FAILED' } : o))
        );
      }
      setCheckoutStatus('PAYMENT_FAILED');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const xuLyThuLaiThanhToan = () => {
    if (!currentPendingOrderId) return;

    capNhatLichSuDon((prev) =>
      prev.map((o) => (o.id === currentPendingOrderId ? { ...o, status: 'PENDING' } : o))
    );
    setCheckoutStatus(null);
  };

  const xuLyHuyDonDangThanhToan = () => {
    if (currentPendingOrderId) {
      capNhatLichSuDon((prev) =>
        prev.map((o) => (o.id === currentPendingOrderId ? { ...o, status: 'CANCELLED' } : o))
      );
    }
    setCurrentPendingOrderId(null);
    setCheckoutStatus(null);
    setManHinhHienTai('cart');
  };

  const xuLyChuyenTrangThaiDon = async (orderId: string, targetStatus: OrderStatus) => {
    const order =
      orderHistory.find((o) => o.id === orderId) ||
      (lastOrder?.id === orderId ? lastOrder : null);
    if (!order) return;

    try {
      assertTransition(order.status, targetStatus);
    } catch {
      return;
    }

    if (targetStatus === 'PENDING') {
      capNhatLichSuDon((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'PENDING' } : o))
      );
      if (lastOrder?.id === orderId) {
        setLastOrder({ ...lastOrder, status: 'PENDING' });
      }

      const idempotencyKey =
        'idemp_' + orderId + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const payload: Payment = {
        id: 'pay_' + Date.now().toString(36),
        orderId,
        idempotencyKey,
        amount: order.total,
        method: 'Thanh toán lại',
      };

      try {
        const res = await api.processPayment(payload, 'PAID');
        if (res.status === 'PAID') {
          capNhatLichSuDon((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: 'PAID' } : o))
          );
          if (lastOrder?.id === orderId) {
            setLastOrder({ ...lastOrder, status: 'PAID' });
          }
          if (!res.isDuplicate) {
            if (order.items) {
              setProducts((prev) =>
                prev.map((p) => {
                  const it = order.items?.find((item) => item.productId === p.id);
                  return it ? { ...p, stock: Math.max(0, p.stock - it.qty) } : p;
                })
              );
            }
            const earned = Math.floor(order.total / 10000);
            if (user && earned > 0) {
              const updatedUser: User = {
                ...user,
                loyaltyPoints: user.loyaltyPoints + earned,
              };
              setUser(updatedUser);
              setStoredUser(updatedUser);
            }
          }
          setStatusNotice({
            type: 'success',
            message: `Đơn hàng #${orderId} đã được thanh toán thành công.`,
            orderId,
          });
        } else {
          capNhatLichSuDon((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: 'PAYMENT_FAILED' } : o))
          );
          if (lastOrder?.id === orderId) {
            setLastOrder({ ...lastOrder, status: 'PAYMENT_FAILED' });
          }
          setStatusNotice({
            type: 'error',
            message: `Thanh toán lại cho đơn hàng #${orderId} không thành công.`,
            orderId,
          });
        }
      } catch {
        capNhatLichSuDon((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'PAYMENT_FAILED' } : o))
        );
        if (lastOrder?.id === orderId) {
          setLastOrder({ ...lastOrder, status: 'PAYMENT_FAILED' });
        }
        setStatusNotice({
          type: 'error',
          message: `Lỗi kết nối khi thanh toán lại đơn #${orderId}.`,
          orderId,
        });
      }
    } else {
      if (order.status === 'PAID' && targetStatus === 'CANCELLED') {
        const pointsToRevert = Math.floor(order.total / 10000);
        if (user && pointsToRevert > 0) {
          const updatedUser: User = {
            ...user,
            loyaltyPoints: Math.max(0, user.loyaltyPoints - pointsToRevert),
          };
          setUser(updatedUser);
          setStoredUser(updatedUser);
        }
        if (order.items) {
          setProducts((prev) =>
            prev.map((p) => {
              const it = order.items?.find((item) => item.productId === p.id);
              return it ? { ...p, stock: p.stock + it.qty } : p;
            })
          );
        }
      }

      capNhatLichSuDon((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: targetStatus } : o))
      );
      if (lastOrder?.id === orderId) {
        setLastOrder({ ...lastOrder, status: targetStatus });
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lichSuDon });

      if (targetStatus === 'READY') {
        setStatusNotice({
          type: 'ready',
          message: `Đồ uống của bạn đã pha xong. Mời bạn đến quầy đọc mã đơn #${orderId} để nhận nước.`,
          orderId,
        });
      } else if (targetStatus === 'PREPARING') {
        setStatusNotice({
          type: 'success',
          message: `Đơn hàng #${orderId} đã được quầy tiếp nhận và đang tiến hành pha chế.`,
          orderId,
        });
      } else if (targetStatus === 'COMPLETED') {
        setStatusNotice({
          type: 'success',
          message: `Đơn hàng #${orderId} đã được bàn giao hoàn tất.`,
          orderId,
        });
      } else if (targetStatus === 'CANCELLED') {
        setStatusNotice({
          type: 'success',
          message: `Đơn hàng #${orderId} đã được hủy thành công.`,
          orderId,
        });
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-stone-50 text-neutral-900 font-sans flex flex-col">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex-1 flex flex-col relative">
        {manHinhHienTai === 'auth' && (
          <DangNhap
            authMode={authMode}
            setAuthMode={setAuthMode}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authError={authError}
            setAuthError={setAuthError}
            authLoading={authLoading}
            onAuthSubmit={xuLyDangNhapDangKy}
          />
        )}

        {manHinhHienTai === 'menu' && (
          <ThucDon
            user={user}
            menuOpen={moMenuTaiKhoan}
            setMenuOpen={setMoMenuTaiKhoan}
            onNavigateHistory={() => {
              taiLichSuDon();
              setManHinhHienTai('history');
            }}
            onLogout={xuLyDangXuat}
            products={products}
            productsLoading={productsLoading}
            onOpenProductDetail={moChiTietMon}
            totalCartCount={totalCartCount}
            onViewCart={() => setManHinhHienTai('cart')}
            onQuickAddProduct={xuLyThemNhanhVaoGio}
          />
        )}

        {manHinhHienTai === 'product-detail' && (
          <ChiTietMon
            selectedProduct={selectedProduct}
            user={user}
            detailLoading={detailLoading}
            stockNotice={stockNotice}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            selectedToppings={selectedToppings}
            toggleTopping={chonTopping}
            selectedSugar={selectedSugar}
            setSelectedSugar={setSelectedSugar}
            selectedIce={selectedIce}
            setSelectedIce={setSelectedIce}
            customerNote={customerNote}
            setCustomerNote={setCustomerNote}
            selectedQty={selectedQty}
            setSelectedQty={setSelectedQty}
            currentUnitPrice={donGiaHienTai}
            addingToCart={addingToCart}
            onAddToCart={xuLyThemVaoGio}
            onBack={() => setManHinhHienTai('menu')}
          />
        )}

        {manHinhHienTai === 'cart' && (
          <GioHang
            cartLines={cartLines}
            user={user}
            editSuccessToast={editSuccessToast}
            promoCodeInput={promoCodeInput}
            setPromoCodeInput={setPromoCodeInput}
            appliedPromo={appliedPromo}
            promoError={promoError}
            setPromoError={setPromoError}
            rawSubtotal={rawSubtotal}
            discountAmount={discountAmount}
            totalCartPrice={totalCartPrice}
            onBack={() => setManHinhHienTai('menu')}
            onOpenEditModal={moModalSuaMon}
            onUpdateCartQty={updateLineQty}
            onRemoveCartItem={removeLineItem}
            onClearCart={clearCart}
            onApplyPromo={xuLyApMaGiamGia}
            onRemovePromo={removePromo}
            onCheckout={() => {
              setCheckoutStatus(null);
              setManHinhHienTai('checkout');
            }}
          />
        )}

        {manHinhHienTai === 'checkout' && (
          <ThanhToan
            user={user}
            totalCartPrice={totalCartPrice}
            cartLines={cartLines}
            stockError={stockError}
            setStockError={setStockError}
            checkoutStatus={checkoutStatus}
            checkoutLoading={checkoutLoading}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            walletType={walletType}
            setWalletType={setWalletType}
            cardNumber={cardNumber}
            cardExpiry={cardExpiry}
            cardCvv={cardCvv}
            onCardNumberChange={xuLyNhapSoThe}
            onExpiryChange={xuLyNhapHanThe}
            onCvvChange={xuLyNhapCvv}
            onBackToCart={() => setManHinhHienTai('cart')}
            onRetryPayment={xuLyThuLaiThanhToan}
            onCancelCurrentOrder={xuLyHuyDonDangThanhToan}
            onConfirmPay={xuLyXacNhanThanhToan}
          />
        )}

        {manHinhHienTai === 'success' && (
          <DatHangThanhCong
            lastOrder={lastOrder}
            user={user}
            onBackToMenu={() => {
              setStatusNotice(null);
              setManHinhHienTai('menu');
            }}
            onViewHistory={() => {
              taiLichSuDon();
              setManHinhHienTai('history');
            }}
            onTransitionOrder={xuLyChuyenTrangThaiDon}
            statusNotice={statusNotice}
            onClearNotice={() => setStatusNotice(null)}
          />
        )}

        {manHinhHienTai === 'history' && (
          <LichSuDon
            user={user}
            orderHistory={orderHistory}
            historyLoading={historyLoading}
            products={products}
            onBackToMenu={() => {
              setStatusNotice(null);
              setManHinhHienTai('menu');
            }}
            onTransition={xuLyChuyenTrangThaiDon}
            onRetryFromHistory={(orderId) => {
              setStatusNotice(null);
              setCurrentPendingOrderId(orderId);
              setCheckoutStatus(null);
              setManHinhHienTai('checkout');
            }}
            statusNotice={statusNotice}
            onClearNotice={() => setStatusNotice(null)}
          />
        )}

        <ModalSuaMon
          editingItemId={editingItemId}
          editProductName={editProductName}
          editBasePrice={editBasePrice}
          editSize={editSize}
          setEditSize={setEditSize}
          editToppings={editToppings}
          onToggleEditTopping={chonToppingKhiSua}
          editSugar={editSugar}
          setEditSugar={setEditSugar}
          editIce={editIce}
          setEditIce={setEditIce}
          editNote={editNote}
          setEditNote={setEditNote}
          editQty={editQty}
          setEditQty={setEditQty}
          editMaxStock={editMaxStock}
          editUnitPrice={donGiaSauKhiSua}
          getSizeExtra={tinhGiaSize}
          onClose={() => setEditingItemId(null)}
          onSave={luuMonDaSuaTrongGio}
        />
      </main>
    </div>
  );
}

export default function Home() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <UngDungDatNuoc />
    </QueryClientProvider>
  );
}
