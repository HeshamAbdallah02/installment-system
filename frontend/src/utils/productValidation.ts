/**
 * Product validation error messages in Arabic
 * Requirements: 6.9, 8.9, 10.9 - Implement Arabic validation error messages
 */
export const PRODUCT_VALIDATION_ERRORS = {
  REQUIRED_NAME: 'اسم المنتج مطلوب',
  REQUIRED_CODE: 'كود المنتج مطلوب',
  DUPLICATE_CODE: 'كود المنتج موجود بالفعل',
  REQUIRED_CATEGORY: 'الفئة مطلوبة',
  INVALID_PRICE: 'السعر يجب أن يكون أكبر من صفر',
  INVALID_DEPOSIT: 'المقدم يجب أن يكون أقل من السعر',
  REQUIRED_IMAGE: 'صورة المنتج مطلوبة',
  IMAGE_TOO_LARGE: 'حجم الصورة يجب أن يكون أقل من 5MB',
  INVALID_IMAGE_FORMAT: 'صيغة الصورة غير مدعومة (JPG, PNG فقط)',
  NO_TERMS_SELECTED: 'يجب اختيار شرط تقسيط واحد على الأقل',
  INVALID_CUSTOM_RATE: 'المعدل المخصص يجب أن يكون بين 0-20%',
  PRODUCT_NOT_FOUND: 'المنتج غير موجود',
  PRODUCT_OUT_OF_STOCK: 'المنتج غير متوفر في المخزون',
  CANNOT_DELETE_WITH_INSTALLMENTS: 'لا يمكن حذف منتج له أقساط نشطة',
  INVALID_STOCK_QUANTITY: 'الكمية الجديدة لا يمكن أن تكون سالبة',
  REQUIRED_ADJUSTMENT_REASON: 'سبب التعديل مطلوب',
  INVALID_QUANTITY: 'الكمية يجب أن تكون أكبر من صفر',
  REQUIRED_REASON: 'السبب مطلوب',
  ALREADY_DEACTIVATED: 'المنتج موقوف بالفعل',
  ALREADY_ACTIVE: 'المنتج نشط بالفعل',
  NO_PRODUCTS_SELECTED: 'لم يتم اختيار أي منتجات',
  INVALID_VALUE: 'القيمة غير صالحة',
  NO_PRODUCTS_FOUND: 'لم يتم العثور على منتجات',
  REQUIRED_FIELDS: 'جميع الحقول المطلوبة يجب ملؤها',
};

/**
 * Validate product image file
 * @param file - Image file to validate
 * @returns Error message if invalid, null if valid
 */
export const validateProductImage = (file: File | null): string | null => {
  if (!file) {
    return PRODUCT_VALIDATION_ERRORS.REQUIRED_IMAGE;
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return PRODUCT_VALIDATION_ERRORS.IMAGE_TOO_LARGE;
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return PRODUCT_VALIDATION_ERRORS.INVALID_IMAGE_FORMAT;
  }

  return null;
};

/**
 * Validate product price
 * @param price - Price to validate
 * @returns Error message if invalid, null if valid
 */
export const validateProductPrice = (price: number | string): string | null => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice) || numPrice <= 0) {
    return PRODUCT_VALIDATION_ERRORS.INVALID_PRICE;
  }

  return null;
};

/**
 * Validate minimum deposit
 * @param deposit - Deposit amount to validate
 * @param cashPrice - Cash price of the product
 * @returns Error message if invalid, null if valid
 */
export const validateMinimumDeposit = (
  deposit: number | string,
  cashPrice: number | string
): string | null => {
  const numDeposit = typeof deposit === 'string' ? parseFloat(deposit) : deposit;
  const numPrice = typeof cashPrice === 'string' ? parseFloat(cashPrice) : cashPrice;

  if (isNaN(numDeposit) || isNaN(numPrice)) {
    return PRODUCT_VALIDATION_ERRORS.INVALID_DEPOSIT;
  }

  if (numDeposit >= numPrice) {
    return PRODUCT_VALIDATION_ERRORS.INVALID_DEPOSIT;
  }

  return null;
};

/**
 * Validate custom installment rate
 * @param rate - Rate to validate (percentage)
 * @returns Error message if invalid, null if valid
 */
export const validateCustomRate = (rate: number | string): string | null => {
  const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;

  if (isNaN(numRate) || numRate < 0 || numRate > 20) {
    return PRODUCT_VALIDATION_ERRORS.INVALID_CUSTOM_RATE;
  }

  return null;
};

/**
 * Validate inventory quantity
 * @param quantity - Quantity to validate
 * @returns Error message if invalid, null if valid
 */
export const validateInventoryQuantity = (quantity: number | string): string | null => {
  const numQuantity = typeof quantity === 'string' ? parseFloat(quantity) : quantity;

  if (isNaN(numQuantity) || numQuantity <= 0) {
    return PRODUCT_VALIDATION_ERRORS.INVALID_QUANTITY;
  }

  return null;
};

/**
 * Extract error message from API error response
 * @param error - Error object from API
 * @returns User-friendly error message in Arabic
 */
export const extractErrorMessage = (error: unknown): string => {
  const apiError = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
    message?: string;
  };

  // Check if error has response data with error object
  if (apiError?.response?.data?.error?.message) {
    return apiError.response.data.error.message;
  }

  // Check if error has response data with message
  if (apiError?.response?.data?.message) {
    return apiError.response.data.message;
  }

  // Check if error has a message property
  if (apiError?.message) {
    return apiError.message;
  }

  // Default error message
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
};
