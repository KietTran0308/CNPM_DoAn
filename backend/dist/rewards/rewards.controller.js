"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardsController = exports.RewardsService = exports.RedeemRewardDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const common_2 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class RedeemRewardDto {
}
exports.RedeemRewardDto = RedeemRewardDto;
__decorate([
    (0, class_validator_1.IsIn)([
        'pt-50',
        'pt-100',
        'pt-150',
        'pt-200',
        'pt-300',
    ]),
    __metadata("design:type", String)
], RedeemRewardDto.prototype, "rewardId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], RedeemRewardDto.prototype, "requestId", void 0);
let RewardsService = class RewardsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async redeem(userId, dto) {
        const catalog = {
            'pt-50': { points: 50, amount: 5000, minOrder: 25000, days: 30 },
            'pt-100': { points: 100, amount: 10000, minOrder: 35000, days: 30 },
            'pt-150': { points: 150, amount: 15000, minOrder: 45000, days: 30 },
            'pt-200': { points: 200, amount: 29000, minOrder: 29000, days: 45 },
            'pt-300': { points: 300, amount: 50000, minOrder: 60000, days: 45 },
        };
        const reward = catalog[dto.rewardId];
        if (!reward)
            throw new common_2.BadRequestException('Phần thưởng không hợp lệ');
        const replay = await this.prisma.userVoucher.findUnique({
            where: { requestId: dto.requestId }, include: { coupon: true },
        });
        if (replay) {
            if (replay.userId !== userId || replay.rewardId !== dto.rewardId) {
                throw new common_2.ConflictException('RequestId đã được sử dụng cho yêu cầu khác');
            }
            const account = await this.prisma.user.findUnique({ where: { id: userId } });
            return {
                success: true, message: 'Đổi điểm đã được ghi nhận',
                voucherCode: replay.coupon.code, remainingPoints: account?.loyaltyPoints ?? 0,
            };
        }
        try {
            return await this.prisma.$transaction(async (tx) => {
                const existing = await tx.userVoucher.findUnique({
                    where: { requestId: dto.requestId }, include: { coupon: true },
                });
                if (existing) {
                    if (existing.userId !== userId || existing.rewardId !== dto.rewardId) {
                        throw new common_2.ConflictException('RequestId đã được dùng');
                    }
                    const account = await tx.user.findUniqueOrThrow({ where: { id: userId } });
                    return {
                        success: true, message: 'Đổi điểm đã được ghi nhận',
                        voucherCode: existing.coupon.code, remainingPoints: account.loyaltyPoints,
                    };
                }
                const spent = await tx.user.updateMany({
                    where: { id: userId, loyaltyPoints: { gte: reward.points } },
                    data: { loyaltyPoints: { decrement: reward.points } },
                });
                if (spent.count !== 1)
                    throw new common_2.BadRequestException('Không đủ điểm đổi phần thưởng');
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
                    data: { userId, couponId: coupon.id, rewardId: dto.rewardId, requestId: dto.requestId },
                });
                await tx.loyaltyTransaction.create({
                    data: { userId, points: reward.points, type: 'REDEEM' },
                });
                const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
                return {
                    success: true, message: 'Đổi điểm thành công',
                    voucherCode: coupon.code, remainingPoints: user.loyaltyPoints,
                };
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            if (error?.code === 'P2002' || error?.code === 'P2034') {
                const replay = await this.prisma.userVoucher.findUnique({
                    where: { requestId: dto.requestId }, include: { coupon: true },
                });
                if (replay && replay.userId === userId && replay.rewardId === dto.rewardId) {
                    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
                    return {
                        success: true, message: 'Đổi điểm đã được ghi nhận',
                        voucherCode: replay.coupon.code, remainingPoints: user.loyaltyPoints,
                    };
                }
                throw new common_2.ConflictException('Đổi điểm đang được xử lý, vui lòng thử lại');
            }
            throw error;
        }
    }
};
exports.RewardsService = RewardsService;
exports.RewardsService = RewardsService = __decorate([
    (0, common_2.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RewardsService);
let RewardsController = class RewardsController {
    constructor(prisma, rewardsService) {
        this.prisma = prisma;
        this.rewardsService = rewardsService;
    }
    history(req) {
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
    redeem(req, dto) {
        return this.rewardsService.redeem(req.user.id, dto);
    }
};
exports.RewardsController = RewardsController;
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RewardsController.prototype, "history", null);
__decorate([
    (0, common_1.Post)('redeem'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RedeemRewardDto]),
    __metadata("design:returntype", void 0)
], RewardsController.prototype, "redeem", null);
exports.RewardsController = RewardsController = __decorate([
    (0, common_1.Controller)('rewards'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        RewardsService])
], RewardsController);
//# sourceMappingURL=rewards.controller.js.map