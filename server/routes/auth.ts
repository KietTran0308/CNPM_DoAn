/**
 * =====================================================================
 * API XÁC THỰC & HỒ SƠ KHÁCH HÀNG (AUTH & PROFILE ROUTES)
 * =====================================================================
 */

import { Router, Response } from 'express';
import { dbManager } from '../db.ts';
import {
  hashPassword,
  comparePassword,
  generateToken,
  requireAuth,
  AuthenticatedRequest,
} from '../auth.ts';

const router = Router();

// 1. ĐĂNG KÝ TÀI KHOẢN MỚI
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'Họ tên, email và mật khẩu không được để trống.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Mật khẩu phải có tối thiểu 6 ký tự.' });
      return;
    }

    const db = await dbManager.getDb();
    const cleanEmail = email.toLowerCase().trim();

    // Kiểm tra trùng email trong DB
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email này đã được sử dụng. Vui lòng chọn email khác.' });
      return;
    }

    // Băm mật khẩu
    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`;

    await db.execute(
      `INSERT INTO users (id, full_name, email, password_hash, phone, avatar, membership_tier, loyalty_points, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        fullName.trim(),
        cleanEmail,
        passwordHash,
        phone || '',
        avatar,
        'Standard',
        10, // Tặng 10 điểm mừng thành viên mới
        'customer',
      ]
    );

    // Ghi nhận lịch sử tích điểm mừng thành viên
    await db.execute(
      `INSERT INTO loyalty_history (id, user_id, action, points, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        `lh_${Date.now()}`,
        userId,
        'EARN',
        10,
        'Thưởng điểm gia nhập thành viên Brew Lite mới',
      ]
    );

    const token = generateToken({ userId, email: cleanEmail, role: 'customer' });

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      token,
      user: {
        id: userId,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone || '',
        avatar,
        membershipTier: 'Standard',
        loyaltyPoints: 10,
        favoriteBranch: 'Brew Lite Nhà Thờ - 12 Nhà Thờ, Hoàn Kiếm, HN',
        role: 'customer',
      },
    });
  } catch (error: any) {
    console.error('[Register Error]', error);
    res.status(500).json({ error: error.message || 'Lỗi server khi đăng ký tài khoản.' });
  }
});

// 2. ĐĂNG NHẬP
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Vui lòng cung cấp cả email và mật khẩu.' });
      return;
    }

    const db = await dbManager.getDb();
    const cleanEmail = email.toLowerCase().trim();

    const users = await db.query(
      `SELECT id, full_name, email, password_hash, phone, avatar, membership_tier, loyalty_points, favorite_branch, role
       FROM users WHERE email = $1`,
      [cleanEmail]
    );

    if (users.length === 0) {
      res.status(401).json({ error: 'Tài khoản không tồn tại trong hệ thống.' });
      return;
    }

    const user = users[0];
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Mật khẩu không chính xác. Vui lòng thử lại.' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role || 'customer',
    });

    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar,
        membershipTier: user.membership_tier,
        loyaltyPoints: Number(user.loyalty_points || 0),
        favoriteBranch: user.favorite_branch,
        role: user.role || 'customer',
      },
    });
  } catch (error: any) {
    console.error('[Login Error]', error);
    res.status(500).json({ error: error.message || 'Lỗi server khi đăng nhập.' });
  }
});

// 3. LẤY THÔNG TIN TÀI KHOẢN HIỆN TẠI (GET /me)
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await dbManager.getDb();
    const users = await db.query(
      `SELECT id, full_name, email, phone, avatar, membership_tier, loyalty_points, favorite_branch, role, created_at
       FROM users WHERE id = $1`,
      [req.user!.userId]
    );

    if (users.length === 0) {
      res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản.' });
      return;
    }

    const u = users[0];
    res.json({
      user: {
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone || '',
        avatar: u.avatar,
        membershipTier: u.membership_tier,
        loyaltyPoints: Number(u.loyalty_points || 0),
        favoriteBranch: u.favorite_branch,
        role: u.role || 'customer',
        createdAt: u.created_at,
      },
    });
  } catch (error: any) {
    console.error('[Get Me Error]', error);
    res.status(500).json({ error: 'Lỗi khi tải thông tin tài khoản.' });
  }
});

// 4. CẬP NHẬT THÔNG TIN HỒ SƠ (PUT /profile)
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fullName, phone, avatar, favoriteBranch } = req.body;
    const db = await dbManager.getDb();

    await db.execute(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           avatar = COALESCE($3, avatar),
           favorite_branch = COALESCE($4, favorite_branch)
       WHERE id = $5`,
      [fullName || null, phone || null, avatar || null, favoriteBranch || null, req.user!.userId]
    );

    const updated = await db.query(
      `SELECT id, full_name, email, phone, avatar, membership_tier, loyalty_points, favorite_branch, role
       FROM users WHERE id = $1`,
      [req.user!.userId]
    );

    const u = updated[0];
    res.json({
      message: 'Cập nhật hồ sơ thành công!',
      user: {
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone || '',
        avatar: u.avatar,
        membershipTier: u.membership_tier,
        loyaltyPoints: Number(u.loyalty_points || 0),
        favoriteBranch: u.favorite_branch,
        role: u.role || 'customer',
      },
    });
  } catch (error: any) {
    console.error('[Update Profile Error]', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật hồ sơ.' });
  }
});

