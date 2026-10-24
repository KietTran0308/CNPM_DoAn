import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { validateEmail } from '../utils';
import { AuthField } from './AuthField';

export interface LoginErrors {
  email?: string;
  password?: string;
}

export const validateLogin = (email: string, password: string): LoginErrors => {
  const errors: LoginErrors = {};
  if (!email.trim()) errors.email = 'Vui lòng nhập email.';
  else if (!validateEmail(email)) errors.email = 'Email không đúng định dạng.';
  if (!password) errors.password = 'Vui lòng nhập mật khẩu.';
  return errors;
};

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const errors = validateLogin(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) onSuccess();
      else setServerError(res.error || 'Đăng nhập không thành công.');
    } catch (err: any) {
      setServerError(err?.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
      {serverError && (
        <div role="alert" className="p-3 rounded-[12px] bg-red-50/90 border border-red-200 text-[#c93b2b] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <AuthField
        id="login-email"
        type="email"
        label="Email đăng nhập *"
        icon={<Mail className="w-3.5 h-3.5 text-[#145C4B]" />}
        value={email}
        onChange={setEmail}
        placeholder="vidu@email.com"
        autoComplete="email"
        error={fieldErrors.email}
      />

      <AuthField
        id="login-password"
        type="password"
        label="Mật khẩu *"
        icon={<Lock className="w-3.5 h-3.5 text-[#145C4B]" />}
        value={password}
        onChange={setPassword}
        placeholder="Nhập mật khẩu..."
        autoComplete="current-password"
        error={fieldErrors.password}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white hover:brightness-105 active:scale-[0.98] font-bold text-sm uppercase transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{isSubmitting ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP'}</span>
      </button>

      <div className="text-center text-xs text-[#333333] pt-2">
        Chưa có tài khoản?{' '}
        <button type="button" onClick={onSwitchToRegister} className="text-[#145C4B] font-bold hover:underline cursor-pointer">
          Đăng ký ngay
        </button>
      </div>
    </form>
  );
};
