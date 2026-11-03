import { PrismaService } from '../prisma.service';
import { CurrentUser } from '../auth/jwt.guard';
export declare class VouchersController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        code: string;
        isActive: boolean;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        minOrderValue: import("@prisma/client/runtime/library").Decimal;
        maxUses: number;
        usedCount: number;
        validFrom: Date;
        validTo: Date;
    }[]>;
    mine(req: {
        user: CurrentUser;
    }): Promise<{
        code: string;
        discountValue: number;
        minOrderValue: number;
        validTo: Date;
        createdAt: Date;
        rewardId: string;
        status: string;
    }[]>;
}
