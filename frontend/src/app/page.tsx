'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    assertTransition,
    getStoredToken,
    setStoredToken,
    setStoredUser,
    Screen,
    SizeType,
    ToppingType,
    SugarType,
    IceType,
    CartLine,
    ToppingItem,
    LOGO,
    BACKGROUND,
    layDuongDanAnh,
    QUERY_KEYS,
    formatPrice,
    tinhGiaTopping,
    laySizeKhaDung,
} from '../api';

import { useGioHang } from '../store/useGioHang';
import { DangNhap } from '../man-hinh/DangNhap';
import { ThucDon } from '../man-hinh/ThucDon';
import { ChiTietMon } from '../man-hinh/ChiTietMon';
import { GioHang, ModalSuaMon } from '../man-hinh/GioHang';
import { ThanhToan } from '../man-hinh/ThanhToan';
import { DatHangThanhCong } from '../man-hinh/DatHangThanhCong';
import { LichSuDon } from '../man-hinh/LichSuDon';

interface ThanhDieuHuongProps {
    user: User | null;
    menuOpen: boolean;
    setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
    onNavigateHistory: () => void;
    onLogout: () => void;
    onLogin: () => void;
}

const ThanhDieuHuong: React.FC<ThanhDieuHuongProps> = ({
                                                           user,
                                                           menuOpen,
                                                           setMenuOpen,
                                                           onNavigateHistory,
                                                           onLogout,
                                                           onLogin,
                                                       }) => {
    const [loiLogo, setLoiLogo] = useState(false);
    const duongDanLogo = layDuongDanAnh(LOGO.chinh);
    const userPoints = user?.loyaltyPoints ?? 0;

    return (
        <header className="flex justify-between items-center px-4 sm:px-6 py-3 bg-[#FBF9F5] rounded-xl border border-[#E2D9C0] shadow-xs relative">
            <div className="flex items-center gap-3 shrink-0">
                {duongDanLogo && !loiLogo ? (
                    <img
                        src={duongDanLogo}
                        alt="Logo BrewLite"
                        referrerPolicy="no-referrer"
                        onError={() => setLoiLogo(true)}
                        className="h-12 w-12 sm:h-14 sm:w-auto object-contain shrink-0"
                    />
                ) : (
                    <div className="h-12 w-12 rounded-xl bg-[#124E35] text-[#F5F0E1] text-base font-bold flex items-center justify-center">
                        B
                    </div>
                )}
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#124E35] whitespace-nowrap">
          BrewLite
        </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                {user && <div className="group relative">
                    <div className="text-xs sm:text-sm text-[#124E35] font-mono tabular-nums px-3 py-1.5 rounded-lg bg-[#EDE6D1] border border-[#D5CCB4] font-medium cursor-help select-none">
                        Điểm: <span className="font-semibold text-[#124E35]">{userPoints}</span>
                    </div>
                    <div className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-[#FBF9F5] border border-[#D5CCB4] rounded-xl shadow-lg text-xs text-[#124E35] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                        <div className="font-semibold text-sm border-b border-[#E2D9C0] pb-1.5 mb-2">
                            Cơ chế Tích điểm & Quy đổi
                        </div>
                        <div className="space-y-1.5 text-[11px] leading-relaxed">
                            <div>• <span className="font-semibold">Tích điểm:</span> Mỗi 10.000đ chi tiêu = +1 điểm thưởng</div>
                            <div>• <span className="font-semibold">Quy đổi:</span> 1 điểm = 500đ khi thanh toán đơn hàng</div>
                            <div className="pt-1.5 mt-1 border-t border-[#E2D9C0] font-medium">
                                Điểm hiện tại: <span className="font-bold">{userPoints} điểm</span> ({formatPrice(userPoints * 500)})
                            </div>
                        </div>
                    </div>
                </div>}
                <button
                    type="button"
                    aria-label="Mở menu tài khoản"
                    onClick={() => user ? setMenuOpen(!menuOpen) : onLogin()}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold cursor-pointer transition-colors select-none ${
                        menuOpen
                            ? 'bg-[#124E35] text-[#F5F0E1] border-[#124E35]'
                            : 'border-[#D5CCB4] bg-[#EDE6D1] text-[#124E35] hover:bg-[#124E35] hover:text-[#F5F0E1] hover:border-[#124E35]'
                    }`}
                >
                    {!user ? 'Đăng nhập' : menuOpen ? 'Đóng' : 'Tài khoản'}
                </button>
            </div>

            {user && menuOpen && (
                <div className="absolute right-0 top-16 w-56 bg-[#FBF9F5] border border-[#E2D9C0] rounded-xl shadow-md z-30 text-xs overflow-hidden">
                    <div className="p-3 border-b border-[#D5CCB4] bg-[#EDE6D1]">
                        <div className="text-[11px] text-[#124E35]/80">Tài khoản đang đăng nhập</div>
                        <div className="text-[#124E35] font-semibold truncate mt-0.5">{user?.email}</div>
                        <div className="font-mono tabular-nums text-[#124E35] font-semibold mt-1">
                            Điểm tích lũy: {user?.loyaltyPoints ?? 0} điểm
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setMenuOpen(false);
                            onNavigateHistory();
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-[#EDE6D1] text-[#124E35] border-b border-[#E2D9C0] cursor-pointer transition-colors font-semibold"
                    >
                        Lịch sử đơn hàng
                    </button>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-[#EDE6D1] text-[#124E35] cursor-pointer transition-colors font-medium"
                    >
                        Đăng xuất
                    </button>
                </div>
            )}
        </header>
    );
};

function UngDungDatNuoc() {
    const queryClient = useQueryClient();
    const [manHinhHienTai, setManHinhHienTai] = useState<Screen>('menu');
    const [moMenuTaiKhoan, setMoMenuTaiKhoan] = useState(false);

    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authFullName, setAuthFullName] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(false);

    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [availableToppings, setAvailableToppings] = useState<ToppingItem[]>([]);

    const [selectedProduct, setSelectedProduct] = useState<Product>(DEFAULT_PRODUCTS[2]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [detailProductId, setDetailProductId] = useState('');
    const detailRequestRef = useRef(0);
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

    const [usePoints, setUsePoints] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);

    const userLoyaltyPoints = user?.loyaltyPoints ?? 0;
    const maxUsablePoints = Math.min(userLoyaltyPoints, Math.floor(totalCartPrice / 500));
    const actualPointsToUse = usePoints ? Math.min(Math.max(0, pointsToRedeem), maxUsablePoints) : 0;
    const pointsDiscount = actualPointsToUse * 500;
    const finalPayablePrice = Math.max(0, totalCartPrice - pointsDiscount);

    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'bank'>('wallet');
    const [walletType, setWalletType] = useState<'MoMo' | 'VNPay'>('MoMo');
    const [cardNumber, setCardNumber] = useState('9704 1985 2468 1234');
    const [cardExpiry, setCardExpiry] = useState('12/28');
    const [cardCvv, setCardCvv] = useState('888');
    const [simulatePaymentError, setSimulatePaymentError] = useState(false);
    const [currentPendingOrderId, setCurrentPendingOrderId] = useState<string | null>(null);
    // Mỗi lần gửi lại cùng request thanh toán giữ nguyên key (kể cả timeout HTTP).
    const paymentKeysRef = useRef<Record<string, string>>({});
    const getPaymentKey = (orderId: string, method: string, simulateFailure: boolean) => {
        const signature = `${orderId}:${method}:${simulateFailure}`;
        if (!paymentKeysRef.current[signature]) paymentKeysRef.current[signature] = crypto.randomUUID();
        return paymentKeysRef.current[signature];
    };
    const [checkoutStatus, setCheckoutStatus] = useState<OrderStatus | null>(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [stockError, setStockError] = useState<string | null>(null);

    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editProductId, setEditProductId] = useState<string>('');
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
        // Không hiển thị thông tin cache khi token chưa được backend xác nhận.
        setUser(null);
        // Xem menu không cần đăng nhập; chỉ xác thực ở bước thanh toán.
        void taiDanhSachMon();
        if (existing) {
            api.getMe().then(me => {
                setUser(me); setStoredUser(me); setToken(existing);
            }).catch(() => {
                setStoredToken(null); setStoredUser(null); setUser(null); setToken(null);
                sessionStorage.removeItem('brewlite_create_key');
            });
        }
    }, []);

    const taiDanhSachMon = async () => {
        setProductsLoading(true);
        setProductsError(null);
        try {
            const data = await api.getProducts();
            setProducts(data);
            // Toppings không tải được không được che lỗi menu hoặc làm mất menu đã tải.
            try { setAvailableToppings(await api.getToppings()); }
            catch (error) { console.error('Không tải được topping:', error); }
        } catch (err: any) {
            setProductsError(err?.message || 'Không thể kết nối máy chủ để tải thực đơn.');
            console.error('Không tải được dữ liệu menu:', err);
        } finally {
            setProductsLoading(false);
        }
    };

    const moChiTietMon = async (productId: string) => {
        const requestId = ++detailRequestRef.current;
        setDetailProductId(productId);
        setDetailError(null);
        setStockNotice(null);
        setDetailLoading(true);
        setManHinhHienTai('product-detail');
        setSelectedToppings([]);
        setSelectedSugar('100%');
        setSelectedIce('100%');
        setCustomerNote('');
        setSelectedQty(1);
        setAddingToCart(false);

        try {
            const product = await queryClient.fetchQuery({
                queryKey: QUERY_KEYS.chiTietMon(productId),
                queryFn: () => api.getProductById(productId),
            });
            if (requestId !== detailRequestRef.current) return;
            if (!product || product.id !== productId) {
                throw new Error('Không tìm thấy thông tin món này.');
            }
            setSelectedProduct(product);
            const sizes = laySizeKhaDung(product);
            setSelectedSize(sizes.includes('M') ? 'M' : sizes[0] ?? 'M');
        } catch (error: any) {
            if (requestId === detailRequestRef.current) {
                setDetailError(error?.message || 'Không tải được chi tiết món.');
            }
        } finally {
            if (requestId === detailRequestRef.current) setDetailLoading(false);
        }
    };

    const taiLichSuDon = async () => {
        setHistoryLoading(true);
        try {
            const data = await queryClient.fetchQuery({
                queryKey: QUERY_KEYS.lichSuDon,
                queryFn: () => api.getMyOrders(),
            });
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
                res = await api.register(authFullName, authEmail, authPassword);
            }
            if (res.token) {
                setToken(res.token);
                setStoredToken(res.token);
                const loggedUser: User = res.user;
                setUser(loggedUser);
                setStoredUser(loggedUser);
                // Giữ giỏ khi vừa được yêu cầu đăng nhập trước checkout.
                setManHinhHienTai(cartLines.length ? 'cart' : 'menu');
                if (!products.length) void taiDanhSachMon();
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
        setCurrentPendingOrderId(null);
        setCheckoutStatus(null);
        paymentKeysRef.current = {};
        sessionStorage.removeItem('brewlite_create_key');
        clearCart();
        setOrderHistory([]);
        setLastOrder(null);
        setUsePoints(false);
        setPointsToRedeem(0);
        queryClient.removeQueries({ queryKey: QUERY_KEYS.lichSuDon });
        setManHinhHienTai('menu');
    };

    const giaTheoSize = (product: Product, size: SizeType) =>
        product.sizePrices?.[size] ?? product.price;
    const tinhGiaSize = (size: SizeType) =>
        giaTheoSize(selectedProduct, size) - selectedProduct.price;

    const donGiaHienTai =
        giaTheoSize(selectedProduct, selectedSize) + tinhGiaTopping(selectedToppings, availableToppings);

    const chonTopping = (topping: ToppingType) => {
        setSelectedToppings((prev) =>
            prev.includes(topping) ? prev.filter((t) => t !== topping) : [...prev, topping]
        );
    };

    const laySoLuongMonTrongGio = (productId: string): number => {
        return cartLines
            .filter((line) => line.item.productId === productId)
            .reduce((sum, line) => sum + line.item.qty, 0);
    };

    const xuLyThemNhanhVaoGio = (product: Product) => {
        if (product.isActive === false || product.stock <= 0) return;
        const soLuongHienCo = laySoLuongMonTrongGio(product.id);
        if (soLuongHienCo + 1 > product.stock) return;

        const size = laySizeKhaDung(product)[0];
        if (!size) return;
        const newItem: OrderItem = {
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            orderId: '',
            productId: product.id,
            size,
            qty: 1,
            lineTotal: giaTheoSize(product, size),
            sugar: '100%',
            ice: '100%',
        };
        const newCartLine: CartLine = {
            item: newItem,
            productName: product.name,
            toppings: [],
            sugar: '100%',
            ice: '100%',
            unitPrice: giaTheoSize(product, size),
            stock: product.stock,
        };
        addLineToCart(newCartLine);
    };

    const xuLyThemVaoGio = () => {
        setStockNotice(null);
        if (detailLoading || detailError || !laySizeKhaDung(selectedProduct).includes(selectedSize)) {
            setStockNotice('Vui lòng chọn kích cỡ đang được bán.');
            return;
        }

        if (selectedProduct.isActive === false) {
            setStockNotice('Món nước này hiện đang tạm ngừng kinh doanh.');
            return;
        }

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
        const basePrice = prod?.price ?? line.unitPrice - tinhGiaTopping(line.toppings, availableToppings);
        setEditingItemId(line.item.id);
        setEditProductId(line.item.productId);
        setEditProductName(line.productName);
        setEditBasePrice(basePrice);
        const sizes = prod ? laySizeKhaDung(prod) : [];
        const currentSize = line.item.size as SizeType;
        setEditSize(sizes.includes(currentSize) ? currentSize : sizes[0] ?? currentSize);
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

    const productDangSua = products.find(p => p.id === editProductId);
    const donGiaSauKhiSua = (productDangSua ? giaTheoSize(productDangSua, editSize) : editBasePrice)
        + tinhGiaTopping(editToppings, availableToppings);

    const luuMonDaSuaTrongGio = () => {
        if (!editingItemId || !productDangSua || !laySizeKhaDung(productDangSua).includes(editSize)) return;
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

    const xuLyApMaGiamGia = async (e: React.FormEvent) => {
        e.preventDefault();
        setPromoError(null);
        const code = promoCodeInput.trim().toUpperCase();
        if (!code) return;
        try {
            const coupons = await api.getCoupons();
            const coupon = coupons.find(c => c.code === code);
            if (!coupon || !coupon.isActive || coupon.usedCount >= coupon.maxUses ||
                new Date(coupon.validFrom) > new Date() || new Date(coupon.validTo) <= new Date() ||
                rawSubtotal < coupon.minOrderValue) {
                setPromoError('Mã giảm giá không hợp lệ hoặc chưa đủ giá trị đơn hàng');
                return;
            }
            const discount = coupon.discountType === 'PERCENT'
                ? Math.round(rawSubtotal * coupon.discountValue / 100)
                : Math.min(rawSubtotal, coupon.discountValue);
            applyPromo({
                code, discount,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderValue: coupon.minOrderValue,
                validFrom: coupon.validFrom,
                validTo: coupon.validTo,
            });
        } catch (err: any) {
            setPromoError(err?.message || 'Không kiểm tra được mã giảm giá');
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

    const thucHienThanhToan = async (epThanhCong = false) => {
        if (!token) {
            setManHinhHienTai('auth');
            return;
        }
        if (cartLines.length === 0) return;
        setCheckoutLoading(true);
        setStockError(null);

        // Kho được xác định theo định lượng nguyên liệu ở backend ngay trong DB transaction.
        let attemptedOrderId = currentPendingOrderId;
        try {
            let orderId = currentPendingOrderId;
            let officialTotal = finalPayablePrice;
            let officialCode = orderHistory.find(o => o.id === orderId)?.orderCode;
            const orderItems: OrderItem[] = cartLines.map(line => ({
                ...line.item,
                toppings: line.toppings.map(name => {
                    const topping = availableToppings.find(t => t.name === name);
                    if (!topping) throw new Error(`Không tìm thấy topping: ${name}`);
                    return { toppingId: topping.id, servings: 1 };
                }),
            }));
            const createdAtFormatted = dinhDangThoiGian();

            if (!orderId) {
                const orderRes = await api.createOrder(orderItems, appliedPromo?.code, actualPointsToUse);
                orderId = orderRes.orderId;
                attemptedOrderId = orderId;
                officialTotal = orderRes.total;
                officialCode = orderRes.orderCode;
                setCurrentPendingOrderId(orderId);

                const pendingOrder: Order = {
                    id: orderId,
                    userId: user?.id || 'usr_me',
                    status: 'PENDING',
                    total: orderRes.total,
                    orderCode: orderRes.orderCode,
                    createdAt: createdAtFormatted,
                    items: orderItems,
                };
                capNhatLichSuDon((prev) => [pendingOrder, ...prev.filter((o) => o.id !== orderId)]);
            } else {
                // Không tự sửa thông tin đơn đã PENDING trên client.
                // Lấy tổng tiền chính thức từ database trước khi tiếp tục thanh toán.
                const existingOrder = (await api.getMyOrders()).find(o => o.id === orderId);
                if (!existingOrder || !['PENDING', 'PAYMENT_FAILED'].includes(existingOrder.status)) {
                    throw new Error('Đơn hàng không còn ở trạng thái chờ thanh toán. Hãy kiểm tra lịch sử đơn.');
                }
                officialTotal = existingOrder.total;
                officialCode = existingOrder.orderCode;
            }

            const methodString = paymentMethod === 'wallet' ? 'WALLET' : 'CARD';

            const cleanCardDigits = cardNumber.replace(/\D/g, '');
            const loiTheNganHang = paymentMethod === 'bank' && cleanCardDigits.endsWith('0000');
            const gayLoi = epThanhCong ? false : simulatePaymentError || loiTheNganHang;

            const idempotencyKey = getPaymentKey(orderId, methodString, gayLoi);
            const paymentPayload: Payment = {
                id: 'pay_' + Date.now().toString(36),
                orderId,
                idempotencyKey,
                amount: officialTotal,
                method: methodString,
                simulateFailure: gayLoi,
                pointsUsed: actualPointsToUse,
                pointsDiscount,
            };

            const targetStatus: OrderStatus = gayLoi ? 'PAYMENT_FAILED' : 'PAID';
            const payRes = await api.processPayment(paymentPayload, targetStatus);

            if (payRes.status === 'PAID') {
                const paidOrder: Order = {
                    id: orderId,
                    userId: user?.id || 'usr_me',
                    status: 'PAID',
                    total: payRes.total ?? officialTotal,
                    orderCode: officialCode,
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
                    // Tồn kho quản lý theo nguyên liệu ở backend, không trừ số ly giả trên UI.
                    const earnedPoints = payRes.earnedPoints ?? Math.floor(officialTotal / 10000);
                    if (user) {
                        const updatedUser: User = {
                            ...user,
                            loyaltyPoints: Math.max(0, user.loyaltyPoints - actualPointsToUse) + earnedPoints,
                        };
                        setUser(updatedUser);
                        setStoredUser(updatedUser);
                    }
                }

                setLastOrder(paidOrder);
                sessionStorage.removeItem('brewlite_create_key');
                clearCart();
                setUsePoints(false);
                setPointsToRedeem(0);
                setCurrentPendingOrderId(null);
                paymentKeysRef.current = {};
                setCheckoutStatus(null);
                setSimulatePaymentError(false);
                api.getMe().then(me => {setUser(me); setStoredUser(me);}).catch(() => {});
                setManHinhHienTai('success');
            } else {
                capNhatLichSuDon((prev) =>
                    prev.map((o) => (o.id === orderId ? { ...o, status: 'PAYMENT_FAILED' } : o))
                );
                setCheckoutStatus('PAYMENT_FAILED');
            }
        } catch (error: any) {
            // Không kết luận PAYMENT_FAILED từ lỗi mạng; server có thể đã commit PAID.
            if (attemptedOrderId) {
                try {
                    const history = await api.getMyOrders();
                    setOrderHistory(history);
                    const latest = history.find(o => o.id === attemptedOrderId);
                    if (latest?.status === 'PAID') {
                        setLastOrder(latest);
                        clearCart();
                        sessionStorage.removeItem('brewlite_create_key');
                        setCurrentPendingOrderId(null);
                        paymentKeysRef.current = {};
                        setCheckoutStatus(null);
                        api.getMe().then(me => {setUser(me); setStoredUser(me);}).catch(() => {});
                        setManHinhHienTai('success');
                        return;
                    }
                    setCheckoutStatus(latest?.status === 'PAYMENT_FAILED' ? 'PAYMENT_FAILED' : null);
                } catch {}
            }
            setStockError(error?.message || 'Chưa xác định được kết quả thanh toán. Kiểm tra lại trạng thái đơn trước khi thử lại.');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const xuLyXacNhanThanhToan = async () => {
        await thucHienThanhToan(false);
    };

    const xuLyThuLaiThanhToan = async () => {
        setSimulatePaymentError(false);
        await thucHienThanhToan(true);
    };

    const xuLyHuyDonDangThanhToan = async () => {
        if (currentPendingOrderId) {
            try { await api.transitionOrderStatus(currentPendingOrderId, 'CANCELLED'); } catch (error: any) { setStockError(error.message); return; }
            capNhatLichSuDon((prev) =>
                prev.map((o) => (o.id === currentPendingOrderId ? { ...o, status: 'CANCELLED' } : o))
            );
        }
        sessionStorage.removeItem('brewlite_create_key');
        paymentKeysRef.current = {};
        setCurrentPendingOrderId(null);
        setCheckoutStatus(null);
        setSimulatePaymentError(false);
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
            // Không cập nhật trạng thái local trước khi nhận xác nhận từ backend.
            const idempotencyKey = getPaymentKey(orderId, 'WALLET', false);
            const payload: Payment = {
                id: 'pay_' + Date.now().toString(36),
                orderId,
                idempotencyKey,
                amount: order.total,
                method: 'WALLET',
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
                    if (currentPendingOrderId === orderId) {
                        clearCart();
                        setCurrentPendingOrderId(null);
                        setCheckoutStatus(null);
                        setSimulatePaymentError(false);
                    }
                    // Số dư điểm và tồn kho sẽ được tải lại từ máy chủ.
                    await taiDanhSachMon();
                    api.getMe().then(me => {setUser(me); setStoredUser(me);}).catch(() => {});
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
                // Lỗi HTTP không chứng minh thanh toán thất bại. Đồng bộ từ DB.
                try {
                    const fresh = await api.getMyOrders();
                    setOrderHistory(fresh);
                    const latest = fresh.find(o => o.id === orderId);
                    if (latest && lastOrder?.id === orderId) setLastOrder(latest);
                } catch {}
                setStatusNotice({
                    type: 'error',
                    message: `Chưa xác nhận kết quả thanh toán đơn #${orderId}. Kiểm tra lại lịch sử trước khi thử tiếp.`,
                    orderId,
                });
            }
        } else {
            if (targetStatus !== 'CANCELLED') return;
            try { await api.transitionOrderStatus(orderId, targetStatus); } catch (error: any) {
                setStatusNotice({type:'error', message:error.message || 'Không thể hủy đơn', orderId}); return;
            }
            // Hoàn tiền, hoàn điểm, hoàn kho thực hiện ở backend trong transaction.
            await taiDanhSachMon();
            api.getMe().then(me => {setUser(me); setStoredUser(me);}).catch(() => {});
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
        <div
            style={{
                backgroundImage: `url('${BACKGROUND}')`,
                backgroundSize: '100% auto',
                backgroundPosition: 'top center',
                backgroundRepeat: 'repeat-y',
            }}
            className="w-full min-h-screen bg-[#124E35] text-neutral-900 font-sans flex flex-col relative"
        >
            <div
                aria-hidden="true"
                className="fixed inset-0 bg-[#124E35]/35 backdrop-blur-[1px] pointer-events-none z-0"
            />
            <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 flex-1 flex flex-col relative z-10">
                {manHinhHienTai === 'auth' && (
                    <DangNhap
                        authMode={authMode}
                        setAuthMode={setAuthMode}
                        authEmail={authEmail}
                        setAuthEmail={setAuthEmail}
                        authPassword={authPassword}
                        authFullName={authFullName}
                        setAuthFullName={setAuthFullName}
                        setAuthPassword={setAuthPassword}
                        authError={authError}
                        setAuthError={setAuthError}
                        authLoading={authLoading}
                        onAuthSubmit={xuLyDangNhapDangKy}
                    />
                )}

                {manHinhHienTai === 'menu' && (
                    <ThucDon
                        header={
                            <ThanhDieuHuong
                                user={user}
                                menuOpen={moMenuTaiKhoan}
                                setMenuOpen={setMoMenuTaiKhoan}
                                onNavigateHistory={() => {
                                    taiLichSuDon();
                                    setManHinhHienTai('history');
                                }}
                                onLogout={xuLyDangXuat}
                                onLogin={() => setManHinhHienTai('auth')}
                            />
                        }
                        products={products}
                        productsLoading={productsLoading}
                        productsError={productsError}
                        onRetryProducts={() => void taiDanhSachMon()}
                        onOpenProductDetail={moChiTietMon}
                        totalCartCount={totalCartCount}
                        onViewCart={() => setManHinhHienTai('cart')}
                        onQuickAddProduct={xuLyThemNhanhVaoGio}
                    />
                )}

                {manHinhHienTai === 'product-detail' && (
                    <ChiTietMon
                        selectedProduct={selectedProduct}
                        toppings={availableToppings}
                        user={user}
                        detailLoading={detailLoading}
                        detailError={detailError}
                        onRetry={() => void moChiTietMon(detailProductId)}
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
                        onBack={() => {
                            detailRequestRef.current++;
                            setManHinhHienTai('menu');
                        }}
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
                            if (!token) {
                                setManHinhHienTai('auth');
                                return;
                            }
                            setCheckoutStatus(null);
                            setManHinhHienTai('checkout');
                        }}
                    />
                )}

                {manHinhHienTai === 'checkout' && (
                    <ThanhToan
                        user={user}
                        rawSubtotal={rawSubtotal}
                        discountAmount={discountAmount}
                        totalCartPrice={totalCartPrice}
                        cartLines={cartLines}
                        promoCodeInput={promoCodeInput}
                        setPromoCodeInput={setPromoCodeInput}
                        appliedPromo={appliedPromo}
                        promoError={promoError}
                        setPromoError={setPromoError}
                        onApplyPromo={xuLyApMaGiamGia}
                        onRemovePromo={removePromo}
                        usePoints={usePoints}
                        setUsePoints={setUsePoints}
                        pointsToRedeem={pointsToRedeem}
                        setPointsToRedeem={setPointsToRedeem}
                        stockError={stockError}
                        setStockError={setStockError}
                        currentPendingOrderId={currentPendingOrderId}
                        checkoutStatus={checkoutStatus}
                        checkoutLoading={checkoutLoading}
                        simulatePaymentError={simulatePaymentError}
                        setSimulatePaymentError={setSimulatePaymentError}
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
                        onBackToCart={() => {
                            if (currentPendingOrderId) void xuLyHuyDonDangThanhToan();
                            else setManHinhHienTai('cart');
                        }}
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
                            xuLyChuyenTrangThaiDon(orderId, 'PENDING');
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
                    availableSizes={productDangSua ? laySizeKhaDung(productDangSua) : []}
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
                    getSizeExtra={(size) => productDangSua ? giaTheoSize(productDangSua,size) - productDangSua.price : 0}
                    toppings={availableToppings}
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
