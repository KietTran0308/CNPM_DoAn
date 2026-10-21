<<<<<<< Updated upstream:src/App.tsx
import React from 'react';
import { NhaCungCapTruyVan } from './lib/nha-cung-cap-truy-van';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { MenuPage } from './components/MenuPage';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { OrderConfirmationPage } from './components/OrderConfirmationPage';
import { OrderHistoryPage } from './components/OrderHistoryPage';
import { PaymentFailureModal } from './components/PaymentFailureModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { AccountProfilePage } from './components/account/AccountProfilePage';
import { TrangDiemThuong } from './components/diem-thuong/diem-thuong';
import { useGiaoDienStore } from './stores';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
=======
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  formatPrice,
  getStoredToken,
  setStoredToken,
  getStoredUser,
  setStoredUser,
} from './api';
>>>>>>> Stashed changes:frontend/src/App.tsx

// --- Screen Navigation ---
type Screen = 'auth' | 'menu' | 'product-detail' | 'cart' | 'checkout' | 'success' | 'history';
type SizeType = 'S' | 'M' | 'L';
type ToppingType = 'Trân châu' | 'Kem';
type SugarType = '100%' | '70%' | '50%' | '30%' | 'Ít đường';
type IceType = '100%' | '70%' | '50%' | 'Ít đá' | 'Đá riêng';

interface CartLine {
  item: OrderItem;
  productName: string;
  toppings: ToppingType[];
  sugar: SugarType;
  ice: IceType;
  note?: string;
  unitPrice: number;
  stock: number;
}

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [menuOpen, setMenuOpen] = useState(false);

  // Authentication & Loyalty State (Task 10 - User.loyaltyPoints)
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<User | null>(() => getStoredUser() || DEFAULT_USER);
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

  // Cart State & Promo Codes (Khuyến mãi)
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

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

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Vui lòng nhập đầy đủ Email và Password.');
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
      const toppingsKey = [...selectedToppings].sort().join(',');
      const trimmedNote = customerNote.trim();

      const existingIndex = cartLines.findIndex(
        (line) =>
          line.item.productId === selectedProduct.id &&
          line.item.size === selectedSize &&
          [...line.toppings].sort().join(',') === toppingsKey &&
          line.sugar === selectedSugar &&
          line.ice === selectedIce &&
          (line.note || '') === trimmedNote
      );

      if (existingIndex > -1) {
        const updated = [...cartLines];
        const newQty = updated[existingIndex].item.qty + 1;
        updated[existingIndex].item.qty = newQty;
        updated[existingIndex].item.lineTotal = updated[existingIndex].unitPrice * newQty;
        setCartLines(updated);
      } else {
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
        setCartLines([...cartLines, newCartLine]);
      }

      setAddingToCart(false);
      setCurrentScreen('cart');
    }, 500);
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCartLines((prev) =>
      prev
        .map((line) => {
          if (line.item.id === itemId) {
            const newQty = line.item.qty + delta;
            if (delta > 0) {
              const productTotal = getProductTotalInCart(line.item.productId);
              if (productTotal + 1 > line.stock) {
                return line;
              }
            }
            if (newQty <= 0) return null;
            return {
              ...line,
              item: {
                ...line.item,
                qty: newQty,
                lineTotal: line.unitPrice * newQty,
              },
            };
          }
          return line;
        })
        .filter((line): line is CartLine => line !== null)
    );
  };

  const removeCartItem = (itemId: string) => {
    setCartLines((prev) => prev.filter((line) => line.item.id !== itemId));
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

    setCartLines((prev) =>
      prev.map((line) => {
        if (line.item.id === editingItemId) {
          return {
            ...line,
            item: {
              ...line.item,
              size: editSize,
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
          };
        }
        return line;
      })
    );

    setEditingItemId(null);
    setEditSuccessToast(true);
    setTimeout(() => setEditSuccessToast(false), 2000);
  };

  const totalCartCount = cartLines.reduce((sum, line) => sum + line.item.qty, 0);
  const rawSubtotal = cartLines.reduce((sum, line) => sum + line.item.lineTotal, 0);

  // Tính toán giảm giá khuyến mãi (Task 10)
  const discountAmount = appliedPromo
    ? appliedPromo.code === 'BREW10'
      ? Math.round(rawSubtotal * 0.1)
      : Math.min(rawSubtotal, appliedPromo.discount)
    : 0;

  const totalCartPrice = Math.max(0, rawSubtotal - discountAmount);

  // Tự động kiểm tra điều kiện mã GIAM10K khi số lượng món trong giỏ thay đổi
  useEffect(() => {
    if (appliedPromo?.code === 'GIAM10K' && rawSubtotal < 30000 && rawSubtotal > 0) {
      setAppliedPromo(null);
      setPromoError('Mã giảm giá không hợp lệ');
    }
  }, [rawSubtotal, appliedPromo]);

  // Xử lý áp dụng mã giảm giá
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'BREW10') {
      const discount = Math.round(rawSubtotal * 0.1);
      setAppliedPromo({ code: 'BREW10', discount });
    } else if (code === 'GIAM10K') {
      if (rawSubtotal >= 30000) {
        setAppliedPromo({ code: 'GIAM10K', discount: 10000 });
      } else {
        setPromoError('Mã giảm giá không hợp lệ');
      }
    } else {
      setPromoError('Mã giảm giá không hợp lệ');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError(null);
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

      // Quy ước lỗi thông minh: Nếu thẻ có đuôi "0000" -> PAYMENT_FAILED
      const cleanCardDigits = cardNumber.replace(/\D/g, '');
      const isSimulatedCardError = paymentMethod === 'bank' && cleanCardDigits.endsWith('0000');

      const targetStatus: OrderStatus = isSimulatedCardError ? 'PAYMENT_FAILED' : 'PAID';
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
        setCartLines([]); // Dọn sạch giỏ hàng
        setAppliedPromo(null); // Reset khuyến mãi
        setPromoCodeInput('');
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

  // State Machine transitions for Order History (Task 10 & Sơ đồ trạng thái)
  const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
    PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
    PAID: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY'],
    READY: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  const handleHistoryTransition = async (orderId: string, targetStatus: OrderStatus) => {
    const order = orderHistory.find((o) => o.id === orderId);
    if (!order) return;

    // Chặn mọi thao tác chuyển trạng thái sai quy tắc
    if (!VALID_TRANSITIONS[order.status]?.includes(targetStatus)) {
      return;
    }

    if (targetStatus === 'PENDING') {
      // Retry payment from history: PENDING -> PAID
      syncOrderHistory((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'PENDING' } : o))
      );

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
        } else {
          syncOrderHistory((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: 'PAYMENT_FAILED' } : o))
          );
        }
      } catch {
        syncOrderHistory((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'PAYMENT_FAILED' } : o))
        );
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
    }
  };

  // ==========================================
  // RENDER WIREFRAME SCREENS
  // ==========================================

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col justify-center items-center p-2 sm:p-6">
      {/* Viewport Wireframe Container: Responsive Mobile (1 cột) / Tablet / Desktop */}
      <div className="w-full max-w-[380px] md:max-w-xl lg:max-w-2xl border border-gray-400 rounded-3xl p-4 sm:p-6 flex flex-col justify-between min-h-[580px] relative bg-white">

