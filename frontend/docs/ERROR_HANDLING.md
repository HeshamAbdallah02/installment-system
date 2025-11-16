# Error Handling Documentation

## Overview

This document describes the comprehensive error handling implementation for the Product & Inventory Management feature.

## Requirements Addressed

- **Requirement 6.9**: Implement Arabic validation error messages, handle image upload errors, handle API errors gracefully
- **Requirement 8.9**: Handle stock errors, show toast notifications
- **Requirement 10.9**: Show loading states, validate product data

## Components

### 1. Toast Notification System

**Location**: `frontend/src/components/common/Toast.tsx`

**Features**:

- Success, error, and info message types
- Auto-dismiss after 5 seconds (configurable)
- Manual close button
- Smooth slide-down animation
- Brand-colored styling

**Usage**:

```tsx
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';

const MyComponent = () => {
  const { toast, showSuccess, showError, showInfo, hideToast } = useToast();

  const handleSuccess = () => {
    showSuccess('تم إضافة المنتج بنجاح');
  };

  const handleError = () => {
    showError('فشل في إضافة المنتج');
  };

  return (
    <>
      {/* Your component content */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
};
```

### 2. Loading Spinner

**Location**: `frontend/src/components/common/LoadingSpinner.tsx`

**Features**:

- Three sizes: sm, md, lg
- Optional loading message
- Full-screen overlay option
- Brand-colored spinner

**Usage**:

```tsx
import LoadingSpinner from '../components/common/LoadingSpinner';

// Inline spinner
<LoadingSpinner size="md" message="جاري التحميل..." />

// Full-screen spinner
<LoadingSpinner size="lg" message="جاري التحميل..." fullScreen />
```

### 3. Validation Utilities

**Location**: `frontend/src/utils/productValidation.ts`

**Features**:

- Arabic error messages for all validation scenarios
- Image file validation (type and size)
- Price validation
- Deposit validation
- Custom rate validation
- Inventory quantity validation
- API error message extraction

**Usage**:

```tsx
import {
  validateProductImage,
  validateProductPrice,
  validateMinimumDeposit,
  validateCustomRate,
  validateInventoryQuantity,
  extractErrorMessage,
  PRODUCT_VALIDATION_ERRORS,
} from '../utils/productValidation';

// Validate image
const imageError = validateProductImage(file);
if (imageError) {
  showError(imageError);
}

// Validate price
const priceError = validateProductPrice(price);
if (priceError) {
  showError(priceError);
}

// Extract error from API response
try {
  await productService.createProduct(data);
} catch (error) {
  const message = extractErrorMessage(error);
  showError(message);
}
```

## Backend Error Messages

**Location**: `backend/src/middleware/errorHandler.ts`

All error messages are defined in Arabic in the `ERROR_MESSAGES` object:

### Product Validation Errors

| Error Code                 | Arabic Message                        | English Translation                            |
| -------------------------- | ------------------------------------- | ---------------------------------------------- |
| REQUIRED_NAME              | اسم المنتج مطلوب                      | Product name is required                       |
| REQUIRED_CODE              | كود المنتج مطلوب                      | Product code is required                       |
| DUPLICATE_CODE             | كود المنتج موجود بالفعل               | Product code already exists                    |
| REQUIRED_CATEGORY          | الفئة مطلوبة                          | Category is required                           |
| INVALID_PRICE              | السعر يجب أن يكون أكبر من صفر         | Price must be greater than zero                |
| INVALID_DEPOSIT            | المقدم يجب أن يكون أقل من السعر       | Deposit must be less than price                |
| REQUIRED_IMAGE             | صورة المنتج مطلوبة                    | Product image is required                      |
| IMAGE_TOO_LARGE            | حجم الصورة يجب أن يكون أقل من 5MB     | Image size must be less than 5MB               |
| INVALID_IMAGE_FORMAT       | صيغة الصورة غير مدعومة (JPG, PNG فقط) | Invalid image format (JPG, PNG only)           |
| NO_TERMS_SELECTED          | يجب اختيار شرط تقسيط واحد على الأقل   | At least one installment term must be selected |
| INVALID_CUSTOM_RATE        | المعدل المخصص يجب أن يكون بين 0-20%   | Custom rate must be between 0-20%              |
| PRODUCT_NOT_FOUND          | المنتج غير موجود                      | Product not found                              |
| PRODUCT_OUT_OF_STOCK       | المنتج غير متوفر في المخزون           | Product is out of stock                        |
| INVALID_STOCK_QUANTITY     | الكمية الجديدة لا يمكن أن تكون سالبة  | New quantity cannot be negative                |
| REQUIRED_ADJUSTMENT_REASON | سبب التعديل مطلوب                     | Adjustment reason is required                  |
| INVALID_QUANTITY           | الكمية يجب أن تكون أكبر من صفر        | Quantity must be greater than zero             |
| REQUIRED_REASON            | السبب مطلوب                           | Reason is required                             |
| ALREADY_DEACTIVATED        | المنتج موقوف بالفعل                   | Product is already deactivated                 |
| ALREADY_ACTIVE             | المنتج نشط بالفعل                     | Product is already active                      |
| NO_PRODUCTS_SELECTED       | لم يتم اختيار أي منتجات               | No products selected                           |
| INVALID_VALUE              | القيمة غير صالحة                      | Invalid value                                  |
| NO_PRODUCTS_FOUND          | لم يتم العثور على منتجات              | No products found                              |
| REQUIRED_FIELDS            | جميع الحقول المطلوبة يجب ملؤها        | All required fields must be filled             |

