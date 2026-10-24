import { useAuthContext } from '../context/AuthContext';

/** Hook tiện dụng: trạng thái đăng nhập + hành động auth (lấy từ AuthContext). */
export const useAuth = useAuthContext;
