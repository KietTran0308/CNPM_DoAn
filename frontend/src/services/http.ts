/**
 * HTTP client dùng chung: base URL, lưu JWT, gọi fetch + chuẩn hoá lỗi.
 * Các file *.api.ts / api.ts chỉ import từ đây, không tự gọi fetch.
 */
import {mockRequest} from '../mocks/request';

/** Chỉ bật khi muốn thử giao diện không cần chạy NestJS/PostgreSQL. */
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'brewlite_auth_token';
export const tokenStorage = {
    get: (): string | null => typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY),
    set: (token: string) => {
        if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
    },
    remove: () => {
        if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
    },
};

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (USE_MOCK_API) return mockRequest<T>(path, options);
    const headers = new Headers(options.headers);
    if (options.body) headers.set('Content-Type', 'application/json');
    const token = tokenStorage.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    let response: Response;
    try {
        response = await fetch(`${BASE_URL}${path}`, {...options, headers, cache: 'no-store'});
    } catch {
        throw new Error('Không kết nối được NestJS. Kiểm tra http://localhost:4000/health hoặc bật NEXT_PUBLIC_USE_MOCK_API=true để thử frontend.');
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) tokenStorage.remove();
        throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || `API lỗi ${response.status}`);
    }
    return body as T;
}

