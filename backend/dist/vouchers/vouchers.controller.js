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
exports.VouchersController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const common_2 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
let VouchersController = class VouchersController {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
        return coupons.filter(c => c.usedCount < c.maxUses);
    }
    async mine(req) {
        const rows = await this.prisma.userVoucher.findMany({
            where: { userId: req.user.id },
            include: { coupon: true },
            orderBy: { createdAt: 'desc' },
        });
        const now = new Date();
        return rows.map(v => ({
            code: v.coupon.code,
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
};
exports.VouchersController = VouchersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VouchersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, common_2.UseGuards)(jwt_guard_1.JwtGuard),
    __param(0, (0, common_2.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VouchersController.prototype, "mine", null);
exports.VouchersController = VouchersController = __decorate([
    (0, common_1.Controller)('vouchers'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VouchersController);
//# sourceMappingURL=vouchers.controller.js.map