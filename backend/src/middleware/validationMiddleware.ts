import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware for Egyptian national ID and phone formats
 */

/**
 * Validates Egyptian national ID format (14 digits)
 */
export const validateNationalId = (nationalId: string): boolean => {
  const nationalIdRegex = /^\d{14}$/;
  return nationalIdRegex.test(nationalId);
};

/**
 * Validates Egyptian phone number format (11 digits starting with 01)
 */
export const validateEgyptianPhone = (phone: string): boolean => {
  const phoneRegex = /^01\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Middleware to validate customer data
 */
export const validateCustomerData = (req: Request, res: Response, next: NextFunction): void => {
  const { fullName, nationalId, phone } = req.body;

  // Validate required fields
  if (!fullName || !nationalId || !phone) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'يرجى إدخال جميع الحقول المطلوبة',
      },
    });
    return;
  }

  // Validate national ID format
  if (!validateNationalId(nationalId)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_NATIONAL_ID',
        message: 'الرقم القومي يجب أن يكون 14 رقماً',
      },
    });
    return;
  }

  // Validate phone format
  if (!validateEgyptianPhone(phone)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PHONE',
        message: 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقماً)',
      },
    });
    return;
  }

  next();
};
