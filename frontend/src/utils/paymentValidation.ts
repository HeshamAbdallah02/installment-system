/**
 * Frontend payment validation utilities
 * Provides validation functions for payment forms
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate payment amount
 */
export const validatePaymentAmount = (
  amount: number,
  remainingAmount: number
): ValidationError | null => {
  if (isNaN(amount) || !isFinite(amount)) {
    return {
      field: 'amount',
      message: 'المبلغ غير صحيح',
    };
  }

  if (amount <= 0) {
    return {
      field: 'amount',
      message: 'المبلغ يجب أن يكون أكبر من صفر',
    };
  }

  if (amount > remainingAmount) {
    return {
      field: 'amount',
      message: 'المبلغ يتجاوز المستحق',
    };
  }

  return null;
};

/**
 * Validate payment method
 */
export const validatePaymentMethod = (paymentMethod: string): ValidationError | null => {
  const validMethods = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHECK'];

  if (!paymentMethod) {
    return {
      field: 'paymentMethod',
      message: 'طريقة الدفع مطلوبة',
    };
  }

  if (!validMethods.includes(paymentMethod)) {
    return {
      field: 'paymentMethod',
      message: 'طريقة الدفع غير صالحة',
    };
  }

  return null;
};

/**
 * Validate reference number for bank transfer
 */
export const validateReferenceNumber = (referenceNumber?: string): ValidationError | null => {
  if (!referenceNumber || referenceNumber.trim() === '') {
    return {
      field: 'referenceNumber',
      message: 'رقم المرجع مطلوب للتحويل البنكي',
    };
  }

  if (referenceNumber.trim().length < 5) {
    return {
      field: 'referenceNumber',
      message: 'رقم المرجع يجب أن يكون 5 أحرف على الأقل',
    };
  }

  return null;
};

/**
 * Validate check details
 */
export const validateCheckDetails = (
  checkNumber?: string,
  bankName?: string
): ValidationError | null => {
  if (!checkNumber || checkNumber.trim() === '') {
    return {
      field: 'checkNumber',
      message: 'رقم الشيك مطلوب',
    };
  }

  if (!bankName || bankName.trim() === '') {
    return {
      field: 'bankName',
      message: 'اسم البنك مطلوب',
    };
  }

  return null;
};

/**
 * Validate reversal reason
 */
export const validateReversalReason = (reason?: string): ValidationError | null => {
  if (!reason || reason.trim() === '') {
    return {
      field: 'reason',
      message: 'سبب العكس مطلوب',
    };
  }

  if (reason.trim().length < 10) {
    return {
      field: 'reason',
      message: 'سبب العكس يجب أن يكون 10 أحرف على الأقل',
    };
  }

  return null;
};

/**
 * Validate payment date
 */
export const validatePaymentDate = (paymentDate: Date): ValidationError | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const paymentDateOnly = new Date(paymentDate);
  paymentDateOnly.setHours(0, 0, 0, 0);

  // Payment date cannot be in the future
  if (paymentDateOnly > today) {
    return {
      field: 'paymentDate',
      message: 'تاريخ الدفع لا يمكن أن يكون في المستقبل',
    };
  }

  // Payment date cannot be more than 30 days in the past
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (paymentDateOnly < thirtyDaysAgo) {
    return {
      field: 'paymentDate',
      message: 'تاريخ الدفع لا يمكن أن يكون أكثر من 30 يوماً في الماضي',
    };
  }

  return null;
};

/**
 * Validate complete payment form
 */
export const validatePaymentForm = (data: {
  amount: number;
  remainingAmount: number;
  paymentMethod: string;
  referenceNumber?: string;
  checkNumber?: string;
  bankName?: string;
  paymentDate: Date;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate amount
  const amountError = validatePaymentAmount(data.amount, data.remainingAmount);
  if (amountError) errors.push(amountError);

  // Validate payment method
  const methodError = validatePaymentMethod(data.paymentMethod);
  if (methodError) errors.push(methodError);

  // Validate payment method specific fields
  if (data.paymentMethod === 'BANK_TRANSFER') {
    const refError = validateReferenceNumber(data.referenceNumber);
    if (refError) errors.push(refError);
  }

  if (data.paymentMethod === 'CHECK') {
    const checkError = validateCheckDetails(data.checkNumber, data.bankName);
    if (checkError) errors.push(checkError);
  }

  // Validate payment date
  const dateError = validatePaymentDate(data.paymentDate);
  if (dateError) errors.push(dateError);

  return errors;
};
