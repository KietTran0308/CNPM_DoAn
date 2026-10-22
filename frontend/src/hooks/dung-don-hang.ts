import {useRef} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {dichVuDonHang, DuLieuTaoDonHang} from '../services/dich-vu-don-hang';
import {dichVuDiemThuong} from '../services/dich-vu-diem-thuong';
import {dichVuVoucher} from '../services/dich-vu-voucher';
import {Order, PaymentMethodId} from '../types';
import {useGioHangStore} from '../stores/gio-hang-store';
import {useTaiKhoanStore} from '../stores/tai-khoan-store';
import {useGiaoDienStore} from '../stores/giao-dien-store';
import confetti from 'canvas-confetti';
import {USE_MOCK_API} from '../services/api';

export const KHOA_TRUY_VAN_DON_HANG = {
    all: ['don-hang'] as const,
    danhSach: () => [...KHOA_TRUY_VAN_DON_HANG.all, 'danh-sach'] as const,
    chiTiet: (id: string) => [...KHOA_TRUY_VAN_DON_HANG.all, 'chi-tiet', id] as const,
};

export const ORDER_KEYS = KHOA_TRUY_VAN_DON_HANG;

/**
 * Hook quản lý đơn hàng kết hợp React Query và Zustand
 */
export const useDungDonHang = () => {
    const queryClient = useQueryClient();
    const isSubmittingRef = useRef<boolean>(false);

    const clearCart = useGioHangStore((state) => state.clearCart);
    const items = useGioHangStore((state) => state.items);
    const discount = useGioHangStore((state) => state.discount);
    const voucherCode = useGioHangStore((state) => state.voucherCode);
    const getSubtotal = useGioHangStore((state) => state.getSubtotal);
    const getTotal = useGioHangStore((state) => state.getTotal);
    const addToCart = useGioHangStore((state) => state.addToCart);

    const user = useTaiKhoanStore((state) => state.user);
    const openAuthModal = useTaiKhoanStore((state) => state.openAuthModal);
    const setCurrentScreen = useGiaoDienStore((state) => state.setCurrentScreen);
    const closeCart = useGiaoDienStore((state) => state.closeCart);
    const openPaymentFailedModal = useGiaoDienStore((state) => state.openPaymentFailedModal);

    // Truy vấn danh sách đơn hàng từ React Query
    const {
        data: orders = [],
        isLoading,
        isError,
        refetch,
    } = useQuery<Order[]>({
        queryKey: [...KHOA_TRUY_VAN_DON_HANG.danhSach(), user?.id ?? 'guest'],
        queryFn: dichVuDonHang.layDanhSachDonHang,
    });

    // Mutation tạo đơn hàng mới
    const createOrderMutation = useMutation({
        mutationFn: (payload: DuLieuTaoDonHang) => dichVuDonHang.taoDonHang(payload),
        onSuccess: (newOrder) => {
            if (newOrder.status !== 'PAID') return;
            queryClient.setQueryData<Order[]>([...KHOA_TRUY_VAN_DON_HANG.danhSach(), user?.id ?? 'guest'], (prev) =>
                prev ? [newOrder, ...prev] : [newOrder]
            );
            clearCart();
            closeCart();
            setCurrentScreen('confirmation');

            try {
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: {y: 0.6},
                    colors: ['#035542', '#2b7bb9', '#f9e9a9', '#333333'],
                });
            } catch {
                // silent
            }
        },
    });

    // Mutation chuyển trạng thái pha chế tại quầy
    const advanceStatusMutation = useMutation({
        mutationFn: (orderId: string) => dichVuDonHang.chuyenTrangThaiDonHang(orderId),
        onSuccess: (updatedOrder) => {
            if (!updatedOrder) return;
            queryClient.setQueryData<Order[]>([...KHOA_TRUY_VAN_DON_HANG.danhSach(), user?.id ?? 'guest'], (prev: Order[] | undefined) =>
                prev ? prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)) : [updatedOrder]
            );
        },
    });

    const cancelOrderMutation = useMutation({
        mutationFn: (orderId: string) => dichVuDonHang.huyDonHang(orderId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: KHOA_TRUY_VAN_DON_HANG.danhSach() });
            await useTaiKhoanStore.getState().initAuth();
            await queryClient.invalidateQueries({ queryKey: ['diem-thuong'] });
            await queryClient.invalidateQueries({ queryKey: ['voucher'] });
        },
    });

    const pickupBranch = useGioHangStore((state) => state.pickupBranch);
    const pickupTimeType = useGioHangStore((state) => state.pickupTimeType);
    const scheduledTime = useGioHangStore((state) => state.scheduledTime);
    const pickupNote = useGioHangStore((state) => state.pickupNote);
    const pointsDiscount = useGioHangStore((state) => state.pointsDiscount);

    const createOrder = async (
        paymentMethod: PaymentMethodId,
        simulateFailure = false,
        customCustomer?: { name: string; phone: string }
    ): Promise<{ success: boolean; order?: Order; error?: string }> => {
        // Chống nhấn đúp hoặc tạo đơn trùng lặp
        if (isSubmittingRef.current || createOrderMutation.isPending) {
            return {success: false, error: 'Đang xử lý thanh toán, vui lòng chờ trong giây lát.'};
        }

        if (items.length === 0) {
            return {success: false, error: 'Giỏ hàng đang trống!'};
        }

        if (!user) {
            openAuthModal('login');
            return {success: false, error: 'Vui lòng đăng nhập trước khi đặt đơn.'};
        }

        try {
            isSubmittingRef.current = true;
            const orderTotal = getTotal();
            const currentPoints = user?.loyaltyPoints || 0;
            const tier = user?.membershipTier || 'Standard';
            const multiplier = tier === 'Diamond' ? 1.5 : tier === 'Gold' ? 1.25 : tier === 'Silver' ? 1.1 : 1;
            const calculatedPoints = Math.max(1, Math.round((orderTotal / 10000) * multiplier));

            const newOrder = await createOrderMutation.mutateAsync({
                items: [...items],
                subtotal: getSubtotal(),
                discount,
                voucherCode: voucherCode || undefined,
                pointsDiscount,
                total: orderTotal,
                paymentMethod,
                customerName: customCustomer?.name || user?.fullName || 'Khách BrewLite',
                customerPhone: customCustomer?.phone || user?.phone || '0901234567',
                pickupBranch: pickupBranch || 'Chi nhánh Bến Nghé (Quầy Bar A)',
                pickupCounter: 'Quầy Barista A - Nhận nước theo mã',
                pickupTimeType,
                scheduledTime,
                pickupNote,
                estimatedMinutes: pickupTimeType === 'scheduled' ? 25 : 8,
                pointsEarned: calculatedPoints,
                simulateFailure: simulateFailure,
            });

            // 1. Đồng bộ trừ điểm nếu khách hàng chọn đổi điểm lấy chiết khấu trực tiếp (15.000đ = 30 điểm)
            if (pointsDiscount > 0 && USE_MOCK_API) {
                useTaiKhoanStore.getState().redeemPoints(30);
                dichVuDiemThuong.ghiNhanTruDiem(
                    30,
                    `Dùng 30 điểm giảm 15.000đ cho đơn hàng ${newOrder.orderNumber}`,
                    currentPoints,
                    newOrder.orderNumber
                );
            }

            // 2. Tự động ghi nhận cộng điểm thưởng vào tài khoản hội viên
            if (USE_MOCK_API) useTaiKhoanStore.getState().addLoyaltyPoints(calculatedPoints);
            if (USE_MOCK_API) dichVuDiemThuong.ghiNhanCongDiem(
                calculatedPoints,
                newOrder.orderNumber,
                pointsDiscount > 0 ? currentPoints - 30 : currentPoints
            );

            // Đồng bộ điểm đã được backend cộng tự động sau khi trả trạng thái PAID.
            if (!USE_MOCK_API) await useTaiKhoanStore.getState().initAuth();

            // 3. Đánh dấu voucher là đã sử dụng nếu có
            if (voucherCode && USE_MOCK_API) {
                dichVuVoucher.danhDauDaSuDung(voucherCode, newOrder.orderNumber);
            }

            if (newOrder.status !== 'PAID') return {success: false, error: 'Đơn chưa thanh toán thành công'};
            return {success: true, order: newOrder};
        } catch (err: any) {
            // Khi mock payment lỗi, server giả lập đã lưu PAYMENT_FAILED; tải lại lịch sử đơn.
            await queryClient.invalidateQueries({queryKey: KHOA_TRUY_VAN_DON_HANG.danhSach()});
            openPaymentFailedModal(err.message || 'Thanh toán không thành công.');
            return {success: false, error: err.message || 'Lỗi khi tạo đơn hàng'};
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const reOrder = (pastOrder: Order) => {
        clearCart();
        pastOrder.items.forEach((item) => {
            addToCart({
                product: item.product,
                size: item.size,
                toppings: item.toppings,
                iceLevel: item.iceLevel,
                sugarLevel: item.sugarLevel,
                note: item.note,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            });
        });
        setCurrentScreen('checkout');
    };

    const advanceOrderStatus = (orderId: string) => {
        advanceStatusMutation.mutate(orderId);
    };

    return {
        orders,
        isLoading,
        isError,
        refetch,
        createOrder,
        advanceOrderStatus,
        reOrder,
        isCreating: createOrderMutation.isPending,
        lastCreatedOrder: orders[0] || null,
        latestOrder: orders[0] || null,
        cancelOrder: (orderId: string) => cancelOrderMutation.mutateAsync(orderId),
        isCancelling: cancelOrderMutation.isPending,
    };
};

export const useOrders = useDungDonHang;
export default useDungDonHang;
