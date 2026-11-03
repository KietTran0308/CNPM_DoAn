import { AuthService } from './auth.service';
import { CurrentUser } from './jwt.guard';
declare class RegisterDto {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
}
declare class LoginDto {
    email: string;
    password: string;
}
declare class UpdateProfileDto {
    fullName?: string;
    phone?: string;
    avatar?: string;
    favoriteBranch?: string;
}
declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(d: RegisterDto): Promise<{
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
    login(d: LoginDto): Promise<{
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
    me(req: {
        user: CurrentUser;
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
    profile(req: {
        user: CurrentUser;
    }, d: UpdateProfileDto): Promise<{
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
    password(req: {
        user: CurrentUser;
    }, d: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
export {};
