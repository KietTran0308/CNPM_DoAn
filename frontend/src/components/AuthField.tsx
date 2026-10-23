import React from 'react';
import { AlertCircle } from 'lucide-react';

/**Ô nhập liệu dùng chung*/
interface AuthFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  icon: React.ReactNode;
  error?: string;
  onChange: (value: string) => void;
}

export const AuthField: React.FC<AuthFieldProps> = ({ label, icon, error, onChange, id, ...inputProps }) => (
  <div>
    <label htmlFor={id} className="text-xs font-semibold text-[#333333] mb-1 flex items-center gap-1 uppercase">
      {icon} {label}
    </label>
    <input
      id={id}
      {...inputProps}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
      className={`w-full px-3.5 py-2.5 rounded-full bg-white border text-xs text-[#333333] focus:outline-none focus:ring-2 shadow-xs ${
        error
          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
          : 'border-black/10 focus:border-[#145C4B] focus:ring-[#145C4B]/10'
      }`}
    />
    {error && (
      <p className="mt-1 ml-2 text-[11px] font-semibold text-[#c93b2b] flex items-center gap-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
      </p>
    )}
  </div>
);
