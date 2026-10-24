import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { validateEmail, validatePhoneNumber } from '../utils';
import { AuthField } from './AuthField';

export const MIN_NAME_LENGTH = 2;
export const MIN_PASSWORD_LENGTH = 6;

export interface RegisterValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

/** Kiểm tra họ tên, email, (số điện thoại nếu có), mật khẩu – trả về object rỗng nếu hợp lệ. */
export const validateRegister = (v: RegisterValues): RegisterErrors => {
  const errors: RegisterErrors = {};

  if (!v.fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên.';
  else if (v.fullName.trim().length < MIN_NAME_LENGTH) errors.fullName = `Họ và tên phải có tối thiểu ${MIN_NAME_LENGTH} ký tự.`;

  if (!v.email.trim()) errors.email = 'Vui lòng nhập email.';
  else if (!validateEmail(v.email)) errors.email = 'Email không đúng định dạng.';

  if (v.phone.trim() && !validatePhoneNumber(v.phone)) {
    errors.phone = 'Số điện thoại phải gồm 10 chữ số (đầu 03, 05, 07, 08, 09).';
  }

  if (!v.password) errors.password = 'Vui lòng nhập mật khẩu.';
  else if (v.password.length < MIN_PASSWORD_LENGTH) errors.password = `Mật khẩu phải có tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`;

  if (!v.confirmPassword) errors.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
  else if (v.password !== v.confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';

  return errors;
};

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const EMPTY: RegisterValues = { fullName: '', email: '', phone: '', password: '', confirmPassword: '' };

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useAuthContext();
  const [values, setValues] = useState<RegisterValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key: keyof RegisterValues) => (value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const errors = validateRegister(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const phone = values.phone.replace(/[\s.-]/g, '') || undefined;
      const res = await register(values.fullName.trim(), values.email.trim(), values.password, phone);
      if (res.success) onSuccess();
      else setServerError(res.error || 'Đăng ký không thành công.');
    } catch (err: any) {
      setServerError(err?.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const icon = (Icon: React.ElementType) => <Icon className="w-3.5 h-3.5 text-[#145C4B]" />;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      {serverError && (
        <div role="alert" className="p-3 rounded-[12px] bg-red-50/90 border border-red-200 text-[#c93b2b] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <AuthField id="reg-name" type="text" label="Họ và tên *" icon={icon(UserIcon)} value={values.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn A" autoComplete="name" error={fieldErrors.fullName} />
      <AuthField id="reg-email" type="email" label="Email *" icon={icon(Mail)} value={values.email} onChange={set('email')} placeholder="vidu@email.com" autoComplete="email" error={fieldErrors.email} />
      <AuthField id="reg-phone" type="tel" label="Số điện thoại" icon={icon(Phone)} value={values.phone} onChange={set('phone')} placeholder="0901234567" autoComplete="tel" error={fieldErrors.phone} />
      <AuthField id="reg-password" type="password" label="Mật khẩu *" icon={icon(Lock)} value={values.password} onChange={set('password')} placeholder={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`} autoComplete="new-password" error={fieldErrors.password} />
      <AuthField id="reg-confirm" type="password" label="Xác nhận mật khẩu *" icon={icon(Lock)} value={values.confirmPassword} onChange={set('confirmPassword')} placeholder="Nhập lại mật khẩu" autoComplete="new-password" error={fieldErrors.confirmPassword} />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white hover:brightness-105 active:scale-[0.98] font-bold text-sm uppercase transition-all cursor-pointer mt-2 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{isSubmitting ? 'ĐANG TẠO TÀI KHOẢN...' : 'ĐĂNG KÝ TÀI KHOẢN'}</span>
      </button>

      <div className="text-center text-xs text-[#333333] pt-2">
        Đã có tài khoản?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-[#145C4B] font-bold hover:underline cursor-pointer">
          Đăng nhập
        </button>
      </div>
    </form>
  );
};
