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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma.service");
let JwtGuard = class JwtGuard {
    constructor(jwt, prisma) {
        this.jwt = jwt;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization || '';
        if (!authorization.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Thiếu token đăng nhập');
        }
        const token = authorization.slice(7).trim();
        if (!token) {
            throw new common_1.UnauthorizedException('Token không hợp lệ');
        }
        let payload;
        try {
            payload = await this.jwt.verifyAsync(token);
        }
        catch {
            throw new common_1.UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
        }
        if (!payload?.sub) {
            throw new common_1.UnauthorizedException('Token thiếu thông tin tài khoản');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Tài khoản không tồn tại');
        }
        request.user = user;
        return true;
    }
};
exports.JwtGuard = JwtGuard;
exports.JwtGuard = JwtGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], JwtGuard);
//# sourceMappingURL=jwt.guard.js.map