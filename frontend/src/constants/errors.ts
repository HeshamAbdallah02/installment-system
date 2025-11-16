/**
 * Error constants for the application
 * Provides Arabic error messages for user-facing errors
 */

/**
 * Installment detail error messages
 * Requirements: 1.8, 1.9, 9.9, 14.9
 */
export const INSTALLMENT_DETAIL_ERRORS = {
  // General errors
  INSTALLMENT_NOT_FOUND: 'القسط غير موجود',
  UNAUTHORIZED_ACCESS: 'غير مصرح بالوصول لهذا القسط',
  INVALID_ID: 'معرف خطة التقسيط غير صالح',
  SERVER_ERROR: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
  NETWORK_ERROR: 'خطأ في الاتصال. يرجى التحقق من الاتصال بالإنترنت',
  TIMEOUT_ERROR: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى',

  // Modification/Cancellation restrictions
  CANNOT_MODIFY_COMPLETED: 'لا يمكن تعديل قسط مكتمل',
  CANNOT_CANCEL_COMPLETED: 'لا يمكن إلغاء قسط مكتمل',
  CANNOT_MODIFY: 'لا يمكن تعديل قسط مكتمل أو ملغي',
  MODIFICATION_LIMIT_EXCEEDED: 'لا يمكن التعديل بعد إكمال أكثر من 50% من الدفعات',
  ALREADY_CANCELLED: 'القسط ملغي بالفعل',
  ALREADY_COMPLETED: 'القسط مكتمل بالفعل',

  // Payment errors
  SCHEDULE_NOT_FOUND: 'القسط غير موجود',
  ALREADY_PAID: 'القسط مدفوع بالفعل',
  INVALID_AMOUNT: 'المبلغ يجب أن يكون أكبر من صفر',
  AMOUNT_EXCEEDS_DUE: 'المبلغ يتجاوز المستحق',
  NO_PENDING_PAYMENTS: 'لا توجد دفعات معلقة',
  PAYMENT_ALREADY_RECORDED: 'الدفعة مسجلة بالفعل',

  // Approval errors
  MANAGER_APPROVAL_REQUIRED: 'يتطلب موافقة المدير',

  // Settlement errors
  INVALID_DISCOUNT_PERCENTAGE: 'نسبة الخصم غير صحيحة',
  INVALID_DISCOUNT: 'نسبة الخصم غير صالحة',
  INVALID_SETTLEMENT_AMOUNT: 'مبلغ التسوية غير صحيح',

  // Reminder errors
  INVALID_PHONE: 'رقم الهاتف غير صالح',
  INVALID_METHOD: 'طريقة الإرسال غير صالحة',

  // Export errors
  INVALID_FORMAT: 'صيغة التصدير غير صالحة',

  // Validation errors
  MISSING_FIELDS: 'يرجى إدخال جميع الحقول المطلوبة',
  UNAUTHORIZED: 'غير مصرح',
} as const;

/**
 * General error messages
 */
export const GENERAL_ERRORS = {
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع',
  LOADING_ERROR: 'فشل تحميل البيانات',
  SAVE_ERROR: 'فشل حفظ البيانات',
  DELETE_ERROR: 'فشل حذف البيانات',
  UPDATE_ERROR: 'فشل تحديث البيانات',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  PAYMENT_RECORDED: 'تم تسجيل الدفع بنجاح',
  REMINDER_SENT: 'تم إرسال التذكير بنجاح',
  SETTLEMENT_PROCESSED: 'تم التسوية المبكرة بنجاح',
  TERMS_MODIFIED: 'تم تعديل الشروط بنجاح',
  INSTALLMENT_CANCELLED: 'تم إلغاء القسط بنجاح',
  EXPORT_SUCCESS: 'تم التصدير بنجاح',
} as const;

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(errorCode: string): string {
  // Check installment detail errors
  if (errorCode in INSTALLMENT_DETAIL_ERRORS) {
    return INSTALLMENT_DETAIL_ERRORS[errorCode as keyof typeof INSTALLMENT_DETAIL_ERRORS];
  }

  // Check general errors
  if (errorCode in GENERAL_ERRORS) {
    return GENERAL_ERRORS[errorCode as keyof typeof GENERAL_ERRORS];
  }

  // Default error message
  return GENERAL_ERRORS.UNKNOWN_ERROR;
}

/**
 * Error type for API errors
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Extract error information from axios error
 */
export function extractApiError(error: any): ApiError {
  // Network error
  if (!error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: INSTALLMENT_DETAIL_ERRORS.NETWORK_ERROR,
    };
  }

  // Timeout error
  if (error.code === 'ECONNABORTED') {
    return {
      code: 'TIMEOUT_ERROR',
      message: INSTALLMENT_DETAIL_ERRORS.TIMEOUT_ERROR,
    };
  }

  // API error response
  const errorData = error.response?.data?.error;
  if (errorData) {
    return {
      code: errorData.code || 'SERVER_ERROR',
      message: errorData.message || getErrorMessage(errorData.code || 'SERVER_ERROR'),
      details: errorData.details,
    };
  }

  // HTTP status errors
  const status = error.response?.status;
  if (status === 404) {
    return {
      code: 'INSTALLMENT_NOT_FOUND',
      message: INSTALLMENT_DETAIL_ERRORS.INSTALLMENT_NOT_FOUND,
    };
  }

  if (status === 403) {
    return {
      code: 'UNAUTHORIZED_ACCESS',
      message: INSTALLMENT_DETAIL_ERRORS.UNAUTHORIZED_ACCESS,
    };
  }

  if (status === 401) {
    return {
      code: 'UNAUTHORIZED',
      message: INSTALLMENT_DETAIL_ERRORS.UNAUTHORIZED,
    };
  }

  // Default server error
  return {
    code: 'SERVER_ERROR',
    message: INSTALLMENT_DETAIL_ERRORS.SERVER_ERROR,
  };
}
