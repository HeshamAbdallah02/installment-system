import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

/**
 * Custom hook for managing toast notifications
 * Provides methods to show success, error, and info toasts
 */
export const useToast = () => {
  const [toast, setToast] = useState<Toast>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({
      message,
      type,
      isVisible: true,
    });
  }, []);

  const showSuccess = useCallback(
    (message: string) => {
      showToast(message, 'success');
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string) => {
      showToast(message, 'error');
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string) => {
      showToast(message, 'info');
    },
    [showToast]
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return {
    toast,
    showToast,
    showSuccess,
    showError,
    showInfo,
    hideToast,
  };
};