## Error Handling Patterns

### 1. Form Validation

Forms use React Hook Form with inline validation:

```tsx
const {
  register,
  handleSubmit,
  formState: { errors },
  setError,
} = useForm<FormData>();

// Field validation
<input
  {...register('name', {
    required: 'اسم المنتج مطلوب',
    minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
  })}
/>;

// Display error
{
  errors.name && <p className="text-sm text-brand-primary-700">{errors.name.message}</p>;
}

// Set manual error
if (apiError.code === 'DUPLICATE_CODE') {
  setError('code', {
    type: 'manual',
    message: 'كود المنتج موجود بالفعل',
  });
}
```

### 2. API Error Handling

All API calls are wrapped in try-catch blocks:

```tsx
const createProductMutation = useMutation({
  mutationFn: (data: FormData) => productService.createProduct(data),
  onSuccess: () => {
    showSuccess('تم إضافة المنتج بنجاح');
  },
  onError: (error: any) => {
    const message = extractErrorMessage(error);
    showError(message);
  },
});
```

### 3. Loading States

Loading states are shown during async operations:

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: () => productService.getProducts(),
});

if (isLoading) {
  return <LoadingSpinner message="جاري تحميل المنتجات..." />;
}

if (error) {
  return <div>حدث خطأ: {error.message}</div>;
}
```

### 4. Image Upload Validation

Image uploads are validated before submission:

```tsx
const validateFile = (file: File): string | null => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return 'صيغة الصورة غير مدعومة. يرجى اختيار صورة JPG أو PNG';
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت';
  }

  return null;
};
```

### 5. Stock Error Handling

Stock errors are handled with specific messages:

```tsx
try {
  await productService.adjustInventory(productId, type, quantity, reason);
  showSuccess('تم تعديل المخزون بنجاح');
} catch (error) {
  const message = extractErrorMessage(error);
  if (message.includes('سالبة')) {
    showError('لا يمكن تقليل المخزون إلى قيمة سالبة');
  } else {
    showError(message);
  }
}
```

## Best Practices

1. **Always use Arabic error messages** - All user-facing errors must be in Arabic
2. **Be specific** - Provide clear, actionable error messages
3. **Show loading states** - Always indicate when an operation is in progress
4. **Handle all error cases** - Network errors, validation errors, server errors
5. **Use toast notifications** - For success and error feedback
6. **Validate early** - Client-side validation before API calls
7. **Extract error messages** - Use `extractErrorMessage()` utility for consistent error handling
8. **Disable during operations** - Disable form inputs and buttons during async operations
9. **Clear errors** - Clear previous errors when user corrects input
10. **Log errors** - Log errors to console in development for debugging

## Testing Error Handling

### Manual Testing Checklist

- [ ] Test all form validations (required fields, format, ranges)
- [ ] Test image upload validation (file type, file size)
- [ ] Test API error responses (network errors, server errors)
- [ ] Test loading states (spinners, disabled buttons)
- [ ] Test toast notifications (success, error, info)
- [ ] Test error message display (inline, toast)
- [ ] Test duplicate code error
- [ ] Test stock quantity validation
- [ ] Test price validation
- [ ] Test deposit validation

### Automated Testing

Error handling should be tested with:

- Unit tests for validation functions
- Integration tests for API error handling
- E2E tests for user error scenarios

## Future Improvements

1. Add error tracking service (e.g., Sentry)
2. Implement retry logic for network errors
3. Add offline error handling
4. Implement error boundaries for React components
5. Add more specific error codes for better error handling
6. Implement error analytics to track cd)
