/**
 * =====================================================================
 * MÁY CHỦ FULL-STACK EXPRESS & VITE DEV SERVER (SERVER ENTRY POINT)
 * =====================================================================
 * Chạy trên cổng 3000. Tích hợp RESTful API cho Database SQL & Vite Middleware.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth.ts';
import menuRoutes from './server/routes/menu.ts';
import ordersRoutes from './server/routes/orders.ts';
import metaRoutes from './server/routes/meta.ts';
import { dbManager } from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();

  // Middleware giải mã JSON & URL-encoded
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Khởi tạo kết nối cơ sở dữ liệu và nạp seed data
  try {
    await dbManager.getDb();
    console.log('[Server] SQL Database initialized and ready.');
  } catch (err) {
    console.error('[Server] Database initialization warning:', err);
  }

  // 1. CÁC ĐƯỜNG DẪN BACKEND API (/api/*)
  app.use('/api/auth', authRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api', metaRoutes);

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Brew Lite Backend API',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. GẮN VITE MIDDLEWARE (DEV) HOẶC STATIC FILES (PRODUCTION)
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite dev server mounted in middleware mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Server] Production static files served from dist.');
  }

  // 3. KHỞI CHẠY LẮNG NGHE TRÊN CỔNG 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Brew Lite Full-Stack is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
