import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('vouchers')
export class VouchersController {
    constructor(
        private prisma: PrismaService
    ) {}

    @Get()
    async getVouchers() {
        const now = new Date();

        const coupons = await this.prisma.coupon.findMany({
            where: {
                isActive: true,
                validFrom: { lte: now },
                validTo: { gt: now }
            }
        });

        return coupons.filter(
            c => c.usedCount < c.maxUses
        );
    }
}