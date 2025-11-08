import { useState, forwardRef } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ value, onChange, error, disabled = false, autoFocus = false }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="w-full">
        <label
          htmlFor="password-input"
          className="block text-sm font-semibold text-brand-primary-900 mb-2 text-right"
        >
          كلمة المرور
        </label>

        <div className="relative">
          <input
            ref={ref}
            id="password-input"
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder="أدخل كلمة المرور"
            className={`w-full px-4 py-3 pl-12 border rounded-lg text-right transition-all duration-300 text-brand-offwhite-900 ${
              error
                ? 'border-brand-primary-500 focus:ring-brand-primary-500 focus:border-brand-primary-500 bg-brand-primary-50'
                : 'border-brand-offwhite-400 focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900'
            } ${disabled ? 'bg-brand-offwhite-200 cursor-not-allowed' : 'bg-brand-offwhite-100'}`}
            autoComplete="current-password"
          />

          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-offwhite-600 hover:text-brand-primary-900 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <EyeIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {error && (
          <p className="text-sm text-brand-primary-700 mt-1 text-right font-medium">{error}</p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
