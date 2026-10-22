export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
}

export interface AuthApiResponse {
  success: boolean;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    membershipTier?: string;
    loyaltyPoints?: number;
  };
  error?: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthApiResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!payload.email.trim() || !payload.password) {
          resolve({ success: false, error: 'Email và mật khẩu không được để trống.' });
          return;
        }
        resolve({
          success: true,
          user: {
            id: 'usr_mock_123',
            fullName: 'Người dùng thử nghiệm',
            email: payload.email,
            membershipTier: 'Standard',
            loyaltyPoints: 100,
          },
        });
      }, 600);
    });
  },

  register: async (payload: RegisterPayload): Promise<AuthApiResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!payload.email.trim() || !payload.password || !payload.fullName.trim()) {
          resolve({ success: false, error: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
          return;
        }
        resolve({
          success: true,
          user: {
            id: 'usr_mock_456',
            fullName: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            membershipTier: 'Standard',
            loyaltyPoints: 0,
          },
        });
      }, 800);
    });
  },
};