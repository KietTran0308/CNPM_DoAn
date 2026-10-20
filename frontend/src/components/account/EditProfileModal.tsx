import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Phone, MapPin, Mail, Camera, Check, AlertCircle, Loader2 } from 'lucide-react';
import { User, UpdateUserProfilePayload } from '../../types';
import { DEFAULT_BRANCHES as BRANCHES } from '../../constants';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (payload: UpdateUserProfilePayload) => Promise<any>;
  isSaving: boolean;
}

const AVATAR_PRESETS = [
  {
    id: 'avatar-1',
    label: 'Brew Barista',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'avatar-2',
    label: 'Espresso Lover',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'avatar-3',
    label: 'Latte Art',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'avatar-4',
    label: 'Cold Brew Fan',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  isSaving,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [favoriteBranch, setFavoriteBranch] = useState('');
  const [avatar, setAvatar] = useState('');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);

  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
    general?: string;
  }>({});

  // Reset form when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setFavoriteBranch(user.favoriteBranch || BRANCHES[0].name);
      setAvatar(user.avatar || '');
      setErrors({});
      setShowCustomAvatarInput(false);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const validate = (): boolean => {
    const newErrors: {
      fullName?: string;
      phone?: string;
    } = {};

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      newErrors.fullName = 'Vui lòng nhập họ và tên của bạn.';
    } else if (trimmedName.length < 2) {
      newErrors.fullName = 'Họ và tên phải có tối thiểu 2 ký tự.';
    } else if (trimmedName.length > 50) {
      newErrors.fullName = 'Họ và tên không được vượt quá 50 ký tự.';
    }

    const trimmedPhone = phone.trim();
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!trimmedPhone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại để nhận thông báo lấy nước.';
    } else if (!phoneRegex.test(trimmedPhone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09).';
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
        fullName: fullName.trim(),
        phone: phone.trim(),
        favoriteBranch: favoriteBranch.trim(),
        avatar: avatar.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        general: err.message || 'Không thể lưu thay đổi. Vui lòng kiểm tra lại.',
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#FAF9F5] rounded-[24px] shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#145C4B]/10 flex items-center justify-center text-[#145C4B]">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 id="edit-profile-title" className="text-base font-bold text-[#252525]">
                Chỉnh sửa thông tin thành viên
              </h3>
              <p className="text-[11px] text-[#252525]/60">
                Thông tin nhận nước tại quầy và tích điểm BrewLite Rewards
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target w-8 h-8 rounded-full border border-black/10 hover:border-black/20 flex items-center justify-center text-[#252525] bg-white transition-colors cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          {errors.general && (
            <div className="p-3 rounded-[14px] bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Avatar Selection */}
          <div>
            <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-2">
              Ảnh đại diện
            </label>
            <div className="flex items-center gap-3">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt="Avatar preview"
                className="w-14 h-14 rounded-full object-cover border-2 border-[#145C4B] shadow-sm bg-stone-100 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAvatar(preset.url);
                        setShowCustomAvatarInput(false);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors cursor-pointer ${
                        avatar === preset.url && !showCustomAvatarInput
                          ? 'bg-[#145C4B] text-white border-[#145C4B]'
                          : 'bg-white text-[#252525]/80 border-black/10 hover:border-black/30'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomAvatarInput(!showCustomAvatarInput)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-dashed border-[#145C4B]/40 text-[#145C4B] hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    <span>URL ảnh</span>
                  </button>
                </div>
              </div>
            </div>

            {showCustomAvatarInput && (
              <div className="mt-2 animate-in fade-in duration-150">
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Dán đường dẫn ảnh đại diện (https://...)"
                  className="w-full text-xs px-3 py-2 rounded-[12px] bg-white border border-black/10 outline-none focus:border-[#145C4B] focus:ring-1 focus:ring-[#145C4B]/20"
                />
              </div>
            )}
          </div>

          {/* Full Name Field */}
          <div>
            <label htmlFor="edit-fullname" className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-[#252525]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="edit-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                placeholder="Nguyễn Thành Đạt"
                className={`w-full text-sm pl-9 pr-3 py-2.5 rounded-[14px] bg-white border transition-colors outline-none focus:ring-2 focus:ring-[#145C4B]/20 ${
                  errors.fullName
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-black/10 focus:border-[#145C4B]'
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="edit-phone" className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-1">
              Số điện thoại nhận nước <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#252525]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="edit-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                placeholder="0901234567"
                className={`w-full text-sm font-mono pl-9 pr-3 py-2.5 rounded-[14px] bg-white border transition-colors outline-none focus:ring-2 focus:ring-[#145C4B]/20 ${
                  errors.phone
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-black/10 focus:border-[#145C4B]'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>

          {/* Favorite Pickup Branch Field */}
          <div>
            <label htmlFor="edit-branch" className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-1">
              Chi nhánh nhận nước yêu thích
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#252525]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                id="edit-branch"
                value={favoriteBranch}
                onChange={(e) => setFavoriteBranch(e.target.value)}
                className="w-full text-xs font-medium pl-9 pr-8 py-2.5 rounded-[14px] bg-white border border-black/10 outline-none focus:border-[#145C4B] focus:ring-2 focus:ring-[#145C4B]/20 transition-colors cursor-pointer appearance-none"
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} — {b.address}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email: Read-only for security */}
          <div>
            <label htmlFor="edit-email-readonly" className="block text-xs font-bold text-[#252525]/60 uppercase tracking-wider mb-1">
              Email tài khoản (Chỉ đọc)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#252525]/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="edit-email-readonly"
                type="email"
                disabled
                value={user.email}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-[14px] bg-stone-100 text-[#252525]/60 border border-black/5 cursor-not-allowed"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer Buttons */}
        <div className="px-5 py-3.5 border-t border-black/5 bg-white/70 backdrop-blur-md flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="touch-target px-4 py-2 rounded-full border border-black/10 text-xs font-bold uppercase tracking-wider text-[#252525] hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="touch-target px-5 py-2 rounded-full bg-[#145C4B] hover:bg-[#035542] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Lưu thông tin</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
