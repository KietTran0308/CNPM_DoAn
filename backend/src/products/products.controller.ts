import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() list() { return this.prisma.product.findMany({ orderBy: { name: 'asc' } }); }
  @Get(':id') async detail(@Param('id') id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy món');
    return product;
  }
}
