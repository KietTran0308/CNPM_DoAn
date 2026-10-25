/**
 * =====================================================================
 * DỊCH VỤ ĐƠN HÀNG THỰC TẾ (ORDER SERVICE VIA REAL SQL API)
 * =====================================================================
 * Kết nối trực tiếp với backend SQL /api/orders, loại bỏ hoàn toàn mock data
 * và localStorage giả lập database.
 */

import { Order, OrderStatus, PaymentMethodId, CartItem } from '../types';
import { orderApi } from './api';

export interface DuLieuTaoDonHang {
  items: CartItem[];
  subtotal: number;
  discount: number;
  voucherCode?: string;
  pointsDiscount?: number;
  pointsUsed?: number;
  total: number;
  paymentMethod: PaymentMethodId;
  customerName: string;
  customerPhone: string;
  pickupBranch?: string;
  pickupCounter?: string;
  pickupTimeType?: 'asap' | 'scheduled';
  scheduledTime?: string;
  pickupNote?: string;
  estimatedMinutes?: number;
  pointsEarned?: number;
  simulateFailure?: boolean;
}

export type CreateOrderPayload = DuLieuTaoDonHang;

export const dichVuDonHang = {
  /**
   * Lấy danh sách toàn bộ đơn hàng của khách hàng từ SQL Database
   */
  async layDanhSachDonHang(): Promise<Order[]> {
    // Không nuốt lỗi: để React Query biết là lỗi và trang Lịch sử hiện nút "Thử lại".
    const orders = await orderApi.getOrders();
    return Array.isArray(orders) ? orders : [];
  },

  /**
   * Lấy chi tiết đơn hàng theo mã id
   */
  async layChiTietDonHang(orderId: string): Promise<Order | null> {
    try {
      return await orderApi.getOrder(orderId); // GET /orders/:id
    } catch (err) {
      // Dự phòng: tìm trong danh sách đơn của tài khoản (vd. tra theo orderNumber).
      let list: Order[];
      try {
        list = await this.layDanhSachDonHang();
      } catch {
        throw err; // cả hai đều lỗi → báo lỗi API thật (khác với "không tìm thấy đơn")
      }
      return list.find((o) => o.id === orderId || o.orderNumber === orderId) || null;
    }
  },

  /**
   * Thanh toán lại đơn đang PAYMENT_FAILED (giữ nguyên đơn, không tạo đơn mới).
   * Trả về đơn sau khi backend cập nhật (PAID hoặc vẫn PAYMENT_FAILED).
   */
  async thanhToanLai(orderId: string, paymentMethod: PaymentMethodId): Promise<Order> {
    await orderApi.retryPayment(orderId, paymentMethod);
    return orderApi.getOrder(orderId);
  },

  /**
   * Tạo một đơn hàng mới và lưu trực tiếp vào SQL Database
   */
  async taoDonHangMoi(payload: DuLieuTaoDonHang): Promise<Order> {
    const res = await orderApi.createOrder({
      items: payload.items,
      subtotal: payload.subtotal,
      discount: payload.discount,
      pointsDiscount: payload.pointsDiscount,
      pointsUsed: payload.pointsUsed,
      voucherCode: payload.voucherCode,
      total: payload.total,
      paymentMethod: payload.paymentMethod,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      pickupBranch: payload.pickupBranch || 'Brew Lite Nhà Thờ - 12 Nhà Thờ, Hoàn Kiếm, HN',
      pickupCounter: payload.pickupCounter || 'Quầy Barista',
      pickupTimeType: payload.pickupTimeType || 'asap',
      scheduledTime: payload.scheduledTime,
      pickupNote: payload.pickupNote,
    }, payload.simulateFailure);

    return res.order;
  },

  /**
   * Cập nhật trạng thái đơn hàng (Dành cho Barista đổi bước trên SQL Database)
   */
  async capNhatTrangThai(orderId: string, status: OrderStatus): Promise<Order> {
    await orderApi.updateStatus(orderId, status);
    const updated = await this.layChiTietDonHang(orderId);
    if (!updated) {
      throw new Error('Không tìm thấy đơn hàng sau khi cập nhật.');
    }
    return updated;
  },

  async huyDonHang(orderId: string): Promise<Order> {
    await orderApi.cancelOrder(orderId);
    const updated = await this.layChiTietDonHang(orderId);
    if (!updated) throw new Error('Hủy thành công nhưng không tải lại được đơn.');
    return updated;
  },

  // Phương thức tiếng Anh
  async getOrders(): Promise<Order[]> {
    return this.layDanhSachDonHang();
  },

  async createOrder(payload: DuLieuTaoDonHang): Promise<Order> {
    return this.taoDonHangMoi(payload);
  },

  async taoDonHang(payload: DuLieuTaoDonHang): Promise<Order> {
    return this.taoDonHangMoi(payload);
  },

  async chuyenTrangThaiDonHang(orderId: string): Promise<Order> {
    const current = await this.layChiTietDonHang(orderId);
    const nextStatus: OrderStatus =
      !current || current.status === 'PAID'
        ? 'PREPARING'
        : current.status === 'PREPARING'
        ? 'READY'
        : 'COMPLETED';
    return this.capNhatTrangThai(orderId, nextStatus);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return this.capNhatTrangThai(orderId, status);
  },
};

export const orderService = dichVuDonHang;
export default dichVuDonHang;