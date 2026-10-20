import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type CurrentUser = { id: string; email: string; role: string };

// @UseGuards(JwtGuard) => bắt buộc gửi Authorization: Bearer <token>.
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace(/^Bearer /i, '');
    if (!token || token === request.headers.authorization) throw new UnauthorizedException('Vui lòng đăng nhập');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; role: string }>(token);
      request.user = { id: payload.sub, email: payload.email, role: payload.role } as CurrentUser;
      return true;
    } catch { throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn'); }
  }
}
