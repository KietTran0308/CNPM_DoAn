import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt.guard';

@Controller('vouchers')
export class VouchersController {
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    async findAll() {
        const now = new Date();

        const coupons = await this.prisma.coupon.findMany({
            where: {
                isActive: true,
                validFrom: { lte: now },
                validTo: { gt: now },
                ownedVouchers: { none: {} },
            },
            orderBy: { validTo: 'asc' },
        });

        return coupons.filter(
            c => c.usedCount < c.maxUses
        );
    }


    @Get('mine')
    @UseGuards(JwtAuthGuard)
    async mine(@Req() req: { user: CurrentUser }) {
        const rows = await this.prisma.userVoucher.findMany({
            where: { userId: req.user.id },
            include: { coupon: true },
            orderBy: { createdAt: 'desc' },
        });

        const now = new Date();

        return rows.map(v => ({
            id: v.coupon.id,
            code: v.coupon.code,
            discountType: v.coupon.discountType,
            maxUses: v.coupon.maxUses,
            usedCount: v.coupon.usedCount,
            isActive: v.coupon.isActive,
            validFrom: v.coupon.validFrom,
            discountValue: Number(v.coupon.discountValue),
            minOrderValue: Number(v.coupon.minOrderValue),
            validTo: v.coupon.validTo,
            createdAt: v.createdAt,
            rewardId: v.rewardId,
            status: v.usedAt || v.coupon.usedCount >= v.coupon.maxUses
                ? 'used'
                : v.coupon.validTo <= now
                    ? 'expired'
                    : 'active',
        }));
    }
}
