import React, { useState } from 'react';
import { X, Lock, Key, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { ChangePasswordPayload } from '../../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ChangePasswordPayload) => Promise<any>;
  isSaving: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword) newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải từ 6 ký tự trở lên.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!validate()) return;

    try {
      await onSave({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      // Clear fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        general: err.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.',
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#FAF9F5] rounded-[24px] shadow-2xl border border-white/80 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#145C4B]/10 flex items-center justify-center text-[#145C4B]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 id="change-password-title" className="text-base font-bold text-[#252525]">
                Đổi mật khẩu tài khoản
              </h3>
              <p className="text-[11px] text-[#252525]/60">
                Tăng cường bảo mật cho tài khoản BrewLite của bạn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 text-[#252525]/70 hover:text-[#252525] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errors.general && (
            <div className="p-3 rounded-[14px] bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-1">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#252525]/40 absolute left-3 top-3" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                required
                onChange={(e) => { setCurrentPassword(e.target.value); setErrors(prev => ({ ...prev, currentPassword: undefined })); }}
                placeholder="Nhập mật khẩu hiện tại (bắt buộc)"
                className="w-full text-sm pl-9 pr-10 py-2.5 rounded-[14px] bg-white border border-black/10 focus:border-[#145C4B] focus:ring-2 focus:ring-[#145C4B]/20 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-3 text-[#252525]/40 hover:text-[#252525] transition-colors cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && <p role="alert" className="text-[11px] text-red-600 mt-1">{errors.currentPassword}</p>}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-1">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-[#252525]/40 absolute left-3 top-3" />
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                placeholder="Tối thiểu 6 ký tự"
                className={`w-full text-sm pl-9 pr-10 py-2.5 rounded-[14px] bg-white border transition-colors outline-none focus:ring-2 focus:ring-[#145C4B]/20 ${
                  errors.newPassword
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-black/10 focus:border-[#145C4B]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-[#252525]/40 hover:text-[#252525] transition-colors cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.newPassword}</span>
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-1">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-[#252525]/40 absolute left-3 top-3" />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                placeholder="Nhập lại mật khẩu mới"
                className={`w-full text-sm pl-9 pr-10 py-2.5 rounded-[14px] bg-white border transition-colors outline-none focus:ring-2 focus:ring-[#145C4B]/20 ${
                  errors.confirmPassword
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-black/10 focus:border-[#145C4B]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-[#252525]/40 hover:text-[#252525] transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.confirmPassword}</span>
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-black/5 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="touch-target px-5 py-2.5 rounded-full border border-black/10 bg-white hover:bg-stone-50 text-[#252525] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="touch-target px-6 py-2.5 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Đổi mật khẩu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
