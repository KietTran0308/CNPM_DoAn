import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('products')
export class ProductsController {
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    list() {
        return this.prisma.product.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    @Get('options')
    async options() {
        const [sizes, toppings] = await Promise.all([
            this.prisma.sizePrice.findMany(),
            this.prisma.topping.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } }),
        ]);
        return { sizes, toppings };
    }

    // Frontend gửi code như vn-1; UUID của DB là trường id.
    @Get(':code')
    async detail(@Param('code') code: string) {
        const product = await this.prisma.product.findUnique({ where: { code } });
        if (!product) throw new NotFoundException('Không tìm thấy món');
        return product;
    }

}
