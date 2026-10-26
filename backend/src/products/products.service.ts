import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.product.findMany({
            where: { isActive: true },
            select: {
                id: true,
                code: true,
                name: true,
                category: true,
                description: true,
                price: true,
                imageUrl: true,
                stock: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    async getOptions(id: string) {
        // Kiểm tra sản phẩm có tồn tại và đang hoạt động
        await this.findById(id);

        const [sizes, toppings] = await Promise.all([
            this.prisma.productSizePrice.findMany({
                where: { productId: id },
                select: { size: true, price: true },
                orderBy: { price: 'asc' },
            }),

            this.prisma.topping.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    code: true,
                    name: true,
                    price: true,
                },
                orderBy: { name: 'asc' },
            }),
        ]);

        return { sizes, toppings };
    }

    async findById(id: string) {
        const product = await this.prisma.product.findFirst({
            where: {
                id,
                isActive: true,
            },
        });

        if (!product) {
            throw new NotFoundException("Không tìm thấy món");
        }

        return product;
    }

    // Kiểm soát tồn kho đồng thời
    // Nhận thêm tham số tx (Transaction) để chạy chung luồng với tạo Order
    async decreaseStock(
        productId: string,
        quantity: number,
        tx?: Prisma.TransactionClient,
    ) {
        const db = tx ?? this.prisma;

        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new BadRequestException("Số lượng không hợp lệ");
        }

        const product = await db.product.findUnique({
            where: { id: productId },
        });

        if (!product || !product.isActive) {
            throw new NotFoundException("Sản phẩm không tồn tại");
        }

        const result = await db.product.updateMany({
            where: {
                id: productId,
                version: product.version,
                stock: { gte: quantity },
                isActive: true,
            },
            data: {
                stock: { decrement: quantity },
                version: { increment: 1 },
            },
        });

        if (result.count === 0) {
            throw new BadRequestException(
                "Không đủ tồn kho hoặc sản phẩm đã thay đổi",
            );
        }

        return db.product.findUnique({
            where: { id: productId },
        });
    }
}
