import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma, LoyaltyType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';

// Danh mục phần thưởng do backend quyết định; frontend chỉ gửi rewardId, không gửi số điểm/giá trị.
export const REWARD_CATALOG = [
  { id: 'pt-50', points: 50, discount: 5000, minOrder: 25000, days: 30, prefix: 'BREW5K', title: 'Phiếu giảm 5.000đ' },
  { id: 'pt-100', points: 100, discount: 10000, minOrder: 35000, days: 30, prefix: 'BREW10K', title: 'Phiếu giảm 10.000đ' },
  { id: 'pt-150', points: 150, discount: 15000, minOrder: 45000, days: 30, prefix: 'BREW15K', title: 'Phiếu giảm 15.000đ' },
  { id: 'pt-200', points: 200, discount: 29000, minOrder: 29000, days: 45, prefix: 'FREECAPHE', title: 'Phiếu giảm 29.000đ' },
  { id: 'pt-300', points: 300, discount: 50000, minOrder: 60000, days: 45, prefix: 'COMBOCAFE', title: 'Phiếu giảm 50.000đ' },
] as const;

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}
  getCatalog() { return REWARD_CATALOG; }

  async redeem(userId: string, rewardId: string, requestId: string) {
    const reward = REWARD_CATALOG.find(r => r.id === rewardId);
    if (!reward) throw new BadRequestException('Phần thưởng không tồn tại');
    const previous = await this.prisma.rewardRedemption.findUnique({ where: { requestId }, include: { coupon: true } });
    if (previous) {
      if (previous.userId !== userId || previous.rewardId !== rewardId) throw new ConflictException('Mã yêu cầu đã được sử dụng');
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
      return { success: true, replay: true, voucherCode: previous.coupon.code, remainingPoints: user.loyaltyPoints, message: 'Đã đổi điểm thành công' };
    }
    try {
      return await this.prisma.$transaction(async tx => {
        const prior = await tx.rewardRedemption.findUnique({ where: { requestId }, include: { coupon: true } });
        if (prior) {
          if (prior.userId !== userId || prior.rewardId !== rewardId) throw new ConflictException('Mã yêu cầu đã được sử dụng');
          const u = await tx.user.findUniqueOrThrow({ where: { id: userId } });
          return { success: true, replay: true, voucherCode: prior.coupon.code, remainingPoints: u.loyaltyPoints, message: 'Đã đổi điểm thành công' };
        }
        const deducted = await tx.user.updateMany({
          where: { id: userId, loyaltyPoints: { gte: reward.points } },
          data: { loyaltyPoints: { decrement: reward.points } }
        });
        if (deducted.count !== 1) throw new BadRequestException('Không đủ điểm để đổi phần thưởng');
        const now = new Date();
        const validTo = new Date(now.getTime() + reward.days * 86400_000);
        const coupon = await tx.coupon.create({
          data: { code: `${reward.prefix}-${randomUUID().slice(0, 8).toUpperCase()}`, discountType: 'FIXED',
            discountValue: reward.discount, minOrderValue: reward.minOrder, maxUses: 1, usedCount: 0,
            validFrom: now, validTo, isActive: true }
        });
        await tx.rewardRedemption.create({ data: { userId, couponId: coupon.id, requestId, rewardId, pointsSpent: reward.points } });
        await tx.loyaltyTransaction.create({ data: { userId, points: reward.points, type: LoyaltyType.REDEEM } });
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        return { success: true, replay: false, voucherCode: coupon.code, remainingPoints: user.loyaltyPoints, message: 'Đổi điểm thành công. Voucher đã được lưu vào tài khoản.' };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (e: any) {
      if (e?.code === 'P2002' || e?.code === 'P2034') {
        const done = await this.prisma.rewardRedemption.findUnique({ where: { requestId }, include: { coupon: true } });
        if (done && done.userId === userId && done.rewardId === rewardId) {
          const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
          return { success: true, replay: true, voucherCode: done.coupon.code, remainingPoints: user.loyaltyPoints, message: 'Đã đổi điểm thành công' };
        }
        throw new ConflictException('Có thay đổi đồng thời, vui lòng thử lại');
      }
      throw e;
    }
  }

  async history(userId: string) {
    return this.prisma.loyaltyTransaction.findMany({
      where: { userId }, include: { order: { select: { orderCode: true } } }, orderBy: { createdAt: 'desc' }
    });
  }
}
