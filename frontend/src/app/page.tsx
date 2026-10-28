'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

import { EditItemModal } from '../components/EditItemModal';
import { useCartStore } from '../store/useCartStore';
import { AuthScreen } from '../screens/AuthScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { SuccessScreen } from '../screens/SuccessScreen';
import { HistoryScreen } from '../screens/HistoryScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function BrewLiteApp() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [menuOpen, setMenuOpen] = useState(false);

  // Authentication & Loyalty State (Task 10 - User.loyaltyPoints)
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Products State (GET /products)
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(false);

  // Product Detail (GET /products/:id)
  const [selectedProduct, setSelectedProduct] = useState<Product>(DEFAULT_PRODUCTS[2]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState<SizeType>('M');
  const [selectedToppings, setSelectedToppings] = useState<ToppingType[]>([]);
  const [selectedSugar, setSelectedSugar] = useState<SugarType>('100%');
  const [selectedIce, setSelectedIce] = useState<IceType>('100%');
  const [customerNote, setCustomerNote] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [stockNotice, setStockNotice] = useState<string | null>(null);

  // Cart State (Zustand Store with localStorage persistence)
  const cartLines = useCartStore((s) => s.cartLines);
  const appliedPromo = useCartStore((s) => s.appliedPromo);
  const promoCodeInput = useCartStore((s) => s.promoCodeInput);
  const promoError = useCartStore((s) => s.promoError);
  const setPromoCodeInput = useCartStore((s) => s.setPromoCodeInput);
  const setPromoError = useCartStore((s) => s.setPromoError);
  const applyPromo = useCartStore((s) => s.applyPromo);
  const removePromo = useCartStore((s) => s.removePromo);
  const clearCart = useCartStore((s) => s.clearCart);
  const addLineToCart = useCartStore((s) => s.addToCart);
  const updateLineQty = useCartStore((s) => s.updateCartQty);
  const updateLineItem = useCartStore((s) => s.updateCartItem);
  const removeLineItem = useCartStore((s) => s.removeCartItem);
  const totalCartCount = useCartStore((s) => s.getTotalCartCount());
  const rawSubtotal = useCartStore((s) => s.getRawSubtotal());
  const discountAmount = useCartStore((s) => s.getDiscountAmount());
  const totalCartPrice = useCartStore((s) => s.getTotalCartPrice());

  // Checkout State & Stock Check
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'bank'>('wallet');
  const [walletType, setWalletType] = useState<'MoMo' | 'VNPay'>('MoMo');
  const [cardNumber, setCardNumber] = useState('9704 1985 2468 1234');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [currentPendingOrderId, setCurrentPendingOrderId] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<OrderStatus | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [simulateWalletError, setSimulateWalletError] = useState(false);

  // Edit Cart Item State (Task: Chỉnh sửa sản phẩm trực tiếp trong Giỏ hàng)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editBasePrice, setEditBasePrice] = useState(0);
  const [editSize, setEditSize] = useState<SizeType>('M');
  const [editToppings, setEditToppings] = useState<ToppingType[]>([]);
  const [editSugar, setEditSugar] = useState<SugarType>('100%');
  const [editIce, setEditIce] = useState<IceType>('100%');
  const [editNote, setEditNote] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editSuccessToast, setEditSuccessToast] = useState(false);

  // Confirmation State
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Order History State (GET /orders/me)
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{
    type: 'success' | 'error' | 'ready';
    message: string;
    orderId?: string;
  } | null>(null);

  // Check initial token and user
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
      setCurrentScreen('menu');
      fetchProducts();
    } else {
      setCurrentScreen('auth');
    }
  }, []);

  // 1. GET /products
  const fetchProducts = async () => {
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

  // 2. GET /products/:id
  const openProductDetail = async (productId: number) => {
    setStockNotice(null);
    setDetailLoading(true);
    setCurrentScreen('product-detail');
    setSelectedSize('S');
    setSelectedToppings([]);
    setSelectedSugar('100%');
    setSelectedIce('100%');
    setCustomerNote('');
    setAddingToCart(false);

    try {
      const product = await api.getProductById(productId);
      if (product) {
        setSelectedProduct(product);
      }
    } catch {
      // Fallback
    } finally {
      setDetailLoading(false);
    }
  };

  // 7. GET /orders/me
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getMyOrders();
      setOrderHistory(data || []);
    } catch {
      // fallback
    } finally {
      setHistoryLoading(false);
    }
  };

  // Save updated orders into localStorage and state
  const syncOrderHistory = (updater: (prev: Order[]) => Order[]) => {
    setOrderHistory((prev) => {
      const updated = updater(prev);
      try {
        localStorage.setItem('brewlite_orders_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // --- Auth Handlers ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const emailTrimmed = authEmail.trim();
    if (!emailTrimmed || !authPassword.trim()) {
      setAuthError('Vui lòng nhập đầy đủ Email và Password.');
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
        setCurrentScreen('menu');
        fetchProducts();
      } else {
        setAuthError('Xác thực không thành công.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setStoredToken(null);
    setUser(null);
    setStoredUser(null);
    setMenuOpen(false);
    setCurrentScreen('auth');
  };

  // --- Customization Helpers ---
  const getSizeExtra = (size: SizeType): number => {
    if (size === 'M') return 5000;
    if (size === 'L') return 10000;
    return 0;
  };

  const getToppingsExtra = (toppings: ToppingType[]): number => {
    return toppings.reduce((sum, t) => {
      if (t === 'Trân châu') return sum + 5000;
      if (t === 'Kem') return sum + 10000;
      return sum;
    }, 0);
  };

  const currentUnitPrice =
    selectedProduct.price + getSizeExtra(selectedSize) + getToppingsExtra(selectedToppings);

  const toggleTopping = (topping: ToppingType) => {
    setSelectedToppings((prev) =>
      prev.includes(topping) ? prev.filter((t) => t !== topping) : [...prev, topping]
    );
  };

  const getProductTotalInCart = (productId: number): number => {
    return cartLines
      .filter((line) => line.item.productId === productId)
      .reduce((sum, line) => sum + line.item.qty, 0);
  };

  // --- Cart Handlers ---
  const handleAddToCart = () => {
    setStockNotice(null);

    const currentQtyInCart = getProductTotalInCart(selectedProduct.id);
    if (currentQtyInCart + 1 > selectedProduct.stock) {
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
        qty: 1,
        lineTotal: currentUnitPrice,
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
        unitPrice: currentUnitPrice,
        stock: selectedProduct.stock,
      };
      addLineToCart(newCartLine);

      setAddingToCart(false);
      setCurrentScreen('cart');
    }, 500);
  };

  const updateCartQty = (itemId: string, delta: number) => {
    updateLineQty(itemId, delta);
  };

  const removeCartItem = (itemId: string) => {
    removeLineItem(itemId);
  };

  // Mở modal chỉnh sửa món trong giỏ hàng (Yêu cầu bổ sung)
  const handleOpenEditModal = (line: CartLine) => {
    const prod = products.find((p) => p.id === line.item.productId);
    const basePrice = prod ? prod.price : line.unitPrice;
    setEditingItemId(line.item.id);
    setEditProductName(line.productName);
    setEditBasePrice(basePrice);
    setEditSize((line.item.size as SizeType) || 'M');
    setEditToppings([...line.toppings]);
    setEditSugar((line.sugar as SugarType) || '100%');
    setEditIce((line.ice as IceType) || '100%');
    setEditNote(line.note || '');
    setEditQty(line.item.qty);
  };

  const handleToggleEditTopping = (topping: ToppingType) => {
    setEditToppings((prev) =>
      prev.includes(topping) ? prev.filter((t) => t !== topping) : [...prev, topping]
    );
  };

  const editUnitPrice = editBasePrice + getSizeExtra(editSize) + getToppingsExtra(editToppings);

  const handleSaveEditedCartItem = () => {
    if (!editingItemId) return;
    const newUnitPrice = editUnitPrice;
    const newLineTotal = newUnitPrice * editQty;

    updateLineItem(editingItemId, {
      item: {
        id: editingItemId,
        orderId: '',
        productId: selectedProduct?.id || 0,
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

  // Tự động kiểm tra điều kiện mã GIAM10K khi số lượng món trong giỏ thay đổi
  useEffect(() => {
    if (appliedPromo?.code === 'GIAM10K' && rawSubtotal < 30000 && rawSubtotal > 0) {
      applyPromo(null);
      setPromoError('Mã giảm giá không hợp lệ');
    }
  }, [rawSubtotal, appliedPromo, applyPromo, setPromoError]);

  // Xử lý áp dụng mã giảm giá
  const handleApplyPromo = (e: React.FormEvent) => {
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

  const handleRemovePromo = () => {
    removePromo();
  };

  // Bank Card Input Formatter
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardCvv(raw);
  };

  // Helper to format date as HH:mm - DD/MM/YYYY
  const formatOrderDate = (d: Date = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const DD = pad(d.getDate());
    const MM = pad(d.getMonth() + 1);
    const YYYY = d.getFullYear();
    return `${hh}:${mm} - ${DD}/${MM}/${YYYY}`;
  };

  // Handle "Xác nhận trả" (Task 10: Idempotent Payment, Stock Check, Loyalty Points)
  const handleConfirmPay = async () => {
    if (cartLines.length === 0) return;
    setCheckoutLoading(true);
    setStockError(null);

    // 1. Kiểm soát tồn kho (Product.stock) trước khi tạo đơn/thanh toán
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
      const createdAtFormatted = formatOrderDate();

      // 2. POST /orders: Tạo đơn ở trạng thái PENDING nếu chưa có (dùng total sau giảm giá)
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
        syncOrderHistory((prev) => [pendingOrder, ...prev.filter((o) => o.id !== orderId)]);
      }

      // 3. Thanh toán Idempotent (Idempotency-Key)
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

      // Quy ước lỗi thông minh: Nếu thẻ có đuôi "0000" hoặc bật giả lập lỗi ví điện tử -> PAYMENT_FAILED
      const cleanCardDigits = cardNumber.replace(/\D/g, '');
      const isSimulatedCardError = paymentMethod === 'bank' && cleanCardDigits.endsWith('0000');
      const isSimulatedWalletFail = paymentMethod === 'wallet' && simulateWalletError;

      const targetStatus: OrderStatus = (isSimulatedCardError || isSimulatedWalletFail)
        ? 'PAYMENT_FAILED'
        : 'PAID';
      const payRes = await api.processPayment(paymentPayload, targetStatus);

      if (payRes.status === 'PAID') {
        // SUCCESS: PENDING -> PAID
        const paidOrder: Order = {
          id: orderId,
          userId: user?.id || 'usr_me',
          status: 'PAID',
          total: totalCartPrice,
          createdAt: createdAtFormatted,
          items: orderItems,
        };

        syncOrderHistory((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'PAID', items: o.items || orderItems } : o))
        );

        // Chỉ trừ tồn kho và cộng điểm nếu không phải request gửi trùng lặp
        if (!payRes.isDuplicate) {
          // Trừ số lượng tồn kho của các sản phẩm tương ứng
          setProducts((prev) =>
            prev.map((p) => {
              const matchedLine = cartLines.find((l) => l.item.productId === p.id);
              if (matchedLine) {
                return { ...p, stock: Math.max(0, p.stock - matchedLine.item.qty) };
              }
              return p;
            })
          );

          // Tích điểm thưởng loyaltyPoints: Cứ mỗi 10.000đ = 1 điểm (làm tròn xuống)
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
        clearCart(); // Dọn sạch giỏ hàng & reset khuyến mãi qua Zustand store
        setCurrentPendingOrderId(null);
        setCheckoutStatus(null);
        setCurrentScreen('success');
      } else {
        // FAILURE: PENDING -> PAYMENT_FAILED (giỏ hàng được giữ nguyên, không trừ tồn kho, không cộng điểm)
        syncOrderHistory((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'PAYMENT_FAILED' } : o))
        );
        setCheckoutStatus('PAYMENT_FAILED');
      }
    } catch {
      if (currentPendingOrderId) {
        syncOrderHistory((prev) =>
          prev.map((o) => (o.id === currentPendingOrderId ? { ...o, status: 'PAYMENT_FAILED' } : o))
        );
      }
      setCheckoutStatus('PAYMENT_FAILED');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // From PAYMENT_FAILED: "Thử lại" -> quay về PENDING rồi thanh toán lại
  const handleRetryPayment = () => {
    if (!currentPendingOrderId) return;

    syncOrderHistory((prev) =>
      prev.map((o) => (o.id === currentPendingOrderId ? { ...o, status: 'PENDING' } : o))
    );
    setCheckoutStatus(null); // Cho phép người dùng chỉnh lại số thẻ hoặc bấm trả lại
  };

  // From PAYMENT_FAILED: "Hủy" -> CANCELLED
  const handleCancelCurrentOrder = () => {
    if (currentPendingOrderId) {
      syncOrderHistory((prev) =>
        prev.map((o) => (o.id === currentPendingOrderId ? { ...o, status: 'CANCELLED' } : o))
      );
    }
    setCurrentPendingOrderId(null);
    setCheckoutStatus(null);
    setCurrentScreen('cart');
  };

  const handleHistoryTransition = async (orderId: string, targetStatus: OrderStatus) => {
    const order =
      orderHistory.find((o) => o.id === orderId) ||
      (lastOrder?.id === orderId ? lastOrder : null);
    if (!order) return;

    // Kiểm tra quy tắc chuyển trạng thái thông qua assertTransition (Task 10)
    try {
      assertTransition(order.status, targetStatus);
    } catch {
      return;
    }

    if (targetStatus === 'PENDING') {
      // Retry payment from history: PENDING -> PAID
      syncOrderHistory((prev) =>
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
          syncOrderHistory((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: 'PAID' } : o))
          );
          if (lastOrder?.id === orderId) {
            setLastOrder({ ...lastOrder, status: 'PAID' });
          }
          if (!res.isDuplicate) {
            // Trừ tồn kho và cộng điểm
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
            message: `Đơn hàng #${orderId} đã được thanh toán thành công (PAID).`,
            orderId,
          });
        } else {
          syncOrderHistory((prev) =>
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
        syncOrderHistory((prev) =>
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
      // Chuyển sang trạng thái khác (PREPARING, READY, COMPLETED, CANCELLED)
      // Nếu hủy đơn hàng đã PAID -> hoàn lại điểm thưởng và tồn kho
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

      syncOrderHistory((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: targetStatus } : o))
      );
      if (lastOrder?.id === orderId) {
        setLastOrder({ ...lastOrder, status: targetStatus });
      }

      // Thông báo phản hồi kết quả chuyển trạng thái
      if (targetStatus === 'READY') {
        setStatusNotice({
          type: 'ready',
          message: `Đồ uống của bạn đã pha xong. Mời bạn đến quầy đọc mã đơn #${orderId} để nhận nước.`,
          orderId,
        });
      } else if (targetStatus === 'PREPARING') {
        setStatusNotice({
          type: 'success',
          message: `Đơn hàng #${orderId} đã được quầy tiếp nhận và đang tiến hành pha chế (PREPARING).`,
          orderId,
        });
      } else if (targetStatus === 'COMPLETED') {
        setStatusNotice({
          type: 'success',
          message: `Đơn hàng #${orderId} đã được bàn giao thành công (COMPLETED).`,
          orderId,
        });
      } else if (targetStatus === 'CANCELLED') {
        setStatusNotice({
          type: 'success',
          message: `Đơn hàng #${orderId} đã được hủy bỏ thành công (CANCELLED).`,
          orderId,
        });
      }
    }
  };

  // ==========================================
  // RENDER WIREFRAME SCREENS
  // ==========================================

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col justify-center items-center p-2 sm:p-6">
      {/* Viewport Wireframe Container: Responsive Mobile (1 cột) / Tablet / Desktop */}
      <div className="w-full max-w-[380px] md:max-w-xl lg:max-w-2xl border border-gray-400 rounded-3xl p-4 sm:p-6 flex flex-col justify-between min-h-[580px] relative bg-white">
        {/* MÀN HÌNH 1: ĐĂNG NHẬP / ĐĂNG KÝ (/auth) */}
        {currentScreen === 'auth' && (
          <AuthScreen
            authMode={authMode}
            setAuthMode={setAuthMode}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authError={authError}
            setAuthError={setAuthError}
            authLoading={authLoading}
            onAuthSubmit={handleAuthSubmit}
          />
        )}

        {/* MÀN HÌNH 2: TRANG MENU (/) */}
        {currentScreen === 'menu' && (
          <MenuScreen
            user={user}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            onNavigateHistory={() => {
              fetchHistory();
              setCurrentScreen('history');
            }}
            onLogout={handleLogout}
            products={products}
            productsLoading={productsLoading}
            onOpenProductDetail={openProductDetail}
            totalCartCount={totalCartCount}
            onViewCart={() => setCurrentScreen('cart')}
          />
        )}

        {/* MÀN HÌNH 3: CHI TIẾT SẢN PHẨM (/products/:id) */}
        {currentScreen === 'product-detail' && (
          <ProductDetailScreen
            selectedProduct={selectedProduct}
            user={user}
            detailLoading={detailLoading}
            stockNotice={stockNotice}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            selectedToppings={selectedToppings}
            toggleTopping={toggleTopping}
            selectedSugar={selectedSugar}
            setSelectedSugar={setSelectedSugar}
            selectedIce={selectedIce}
            setSelectedIce={setSelectedIce}
            customerNote={customerNote}
            setCustomerNote={setCustomerNote}
            currentUnitPrice={currentUnitPrice}
            addingToCart={addingToCart}
            onAddToCart={handleAddToCart}
            onBack={() => setCurrentScreen('menu')}
          />
        )}

        {/* MÀN HÌNH 4: GIỎ HÀNG (/cart) */}
        {currentScreen === 'cart' && (
          <CartScreen
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
            onBack={() => setCurrentScreen('menu')}
            onOpenEditModal={handleOpenEditModal}
            onUpdateCartQty={updateCartQty}
            onRemoveCartItem={removeCartItem}
            onApplyPromo={handleApplyPromo}
            onRemovePromo={handleRemovePromo}
            onCheckout={() => {
              setCheckoutStatus(null);
              setCurrentScreen('checkout');
            }}
          />
        )}

        {/* MÀN HÌNH 5: THANH TOÁN (/checkout) */}
        {currentScreen === 'checkout' && (
          <CheckoutScreen
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
            onCardNumberChange={handleCardNumberChange}
            onExpiryChange={handleExpiryChange}
            onCvvChange={handleCvvChange}
            onBackToCart={() => setCurrentScreen('cart')}
            onRetryPayment={handleRetryPayment}
            onCancelCurrentOrder={handleCancelCurrentOrder}
            onConfirmPay={handleConfirmPay}
            simulateWalletError={simulateWalletError}
            setSimulateWalletError={setSimulateWalletError}
          />
        )}

        {/* MÀN HÌNH 6: XÁC NHẬN (/orders/success) */}
        {currentScreen === 'success' && (
          <SuccessScreen
            lastOrder={lastOrder}
            user={user}
            onBackToMenu={() => {
              setStatusNotice(null);
              setCurrentScreen('menu');
            }}
            onViewHistory={() => {
              fetchHistory();
              setCurrentScreen('history');
            }}
            onTransitionOrder={handleHistoryTransition}
            statusNotice={statusNotice}
            onClearNotice={() => setStatusNotice(null)}
          />
        )}

        {/* MÀN HÌNH LỊCH SỬ ĐƠN HÀNG (/orders/history) */}
        {currentScreen === 'history' && (
          <HistoryScreen
            user={user}
            orderHistory={orderHistory}
            historyLoading={historyLoading}
            products={products}
            onBackToMenu={() => {
              setStatusNotice(null);
              setCurrentScreen('menu');
            }}
            onTransition={handleHistoryTransition}
            onRetryFromHistory={(orderId) => {
              setStatusNotice(null);
              setCurrentPendingOrderId(orderId);
              setCheckoutStatus(null);
              setCurrentScreen('checkout');
            }}
            statusNotice={statusNotice}
            onClearNotice={() => setStatusNotice(null)}
          />
        )}

        {/* MODAL CHỈNH SỬA SẢN PHẨM TRONG GIỎ HÀNG */}
        <EditItemModal
          editingItemId={editingItemId}
          editProductName={editProductName}
          editBasePrice={editBasePrice}
          editSize={editSize}
          setEditSize={setEditSize}
          editToppings={editToppings}
          onToggleEditTopping={handleToggleEditTopping}
          editSugar={editSugar}
          setEditSugar={setEditSugar}
          editIce={editIce}
          setEditIce={setEditIce}
          editNote={editNote}
          setEditNote={setEditNote}
          editQty={editQty}
          editUnitPrice={editUnitPrice}
          getSizeExtra={getSizeExtra}
          onClose={() => setEditingItemId(null)}
          onSave={handleSaveEditedCartItem}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrewLiteApp />
    </QueryClientProvider>
  );
}
