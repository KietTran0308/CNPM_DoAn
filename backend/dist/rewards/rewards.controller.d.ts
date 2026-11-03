import { PrismaService } from '../prisma.service';
import { CurrentUser } from '../auth/jwt.guard';
import { Prisma } from '@prisma/client';
export declare class RedeemRewardDto {
    rewardId: string;
    requestId: string;
}
export declare class RewardsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    redeem(userId: string, dto: RedeemRewardDto): Promise<{
        success: boolean;
        message: string;
        voucherCode: string;
        remainingPoints: number;
    }>;
}
export declare class RewardsController {
    private readonly prisma;
    private readonly rewardsService;
    constructor(prisma: PrismaService, rewardsService: RewardsService);
    history(req: {
        user: CurrentUser;
    }): Prisma.PrismaPromise<{
        order: {
            orderCode: number;
        };
        id: string;
        createdAt: Date;
        points: number;
        type: import(".prisma/client").$Enums.LoyaltyType;
    }[]>;
    redeem(req: {
        user: CurrentUser;
    }, dto: RedeemRewardDto): Promise<{
        success: boolean;
        message: string;
        voucherCode: string;
        remainingPoints: number;
    }>;
}