// 5. ĐỔI MẬT KHẨU (PUT /password)
router.put('/password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { oldPassword, oldPass, newPassword, newPass } = req.body;
    const currentPass = oldPassword || oldPass;
    const targetPass = newPassword || newPass;

    if (!currentPass || !targetPass) {
      res.status(400).json({ error: 'Vui lòng điền mật khẩu hiện tại và mật khẩu mới.' });
      return;
    }

    if (targetPass.length < 6) {
      res.status(400).json({ error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      return;
    }

    const db = await dbManager.getDb();
    const users = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user!.userId]);
    if (users.length === 0) {
      res.status(404).json({ error: 'Tài khoản không tồn tại.' });
      return;
    }

    const isMatch = await comparePassword(currentPass, users[0].password_hash);
    if (!isMatch) {
      res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
      return;
    }

    const newHash = await hashPassword(targetPass);
    await db.execute('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.userId]);

    res.json({ message: 'Đổi mật khẩu thành công! Hãy dùng mật khẩu mới từ lần tới.' });
  } catch (error: any) {
    console.error('[Change Password Error]', error);
    res.status(500).json({ error: 'Lỗi khi đổi mật khẩu.' });
  }
});

// 6. ĐỔI ĐIỂM THƯỞNG (POST /redeem-points)
router.post('/redeem-points', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { points, description } = req.body;
    const pts = Number(points);

    if (!pts || pts <= 0) {
      res.status(400).json({ error: 'Số điểm quy đổi không hợp lệ.' });
      return;
    }

    const db = await dbManager.getDb();
    const users = await db.query('SELECT loyalty_points FROM users WHERE id = $1', [req.user!.userId]);
    if (users.length === 0) {
      res.status(404).json({ error: 'Không tìm thấy người dùng.' });
      return;
    }

    const currentPoints = Number(users[0].loyalty_points || 0);
    if (currentPoints < pts) {
      res.status(400).json({ error: `Bạn không đủ điểm thưởng (Hiện có ${currentPoints} điểm).` });
      return;
    }

    const remaining = currentPoints - pts;
    await db.execute('UPDATE users SET loyalty_points = $1 WHERE id = $2', [remaining, req.user!.userId]);

    await db.execute(
      `INSERT INTO loyalty_history (id, user_id, action, points, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [`lh_${Date.now()}`, req.user!.userId, 'REDEEM', -pts, description || 'Đổi voucher ưu đãi']
    );

    res.json({
      message: 'Đổi điểm thưởng thành công!',
      remainingPoints: remaining,
    });
  } catch (error: any) {
    console.error('[Redeem Points Error]', error);
    res.status(500).json({ error: 'Lỗi khi quy đổi điểm thưởng.' });
  }
});

export default router;
