/**
 * =====================================================================
 * API CHI NHÁNH, VOUCHERS & LỊCH SỬ ĐIỂM (META DATA API ROUTES)
 * =====================================================================
 */

import { Router, Request, Response } from 'express';
import { dbManager } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../auth.ts';

const router = Router();

// 1. DANH SÁCH CHI NHÁNH
router.get('/branches', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = await dbManager.getDb();
    const rows = await db.query('SELECT * FROM branches');
    const branches = rows.map((b: any) => ({
      id: b.id,
      name: b.name,
      shortName: b.short_name,
      address: b.address,
      counter: b.counter,
      phone: b.phone,
      openHours: b.open_hours,
      distance: b.distance,
    }));
    res.json(branches);
  } catch (error: any) {
    console.error('[Get Branches Error]', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách chi nhánh.' });
  }
});

// 2. DANH SÁCH VOUCHERS
router.get('/vouchers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = await dbManager.getDb();
    const rows = await db.query('SELECT * FROM vouchers WHERE is_active = 1');
    const vouchers = rows.map((v: any) => ({
      code: v.code,
      title: v.title,
      discountAmount: Number(v.discount_amount),
      minOrder: Number(v.min_order),
      description: v.description || '',
      tag: v.tag,
      expiry: v.expiry,
      requiredPoints: Number(v.required_points || 0),
    }));
    res.json(vouchers);
  } catch (error: any) {
    console.error('[Get Vouchers Error]', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách voucher.' });
  }
});

// 3. LỊCH SỬ TÍCH / ĐỔI ĐIỂM CỦA NGƯỜI DÙNG
router.get('/loyalty-history', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await dbManager.getDb();
    const rows = await db.query(
      'SELECT * FROM loyalty_history WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user!.userId]
    );

    const history = rows.map((h: any) => ({
      id: h.id,
      userId: h.user_id,
      orderId: h.order_id,
      action: h.action,
      points: Number(h.points),
      description: h.description,
      createdAt: h.created_at,
    }));

    res.json(history);
  } catch (error: any) {
    console.error('[Get Loyalty History Error]', error);
    res.status(500).json({ error: 'Lỗi khi tải lịch sử điểm thưởng.' });
  }
});

export default router;
