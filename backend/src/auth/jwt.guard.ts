import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { createHash } from 'node:crypto';

export interface CurrentUser { id: string; email: string; role: string; }
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService, private readonly prisma: PrismaService) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Thiếu Bearer token');
        let decoded: { sub?: string; pv?: string };
        try { decoded = this.jwtService.verify(auth.slice(7)); }
        catch { throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn'); }
        if (!decoded.sub) throw new UnauthorizedException('Token thiếu người dùng');
        const user = await this.prisma.user.findUnique({
            where: { id: decoded.sub }, select: { id: true, email: true, role: true, passwordHash: true },
        });
        if (!user) throw new UnauthorizedException('Tài khoản không còn tồn tại');
        // Token cu (khong co pv) va token truoc khi doi mat khau bi tu choi.
        const pv = createHash('sha256').update(user.passwordHash).digest('hex');
        if (!decoded.pv || decoded.pv !== pv) {
            throw new UnauthorizedException('Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại');
        }
        req.user = { id: user.id, email: user.email, role: user.role };
        return true;
    }
}
