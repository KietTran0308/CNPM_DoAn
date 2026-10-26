import {BadRequestException, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {PrismaService} from '../prisma.service';
import * as bcrypt from 'bcryptjs';

const USER_SELECT = {
    id: true, email: true, fullName: true, phone: true, avatar: true,
    favoriteBranch: true, role: true, loyaltyPoints: true, createdAt: true
} as const;

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {
    }

    private result(user: {
        id: string;
        email: string;
        fullName: string;
        role: string;
        loyaltyPoints: number;
        phone?: string | null;
        avatar?: string | null;
        favoriteBranch?: string | null
    }) {
        const token = this.jwt.sign({sub: user.id, email: user.email, role: user.role});
        const {id, email, fullName, role, loyaltyPoints, phone, avatar, favoriteBranch} = user;
        return {token, user: {id, email, fullName, role, loyaltyPoints, phone, avatar, favoriteBranch}};
    }

    async register(fullName: string, email: string, password: string, phone?: string) {
        email = email.trim().toLowerCase();
        fullName = fullName.trim();
        if (fullName.length < 2) throw new BadRequestException('Tên quá ngắn');
        if (await this.prisma.user.findUnique({where: {email}})) throw new BadRequestException('Email đã được sử dụng');
        const passwordHash = await bcrypt.hash(password, 12);
        try {
            const user = await this.prisma.user.create({data: {fullName, email, passwordHash, phone}});
            return this.result(user);
        } catch (error: any) {
            if (error?.code === 'P2002') throw new BadRequestException('Email đã được sử dụng');
            throw error;
        }
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({where: {email: email.trim().toLowerCase()}});
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        return this.result(user);
    }

    async getMe(id: string) {
        const user = await this.prisma.user.findUnique({where: {id}, select: USER_SELECT});
        if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');
        return user;
    }

    async updateProfile(id: string, data: {
        fullName?: string;
        phone?: string | null;
        avatar?: string | null;
        favoriteBranch?: string | null
    }) {

        const fullName = data.fullName?.trim();
        if (data.fullName !== undefined && (!fullName || fullName.length < 2)) {
            throw new BadRequestException('Tên phải từ 2 ký tự');
        }
        // Không nhận email, role, loyaltyPoints và passwordHash từ form hồ sơ.
        const avatar = data.avatar?.trim();
        if (avatar && !/^https:\/\//i.test(avatar) && !avatar.startsWith('/images/')) {
            throw new BadRequestException('Ảnh đại diện phải là URL HTTPS hoặc đường dẫn /images/');
        }
        return this.prisma.user.update({
            where: {id},
            data: {
                ...(fullName !== undefined ? {fullName} : {}),
                ...(data.phone !== undefined
                    ? { phone: data.phone?.trim() || null }
                    : {}),
                ...(data.avatar !== undefined ? {avatar: avatar || null} : {}),
                ...(data.favoriteBranch !== undefined
                    ? { favoriteBranch: data.favoriteBranch?.trim() || null }
                    : {}),
            }, select: USER_SELECT
        });
    }

    async changePassword(id: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({where: {id}});
        if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');
        if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
            throw new BadRequestException('Mật khẩu hiện tại không đúng');
        }
        if (currentPassword === newPassword) throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
        const newHash = await bcrypt.hash(newPassword, 12);
        // CAS: từ chối đổi nếu đã có yêu cầu khác đổi mật khẩu trước.
        const updated = await this.prisma.user.updateMany({
            where: {id, passwordHash: user.passwordHash},
            data: {passwordHash: newHash}
        });
        if (updated.count !== 1) throw new BadRequestException('Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại');
        return {message: 'Đổi mật khẩu thành công'};
    }
}
