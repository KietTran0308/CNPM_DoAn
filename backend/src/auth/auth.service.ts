import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  private result(user: { id: string; email: string; fullName: string; role: string; loyaltyPoints: number }) {
    const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return { token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, loyaltyPoints: user.loyaltyPoints } };
  }

  async register(fullName: string, email: string, password: string) {
    email = email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new BadRequestException('Email đã được sử dụng');
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const user = await this.prisma.user.create({ data: { fullName, email, passwordHash } });
      return this.result(user);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new BadRequestException('Email đã được sử dụng');
      throw error;
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.result(user);
  }

  async getMe(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true, fullName: true, role: true, loyaltyPoints: true } });
    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');
    return user;
  }
}
