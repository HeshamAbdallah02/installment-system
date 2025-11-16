import React, { useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

/**
 * Toast notification component
 * Displays success, error, and info messages with auto-dismiss
 * Requirements: 6.9, 8.9, 10.9 - Show toast notifications
 */
const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-400',
          text: 'text-green-800',
          icon: <CheckCircleIcon className="w-6 h-6 text-green-600" />,
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-400',
          text: 'text-red-800',
          icon: <XCircleIcon className="w-6 h-6 text-red-600" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-400',
          text: 'text-blue-800',
          icon: <InformationCircleIcon className="w-6 h-6 text-blue-600" />,
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div
        className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg border-2 ${styles.bg} ${styles.border} min-w-[320px] max-w-[600px]`}
        role="alert"
      >
        {/* Icon */}
        <div className="flex-shrink-0">{styles.icon}</div>

        {/* Message */}
        <div className={`flex-1 ${styles.text} font-medium text-sm`}>{message}</div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
          aria-label="إغلاق"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
