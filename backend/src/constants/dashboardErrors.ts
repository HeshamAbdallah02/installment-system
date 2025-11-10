/**
 * Dashboard Error Messages
 * Arabic error messages for dashboard API endpoints
 */

export const DASHBOARD_ERRORS = {
  // Database errors
  DATABASE_ERROR: 'خطأ في قاعدة البيانات',
  QUERY_FAILED: 'فشل في تنفيذ الاستعلام',

  // Validation errors
  INVALID_MONTHS: 'عدد الأشهر غير صحيح. يجب أن يكون بين 1 و 12',
  INVALID_PERIOD:
    'الفترة الزمنية غير صحيحة. القيم المسموحة: current_month, last_month, last_3_months, last_6_months',
  INVALID_LIMIT: 'الحد الأقصى غير صحيح. يجب أن يكون بين 1 و 50',
  INVALID_QUERY_PARAMS: 'معاملات الاستعلام غير صحيحة',

  // Calculation errors
  CALCULATION_ERROR: 'خطأ في حساب المقاييس',
  AGGREGATION_ERROR: 'خطأ في تجميع البيانات',

  // General errors
  INTERNAL_ERROR: 'خطأ داخلي في الخادم',
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع',
} as const;

export type DashboardErrorCode = keyof typeof DASHBOARD_ERRORS;

/**
 * Error code mapping for different error scenarios
 */
export const ERROR_CODE_MAP = {
  // Prisma/Database errors
  P2002: 'DATABASE_ERROR',
  P2003: 'DATABASE_ERROR',
  P2025: 'DATABASE_ERROR',

  // Validation errors
  VALIDATION_ERROR: 'INVALID_QUERY_PARAMS',
} as const;

/**
 * Get Arabic error message for a given error code
 */
export function getDashboardErrorMessage(code: DashboardErrorCode): string {
  return DASHBOARD_ERRORS[code] || DASHBOARD_ERRORS.UNKNOWN_ERROR;
}
