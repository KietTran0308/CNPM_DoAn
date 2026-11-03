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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma.service");
const bcrypt = require("bcryptjs");
const USER_SELECT = {
    id: true, email: true, fullName: true, phone: true, avatar: true,
    favoriteBranch: true, role: true, loyaltyPoints: true, createdAt: true
};
let AuthService = class AuthService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    result(user) {
        const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
        const { id, email, fullName, role, loyaltyPoints, phone, avatar, favoriteBranch } = user;
        return { token, user: { id, email, fullName, role, loyaltyPoints, phone, avatar, favoriteBranch } };
    }
    async register(fullName, email, password, phone) {
        email = email.trim().toLowerCase();
        fullName = fullName.trim();
        if (fullName.length < 2)
            throw new common_1.BadRequestException('Tên quá ngắn');
        if (await this.prisma.user.findUnique({ where: { email } }))
            throw new common_1.BadRequestException('Email đã được sử dụng');
        const passwordHash = await bcrypt.hash(password, 12);
        try {
            const user = await this.prisma.user.create({ data: { fullName, email, passwordHash, phone } });
            return this.result(user);
        }
        catch (error) {
            if (error?.code === 'P2002')
                throw new common_1.BadRequestException('Email đã được sử dụng');
            throw error;
        }
    }
    async login(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        return this.result(user);
    }
    async getMe(id) {
        const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
        if (!user)
            throw new common_1.UnauthorizedException('Tài khoản không tồn tại');
        return user;
    }
    async updateProfile(id, data) {
        const fullName = data.fullName?.trim();
        if (data.fullName !== undefined && (!fullName || fullName.length < 2)) {
            throw new common_1.BadRequestException('Tên phải từ 2 ký tự');
        }
        const avatar = data.avatar?.trim();
        if (avatar && !/^https:\/\//i.test(avatar) && !avatar.startsWith('/images/')) {
            throw new common_1.BadRequestException('Ảnh đại diện phải là URL HTTPS hoặc đường dẫn /images/');
        }
        return this.prisma.user.update({
            where: { id },
            data: {
                ...(fullName !== undefined ? { fullName } : {}),
                ...(data.phone !== undefined
                    ? { phone: data.phone?.trim() || null }
                    : {}),
                ...(data.avatar !== undefined ? { avatar: avatar || null } : {}),
                ...(data.favoriteBranch !== undefined
                    ? { favoriteBranch: data.favoriteBranch?.trim() || null }
                    : {}),
            }, select: USER_SELECT
        });
    }
    async changePassword(id, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.UnauthorizedException('Tài khoản không tồn tại');
        if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
            throw new common_1.BadRequestException('Mật khẩu hiện tại không đúng');
        }
        if (currentPassword === newPassword)
            throw new common_1.BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
        const newHash = await bcrypt.hash(newPassword, 12);
        const updated = await this.prisma.user.updateMany({
            where: { id, passwordHash: user.passwordHash },
            data: { passwordHash: newHash }
        });
        if (updated.count !== 1)
            throw new common_1.BadRequestException('Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại');
        return { message: 'Đổi mật khẩu thành công' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map