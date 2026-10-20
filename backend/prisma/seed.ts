import { PrismaClient, Size, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'node:fs';
import * as path from 'node:path';

const prisma = new PrismaClient();

interface SeedProduct {
    id: string; // Mã định danh trên giao diện (vd: vn-1...), sẽ lưu vào cột `code`
    name: string;
    category: string;
    description: string;
    basePrice: number;
    image: string;
}

async function main() {
    const DEFAULT_PASSWORD_HASH = await bcrypt.hash('123456', 10);
    console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu (Seeding)...');

    // 1. Seed bảng users (3 tài khoản phân quyền: ADMIN, STAFF, CUSTOMER)
    const users = [
        {
            email: 'admin@brewlite.vn',
            passwordHash: DEFAULT_PASSWORD_HASH,
            fullName: 'Quản trị viên BrewLite',
            phone: '0901000001',
            role: 'ADMIN',
            loyaltyPoints: 0,
        },
        {
            email: 'staff@brewlite.vn',
            passwordHash: DEFAULT_PASSWORD_HASH,
            fullName: 'Nhân viên Pha chế',
            phone: '0901000002',
            role: 'STAFF',
            loyaltyPoints: 0,
        },
        {
            email: 'customer@brewlite.vn',
            passwordHash: DEFAULT_PASSWORD_HASH,
            fullName: 'Khách hàng Thân thiết',
            phone: '0901000003',
            role: 'CUSTOMER',
            loyaltyPoints: 500, // Có sẵn điểm để test tính năng đổi điểm trên đơn hàng
        },
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                fullName: u.fullName,
                phone: u.phone,
                role: u.role,
            },
            create: u,
        });
    }
    console.log(`✅ Đã seed bảng users (${users.length} tài khoản - mật khẩu mặc định: 123456)`);

    // 2. Seed bảng size_prices (ON CONFLICT DO UPDATE)
    const sizePrices = [
        { size: Size.S, extraPrice: 0 },
        { size: Size.M, extraPrice: 6000 },
        { size: Size.L, extraPrice: 12000 },
    ];

    for (const item of sizePrices) {
        await prisma.sizePrice.upsert({
            where: { size: item.size },
            update: { extraPrice: item.extraPrice },
            create: {
                size: item.size,
                extraPrice: item.extraPrice,
            },
        });
    }
    console.log('✅ Đã seed bảng size_prices (3 sizes)');

    const toppings = [
        { code: 't1', name: 'Trân châu đen dẻo giòn', price: 8000 },
        { code: 't2', name: 'Kem Macchiato phô mai béo mặn', price: 10000 },
        { code: 't3', name: 'Thạch cà phê phin giòn', price: 7000 },
        { code: 't4', name: 'Thêm Shot Espresso Arabica (+1)', price: 10000 },
        { code: 't5', name: 'Hạt sen Huế thơm bùi', price: 10000 },
        { code: 't6', name: 'Đào ngâm vàng giòn ngọt', price: 8000 },
        { code: 't7', name: 'Vải thiều mọng nước', price: 8000 },
        { code: 't8', name: 'Sốt socola Bỉ đậm đà', price: 8000 },
    ];

    for (const topping of toppings) {
        await prisma.topping.upsert({
            where: { code: topping.code },
            update: {
                name: topping.name,
                price: topping.price,
            },
            create: {
                code: topping.code,
                name: topping.name,
                price: topping.price,
            },
        });
    }
    console.log(`✅ Đã seed bảng toppings (${toppings.length} toppings)`);

    const productsPath = path.join(__dirname, 'products.json');
    const products: SeedProduct[] = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

    for (const item of products) {
        const info = {
            name: item.name,
            category: item.category,
            description: item.description,
            price: item.basePrice,
            imageUrl: item.image,
        };

        // Upsert theo `code` (vì `id` trong DB mới là UUID).
        // UPDATE không đặt lại `stock` để dữ liệu tồn kho hiện tại không bị reset khi khởi động lại.
        await prisma.product.upsert({
            where: { code: item.id },
            update: info,
            create: {
                code: item.id,
                ...info,
                stock: 50,
            },
        });
    }
    console.log(`✅ Đã seed bảng products (${products.length} món)`);

    const now = new Date();
    const validFrom = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // now() - 1 ngày
    const validTo = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);  // now() + 90 ngày

    const coupons = [
        {
            code: 'BANMOI15',
            discountType: DiscountType.FIXED,
            discountValue: 15000,
            minOrderValue: 40000,
            maxUses: 1000,
            validFrom,
            validTo,
        },
        {
            code: 'BREWLITE20',
            discountType: DiscountType.FIXED,
            discountValue: 20000,
            minOrderValue: 60000,
            maxUses: 1000,
            validFrom,
            validTo,
        },
        {
            code: 'VIPDIAMOND',
            discountType: DiscountType.FIXED,
            discountValue: 50000,
            minOrderValue: 120000,
            maxUses: 1000,
            validFrom,
            validTo,
        },
    ];

    for (const c of coupons) {
        await prisma.coupon.upsert({
            where: { code: c.code },
            update: {
                discountType: c.discountType,
                discountValue: c.discountValue,
                minOrderValue: c.minOrderValue,
            },
            create: c,
        });
    }
    console.log(`✅ Đã seed bảng coupons (${coupons.length} mã giảm giá)`);

    console.log('🎉 Hoàn tất toàn bộ quá trình seed dữ liệu!');
}

main()
    .catch((e) => {
        console.error('❌ Lỗi khi seed dữ liệu:', e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });