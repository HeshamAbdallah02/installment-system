/**
 * API Error Handler Utility
 * Provides consistent error handling and user-friendly error messages
 */

import { AxiosError } from 'axios';

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

/**
 * Extract error message from API response
 */
export const getErrorMessage = (error: unknown): string => {
  // Handle Axios errors
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Check if we have a response with error details
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error.message;
    }

    // Handle network errors
    if (axiosError.message === 'Network Error') {
      return 'خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت';
    }

    // Handle timeout errors
    if (axiosError.code === 'ECONNABORTED') {
      return 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى';
    }

    // Handle other Axios errors
    return axiosError.message || 'حدث خطأ غير متوقع';
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Default error message
  return 'حدث خطأ غير متوقع';
};

/**
 * Get error code from API response
 */
export const getErrorCode = (error: unknown): string | null => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return axiosError.response?.data?.error?.code || null;
  }
  return null;
};

/**
 * Check if error is a specific error code
 */
export const isErrorCode = (error: unknown, code: string): boolean => {
  return getErrorCode(error) === code;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  return (
    code !== null &&
    (code.startsWith('INVALID_') ||
      code.startsWith('REQUIRED_') ||
      code.startsWith('MISSING_') ||
      code === 'AMOUNT_ZERO' ||
      code === 'AMOUNT_EXCEEDS_DUE')
  );
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  return (
    code !== null &&
    (code === 'INVALID_TOKEN' ||
      code === 'TOKEN_EXPIRED' ||
      code === 'NO_TOKEN' ||
      code === 'UNAUTHORIZED')
  );
};

/**
 * Check if error is a duplicate submission error
 */
export const isDuplicateSubmissionError = (error: unknown): boolean => {
  return isErrorCode(error, 'DUPLICATE_SUBMISSION');
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    return axiosError.message === 'Network Error' || !axiosError.response;
  }
  return false;
};

/**
 * Get user-friendly error message for payment errors
 */
export const getPaymentErrorMessage = (error: unknown): string => {
  const code = getErrorCode(error);

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    SCHEDULE_NOT_FOUND: 'القسط غير موجود',
    ALREADY_PAID: 'القسط مدفوع بالفعل',
    INVALID_AMOUNT: 'المبلغ غير صحيح',
    AMOUNT_ZERO: 'المبلغ يجب أن يكون أكبر من صفر',
    AMOUNT_EXCEEDS_DUE: 'المبلغ يتجاوز المستحق',
    REQUIRED_PAYMENT_METHOD: 'طريقة الدفع مطلوبة',
    REQUIRED_REFERENCE: 'رقم المرجع مطلوب للتحويل البنكي',
    REQUIRED_CHECK_NUMBER: 'رقم الشيك مطلوب',
    REQUIRED_BANK_NAME: 'اسم البنك مطلوب',
    PAYMENT_NOT_FOUND: 'الدفع غير موجود',
    ALREADY_REVERSED: 'الدفع معكوس بالفعل',
    CANNOT_REVERSE_REVERSAL: 'لا يمكن عكس دفع معكوس',
    REQUIRED_REVERSAL_REASON: 'سبب العكس مطلوب',
    REVERSAL_REASON_TOO_SHORT: 'سبب العكس يجب أن يكون 10 أحرف على الأقل',
    DIFFERENT_CUSTOMERS: 'الأقساط المحددة تنتمي لعملاء مختلفين',
    SOME_ALREADY_PAID: 'بعض الأقساط مدفوعة بالفعل',
    NOT_ADVANCE: 'القسط ليس مستقبلياً',
    DUPLICATE_SUBMISSION: 'تم إرسال هذا الطلب بالفعل. يرجى الانتظار',
    INVALID_PAYMENT_DATE: 'تاريخ الدفع غير صالح',
    PAYMENT_DATE_TOO_OLD: 'تاريخ الدفع لا يمكن أن يكون أكثر من 30 يوماً في الماضي',
  };

  if (code && errorMessages[code]) {
    return errorMessages[code];
  }

  // Fall back to generic error message
  return getErrorMessage(error);
};

/**
 * Handle API error with toast notification
 * Returns the error message for additional handling if needed
 */
export const handleApiError = (
  error: unknown,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void,
  customMessage?: string
): string => {
  const errorMessage = customMessage || getErrorMessage(error);

  // Show toast notification
  showToast(errorMessage, 'error');

  // Log error for debugging
  console.error('API Error:', error);

  return errorMessage;
};
