import {
    Controller, Get, Post, Body, Req, UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtGuard, CurrentUser } from '../auth/jwt.guard';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IsIn, IsUUID } from 'class-validator';

export class RedeemRewardDto {
    @IsIn([
        'pt-50',
        'pt-100',
        'pt-150',
        'pt-200',
        'pt-300',
    ])
    rewardId!: string;

    @IsUUID('4')
    requestId!: string;
}


@Injectable()
export class RewardsService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async redeem(userId: string, dto: RedeemRewardDto) {
        const catalog: Record<string, { points: number; amount: number; minOrder: number; days: number }> = {
            'pt-50': { points: 50, amount: 5000, minOrder: 25000, days: 30 },
            'pt-100': { points: 100, amount: 10000, minOrder: 35000, days: 30 },
            'pt-150': { points: 150, amount: 15000, minOrder: 45000, days: 30 },
            'pt-200': { points: 200, amount: 29000, minOrder: 29000, days: 45 },
            'pt-300': { points: 300, amount: 50000, minOrder: 60000, days: 45 },
        };
        const reward = catalog[dto.rewardId];
        if (!reward) throw new BadRequestException('Phần thưởng không hợp lệ');

        // Cùng requestId trả lại kết quả cũ, không trừ điểm hai lần.
        const replay = await this.prisma.userVoucher.findUnique({
            where: { requestId: dto.requestId }, include: { coupon: true },
        });
        if (replay) {
            if (replay.userId !== userId || replay.rewardId !== dto.rewardId) {
                throw new ConflictException('RequestId đã được sử dụng cho yêu cầu khác');
            }
            const account = await this.prisma.user.findUnique({ where: { id: userId } });
            return {
                success: true, message: 'Đổi điểm đã được ghi nhận',
                voucherCode: replay.coupon.code, remainingPoints: account?.loyaltyPoints ?? 0,
            };
        }
        try {
            return await this.prisma.$transaction(async tx => {
                const existing = await tx.userVoucher.findUnique({
                    where: {requestId: dto.requestId}, include: {coupon: true},
                });
                if (existing) {
                    if (existing.userId !== userId || existing.rewardId !== dto.rewardId) {
                        throw new ConflictException('RequestId đã được dùng');
                    }
                    const account = await tx.user.findUniqueOrThrow({where: {id: userId}});
                    return {
                        success: true, message: 'Đổi điểm đã được ghi nhận',
                        voucherCode: existing.coupon.code, remainingPoints: account.loyaltyPoints,
                    };
                }
                const spent = await tx.user.updateMany({
                    where: {id: userId, loyaltyPoints: {gte: reward.points}},
                    data: {loyaltyPoints: {decrement: reward.points}},
                });
                if (spent.count !== 1) throw new BadRequestException('Không đủ điểm đổi phần thưởng');
                // user_vouchers.couponId UNIQUE: mỗi lần đổi tạo coupon riêng có maxUses=1.
                const voucherCode = `R${dto.requestId.replace(/-/g, '').slice(0, 24).toUpperCase()}`;
                const now = new Date();
                const coupon = await tx.coupon.create({
                    data: {
                        code: voucherCode, discountType: 'FIXED', discountValue: reward.amount,
                        minOrderValue: reward.minOrder, maxUses: 1, usedCount: 0,
                        isActive: true, validFrom: now,
                        validTo: new Date(now.getTime() + reward.days * 86400000),
                    },
                });
                await tx.userVoucher.create({
                    data: {userId, couponId: coupon.id, rewardId: dto.rewardId, requestId: dto.requestId},
                });
                await tx.loyaltyTransaction.create({
                    data: {userId, points: reward.points, type: 'REDEEM'},
                });
                const user = await tx.user.findUniqueOrThrow({where: {id: userId}});
                return {
                    success: true, message: 'Đổi điểm thành công',
                    voucherCode: coupon.code, remainingPoints: user.loyaltyPoints,
                };
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error: any) {
            if (error?.code === 'P2002' || error?.code === 'P2034') {
                const replay = await this.prisma.userVoucher.findUnique({
                    where: {requestId: dto.requestId}, include: {coupon: true},
                });
                if (replay && replay.userId === userId && replay.rewardId === dto.rewardId) {
                    const user = await this.prisma.user.findUniqueOrThrow({where: {id: userId}});
                    return {
                        success: true, message: 'Đổi điểm đã được ghi nhận',
                        voucherCode: replay.coupon.code, remainingPoints: user.loyaltyPoints,
                    };
                }
                throw new ConflictException('Đổi điểm đang được xử lý, vui lòng thử lại');
            }
            throw error;
        }
    }
}

@Controller('rewards')
@UseGuards(JwtGuard)
export class RewardsController {
    constructor(private readonly prisma: PrismaService,
                private readonly rewardsService: RewardsService,) {}

    @Get('history')
    history(@Req() req: { user: CurrentUser }) {
        return this.prisma.loyaltyTransaction.findMany({
            where: {
                userId: req.user.id,
            },
            select: {
                id: true,
                points: true,
                type: true,
                createdAt: true,
                order: {
                    select: {
                        orderCode: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    @Post('redeem')
    redeem(
        @Req() req: { user: CurrentUser },
        @Body() dto: RedeemRewardDto,
    ) {
        return this.rewardsService.redeem(
            req.user.id,
            dto,
        );
    }
}

