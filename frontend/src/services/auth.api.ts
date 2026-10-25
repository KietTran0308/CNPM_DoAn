/**
 * =====================================================================
 * AUTH API – các hàm gọi Backend cho đăng ký / đăng nhập / hồ sơ
 * =====================================================================
 * File này CHỈ gọi API và map dữ liệu. Không validate form (việc của
 * LoginForm / RegisterForm) và không giữ state (việc của AuthContext).
 */
import type {
    User,
    UpdateUserProfilePayload,
    ChangePasswordPayload,
} from '../types';
import {request, tokenStorage} from './http';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    message: string;
}

/** Chuẩn hoá user từ backend (role, hạng thành viên...) về kiểu User của frontend. */
export function mapUser(data: any): User {
    const u = data.user || data;
    return {
        id: String(u.id), fullName: u.fullName || '', email: u.email || '', phone: u.phone || '',
        avatar: u.avatar || undefined, favoriteBranch: u.favoriteBranch || undefined,
        role: u.role === 'ADMIN' ? 'admin' : u.role === 'STAFF' ? 'barista' : 'customer',
        loyaltyPoints: u.loyaltyPoints || 0, createdAt: u.createdAt,
        membershipTier: u.loyaltyPoints >= 600 ? 'Diamond' : u.loyaltyPoints >= 300 ? 'Gold' : u.loyaltyPoints >= 100 ? 'Silver' : 'Standard'
    };
}

export const authApi = {
    /** POST /auth/register – tạo tài khoản, lưu JWT. */
    register: async (payload: RegisterPayload): Promise<AuthResponse> => {
        const res = await request<{ user: User; token: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        tokenStorage.set(res.token);
        return {...res, user: mapUser(res.user), message: 'Đăng ký thành công'};
    },

    /** POST /auth/login – đăng nhập, lưu JWT. */
    login: async (payload: LoginPayload): Promise<AuthResponse> => {
        const res = await request<{ user: User; token: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        tokenStorage.set(res.token);
        return {...res, user: mapUser(res.user), message: 'Đăng nhập thành công'};
    },

    /** Xoá JWT khỏi máy (backend dùng JWT stateless nên không cần gọi server). */
    logout: () => tokenStorage.remove(),

    /** GET /auth/me – khôi phục phiên đăng nhập từ JWT. */
    getMe: async () => ({user: mapUser(await request<any>('/auth/me'))}),

    updateProfile: async (payload: UpdateUserProfilePayload) => ({
        user: mapUser(await request<any>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(payload)
        })), message: 'Đã cập nhật hồ sơ'
    }),

    changePassword: (payload: ChangePasswordPayload) => request<{ message: string }>('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
            currentPassword: payload.currentPassword ?? payload.oldPass,
            newPassword: payload.newPassword ?? payload.newPass
        })
    }),

    redeemReward: (rewardId: string, requestId: string) => request<{
        success: boolean; message: string; voucherCode: string; remainingPoints: number
    }>('/rewards/redeem', {method: 'POST', body: JSON.stringify({rewardId, requestId})}),

    getLoyaltyHistory: () => request<Array<{
        id: string; points: number; type: 'EARN' | 'REDEEM'; createdAt: string; order?: { orderCode: number } | null
    }>>('/rewards/history'),
};

export default authApi;
