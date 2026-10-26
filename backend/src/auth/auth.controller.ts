import {Body, Controller, Get, Post, Put, Req, UseGuards} from '@nestjs/common';
import {IsEmail, IsOptional, IsString, MaxLength, Matches, MinLength} from 'class-validator';
import {AuthService} from './auth.service';
import {JwtGuard, CurrentUser} from './jwt.guard';

class RegisterDto {
    @IsString() @MinLength(2) @MaxLength(255) fullName!: string;
    @IsEmail() @MaxLength(255) email!: string;
    @IsString() @MinLength(6) @MaxLength(128) password!: string;
    @IsOptional() @Matches(/^(03|05|07|08|09)\d{8}$/) phone?: string;
}

class LoginDto {
    @IsEmail() @MaxLength(255) email!: string;
    @IsString() password!: string;
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
    constructor(private readonly auth: AuthService) {
    }

    @Post('register') register(@Body() d: RegisterDto) {
        return this.auth.register(d.fullName, d.email, d.password, d.phone);
    }

    @Post('login') login(@Body() d: LoginDto) {
        return this.auth.login(d.email, d.password);
    }

    @UseGuards(JwtGuard) @Get('me') me(@Req() req: { user: CurrentUser }) {
        return this.auth.getMe(req.user.id);
    }

    @UseGuards(JwtGuard) @Put('profile') profile(@Req() req: { user: CurrentUser }, @Body() d: UpdateProfileDto) {
        return this.auth.updateProfile(req.user.id, d);
    }

    @UseGuards(JwtGuard) @Put('password') password(@Req() req: { user: CurrentUser }, @Body() d: ChangePasswordDto) {
        return this.auth.changePassword(req.user.id, d.currentPassword, d.newPassword);
    }
}

