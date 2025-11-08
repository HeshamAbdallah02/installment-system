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
  const errorCode = (err as any).code || 'SERVER_ERROR';

  // Map error codes to Arabic messages
  const errorResponse =
    ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    error: errorResponse,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
