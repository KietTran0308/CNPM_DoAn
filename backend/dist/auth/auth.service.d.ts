import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    private result;
    register(fullName: string, email: string, password: string, phone?: string): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: string;
            loyaltyPoints: number;
            phone: string;
            avatar: string;
            favoriteBranch: string;
        };
    }>;
    login(email: string, password: string): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: string;
            loyaltyPoints: number;
            phone: string;
            avatar: string;
            favoriteBranch: string;
        };
    }>;
    getMe(id: string): Promise<{
        email: string;
        role: string;
        id: string;
        fullName: string;
        loyaltyPoints: number;
        phone: string;
        avatar: string;
        favoriteBranch: string;
        createdAt: Date;
    }>;
    updateProfile(id: string, data: {
        fullName?: string;
        phone?: string | null;
        avatar?: string | null;
        favoriteBranch?: string | null;
    }): Promise<{
        email: string;
        role: string;
        id: string;
        fullName: string;
        loyaltyPoints: number;
        phone: string;
        avatar: string;
        favoriteBranch: string;
        createdAt: Date;
    }>;
    changePassword(id: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
}
