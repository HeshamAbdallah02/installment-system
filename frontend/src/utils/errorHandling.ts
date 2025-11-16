/**
 * Error handling utilities for the application
 * Provides Arabic error messages and standardized error handling
 * Requirements: 2.5, 2.9, 8.7
 */

export interface ApiError {
  code?: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

/**
 * Arabic validation error messages
 */
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: 'هذا الحقل مطلوب',
  INVALID_NATIONAL_ID: 'الرقم القومي يجب أن يكون 14 رقماً',
  INVALID_PHONE: 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقماً)',
  DUPLICATE_NATIONAL_ID: 'الرقم القومي مسجل بالفعل',
  INVALID_DEPOSIT: 'المقدم يجب أن يكون بين الحد الأدنى وسعر المنتج',
  INVALID_EMAIL: 'البريد الإلكتروني غير صحيح',
  INVALID_DATE: 'التاريخ غير صحيح',
  MIN_LENGTH: 'الحد الأدنى للأحرف',
  MAX_LENGTH: 'الحد الأقصى للأحرف',
  INVALID_NUMBER: 'يجب إدخال رقم صحيح',
  INVALID_AMOUNT: 'المبلغ غير صحيح',
} as const;

/**
 * Arabic API error messages
 */
export const API_ERRORS = {
  NETWORK_ERROR: 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت',
  SERVER_ERROR: 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً',
  UNAUTHORIZED: 'غير مصرح. يرجى تسجيل الدخول مرة أخرى',
  FORBIDDEN: 'ليس لديك صلاحية للوصول إلى هذا المورد',
  NOT_FOUND: 'المورد المطلوب غير موجود',
  TIMEOUT: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى',
  BAD_REQUEST: 'طلب غير صحيح. يرجى التحقق من البيانات المدخلة',
  CONFLICT: 'تعارض في البيانات. قد تكون البيانات موجودة بالفعل',
  VALIDATION_ERROR: 'خطأ في التحقق من البيانات',
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع',
} as const;

/**
 * Success messages in Arabic
 */
export const SUCCESS_MESSAGES = {
  CUSTOMER_CREATED: 'تم إضافة العميل بنجاح',
  CUSTOMER_UPDATED: 'تم تحديث بيانات العميل بنجاح',
  CUSTOMER_DELETED: 'تم حذف العميل بنجاح',
  INSTALLMENT_CREATED: 'تم إنشاء خطة التقسيط بنجاح',
  INSTALLMENT_UPDATED: 'تم تحديث خطة التقسيط بنجاح',
  PAYMENT_RECORDED: 'تم تسجيل الدفعة بنجاح',
  DATA_SAVED: 'تم حفظ البيانات بنجاح',
  DATA_LOADED: 'تم تحميل البيانات بنجاح',
} as const;

/**
 * Extract error message from API error response
 */
export function getErrorMessage(error: unknown): string {
  // Check if it's an axios error with response
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response?: { status: number; data?: { error?: { message?: string } } };
    };
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    // Check for custom error message from backend
    if (data?.error?.message) {
      return data.error.message;
    }

    // Map HTTP status codes to Arabic messages
    switch (status) {
      case 400:
        return API_ERRORS.BAD_REQUEST;
      case 401:
        return API_ERRORS.UNAUTHORIZED;
      case 403:
        return API_ERRORS.FORBIDDEN;
      case 404:
        return API_ERRORS.NOT_FOUND;
      case 409:
        return API_ERRORS.CONFLICT;
      case 422:
        return API_ERRORS.VALIDATION_ERROR;
      case 500:
      case 502:
      case 503:
        return API_ERRORS.SERVER_ERROR;
      case 504:
        return API_ERRORS.TIMEOUT;
      default:
        return API_ERRORS.UNKNOWN_ERROR;
    }
  }

  // Check if it's a network error
  if (error && typeof error === 'object' && 'request' in error) {
    return API_ERRORS.NETWORK_ERROR;
  }

  // Check if error has a message property
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  // Default error message
  return API_ERRORS.UNKNOWN_ERROR;
}

