import { PrismaClient } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';

const prisma = new PrismaClient();
interface SeedProduct { id: string; name: string; category: string; description: string; basePrice: number; image: string }
async function main() {
  const products: SeedProduct[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
  for (const item of products) {
    const info = { name: item.name, category: item.category, description: item.description, price: item.basePrice, imageUrl: item.image };
    // UPDATE không đặt lại stock để dữ liệu đơn cũ không bị reset khi khởi động lại.
    await prisma.product.upsert({ where: { id: item.id }, update: info, create: { id: item.id, ...info, stock: 50 } });
  }
  for (const v of [
    { code: 'BANMOI15', minOrder: 40000, discountAmount: 15000 },
    { code: 'BREWLITE20', minOrder: 60000, discountAmount: 20000 },
    { code: 'VIPDIAMOND', minOrder: 120000, discountAmount: 50000 },
  ]) {
    await prisma.voucher.upsert({ where: { code: v.code }, create: v, update: { minOrder: v.minOrder, discountAmount: v.discountAmount } });
  }
  console.log(`Seed thành công ${products.length} món và 3 voucher`);
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
