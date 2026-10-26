import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

export type CurrentUser = {
    id: string;
    email: string;
    role: string;
};

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<{
            headers: { authorization?: string };
            user?: CurrentUser;
        }>();

        const authorization = request.headers.authorization || '';

        if (!authorization.startsWith('Bearer ')) {
            throw new UnauthorizedException('Thiếu token đăng nhập');
        }

        const token = authorization.slice(7).trim();

        if (!token) {
            throw new UnauthorizedException('Token không hợp lệ');
        }

        let payload: { sub: string };

        try {
            payload = await this.jwt.verifyAsync<{ sub: string }>(token);
        } catch {
            throw new UnauthorizedException(
                'Token không hợp lệ hoặc đã hết hạn',
            );
        }

        if (!payload?.sub) {
            throw new UnauthorizedException('Token thiếu thông tin tài khoản');
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
            throw new UnauthorizedException('Tài khoản không tồn tại');
        }

        request.user = user;

        return true;
    }
}