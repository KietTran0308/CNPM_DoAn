import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

export interface CurrentUser { id: string; email: string; role: string; }
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService, private readonly prisma: PrismaService) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Thiếu Bearer token');
        let decoded: { sub?: string };
        try { decoded = this.jwtService.verify(auth.slice(7)); }
        catch { throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn'); }
        if (!decoded.sub) throw new UnauthorizedException('Token thiếu người dùng');
        const user = await this.prisma.user.findUnique({
            where: { id: decoded.sub }, select: { id: true, email: true, role: true },
        });
        if (!user) throw new UnauthorizedException('Tài khoản không còn tồn tại');
        req.user = user;
        return true;
    }
}
