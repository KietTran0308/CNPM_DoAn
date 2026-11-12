import {Body, Controller, Get, Post, Put, Req, UseGuards, HttpException, HttpStatus} from '@nestjs/common';
import {IsEmail, IsOptional, IsString, MaxLength, Matches, MinLength} from 'class-validator';
import {AuthService} from './auth.service';
import { JwtAuthGuard, CurrentUser } from './jwt.guard';

// CLASS DTO
class RegisterDto {
    @IsString() @MinLength(2) @MaxLength(255) fullName!: string;
    @IsEmail() @MaxLength(255) email!: string;
    @IsString() @MinLength(6) @MaxLength(128) password!: string;
    @IsOptional() @Matches(/^(03|05|07|08|09)\d{8}$/) phone?: string;
}

class LoginDto {
    @IsEmail() @MaxLength(255) email!: string;
    @IsString() @MaxLength(128) password!: string;
}

class UpdateProfileDto {
    @IsOptional() @IsString() @MinLength(2) @MaxLength(255) fullName?: string;
    @IsOptional() @Matches(/^(03|05|07|08|09)\d{8}$/) phone?: string;
    @IsOptional() @IsString() @MaxLength(500) avatar?: string;
    @IsOptional() @IsString() @MaxLength(255) favoriteBranch?: string;
}

class ChangePasswordDto {
    @IsString() currentPassword!: string;
    @IsString() @MinLength(6) @MaxLength(128) newPassword!: string;
}

@Controller('auth')
export class AuthController {
    private readonly attempts = new Map<string, { count: number; reset: number }>();
    private limit(ip: string, action: string) {
        const now = Date.now();
        // Xóa bản ghi cũ để tránh tăng bộ nhớ mãi; vẫn chỉ bảo vệ theo một process.
        if (this.attempts.size > 10000) {
            for (const [key, value] of this.attempts) {
                if (value.reset <= now) this.attempts.delete(key);
            }
        }
        const key = `${action}:${ip}`;
        const item = this.attempts.get(key);
        if (!item || item.reset <= now) {
            this.attempts.set(key, { count: 1, reset: now + 15 * 60_000 });
        } else {
            if (item.count >= (action === 'login' ? 10 : 5)) {
                throw new HttpException('Bạn đã thử quá nhiều lần, vui lòng thử lại sau', HttpStatus.TOO_MANY_REQUESTS);
            }
            item.count++;
        }
    }
    constructor(private readonly auth: AuthService) {
    }

    @Post('register') register(@Req() req: { ip?: string }, @Body() d: RegisterDto) {
        this.limit(req.ip || 'unknown', 'register');
        return this.auth.register(d.fullName, d.email, d.password, d.phone);
    }

    @Post('login') async login(@Req() req: { ip?: string }, @Body() d: LoginDto) {
        const ip = req.ip || 'unknown';
        this.limit(ip, 'login');
        const result = await this.auth.login(d.email, d.password);
        // Khong khoa nham nguoi dung dang nhap thanh cong nhieu lan.
        this.attempts.delete(`login:${ip}`);
        return result;
    }

    @UseGuards(JwtAuthGuard) @Get('me') me(@Req() req: { user: CurrentUser }) {
        return this.auth.getMe(req.user.id);
    }

    @UseGuards(JwtAuthGuard) @Put('profile') profile(@Req() req: { user: CurrentUser }, @Body() d: UpdateProfileDto) {
        return this.auth.updateProfile(req.user.id, d);
    }

    @UseGuards(JwtAuthGuard) @Put('password') password(@Req() req: { user: CurrentUser }, @Body() d: ChangePasswordDto) {
        return this.auth.changePassword(req.user.id, d.currentPassword, d.newPassword);
    }
}