<<<<<<< Updated upstream:src/App.tsx
      {/* Brand Header */}
      <Header />
=======
        {/* ------------------------------------------ */}
        {/* MÀN HÌNH 1: ĐĂNG NHẬP / ĐĂNG KÝ (/auth)    */}
        {/* ------------------------------------------ */}
        {currentScreen === 'auth' && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="text-center font-bold text-lg pb-3 border-b border-gray-400">
                BrewLite
              </div>

              <div className="mt-6 space-y-4">
                <div className="text-center font-bold text-sm">
                  {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </div>
>>>>>>> Stashed changes:frontend/src/App.tsx

                {authError && (
                  <div className="text-xs text-red-600 text-center border border-red-400 p-1.5 bg-stone-100">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="Email"
                      required
                      className="w-full p-2 border border-gray-400 bg-stone-100 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Mật khẩu"
                      required
                      className="w-full p-2 border border-gray-400 bg-stone-100 text-sm focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 mt-2 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900"
                  >
                    {authLoading
                      ? 'Đang xử lý...'
                      : authMode === 'login'
                      ? 'Đăng nhập'
                      : 'Đăng ký'}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setAuthError(null);
                    }}
                    className="text-xs text-black underline cursor-pointer"
                  >
                    {authMode === 'login'
                      ? 'Chưa có tài khoản? Chuyển sang Đăng ký'
                      : 'Đã có tài khoản? Chuyển sang Đăng nhập'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* MÀN HÌNH 2: TRANG MENU (/)                 */}
        {/* ------------------------------------------ */}
        {currentScreen === 'menu' && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Header: BrewLite ≡ */}
              <div className="flex justify-between items-center pb-2 border-b border-gray-400 relative">
                <span className="font-bold text-base">BrewLite</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono border border-gray-400 px-2 py-0.5 rounded bg-stone-100 font-medium">
                    Điểm: {user?.loyaltyPoints ?? 0}
                  </span>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="font-bold text-lg px-2 cursor-pointer select-none"
                  >
                    ☰
                  </button>
                </div>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 top-8 w-48 bg-white border border-gray-400 shadow-none z-10 text-xs">
                    <div className="p-2 border-b border-gray-300 bg-stone-50">
                      <div className="text-gray-600 truncate">{user?.email}</div>
                      <div className="font-bold font-mono text-emerald-800 mt-0.5">
                        Điểm: {user?.loyaltyPoints ?? 0}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        fetchHistory();
                        setCurrentScreen('history');
                      }}
                      className="w-full text-left p-2.5 hover:bg-stone-100 border-b border-gray-300 cursor-pointer"
                    >
                      Lịch sử đơn hàng
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left p-2.5 hover:bg-stone-100 text-red-700 cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>

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
                      onClick={() => openProductDetail(item.id)}
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
                onClick={() => setCurrentScreen('cart')}
                className="w-full py-2.5 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900"
              >
                Xem giỏ hàng ({totalCartCount})
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* MÀN HÌNH 3: CHI TIẾT SẢN PHẨM (/products/:id) */}
        {/* ------------------------------------------ */}
        {currentScreen === 'product-detail' && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Header: ← [Tên món] */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-400">
                <div className="flex items-center">
                  <button
                    onClick={() => setCurrentScreen('menu')}
                    className="font-bold mr-2 text-base cursor-pointer"
                  >
                    ←
                  </button>
                  <span className="font-bold text-base">{selectedProduct.name}</span>
                </div>
                <span className="text-xs font-mono border border-gray-400 px-1.5 py-0.5 rounded bg-stone-100 font-medium">
                  Điểm: {user?.loyaltyPoints ?? 0}
                </span>
              </div>

              {detailLoading ? (
                <div className="text-center text-sm py-8 text-gray-500">
                  Đang tải...
                </div>
              ) : (
                <div className="mt-3 space-y-3.5 flex-1 overflow-y-auto max-h-[440px] pr-0.5">
                  {stockNotice && (
                    <div className="text-xs text-red-600 text-center border border-red-400 p-1.5 bg-stone-100">
                      {stockNotice}
                    </div>
                  )}

                  {/* Thông tin món & Ảnh sản phẩm */}
                  <div className="flex items-center gap-3 p-2 bg-stone-100 border border-gray-400 rounded">
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-14 h-14 object-cover rounded border border-gray-300 bg-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{selectedProduct.name}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        Giá gốc: <span className="font-mono">{formatPrice(selectedProduct.price)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mục 1: Chọn Size (Thẻ hiển thị rõ mức giá cộng thêm) */}
                  <div>
                    <div className="text-xs font-bold mb-1.5">1. Chọn Size</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { size: 'S' as SizeType, label: 'S (+0đ)', price: selectedProduct.price },
                        { size: 'M' as SizeType, label: 'M (+5.000đ)', price: selectedProduct.price + 5000 },
                        { size: 'L' as SizeType, label: 'L (+10.000đ)', price: selectedProduct.price + 10000 },
                      ].map(({ size, label, price }) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`p-2 text-xs border rounded text-center cursor-pointer flex flex-col items-center justify-center transition-colors ${
                            selectedSize === size
                              ? 'bg-stone-200 font-bold border-black'
                              : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                          }`}
                        >
                          <span className="font-bold text-xs">{label}</span>
                          <span className="text-[10px] text-gray-600 font-mono mt-0.5">
                            {formatPrice(price)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mục 2: Chọn Topping (Hiển thị rõ mức giá cộng thêm) */}
                  <div>
                    <div className="text-xs font-bold mb-1.5">2. Chọn Topping</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Trân châu' as ToppingType, extra: '+5.000đ' },
                        { name: 'Kem' as ToppingType, extra: '+10.000đ' },
                      ].map(({ name, extra }) => {
                        const isChecked = selectedToppings.includes(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => toggleTopping(name)}
                            className={`p-2 text-xs border rounded text-center cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-stone-200 font-bold border-black'
                                : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                            }`}
                          >
                            {isChecked ? `[✓] ${name} (${extra})` : `[ ] ${name} (${extra})`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mục 3: Mức Đường & Mức Đá (Ice & Sugar Options) */}
                  <div className="space-y-2.5">
                    <div>
                      <div className="text-xs font-bold mb-1.5">3. Mức Đường</div>
                      <div className="grid grid-cols-5 gap-1">
                        {(['100%', '70%', '50%', '30%', 'Ít đường'] as SugarType[]).map((sugar) => (
                          <button
                            key={sugar}
                            type="button"
                            onClick={() => setSelectedSugar(sugar)}
                            className={`py-1.5 text-[11px] border rounded text-center cursor-pointer transition-colors ${
                              selectedSugar === sugar
                                ? 'bg-stone-200 font-bold border-black'
                                : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                            }`}
                          >
                            {sugar}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold mb-1.5">4. Mức Đá</div>
                      <div className="grid grid-cols-5 gap-1">
                        {(['100%', '70%', '50%', 'Ít đá', 'Đá riêng'] as IceType[]).map((ice) => (
                          <button
                            key={ice}
                            type="button"
                            onClick={() => setSelectedIce(ice)}
                            className={`py-1.5 text-[11px] border rounded text-center cursor-pointer transition-colors ${
                              selectedIce === ice
                                ? 'bg-stone-200 font-bold border-black'
                                : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                            }`}
                          >
                            {ice}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mục 4: Ô Ghi chú cho quán */}
                  <div>
                    <label className="block text-xs font-bold mb-1 text-gray-800">
                      Ghi chú cho quán (Ví dụ: Ít ngọt, nhiều đá riêng...)
                    </label>
                    <textarea
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="Ghi chú yêu cầu đặc biệt..."
                      rows={2}
                      className="w-full p-2 border border-gray-400 bg-white text-xs placeholder:text-gray-400 focus:outline-none resize-none rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dưới cùng: Tổng tạm tính trực quan & Nút Thêm vào giỏ */}
            <div className="pt-3 border-t border-gray-300 mt-2 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-700">Tổng tạm tính:</span>
                <span className="font-mono font-bold text-base text-black">
                  {formatPrice(currentUnitPrice)}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={selectedProduct.stock <= 0 || addingToCart}
                className="w-full py-2.5 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900 disabled:bg-gray-300 disabled:text-gray-500"
              >
                {selectedProduct.stock <= 0
                  ? 'Hết hàng'
                  : addingToCart
                  ? 'Đang thêm...'
                  : `Thêm vào giỏ • ${formatPrice(currentUnitPrice)}`}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* MÀN HÌNH 4: GIỎ HÀNG (/cart)              */}
        {/* ------------------------------------------ */}
        {currentScreen === 'cart' && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Header: Giỏ hàng & ← */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-400">
                <button
                  onClick={() => setCurrentScreen('menu')}
                  className="font-bold text-base cursor-pointer"
                >
                  ←
                </button>
                <span className="font-bold text-base">Giỏ hàng</span>
                <span className="text-xs font-mono border border-gray-400 px-1.5 py-0.5 rounded bg-stone-100 font-medium">
                  Điểm: {user?.loyaltyPoints ?? 0}
                </span>
              </div>

              {/* Thông báo cập nhật món thành công */}
              {editSuccessToast && (
                <div className="mt-3 p-1.5 bg-emerald-50 border border-emerald-600 rounded text-center text-xs text-emerald-800 font-medium">
                  ✓ Đã lưu thay đổi món thành công!
                </div>
              )}

              {/* Danh sách các món trong giỏ: [Tên món] [Size] [Topping] x[Số lượng] */}
              <div className="mt-4 space-y-2">
                {cartLines.length === 0 ? (
                  <div className="text-center text-sm py-8 text-gray-500">
                    Giỏ hàng trống
                  </div>
                ) : (
                  cartLines.map((line) => (
                    <div
                      key={line.item.id}
                      className="p-2.5 bg-stone-100 border border-gray-400 rounded text-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-start font-medium">
                        <div>
                          <div>
                            {line.productName} ({line.item.size}) x{line.item.qty}
                          </div>
                          {(line.toppings.length > 0 || line.sugar || line.ice) && (
                            <div className="text-[11px] text-gray-600 mt-0.5">
                              {line.toppings.length > 0 && `Topping: ${line.toppings.join(', ')} • `}
                              Đường: {line.sugar} • Đá: {line.ice}
                            </div>
                          )}
                          {line.note && (
                            <div className="text-[10px] text-gray-500 italic mt-0.5">
                              Ghi chú: {line.note}
                            </div>
                          )}
                        </div>
                        <span className="font-mono shrink-0 ml-2">
                          {formatPrice(line.item.lineTotal)}
                        </span>
                      </div>

                      <div className="flex justify-end items-center gap-2 pt-1 border-t border-gray-300">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(line)}
                          className="px-2 py-0.5 border border-gray-400 bg-white text-xs font-medium cursor-pointer hover:bg-stone-200 mr-auto"
                        >
                          [Sửa]
                        </button>
                        <button
                          onClick={() => updateCartQty(line.item.id, -1)}
                          className="px-2 py-0.5 border border-gray-400 bg-white font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono">{line.item.qty}</span>
                        <button
                          onClick={() => updateCartQty(line.item.id, 1)}
                          disabled={line.item.qty >= line.stock}
                          className="px-2 py-0.5 border border-gray-400 bg-white font-bold cursor-pointer disabled:text-gray-400"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeCartItem(line.item.id)}
                          className="px-2 py-0.5 border border-gray-400 bg-white text-red-700 cursor-pointer ml-1"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Áp mã giảm giá hợp lệ (Khuyến mãi) - Mục 2 */}
              {cartLines.length > 0 && (
                <div className="mt-3.5 pt-2 border-t border-gray-300">
                  <form onSubmit={handleApplyPromo} className="flex gap-1.5">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value);
                        setPromoError(null);
                      }}
                      placeholder="Mã giảm giá (BREW10, GIAM10K)"
                      disabled={appliedPromo !== null}
                      className="flex-1 p-1.5 border border-gray-400 bg-white text-xs uppercase font-mono focus:outline-none disabled:bg-stone-200"
                    />
                    {appliedPromo ? (
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="px-2.5 py-1.5 border border-gray-400 bg-white text-red-700 text-xs font-medium cursor-pointer hover:bg-stone-200 shrink-0"
                      >
                        Xóa mã
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!promoCodeInput.trim()}
                        className="px-3 py-1.5 bg-emerald-800 text-white text-xs font-medium rounded cursor-pointer hover:bg-emerald-900 disabled:bg-gray-300 disabled:text-gray-500 shrink-0"
                      >
                        Áp dụng
                      </button>
                    )}
                  </form>
                  {promoError && (
                    <div className="text-[11px] text-red-600 mt-1 font-medium">
                      {promoError}
                    </div>
                  )}
                </div>
              )}

              {/* Đường kẻ phân cách & Tổng tiền */}
              {cartLines.length > 0 && (
                <div className="mt-3">
                  <div className="text-center text-gray-500 tracking-widest text-xs select-none">
                    – - - - - - - - -
                  </div>
                  <div className="mt-2 space-y-1">
                    {appliedPromo && (
                      <>
                        <div className="flex justify-between items-center text-xs text-gray-700">
                          <span>Tạm tính:</span>
                          <span className="font-mono">{formatPrice(rawSubtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-emerald-800 font-medium">
                          <span>Giảm giá ({appliedPromo.code}):</span>
                          <span className="font-mono">-{formatPrice(discountAmount)}</span>
                        </div>
                      </>
                    )}
                    <div className="text-center font-bold text-sm pt-1">
                      Tổng: {formatPrice(totalCartPrice)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Nút dưới cùng: Thanh toán */}
            <div className="pt-4">
              <button
                onClick={() => {
                  setCheckoutStatus(null);
                  setCurrentScreen('checkout');
                }}
                disabled={cartLines.length === 0}
                className={`w-full py-2.5 font-medium text-sm rounded ${
                  cartLines.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-800 text-white cursor-pointer hover:bg-emerald-900'
                }`}
              >
                Thanh toán
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MÀN HÌNH 5: THANH TOÁN (/checkout) THỰC TẾ & TỐI GIẢN  */}
        {/* ---------------------------------------------------- */}
        {currentScreen === 'checkout' && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Header: Thanh toán & ← */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-400">
                <button
                  onClick={() => setCurrentScreen('cart')}
                  className="font-bold text-base cursor-pointer"
                >
                  ←
                </button>
                <span className="font-bold text-base">Thanh toán</span>
                <span className="text-xs font-mono border border-gray-400 px-1.5 py-0.5 rounded bg-stone-100 font-medium">
                  Điểm: {user?.loyaltyPoints ?? 0}
                </span>
              </div>

              <div className="mt-3 space-y-3.5">
                {/* Thông báo lỗi tồn kho (Product.stock) */}
                {stockError && (
                  <div className="border border-red-500 p-2.5 bg-stone-100 rounded text-center space-y-1.5">
                    <div className="text-xs font-bold text-red-700">
                      {stockError}
                    </div>
                    <button
                      onClick={() => {
                        setStockError(null);
                        setCurrentScreen('cart');
                      }}
                      className="text-xs text-black underline cursor-pointer"
                    >
                      Quay lại Giỏ hàng để điều chỉnh
                    </button>
                  </div>
                )}

                {/* Thông báo trạng thái PAYMENT_FAILED nếu thanh toán gặp lỗi */}
                {checkoutStatus === 'PAYMENT_FAILED' && (
                  <div className="border border-red-500 p-2.5 bg-stone-100 rounded text-center space-y-2">
                    <div className="text-xs font-bold text-red-700">
                      Trạng thái: PAYMENT_FAILED
                    </div>
                    <div className="text-xs text-red-600">
                      Thanh toán thất bại, vui lòng thử lại!
                    </div>
                    <div className="flex justify-center gap-2 pt-1">
                      <button
                        onClick={handleRetryPayment}
                        className="px-3 py-1 bg-emerald-800 text-white text-xs font-medium rounded cursor-pointer hover:bg-emerald-900"
                      >
                        Thử lại
                      </button>
                      <button
                        onClick={handleCancelCurrentOrder}
                        className="px-3 py-1 border border-gray-400 bg-white text-xs font-medium rounded cursor-pointer hover:bg-stone-200"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                {/* Tổng: [Tổng tiền]đ */}
                <div className="text-center font-bold text-sm">
                  Tổng: {formatPrice(totalCartPrice)}
                </div>

                {/* Mục Phương thức (Mục 2) */}
                <div>
                  <div className="text-xs font-bold text-center mb-2">
                    Phương thức
                  </div>
                  <div className="space-y-2">
                    {/* Tùy chọn A: (o) Ví điện tử */}
                    <div
                      className={`p-2.5 border rounded cursor-pointer transition-colors ${
                        paymentMethod === 'wallet'
                          ? 'bg-stone-200 border-black'
                          : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                      }`}
                      onClick={() => setPaymentMethod('wallet')}
                    >
                      <div className="text-xs font-medium">
                        {paymentMethod === 'wallet' ? '(o)' : '( )'} Ví điện tử
                      </div>

                      {paymentMethod === 'wallet' && (
                        <div className="pt-2 space-y-2.5">
                          {/* 2 nút chọn loại ví ngang nhau */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setWalletType('MoMo');
                              }}
                              className={`py-1 text-xs border rounded cursor-pointer text-center ${
                                walletType === 'MoMo'
                                  ? 'bg-white font-bold border-black'
                                  : 'bg-stone-100 border-gray-400'
                              }`}
                            >
                              {walletType === 'MoMo' ? '(•)' : '( )'} MoMo
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setWalletType('VNPay');
                              }}
                              className={`py-1 text-xs border rounded cursor-pointer text-center ${
                                walletType === 'VNPay'
                                  ? 'bg-white font-bold border-black'
                                  : 'bg-stone-100 border-gray-400'
                              }`}
                            >
                              {walletType === 'VNPay' ? '(•)' : '( )'} VNPay
                            </button>
                          </div>

                          {/* Khung Mã QR thanh toán chuẩn Wireframe */}
                          <div className="pt-1 text-center space-y-1.5">
                            <div className="w-36 h-36 mx-auto border border-gray-400 p-2 bg-white flex items-center justify-center">
                              {/* Authentic SVG QR Code */}
                              <svg
                                viewBox="0 0 100 100"
                                className="w-full h-full text-black"
                                fill="currentColor"
                              >
                                {/* Top-Left Finder */}
                                <rect x="6" y="6" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="4" />
                                <rect x="13" y="13" width="12" height="12" />
                                {/* Top-Right Finder */}
                                <rect x="68" y="6" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="4" />
                                <rect x="75" y="13" width="12" height="12" />
                                {/* Bottom-Left Finder */}
                                <rect x="6" y="68" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="4" />
                                <rect x="13" y="75" width="12" height="12" />
                                {/* Matrix modules */}
                                <rect x="38" y="8" width="5" height="5" />
                                <rect x="48" y="8" width="5" height="5" />
                                <rect x="58" y="8" width="5" height="5" />
                                <rect x="38" y="18" width="5" height="5" />
                                <rect x="53" y="18" width="5" height="5" />
                                <rect x="43" y="28" width="5" height="5" />
                                <rect x="58" y="28" width="5" height="5" />
                                <rect x="8" y="38" width="5" height="5" />
                                <rect x="18" y="38" width="5" height="5" />
                                <rect x="28" y="38" width="5" height="5" />
                                <rect x="38" y="38" width="10" height="10" />
                                <rect x="58" y="38" width="5" height="5" />
                                <rect x="68" y="38" width="10" height="5" />
                                <rect x="88" y="38" width="5" height="5" />
                                <rect x="8" y="48" width="5" height="5" />
                                <rect x="23" y="48" width="5" height="5" />
                                <rect x="33" y="48" width="5" height="5" />
                                <rect x="53" y="48" width="10" height="10" />
                                <rect x="73" y="48" width="5" height="5" />
                                <rect x="88" y="48" width="5" height="5" />
                                <rect x="8" y="58" width="5" height="5" />
                                <rect x="28" y="58" width="5" height="5" />
                                <rect x="38" y="58" width="5" height="5" />
                                <rect x="68" y="58" width="5" height="5" />
                                <rect x="78" y="58" width="5" height="5" />
                                <rect x="88" y="58" width="5" height="5" />
                                <rect x="38" y="68" width="10" height="5" />
                                <rect x="53" y="68" width="5" height="5" />
                                <rect x="63" y="68" width="5" height="5" />
                                <rect x="78" y="68" width="10" height="5" />
                                <rect x="43" y="78" width="5" height="5" />
                                <rect x="58" y="78" width="10" height="5" />
                                <rect x="73" y="78" width="5" height="5" />
                                <rect x="88" y="78" width="5" height="5" />
                                <rect x="38" y="88" width="5" height="5" />
                                <rect x="48" y="88" width="10" height="5" />
                                <rect x="68" y="88" width="5" height="5" />
                                <rect x="83" y="88" width="10" height="5" />
                              </svg>
                            </div>

                            <p className="text-[11px] text-gray-700 leading-tight">
                              Quét mã QR bằng ứng dụng <span className="font-bold">{walletType}</span> để thanh toán
                            </p>
                            <p className="text-[10px] font-mono text-gray-500">
                              Nội dung: BREW-{totalCartPrice}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tùy chọn B: ( ) Thẻ ngân hàng */}
                    <div
                      className={`p-2.5 border rounded cursor-pointer transition-colors ${
                        paymentMethod === 'bank'
                          ? 'bg-stone-200 border-black'
                          : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                      }`}
                      onClick={() => setPaymentMethod('bank')}
                    >
                      <div className="text-xs font-medium">
                        {paymentMethod === 'bank' ? '(o)' : '( )'} Thẻ ngân hàng
                      </div>

                      {paymentMethod === 'bank' && (
                        <div className="pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                          {/* Ô 1: Số thẻ */}
                          <div>
                            <label className="block text-[10px] text-gray-600 mb-0.5">
                              Số thẻ
                            </label>
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              placeholder="0000 0000 0000 0000"
                              className="w-full p-1.5 border border-gray-400 bg-white text-xs font-mono focus:outline-none"
                            />
                          </div>

                          {/* Ô 2 & Ô 3: MM/YY và CVV chia đôi */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-gray-600 mb-0.5">
                                MM/YY
                              </label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={handleExpiryChange}
                                placeholder="MM/YY"
                                className="w-full p-1.5 border border-gray-400 bg-white text-xs font-mono focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-600 mb-0.5">
                                CVV
                              </label>
                              <input
                                type="password"
                                maxLength={3}
                                value={cardCvv}
                                onChange={handleCvvChange}
                                placeholder="CVV"
                                className="w-full p-1.5 border border-gray-400 bg-white text-xs font-mono focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dòng chữ: Không dùng tiền mặt */}
                <div className="text-center text-xs text-gray-700 pt-1 font-medium">
                  Không dùng tiền mặt
                </div>
              </div>
            </div>

            {/* Nút dưới cùng: Xác nhận trả */}
            <div className="pt-4">
              <button
                onClick={handleConfirmPay}
                disabled={checkoutLoading || cartLines.length === 0}
                className="w-full py-2.5 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900 disabled:bg-gray-300 disabled:text-gray-500"
              >
                {checkoutLoading ? 'Đang xử lý...' : 'Xác nhận trả'}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* MÀN HÌNH 6: XÁC NHẬN (/orders/success)     */}
        {/* ------------------------------------------ */}
        {currentScreen === 'success' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="text-center space-y-3 pt-4">
              {/* Ký hiệu ✓ màu xanh lá */}
              <div className="text-3xl font-bold text-emerald-800">✓</div>

              {/* Dòng chữ Đặt hàng thành công */}
              <div className="font-bold text-sm">Đặt hàng thành công</div>

              {/* Khung hiển thị Mã đơn: #... */}
              <div className="p-2.5 bg-stone-100 border border-gray-400 rounded text-xs font-mono font-medium">
                Mã đơn: #{lastOrder ? lastOrder.id : '1042'}
              </div>

              {/* Khung hiển thị Trạng thái: PAID */}
              <div className="p-2.5 bg-stone-100 border border-gray-400 rounded text-xs font-mono font-medium">
                Trạng thái: {lastOrder ? lastOrder.status : 'PAID'}
              </div>

              {/* Dòng điểm thưởng tích lũy (Mục 1) */}
              <div className="text-xs text-emerald-800 font-mono font-medium">
                + {Math.floor((lastOrder?.total || 0) / 10000)} điểm tích lũy (Tổng: {user?.loyaltyPoints ?? 0} điểm)
              </div>

              {/* Dòng chữ Mời tới quầy lấy nước */}
              <div className="text-xs pt-1 text-gray-800 font-medium">
                Mời tới quầy lấy nước
              </div>
            </div>

            {/* Nút màu xanh lá đậm: Về trang chủ */}
            <div className="pt-4 space-y-2">
              <button
                onClick={() => setCurrentScreen('menu')}
                className="w-full py-2.5 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900"
              >
                Về trang chủ
              </button>
              <button
                onClick={() => {
                  fetchHistory();
                  setCurrentScreen('history');
                }}
                className="w-full py-2 border border-gray-400 bg-stone-100 text-black text-xs font-medium rounded cursor-pointer hover:bg-stone-200"
              >
                Xem lịch sử đơn hàng
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* MÀN HÌNH LỊCH SỬ ĐƠN HÀNG (/orders/history) */}
        {/* ------------------------------------------ */}
        {currentScreen === 'history' && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Header: Lịch sử đơn hàng & ← */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-400">
                <button
                  onClick={() => setCurrentScreen('menu')}
                  className="font-bold text-base cursor-pointer"
                >
                  ←
                </button>
                <span className="font-bold text-base">Lịch sử đơn hàng</span>
                <span className="text-xs font-mono border border-gray-400 px-1.5 py-0.5 rounded bg-stone-100 font-medium">
                  Điểm: {user?.loyaltyPoints ?? 0}
                </span>
              </div>

              {/* Danh sách đơn hàng từ GET /orders/me */}
              <div className="mt-4 space-y-3">
                {historyLoading ? (
                  <div className="text-center text-sm py-8 text-gray-500">
                    Đang tải...
                  </div>
                ) : orderHistory.length === 0 ? (
                  <div className="text-center text-sm py-8 text-gray-500">
                    Chưa có đơn hàng nào
                  </div>
                ) : (
                  orderHistory.map((order) => {
                    const status = order.status;
                    const hasActions = ['PENDING', 'PAYMENT_FAILED', 'PAID', 'PREPARING', 'READY'].includes(status);

                    return (
                      <div
                        key={order.id}
                        className="p-3 bg-stone-100 border border-gray-400 rounded text-xs space-y-2"
                      >
                        {/* Hàng 1 (Header thẻ): Mã đơn + thời gian (trái) và Nhãn trạng thái (phải) */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-bold text-sm">#{order.id}</span>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                              {order.createdAt}
                            </div>
                          </div>

                          {/* Nhãn trạng thái chuẩn Wireframe tối giản */}
                          <span
                            className={`font-mono px-2 py-0.5 rounded text-[11px] font-medium ${
                              status === 'PAID'
                                ? 'bg-emerald-800 text-white font-bold'
                                : status === 'PAYMENT_FAILED'
                                ? 'bg-red-50 text-red-700 border border-red-400'
                                : 'bg-stone-200 text-black border border-gray-400'
                            }`}
                          >
                            {status}
                          </span>
                        </div>

                        {/* Hàng 2 (Danh sách món - OrderItem): [Tên món] ([size]) x[qty] và lineTotal */}
                        {order.items && order.items.length > 0 && (
                          <div className="py-1.5 border-y border-gray-300 space-y-1">
                            {order.items.map((item) => {
                              const product = products.find((p) => p.id === item.productId);
                              const name = product ? product.name : `Món #${item.productId}`;
                              return (
                                <div key={item.id} className="flex justify-between items-start text-[11px] text-gray-800">
                                  <div>
                                    <span>
                                      {name} ({item.size}) x{item.qty}
                                    </span>
                                    {(item.sugar || item.ice) && (
                                      <div className="text-[10px] text-gray-500">
                                        Đường: {item.sugar || '100%'} • Đá: {item.ice || '100%'}
                                      </div>
                                    )}
                                    {item.note && (
                                      <div className="text-[10px] text-gray-500 italic">
                                        Ghi chú: {item.note}
                                      </div>
                                    )}
                                  </div>
                                  <span className="font-mono text-gray-700 shrink-0 ml-2">
                                    {formatPrice(item.lineTotal)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Hàng 3 (Tổng cộng): Tổng tiền và giá trị total in đậm */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-700">Tổng tiền:</span>
                          <span className="font-mono font-bold text-sm">
                            {formatPrice(order.total)}
                          </span>
                        </div>

                        {/* Khu vực Nút bấm: Chỉ hiển thị đường kẻ ngang và nút khi còn tác vụ */}
                        {hasActions && (
                          <div className="pt-2 border-t border-gray-300 flex flex-wrap gap-1.5 justify-end">
                            {/* Nếu status là PENDING hoặc PAYMENT_FAILED: */}
                            {(status === 'PENDING' || status === 'PAYMENT_FAILED') && (
                              <>
                                <button
                                  onClick={() => handleHistoryTransition(order.id, 'CANCELLED')}
                                  className="px-2.5 py-1 border border-gray-400 bg-white rounded text-xs cursor-pointer hover:bg-stone-200"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => {
                                    setCurrentPendingOrderId(order.id);
                                    setCheckoutStatus(null);
                                    setCurrentScreen('checkout');
                                  }}
                                  className="px-2.5 py-1 bg-emerald-800 text-white rounded text-xs font-medium cursor-pointer hover:bg-emerald-900"
                                >
                                  Thử lại
                                </button>
                              </>
                            )}

                            {/* Nếu status là PAID: Hủy hoặc Barista nhận */}
                            {status === 'PAID' && (
                              <>
                                <button
                                  onClick={() => handleHistoryTransition(order.id, 'CANCELLED')}
                                  className="px-2.5 py-1 border border-gray-400 bg-white rounded text-xs cursor-pointer hover:bg-stone-200"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => handleHistoryTransition(order.id, 'PREPARING')}
                                  className="px-2.5 py-1 bg-stone-200 border border-gray-400 rounded text-xs font-medium cursor-pointer hover:bg-stone-300"
                                >
                                  Barista nhận →
                                </button>
                              </>
                            )}

                            {/* Nếu status là PREPARING: Chỉ hiển thị nút Pha xong → */}
                            {status === 'PREPARING' && (
                              <button
                                onClick={() => handleHistoryTransition(order.id, 'READY')}
                                className="px-2.5 py-1 bg-stone-200 border border-gray-400 rounded text-xs font-medium cursor-pointer hover:bg-stone-300"
                              >
                                Pha xong →
                              </button>
                            )}

                            {/* Nếu status là READY: Chỉ hiển thị nút Giao khách ✓ */}
                            {status === 'READY' && (
                              <button
                                onClick={() => handleHistoryTransition(order.id, 'COMPLETED')}
                                className="px-2.5 py-1 bg-emerald-800 text-white rounded text-xs font-medium cursor-pointer hover:bg-emerald-900"
                              >
                                Giao khách ✓
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Nút dưới cùng quay về Menu */}
            <div className="pt-4">
              <button
                onClick={() => setCurrentScreen('menu')}
                className="w-full py-2.5 bg-emerald-800 text-white font-medium text-sm rounded cursor-pointer hover:bg-emerald-900"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL CHỈNH SỬA SẢN PHẨM TRONG GIỎ HÀNG (Edit / Configure Modal) */}
        {/* ------------------------------------------------------------------ */}
        {editingItemId && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 rounded-3xl p-3 sm:p-5 flex items-center justify-center">
            <div className="bg-white border border-gray-400 rounded-2xl p-4 w-full max-h-[92%] overflow-y-auto space-y-3.5 shadow-xl">
              {/* Header Modal: Tên món và giá cơ bản */}
              <div className="flex justify-between items-start pb-2 border-b border-gray-400">
                <div>
                  <h3 className="font-bold text-sm text-black">Chỉnh sửa tùy chọn</h3>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {editProductName} • Giá gốc: {formatPrice(editBasePrice)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingItemId(null)}
                  className="font-bold text-sm px-2 py-0.5 text-gray-500 hover:text-black cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Mục 1: Chọn lại Size (S, M, L) và giá tiền tương ứng */}
              <div>
                <div className="text-xs font-bold mb-1.5">1. Kích cỡ (Size)</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['S', 'M', 'L'] as SizeType[]).map((size) => {
                    const extra = getSizeExtra(size);
                    const label = extra === 0 ? 'S (+0đ)' : `${size} (+${formatPrice(extra)})`;
                    const isSelected = editSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setEditSize(size)}
                        className={`p-2 text-xs border rounded text-center cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-stone-200 font-bold border-black'
                            : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mục 2: Tích chọn lại Topping (Trân châu, Kem...) */}
              <div>
                <div className="text-xs font-bold mb-1.5">2. Topping</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Trân châu', 'Kem'] as ToppingType[]).map((name) => {
                    const extra = name === 'Trân châu' ? '+5.000đ' : '+10.000đ';
                    const isChecked = editToppings.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleToggleEditTopping(name)}
                        className={`p-2 text-xs border rounded text-center cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-stone-200 font-bold border-black'
                            : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                        }`}
                      >
                        {isChecked ? `[✓] ${name} (${extra})` : `[ ] ${name} (${extra})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mục 3: Mức Đường & Mức Đá */}
              <div className="space-y-2.5">
                <div>
                  <div className="text-xs font-bold mb-1.5">3. Mức Đường</div>
                  <div className="grid grid-cols-5 gap-1">
                    {(['100%', '70%', '50%', '30%', 'Ít đường'] as SugarType[]).map((sugar) => (
                      <button
                        key={sugar}
                        type="button"
                        onClick={() => setEditSugar(sugar)}
                        className={`py-1.5 text-[11px] border rounded text-center cursor-pointer transition-colors ${
                          editSugar === sugar
                            ? 'bg-stone-200 font-bold border-black'
                            : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                        }`}
                      >
                        {sugar}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold mb-1.5">4. Mức Đá</div>
                  <div className="grid grid-cols-5 gap-1">
                    {(['100%', '70%', '50%', 'Ít đá', 'Đá riêng'] as IceType[]).map((ice) => (
                      <button
                        key={ice}
                        type="button"
                        onClick={() => setEditIce(ice)}
                        className={`py-1.5 text-[11px] border rounded text-center cursor-pointer transition-colors ${
                          editIce === ice
                            ? 'bg-stone-200 font-bold border-black'
                            : 'bg-stone-100 border-gray-400 hover:bg-stone-200'
                        }`}
                      >
                        {ice}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mục 4: Ô Ghi chú cho quán */}
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-800">
                  Ghi chú cho quán (Ví dụ: Ít ngọt, nhiều đá riêng...)
                </label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Ghi chú yêu cầu đặc biệt..."
                  rows={2}
                  className="w-full p-2 border border-gray-400 bg-white text-xs placeholder:text-gray-400 focus:outline-none resize-none rounded"
                />
              </div>

              {/* Hiển thị Giá tiền đơn vị và Thành tiền */}
              <div className="pt-2 border-t border-gray-300 flex justify-between items-center text-xs">
                <span className="text-gray-700">Đơn giá mới (x{editQty}):</span>
                <span className="font-mono font-bold text-sm text-black">
                  {formatPrice(editUnitPrice * editQty)}
                </span>
              </div>

              {/* 2 Nút hành động chân modal: [Hủy] và [Lưu thay đổi] */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingItemId(null)}
                  className="w-full py-2 border border-gray-400 bg-white text-xs font-medium rounded cursor-pointer hover:bg-stone-200 text-center"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedCartItem}
                  className="w-full py-2 bg-emerald-800 text-white text-xs font-medium rounded cursor-pointer hover:bg-emerald-900 text-center"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