/**
 * Extract error code from API error response
 */
export function getErrorCode(error: unknown): string | undefined {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const data = (error.response as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data) {
      const errorObj = (data as { error?: unknown }).error;
      if (errorObj && typeof errorObj === 'object' && 'code' in errorObj) {
        return String((errorObj as { code: unknown }).code);
      }
    }
  }
  return undefined;
}

/**
 * Check if error is a specific error code
 */
export function isErrorCode(error: unknown, code: string): boolean {
  return getErrorCode(error) === code;
}

/**
 * Format validation errors for form fields
 */
export function formatValidationErrors(error: unknown): Record<string, string> {
  const errors: Record<string, string> = {};

  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const data = (error.response as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data) {
      const errorObj = (data as { error?: unknown }).error;
      if (errorObj && typeof errorObj === 'object' && 'details' in errorObj) {
        const details = (errorObj as { details?: unknown }).details;

        // Handle array of validation errors
        if (Array.isArray(details)) {
          details.forEach((detail: unknown) => {
            if (detail && typeof detail === 'object' && 'field' in detail && 'message' in detail) {
              const typedDetail = detail as { field: string; message: string };
              errors[typedDetail.field] = typedDetail.message;
            }
          });
        }
        // Handle object of validation errors
        // Handle object of validation errors
        else if (typeof details === 'object' && details !== null) {
          Object.keys(details).forEach((field) => {
            const value = (details as Record<string, unknown>)[field];
            errors[field] = String(value);
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Log error for debugging (can be extended to send to error tracking service)
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);

  console.error(`[${timestamp}] Error${context ? ` in ${context}` : ''}:`, {
    message: errorMessage,
    code: errorCode,
    error: error instanceof Error ? error.message : String(error),
  });

  // TODO: Send to error tracking service (e.g., Sentry)
}

/**
 * Handle API error with toast notification
 */
export function handleApiError(
  error: unknown,
  showToast: (message: string, type: 'error') => void,
  context?: string
): void {
  logError(error, context);
  const errorMessage = getErrorMessage(error);
  showToast(errorMessage, 'error');
}

/**
 * Validate Egyptian national ID format
 */
export function validateNationalId(value: string): boolean | string {
  if (!value) return VALIDATION_ERRORS.REQUIRED_FIELD;
  if (!/^\d{14}$/.test(value)) {
    return VALIDATION_ERRORS.INVALID_NATIONAL_ID;
  }
  return true;
}

/**
 * Validate Egyptian phone number format
 */
export function validatePhone(value: string): boolean | string {
  if (!value) return VALIDATION_ERRORS.REQUIRED_FIELD;
  if (!/^01\d{9}$/.test(value)) {
    return VALIDATION_ERRORS.INVALID_PHONE;
  }
  return true;
}

/**
 * Validate required field
 */
export function validateRequired(value: unknown): boolean | string {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return VALIDATION_ERRORS.REQUIRED_FIELD;
  }
  return true;
}

/**
 * Validate number field
 */
export function validateNumber(value: unknown, min?: number, max?: number): boolean | string {
  const num = parseFloat(String(value));

  if (isNaN(num)) {
    return VALIDATION_ERRORS.INVALID_NUMBER;
  }

  if (min !== undefined && num < min) {
    return `القيمة يجب أن تكون على الأقل ${min}`;
  }

  if (max !== undefined && num > max) {
    return `القيمة يجب أن لا تتجاوز ${max}`;
  }

  return true;
}

/**
 * Validate deposit amount
 */
export function validateDeposit(
  deposit: number,
  productPrice: number,
  minDeposit: number = 0
): boolean | string {
  if (deposit < minDeposit) {
    return `المقدم يجب أن يكون على الأقل ${minDeposit} ج.م`;
  }

  if (deposit > productPrice) {
    return 'المقدم لا يمكن أن يكون أكبر من سعر المنتج';
  }

  return true;
}
