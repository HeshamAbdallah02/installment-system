/**
 * Error messages in Arabic for common API errors
 */
export const ERROR_MESSAGES = {
  FETCH_METRICS_FAILED: 'فشل تحميل المقاييس. يرجى المحاولة مرة أخرى',
  FETCH_CHARTS_FAILED: 'فشل تحميل الرسوم البيانية',
  FETCH_ACTIVITIES_FAILED: 'فشل تحميل الأنشطة الأخيرة',
  NETWORK_ERROR: 'خطأ في الاتصال بالخادم. تحقق من اتصالك بالإنترنت',
  NO_DATA: 'لا توجد بيانات متاحة',
  EXPORT_FAILED: 'فشل تصدير البيانات',
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى',
  TIMEOUT_ERROR: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى',
  UNAUTHORIZED: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى',
  SERVER_ERROR: 'خطأ في الخادم. يرجى المحاولة لاحقاً',
};

/**
 * Helper function to get appropriate error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;

  // Network errors
  if (
    (error &&
      typeof error === 'object' &&
      'message' in error &&
      error.message === 'Network Error') ||
    !navigator.onLine
  ) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Timeout errors
  if (
    error &&
    typeof error === 'object' &&
    (('code' in error && error.code === 'ECONNABORTED') ||
      ('message' in error &&
        typeof error.message === 'string' &&
        error.message.includes('timeout')))
  ) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  // HTTP status errors
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
    const status = axiosError.response?.status;
    if (status === 401 || status === 403) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
    if (status && status >= 500) {
      return ERROR_MESSAGES.SERVER_ERROR;
    }
    // Use server error message if available
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
  }

  // Custom error messages
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Hook for logging errors to console
 */
export const logError = (context: string, error: unknown): void => {
  const errorObj = error && typeof error === 'object' ? (error as Record<string, unknown>) : {};
  console.error(`[Dashboard Error - ${context}]:`, {
    message: errorObj.message || 'Unknown error',
    stack: errorObj.stack,
    response:
      errorObj.response && typeof errorObj.response === 'object'
        ? (errorObj.response as { data?: unknown }).data
        : undefined,
    timestamp: new Date().toISOString(),
  });
};
