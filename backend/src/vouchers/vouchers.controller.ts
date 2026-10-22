import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtGuard, CurrentUser } from '../auth/jwt.guard';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly prisma: PrismaService) {}

  // Chỉ voucher công khai: tuyệt đối không lộ voucher đổi điểm của người dùng khác.
  @Get()
  async getVouchers() {
    const now = new Date();
    return this.prisma.coupon.findMany({
      where: { isActive: true, validFrom: { lte: now }, validTo: { gt: now }, rewardRedemption: { is: null } }
    }).then(rows => rows.filter(c => c.usedCount < c.maxUses));
  }

  @Get('mine') @UseGuards(JwtGuard)
  async mine(@Req() req: { user: CurrentUser }) {
    const now = new Date();
    const records = await this.prisma.rewardRedemption.findMany({
      where: { userId: req.user.id }, include: { coupon: true }, orderBy: { createdAt: 'desc' }
    });
    return records.map(r => ({
      code: r.coupon.code,
      discountType: r.coupon.discountType,
      discountValue: r.coupon.discountValue,
      minOrderValue: r.coupon.minOrderValue,
      validTo: r.coupon.validTo,
      createdAt: r.createdAt,
      rewardId: r.rewardId,
      usedCount: r.coupon.usedCount,
      status: r.coupon.usedCount > 0 ? 'used' : r.coupon.validTo <= now || !r.coupon.isActive ? 'expired' : 'active'
    }));
  }
}
