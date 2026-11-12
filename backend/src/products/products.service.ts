import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from '@prisma/client';
import { PrismaService } from "../prisma.service";

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) {}

    async inventory(role: string) {
        if (role !== 'STAFF' && role !== 'ADMIN') {
            throw new ForbiddenException('Chỉ nhân viên được xem kho');
        }
        return this.prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
    }

    async restock(performedBy: string, role: string, dto: { ingredientId: string; quantity: number; note?: string }) {
        if (role !== 'STAFF' && role !== 'ADMIN') throw new ForbiddenException('Chỉ nhân viên được nhập kho');
        if (!Number.isFinite(dto.quantity) || dto.quantity <= 0 || dto.quantity > 1000000 ||
            Math.abs(Math.round(dto.quantity * 1000) - dto.quantity * 1000) > 0.000001) {
            throw new BadRequestException('Số lượng nhập kho không hợp lệ');
        }
        try {
            return await this.prisma.$transaction(async tx => {
                const ingredient = await tx.ingredient.findUnique({ where: { id: dto.ingredientId } });
                if (!ingredient || !ingredient.isActive) throw new NotFoundException('Nguyên liệu không còn hoạt động');
                const change = new Prisma.Decimal(dto.quantity);
                const next = ingredient.stockQty.plus(change);
                const changed = await tx.ingredient.updateMany({
                    where: { id: ingredient.id, version: ingredient.version },
                    data: { stockQty: next, version: { increment: 1 }, updatedAt: new Date() },
                });
                if (changed.count !== 1) throw new ConflictException('Kho vừa thay đổi, hãy thử lại');
                await tx.ingredientMovement.create({ data: {
                    ingredientId: ingredient.id, performedBy, movementType: 'RESTOCK',
                    expectedVersion: ingredient.version, quantityChange: change,
                    stockBefore: ingredient.stockQty, stockAfter: next,
                    note: dto.note?.trim() || null,
                }});
                return { ingredientId: ingredient.id, stockBefore: ingredient.stockQty, stockAfter: next };
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error: any) {
            if (error?.code === 'P2034') throw new ConflictException('Kho đang được cập nhật, hãy thử lại');
            throw error;
        }
    }

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
