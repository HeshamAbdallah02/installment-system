/**
 * Payment validation utilities
 * Provides validation functions for payment-related operations
 */

export interface ValidationResult {
  isValid: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Validate payment amount
 */
export const validatePaymentAmount = (
  amount: number,
  remainingAmount: number
): ValidationResult => {
  // Check if amount is a valid number
  if (isNaN(amount) || !isFinite(amount)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_AMOUNT',
        message: 'المبلغ غير صحيح',
      },
    };
  }

  // Check if amount is greater than zero
  if (amount <= 0) {
    return {
      isValid: false,
      error: {
        code: 'AMOUNT_ZERO',
        message: 'المبلغ يجب أن يكون أكبر من صفر',
      },
    };
  }

  // Check if amount exceeds remaining amount
  if (amount > remainingAmount) {
    return {
      isValid: false,
      error: {
        code: 'AMOUNT_EXCEEDS_DUE',
        message: 'المبلغ يتجاوز المستحق',
      },
    };
  }

  return { isValid: true };
};

/**
 * Validate payment method specific fields
 */
export const validatePaymentMethodFields = (
  paymentMethod: string,
  referenceNumber?: string,
  checkNumber?: string,
  bankName?: string
): ValidationResult => {
  if (paymentMethod === 'BANK_TRANSFER' && !referenceNumber) {
    return {
      isValid: false,
      error: {
        code: 'REQUIRED_REFERENCE',
        message: 'رقم المرجع مطلوب للتحويل البنكي',
      },
    };
  }

  if (paymentMethod === 'CHECK') {
    if (!checkNumber) {
      return {
        isValid: false,
        error: {
          code: 'REQUIRED_CHECK_NUMBER',
          message: 'رقم الشيك مطلوب',
        },
      };
    }
    if (!bankName) {
      return {
        isValid: false,
        error: {
          code: 'REQUIRED_BANK_NAME',
          message: 'اسم البنك مطلوب',
        },
      };
    }
  }

  return { isValid: true };
};

/**
 * Validate reversal reason
 */
export const validateReversalReason = (reason?: string): ValidationResult => {
  if (!reason || reason.trim() === '') {
    return {
      isValid: false,
      error: {
        code: 'REQUIRED_REVERSAL_REASON',
        message: 'سبب العكس مطلوب',
      },
    };
  }

  if (reason.trim().length < 10) {
    return {
      isValid: false,
      error: {
        code: 'REVERSAL_REASON_TOO_SHORT',
        message: 'سبب العكس يجب أن يكون 10 أحرف على الأقل',
      },
    };
  }

  return { isValid: true };
};

/**
 * Validate payment date
 */
export const validatePaymentDate = (paymentDate: Date): ValidationResult => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const paymentDateOnly = new Date(paymentDate);
  paymentDateOnly.setHours(0, 0, 0, 0);

  // Payment date cannot be in the future
  if (paymentDateOnly > today) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_PAYMENT_DATE',
        message: 'تاريخ الدفع لا يمكن أن يكون في المستقبل',
      },
    };
  }

  // Payment date cannot be more than 30 days in the past
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (paymentDateOnly < thirtyDaysAgo) {
    return {
      isValid: false,
      error: {
        code: 'PAYMENT_DATE_TOO_OLD',
        message: 'تاريخ الدفع لا يمكن أن يكون أكثر من 30 يوماً في الماضي',
      },
    };
  }

  return { isValid: true };
};
