import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * Generic error state component for dashboard components
 * Shows error message with optional retry button
 */
export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, showRetry = true }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-brand-primary-100 rounded-full flex items-center justify-center mb-4">
        <ExclamationTriangleIcon className="w-8 h-8 text-brand-primary-700" />
      </div>
      <p className="text-brand-primary-900 font-semibold text-center mb-2">حدث خطأ</p>
      <p className="text-brand-offwhite-700 text-center mb-4 max-w-md">{message}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          <ArrowPathIcon className="w-5 h-5" />
          <span>إعادة المحاولة</span>
        </button>
      )}
    </div>
  );
};

/**
 * Error state for metric cards
 * Compact error display for small components
 */
export const MetricCardError: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-brand-primary-50 rounded-xl shadow-lg p-6 border-2 border-brand-primary-300">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="w-6 h-6 text-brand-primary-700 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <p className="text-sm text-brand-primary-900 text-right mb-2">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-brand-primary-700 hover:text-brand-primary-900 font-semibold underline"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Error state for chart components
 * Shows error within chart container
 */
export const ChartError: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300">
      <ErrorState message={message} onRetry={onRetry} />
    </div>
  );
};
