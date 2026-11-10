import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

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
                imageUrl: true,
                imageKey: true,
                sizePrices: {
                    select: {
                        size: true,
                        price: true,
                    },
                    orderBy: {
                        size: "asc",
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });
    }

    async findToppings() {
        return this.prisma.topping.findMany({
            where: {isActive: true},
            select: {id: true, code: true, name: true, price: true, isActive: true},
            orderBy: {name: 'asc'},
        });
    }

    async getOptions(id: string) {
        await this.findById(id);

        const [sizes, toppings] = await Promise.all([
            this.prisma.productSizePrice.findMany({
                where: { productId: id },
                select: { size: true, price: true },
                orderBy: { size: "asc" },
            }),

            this.prisma.topping.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    code: true,
                    name: true,
                    price: true,
                },
                orderBy: { name: "asc" },
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
            include: {
                sizePrices: {
                    orderBy: { size: "asc" },
                },
            },
        });

        if (!product) {
            throw new NotFoundException("Không tìm thấy món");
        }

        return product;
    }
}
