/**
 * =====================================================================
 * API ĐƠN HÀNG & GIAO DỊCH (ORDERS & TRANSACTIONS API ROUTES)
 * =====================================================================
 */

import { Router, Response } from 'express';
import { dbManager } from '../db.ts';
import { optionalAuth, requireAuth, AuthenticatedRequest } from '../auth.ts';

const router = Router();

// 1. LẤY DANH SÁCH ĐƠN HÀNG CỦA KHÁCH HÀNG
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await dbManager.getDb();
    const userId = req.user?.userId;

    if (!userId) {
      // Người dùng chưa đăng nhập -> trả về mảng rỗng (không dùng mock data!)
      res.json([]);
      return;
    }

    // Lấy các đơn hàng thuộc về user_id này (hoặc tất cả nếu là barista/admin)
    const isStaff = req.user?.role === 'barista' || req.user?.role === 'admin';
    const orderSql = isStaff
      ? 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 50'
      : 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC';
    const orderParams = isStaff ? [] : [userId];

    const ordersRows = await db.query(orderSql, orderParams);
    if (ordersRows.length === 0) {
      res.json([]);
      return;
    }

    // Lấy items tương ứng cho từng order
    const orderIds = ordersRows.map((o: any) => o.id);
    const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(', ');
    const itemsRows = await db.query(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
      orderIds
    );

    // Gom nhóm items vào order
    const itemsByOrder: Record<string, any[]> = {};
    for (const item of itemsRows) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      let toppings = [];
      try {
        toppings = item.toppings_json ? JSON.parse(item.toppings_json) : [];
      } catch {
        toppings = [];
      }

      itemsByOrder[item.order_id].push({
        cartItemId: item.id,
        product: {
          id: item.product_id,
          name: item.product_name,
          image: item.product_image,
          basePrice: Number(item.unit_price),
        },
        size: {
          id: item.size_id,
          name: item.size_name,
        },
        toppings,
        iceLevel: item.ice_level,
        sugarLevel: item.sugar_level,
        note: item.note || '',
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price),
      });
    }

    const result = ordersRows.map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      userId: o.user_id,
      pickupCode: o.pickup_code,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount || 0),
      pointsDiscount: Number(o.points_discount || 0),
      pointsUsed: Number(o.points_used || 0),
      voucherCode: o.voucher_code || undefined,
      total: Number(o.total),
      paymentMethod: o.payment_method,
      status: o.status,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      pickupBranch: o.pickup_branch,
      pickupCounter: o.pickup_counter,
      pickupTimeType: o.pickup_time_type,
      scheduledTime: o.scheduled_time || undefined,
      pickupNote: o.pickup_note || undefined,
      estimatedMinutes: Number(o.estimated_minutes || 15),
      pointsEarned: Number(o.points_earned || 0),
      createdAt: o.created_at,
      items: itemsByOrder[o.id] || [],
    }));

    res.json(result);
  } catch (error: any) {
    console.error('[Get Orders Error]', error);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử đơn hàng từ cơ sở dữ liệu.' });
  }
});

