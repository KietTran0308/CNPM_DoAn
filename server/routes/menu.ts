/**
 * =====================================================================
 * API THỰC ĐƠN & MÓN ĂN (MENU ITEMS API ROUTES)
 * =====================================================================
 */

import { Router, Request, Response } from 'express';
import { dbManager } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../auth.ts';

const router = Router();

// 1. LẤY TOÀN BỘ THỰC ĐƠN TỪ CƠ SỞ DỮ LIỆU SQL
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    const db = await dbManager.getDb();

    let sql = 'SELECT * FROM menu_items WHERE is_active = 1';
    const params: any[] = [];

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`;
    }

    sql += ' ORDER BY id ASC';

    const rows = await db.query(sql, params);

    // Map các trường SQL sang camelCase cho Frontend
    const products = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      categoryName: r.category_name,
      sectionCaption: r.section_caption,
      description: r.description,
      basePrice: Number(r.base_price),
      image: r.image,
      isPopular: Boolean(r.is_popular),
      calories: Number(r.calories || 0),
      isActive: Boolean(r.is_active),
    }));

    res.json(products);
  } catch (error: any) {
    console.error('[Get Menu Error]', error);
    res.status(500).json({ error: 'Không thể tải danh sách thực đơn từ cơ sở dữ liệu.' });
  }
});

// 2. LẤY CHI TIẾT 1 MÓN
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await dbManager.getDb();
    const rows = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Không tìm thấy món trong thực đơn.' });
      return;
    }

    const r = rows[0];
    res.json({
      id: r.id,
      name: r.name,
      category: r.category,
      categoryName: r.category_name,
      sectionCaption: r.section_caption,
      description: r.description,
      basePrice: Number(r.base_price),
      image: r.image,
      isPopular: Boolean(r.is_popular),
      calories: Number(r.calories || 0),
      isActive: Boolean(r.is_active),
    });
  } catch (error: any) {
    console.error('[Get Product Detail Error]', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin món.' });
  }
});

// 3. THÊM MÓN MỚI (Yêu cầu đăng nhập quản trị / barista)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, category, categoryName, sectionCaption, description, basePrice, image, calories, isPopular } = req.body;

    if (!name || !category || !description || !basePrice || !image) {
      res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin món.' });
      return;
    }

    const id = `item_${Date.now()}`;
    const db = await dbManager.getDb();

    await db.execute(
      `INSERT INTO menu_items (id, name, category, category_name, section_caption, description, base_price, image, calories, is_popular, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)`,
      [
        id,
        name,
        category,
        categoryName || category,
        sectionCaption || '',
        description,
        Number(basePrice),
        image,
        Number(calories || 0),
        isPopular ? 1 : 0,
      ]
    );

    res.status(201).json({ message: 'Thêm món mới thành công!', id });
  } catch (error: any) {
    console.error('[Create Menu Item Error]', error);
    res.status(500).json({ error: 'Không thể thêm món vào thực đơn.' });
  }
});

// 4. CẬP NHẬT MÓN (PUT)
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, category, categoryName, sectionCaption, description, basePrice, image, calories, isPopular } = req.body;
    const db = await dbManager.getDb();

    await db.execute(
      `UPDATE menu_items
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           category_name = COALESCE($3, category_name),
           section_caption = COALESCE($4, section_caption),
           description = COALESCE($5, description),
           base_price = COALESCE($6, base_price),
           image = COALESCE($7, image),
           calories = COALESCE($8, calories),
           is_popular = COALESCE($9, is_popular)
       WHERE id = $10`,
      [
        name || null,
        category || null,
        categoryName || null,
        sectionCaption || null,
        description || null,
        basePrice !== undefined ? Number(basePrice) : null,
        image || null,
        calories !== undefined ? Number(calories) : null,
        isPopular !== undefined ? (isPopular ? 1 : 0) : null,
        id,
      ]
    );

    res.json({ message: 'Cập nhật món thành công!' });
  } catch (error: any) {
    console.error('[Update Menu Item Error]', error);
    res.status(500).json({ error: 'Không thể cập nhật món.' });
  }
});

// 5. ẨN / XÓA MÓN (DELETE)
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await dbManager.getDb();
    await db.execute('UPDATE menu_items SET is_active = 0 WHERE id = $1', [id]);
    res.json({ message: 'Đã ẩn món khỏi thực đơn!' });
  } catch (error: any) {
    console.error('[Delete Menu Item Error]', error);
    res.status(500).json({ error: 'Không thể xóa món.' });
  }
});

export default router;
