import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Error messages in Arabic for consistent error responses
 */
const ERROR_MESSAGES = {
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    message: 'رمز المصادقة غير صالح',
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: 'انتهت صلاحية رمز المصادقة. يرجى تسجيل الدخول مرة أخرى',
  },
  NO_TOKEN: {
    code: 'NO_TOKEN',
    message: 'لم يتم توفير رمز المصادقة',
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  },
  ACCOUNT_DISABLED: {
    code: 'ACCOUNT_DISABLED',
    message: 'تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول',
  },
  MISSING_FIELDS: {
    code: 'MISSING_FIELDS',
    message: 'يرجى إدخال جميع الحقول المطلوبة',
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'خطأ في قاعدة البيانات',
  },
  // Payment validation errors
  INVALID_AMOUNT: {
    code: 'INVALID_AMOUNT',
    message: 'المبلغ غير صحيح',
  },
  AMOUNT_ZERO: {
    code: 'AMOUNT_ZERO',
    message: 'المبلغ يجب أن يكون أكبر من صفر',
  },
  AMOUNT_EXCEEDS_DUE: {
    code: 'AMOUNT_EXCEEDS_DUE',
    message: 'المبلغ يتجاوز المستحق',
  },
  REQUIRED_PAYMENT_METHOD: {
    code: 'REQUIRED_PAYMENT_METHOD',
    message: 'طريقة الدفع مطلوبة',
  },
  REQUIRED_REFERENCE: {
    code: 'REQUIRED_REFERENCE',
    message: 'رقم المرجع مطلوب للتحويل البنكي',
  },
  REQUIRED_CHECK_NUMBER: {
    code: 'REQUIRED_CHECK_NUMBER',
    message: 'رقم الشيك مطلوب',
  },
  REQUIRED_REVERSAL_REASON: {
    code: 'REQUIRED_REVERSAL_REASON',
    message: 'سبب العكس مطلوب',
  },
  PAYMENT_ALREADY_REVERSED: {
    code: 'PAYMENT_ALREADY_REVERSED',
    message: 'الدفع معكوس بالفعل',
  },
  PAYMENT_NOT_FOUND: {
    code: 'PAYMENT_NOT_FOUND',
    message: 'الدفع غير موجود',
  },
  INSTALLMENT_ALREADY_PAID: {
    code: 'INSTALLMENT_ALREADY_PAID',
    message: 'القسط مدفوع بالفعل',
  },
  SCHEDULE_NOT_FOUND: {
    code: 'SCHEDULE_NOT_FOUND',
    message: 'القسط غير موجود',
  },
  ALREADY_PAID: {
    code: 'ALREADY_PAID',
    message: 'القسط مدفوع بالفعل',
  },
  SCHEDULES_NOT_FOUND: {
    code: 'SCHEDULES_NOT_FOUND',
    message: 'الأقساط غير موجودة',
  },
  SOME_SCHEDULES_NOT_FOUND: {
    code: 'SOME_SCHEDULES_NOT_FOUND',
    message: 'بعض الأقساط غير موجودة',
  },
  DIFFERENT_CUSTOMERS: {
    code: 'DIFFERENT_CUSTOMERS',
    message: 'الأقساط المحددة تنتمي لعملاء مختلفين',
  },
  SOME_ALREADY_PAID: {
    code: 'SOME_ALREADY_PAID',
    message: 'بعض الأقساط مدفوعة بالفعل',
  },
  NOT_ADVANCE: {
    code: 'NOT_ADVANCE',
    message: 'القسط ليس مستقبلياً',
  },
  ALREADY_REVERSED: {
    code: 'ALREADY_REVERSED',
    message: 'الدفع معكوس بالفعل',
  },
  CANNOT_REVERSE_REVERSAL: {
    code: 'CANNOT_REVERSE_REVERSAL',
    message: 'لا يمكن عكس دفع معكوس',
  },
  DUPLICATE_SUBMISSION: {
    code: 'DUPLICATE_SUBMISSION',
    message: 'تم إرسال هذا الطلب بالفعل. يرجى الانتظار',
  },
  // Product validation errors
  REQUIRED_NAME: {
    code: 'REQUIRED_NAME',
    message: 'اسم المنتج مطلوب',
  },
  REQUIRED_CODE: {
    code: 'REQUIRED_CODE',
    message: 'كود المنتج مطلوب',
  },
  DUPLICATE_CODE: {
    code: 'DUPLICATE_CODE',
    message: 'كود المنتج موجود بالفعل',
  },
  REQUIRED_CATEGORY: {
    code: 'REQUIRED_CATEGORY',
    message: 'الفئة مطلوبة',
  },
  INVALID_PRICE: {
    code: 'INVALID_PRICE',
    message: 'السعر يجب أن يكون أكبر من صفر',
  },
  INVALID_DEPOSIT: {
    code: 'INVALID_DEPOSIT',
    message: 'المقدم يجب أن يكون أقل من السعر',
  },
  REQUIRED_IMAGE: {
    code: 'REQUIRED_IMAGE',
    message: 'صورة المنتج مطلوبة',
  },
  IMAGE_TOO_LARGE: {
    code: 'IMAGE_TOO_LARGE',
    message: 'حجم الصورة يجب أن يكون أقل من 5MB',
  },
  INVALID_IMAGE_FORMAT: {
    code: 'INVALID_IMAGE_FORMAT',
    message: 'صيغة الصورة غير مدعومة (JPG, PNG فقط)',
  },
  NO_TERMS_SELECTED: {
    code: 'NO_TERMS_SELECTED',
    message: 'يجب اختيار شرط تقسيط واحد على الأقل',
  },
  INVALID_CUSTOM_RATE: {
    code: 'INVALID_CUSTOM_RATE',
    message: 'المعدل المخصص يجب أن يكون بين 0-20%',
  },
  PRODUCT_NOT_FOUND: {
    code: 'PRODUCT_NOT_FOUND',
    message: 'المنتج غير موجود',
  },
  PRODUCT_OUT_OF_STOCK: {
    code: 'PRODUCT_OUT_OF_STOCK',
    message: 'المنتج غير متوفر في المخزون',
  },
  CANNOT_DELETE_WITH_INSTALLMENTS: {
    code: 'CANNOT_DELETE_WITH_INSTALLMENTS',
    message: 'لا يمكن حذف منتج له أقساط نشطة',
  },
  INVALID_STOCK_QUANTITY: {
    code: 'INVALID_STOCK_QUANTITY',
    message: 'الكمية الجديدة لا يمكن أن تكون سالبة',
  },
  REQUIRED_ADJUSTMENT_REASON: {
    code: 'REQUIRED_ADJUSTMENT_REASON',
    message: 'سبب التعديل مطلوب',
  },
  INVALID_QUANTITY: {
    code: 'INVALID_QUANTITY',
    message: 'الكمية يجب أن تكون أكبر من صفر',
  },
  REQUIRED_REASON: {
    code: 'REQUIRED_REASON',
    message: 'السبب مطلوب',
  },
  ALREADY_DEACTIVATED: {
    code: 'ALREADY_DEACTIVATED',
    message: 'المنتج موقوف بالفعل',
  },
  ALREADY_ACTIVE: {
    code: 'ALREADY_ACTIVE',
    message: 'المنتج نشط بالفعل',
  },
  NO_PRODUCTS_SELECTED: {
    code: 'NO_PRODUCTS_SELECTED',
    message: 'لم يتم اختيار أي منتجات',
  },
  INVALID_VALUE: {
    code: 'INVALID_VALUE',
    message: 'القيمة غير صالحة',
  },
  NO_PRODUCTS_FOUND: {
    code: 'NO_PRODUCTS_FOUND',
    message: 'لم يتم العثور على منتجات',
  },
  REQUIRED_FIELDS: {
    code: 'REQUIRED_FIELDS',
    message: 'جميع الحقول المطلوبة يجب ملؤها',
  },
};

export const errorHandler = (err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  // Handle JWT-specific errors
  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      success: false,
      error: ERROR_MESSAGES.TOKEN_EXPIRED,
    });
  }

  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      error: ERROR_MESSAGES.INVALID_TOKEN,
    });
  }

  // Handle custom application errors with status codes
  const statusCode = err.statusCode || 500;
  const errorCode = (err as { code?: string }).code || 'SERVER_ERROR';

  // Map error codes to Arabic messages
  const errorResponse =
    ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.SERVER_ERROR;

  return res.status(statusCode).json({
    success: false,
    error: errorResponse,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