// 2. TẠO ĐƠN HÀNG MỚI (LƯU VÀO SQL THEO THỜI GIAN THỰC)
router.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      items,
      subtotal,
      discount = 0,
      pointsDiscount = 0,
      pointsUsed = 0,
      voucherCode,
      total,
      paymentMethod,
      customerName,
      customerPhone,
      pickupBranch,
      pickupCounter = 'Quầy Pha Chế',
      pickupTimeType = 'asap',
      scheduledTime,
      pickupNote,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Giỏ hàng trống. Vui lòng chọn ít nhất 1 món.' });
      return;
    }

    if (!customerName || !customerPhone) {
      res.status(400).json({ error: 'Vui lòng cung cấp tên và số điện thoại người nhận.' });
      return;
    }

    const db = await dbManager.getDb();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BL-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${randomSuffix}`;
    const pickupCode = `PK-${Math.floor(100 + Math.random() * 900)}`;
    const userId = req.user?.userId || `guest_${Date.now()}`;
    const pointsEarned = Math.floor(Number(total) / 10000); // 1 điểm cho mỗi 10.000đ

    // Thêm vào bảng orders
    await db.execute(
      `INSERT INTO orders (
        id, order_number, user_id, pickup_code, subtotal, discount, points_discount,
        points_used, voucher_code, total, payment_method, status, customer_name,
        customer_phone, pickup_branch, pickup_counter, pickup_time_type, scheduled_time,
        pickup_note, estimated_minutes, points_earned
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [
        orderId,
        orderNumber,
        userId,
        pickupCode,
        Number(subtotal),
        Number(discount),
        Number(pointsDiscount),
        Number(pointsUsed),
        voucherCode || null,
        Number(total),
        paymentMethod,
        'PAID', // Thanh toán thành công và chuyển vào quầy pha chế
        customerName.trim(),
        customerPhone.trim(),
        pickupBranch || 'Brew Lite Nhà Thờ - 12 Nhà Thờ, Hoàn Kiếm, HN',
        pickupCounter,
        pickupTimeType,
        scheduledTime || null,
        pickupNote || null,
        15,
        pointsEarned,
      ]
    );

    // Thêm từng món vào order_items
    for (const item of items) {
      const itemId = `oi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.execute(
        `INSERT INTO order_items (
          id, order_id, product_id, product_name, product_image, size_id, size_name,
          ice_level, sugar_level, note, quantity, unit_price, total_price, toppings_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          itemId,
          orderId,
          item.product?.id || 'item-unknown',
          item.product?.name || 'Món nước',
          item.product?.image || '',
          item.size?.id || 'M',
          item.size?.name || 'Vừa (M)',
          item.iceLevel || '100%',
          item.sugarLevel || '100%',
          item.note || '',
          Number(item.quantity || 1),
          Number(item.unitPrice || 0),
          Number(item.totalPrice || 0),
          JSON.stringify(item.toppings || []),
        ]
      );
    }

    // Nếu người dùng đã đăng nhập, cập nhật điểm tích lũy vào bảng users & loyalty_history
    if (req.user?.userId) {
      await db.execute(
        `UPDATE users
         SET loyalty_points = loyalty_points + $1 - $2
         WHERE id = $3`,
        [pointsEarned, Number(pointsUsed || 0), req.user.userId]
      );

      if (pointsEarned > 0) {
        await db.execute(
          `INSERT INTO loyalty_history (id, user_id, order_id, action, points, description)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            `lh_${Date.now()}_earn`,
            req.user.userId,
            orderId,
            'EARN',
            pointsEarned,
            `Tích điểm đơn hàng #${orderNumber}`,
          ]
        );
      }
    }

    const createdOrder = {
      id: orderId,
      orderNumber,
      userId,
      pickupCode,
      subtotal: Number(subtotal),
      discount: Number(discount),
      pointsDiscount: Number(pointsDiscount),
      pointsUsed: Number(pointsUsed),
      voucherCode,
      total: Number(total),
      paymentMethod,
      status: 'PAID',
      customerName,
      customerPhone,
      pickupBranch,
      pickupCounter,
      pickupTimeType,
      scheduledTime,
      pickupNote,
      estimatedMinutes: 15,
      pointsEarned,
      createdAt: new Date().toISOString(),
      items,
    };

    res.status(201).json({
      message: 'Đặt đơn hàng thành công!',
      order: createdOrder,
    });
  } catch (error: any) {
    console.error('[Create Order Error]', error);
    res.status(500).json({ error: error.message || 'Không thể tạo đơn hàng trong cơ sở dữ liệu.' });
  }
});

// 3. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (Dành cho Barista đổi bước)
router.put('/:id/status', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await dbManager.getDb();

    const allowed = ['PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: 'Trạng thái đơn hàng không hợp lệ.' });
      return;
    }

    await db.execute('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: `Đã cập nhật trạng thái đơn hàng sang ${status}`, status });
  } catch (error: any) {
    console.error('[Update Order Status Error]', error);
    res.status(500).json({ error: 'Không thể cập nhật trạng thái đơn hàng.' });
  }
});

export default router;
