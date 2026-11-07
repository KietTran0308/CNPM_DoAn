
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Không tìm thấy Token bảo vệ!');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = this.jwtService.verify(token);

      request.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException(
        'Token không hợp lệ hoặc đã hết hạn!',
      );
    }
  }
}
