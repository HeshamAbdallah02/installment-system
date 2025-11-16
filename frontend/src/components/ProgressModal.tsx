import React from 'react';

interface ProgressModalProps {
  isOpen: boolean;
  title: string;
  progress: number;
  message?: string;
}

/**
 * ProgressModal component
 * Shows progress indicator for long-running operations
 * Requirements: 12.8, 13.7
 */
const ProgressModal: React.FC<ProgressModalProps> = ({ isOpen, title, progress, message }) => {
  if (!isOpen) return null;

  const progressPercentage = Math.round(progress);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      dir="rtl"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-brand-primary-900 mb-4">{title}</h3>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full bg-brand-offwhite-200 rounded-full h-4 overflow-hidden relative">
            <div
              className={`absolute top-0 left-0 bg-brand-secondary-400 h-full transition-all duration-300 ease-out`}
              style={{ width: `${progressPercentage}%` }}
              data-progress={progressPercentage}
              role="progressbar"
              aria-label={`${title} - ${progressPercentage}%`}
            />
          </div>
          <p className="text-center text-brand-offwhite-900 mt-2 font-medium" aria-live="polite">
            {progressPercentage}%
          </p>
        </div>

        {/* Message */}
        {message && <p className="text-sm text-brand-offwhite-700 text-center">{message}</p>}

        {/* Loading spinner */}
        <div className="flex justify-center mt-4">
          <svg
            className="animate-spin h-8 w-8 text-brand-primary-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;
