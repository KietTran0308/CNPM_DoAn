import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
export type CurrentUser = {
    id: string;
    email: string;
    role: string;
};
export declare class JwtGuard implements CanActivate {
    private readonly jwt;
    private readonly prisma;
    constructor(jwt: JwtService, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
