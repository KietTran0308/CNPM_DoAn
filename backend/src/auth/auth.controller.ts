import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtGuard, CurrentUser } from './jwt.guard';

class RegisterDto {
  @IsString() @MinLength(2) fullName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}
class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() d: RegisterDto) { return this.auth.register(d.fullName, d.email, d.password); }
  @Post('login') login(@Body() d: LoginDto) { return this.auth.login(d.email, d.password); }
  @UseGuards(JwtGuard) @Get('me') me(@Req() req: { user: CurrentUser }) { return this.auth.getMe(req.user.id); }
}
