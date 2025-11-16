import React from 'react';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ErrorDisplayProps {
  error: {
    code?: string;
    message: string;
    details?: Record<string, any>;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'banner' | 'modal';
}

/**
 * ErrorDisplay component
 * Displays error messages in Arabic with appropriate styling
 * Requirements: 1.8, 1.9
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  variant = 'inline',
}) => {
  const baseClasses = 'rounded-lg border';

  const variantClasses = {
    inline: 'p-4',
    banner: 'p-4 shadow-md',
    modal: 'p-6',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} bg-brand-primary-50 border-brand-primary-900 text-brand-primary-900`}
      dir="rtl"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <XCircleIcon className="w-6 h-6 text-brand-primary-900" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1">خطأ</h3>
          <p className="text-base">{error.message}</p>

          {error.code && (
            <p className="text-sm text-brand-primary-700 mt-1">رمز الخطأ: {error.code}</p>
          )}

          {error.details && Object.keys(error.details).length > 0 && (
            <div className="mt-2 text-sm text-brand-primary-700">
              <details>
                <summary className="cursor-pointer hover:underline">تفاصيل إضافية</summary>
                <pre className="mt-2 p-2 bg-brand-offwhite-100 rounded text-xs overflow-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors text-sm font-medium"
              >
                إعادة المحاولة
              </button>
            )}

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="px-4 py-2 bg-brand-offwhite-200 text-brand-primary-900 rounded-lg hover:bg-brand-offwhite-300 transition-colors text-sm font-medium"
              >
                إغلاق
              </button>
            )}
          </div>
        </div>

        {onDismiss && variant !== 'modal' && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 text-brand-primary-900 hover:text-brand-primary-950"
            aria-label="إغلاق"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Warning display component
 */
export const WarningDisplay: React.FC<{
  message: string;
  onDismiss?: () => void;
}> = ({ message, onDismiss }) => {
  return (
    <div
      className="p-4 rounded-lg border bg-brand-secondary-50 border-brand-secondary-400 text-brand-primary-900"
      dir="rtl"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="w-6 h-6 text-brand-secondary-700" />
        </div>

        <div className="flex-1">
          <p className="text-base">{message}</p>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 text-brand-primary-900 hover:text-brand-primary-950"
            aria-label="إغلاق"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
