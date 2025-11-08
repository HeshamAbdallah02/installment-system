import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function ToastNotification({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-brand-secondary-600" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-brand-primary-700" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-brand-primary-900" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-brand-secondary-50 border-brand-secondary-300';
      case 'error':
        return 'bg-brand-primary-50 border-brand-primary-300';
      case 'info':
        return 'bg-brand-offwhite-100 border-brand-offwhite-400';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-brand-secondary-900';
      case 'error':
        return 'text-brand-primary-900';
      case 'info':
        return 'text-brand-offwhite-900';
    }
  };

  const toast = (
    <div className="fixed top-4 left-4 z-50 animate-slide-in-top">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${getBackgroundColor()} min-w-[300px] max-w-md`}
        role="alert"
      >
        <div className="flex-shrink-0">{getIcon()}</div>

        <p className={`flex-1 text-sm font-medium text-right ${getTextColor()}`}>{message}</p>

        <button
          onClick={onClose}
          className={`flex-shrink-0 hover:opacity-70 transition-opacity ${getTextColor()}`}
          aria-label="إغلاق"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}
