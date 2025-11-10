# Error Handling Documentation

## Overview

This document describes the comprehensive error handling system implemented for the Customer & Installment Management feature. The system provides Arabic error messages, standardized error handling, and consistent user feedback through toast notifications.

## Requirements Addressed

- **Requirement 2.5**: Arabic validation error messages
- **Requirement 2.9**: Display validation errors in Arabic below each field
- **Requirement 8.7**: Display error message and allow retry on failure

## Error Handling Utilities

### Location

`frontend/src/utils/errorHandling.ts`

### Key Functions

#### 1. `getErrorMessage(error: any): string`

Extracts a user-friendly Arabic error message from any error object.

**Usage:**

```typescript
try {
  await apiCall();
} catch (err) {
  const errorMessage = getErrorMessage(err);
  showToast(errorMessage, 'error');
}
```

#### 2. `getErrorCode(error: any): string | undefined`

Extracts the error code from API error responses.

#### 3. `isErrorCode(error: any, code: string): boolean`

Checks if an error matches a specific error code.

**Usage:**

```typescript
if (isErrorCode(err, 'DUPLICATE_NATIONAL_ID')) {
  // Handle duplicate national ID
}
```

#### 4. `logError(error: any, context?: string): void`

Logs errors with context for debugging.

**Usage:**

```typescript
logError(err, 'CustomerSelection - fetchCustomers');
```

#### 5. Validation Functions

- `validateNationalId(value: string): boolean | string`
- `validatePhone(value: string): boolean | string`
- `validateRequired(value: any): boolean | string`
- `validateNumber(value: any, min?: number, max?: number): boolean | string`
- `validateDeposit(deposit: number, productPrice: number, minDeposit?: number): boolean | string`

**Usage with React Hook Form:**

```typescript
<input
  {...register('nationalId', {
    validate: validateNationalId,
  })}
/>
```

## Error Messages

### Validation Errors (VALIDATION_ERRORS)

```typescript
REQUIRED_FIELD: 'هذا الحقل مطلوب';
INVALID_NATIONAL_ID: 'الرقم القومي يجب أن يكون 14 رقماً';
INVALID_PHONE: 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقماً)';
DUPLICATE_NATIONAL_ID: 'الرقم القومي مسجل بالفعل';
INVALID_DEPOSIT: 'المقدم يجب أن يكون بين الحد الأدنى وسعر المنتج';
```

### API Errors (API_ERRORS)

```typescript
NETWORK_ERROR: 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت';
SERVER_ERROR: 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً';
UNAUTHORIZED: 'غير مصرح. يرجى تسجيل الدخول مرة أخرى';
NOT_FOUND: 'المورد المطلوب غير موجود';
VALIDATION_ERROR: 'خطأ في التحقق من البيانات';
```

### Success Messages (SUCCESS_MESSAGES)

```typescript
CUSTOMER_CREATED: 'تم إضافة العميل بنجاح';
CUSTOMER_UPDATED: 'تم تحديث بيانات العميل بنجاح';
INSTALLMENT_CREATED: 'تم إنشاء خطة التقسيط بنجاح';
PAYMENT_RECORDED: 'تم تسجيل الدفعة بنجاح';
```

## Implementation Patterns

### 1. API Call Error Handling

```typescript
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await apiService.getData();
    setData(data);
  } catch (err) {
    logError(err, 'ComponentName - fetchData');
    const errorMessage = getErrorMessage(err);
    setError(errorMessage);
    showToast(errorMessage, 'error');
  } finally {
    setLoading(false);
  }
};
```

### 2. Form Validation

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
  setError,
} = useForm<FormData>();

const onSubmit = async (data: FormData) => {
  try {
    setIsSubmitting(true);
    await apiService.submit(data);
    onSuccess(SUCCESS_MESSAGES.DATA_SAVED);
  } catch (err) {
    logError(err, 'FormComponent - submit');

    // Handle specific error codes
    if (isErrorCode(err, 'DUPLICATE_NATIONAL_ID')) {
      setError('nationalId', {
        type: 'manual',
        message: VALIDATION_ERRORS.DUPLICATE_NATIONAL_ID,
      });
    } else {
      const errorMessage = getErrorMessage(err);
      onError(errorMessage);
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

### 3. Loading States

```typescript
{loading ? (
  <div className="text-center py-4">
    <div className="w-12 h-12 border-4 border-brand-primary-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
    <p className="text-brand-primary-900 font-semibold">جاري التحميل...</p>
  </div>
) : error ? (
  <div className="bg-brand-primary-50 border border-brand-primary-700 rounded-lg p-4">
    <p className="text-brand-primary-700 mb-4">{error}</p>
    <button
      type="button"
      onClick={retry}
      className="px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950"
    >
      إعادة المحاولة
    </button>
  </div>
) : (
  // Content
)}
```

### 4. Submit Button with Loading State

```typescript
<button
  type="submit"
  disabled={isSubmitting}
  className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSubmitting ? (
    <>
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span>جاري الحفظ...</span>
    </>
  ) : (
    'حفظ'
  )}
</button>
```

## Components Updated

### Pages

- `Customers.tsx` - Customer list page
- `CustomerDetail.tsx` - Customer detail page
- `Installments.tsx` - Installments list page

### Modals

- `AddCustomerModal.tsx` - Add customer form
- `EditCustomerModal.tsx` - Edit customer form

### Wizard Steps

- `CustomerSelection.tsx` - Step 1: Customer selection
- `ProductSelection.tsx` - Step 2: Product selection
- `TermsConfiguration.tsx` - Step 3: Terms configuration
- `ReviewAndConfirm.tsx` - Step 4: Review and confirm

### Shared Components

- `ToastNotification.tsx` - Toast notification component

## Toast Notification System

### Usage with useToast Hook

```typescript
import { useToast } from '../hooks/useToast';

const Component = () => {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast();

  // Show success
  showSuccess('تم الحفظ بنجاح');

  // Show error
  showError('حدث خطأ');

  // Show custom message
  showToast('رسالة مخصصة', 'info');

  return (
    <>
      {/* Component content */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
};
```

## Best Practices

1. **Always log errors** with context using `logError()`
2. **Use validation utilities** instead of inline validation
3. **Show loading states** during async operations
4. **Provide retry options** when operations fail
5. **Use success messages** from `SUCCESS_MESSAGES` constant
6. **Handle specific error codes** when needed (e.g., duplicate entries)
7. **Clear errors** when user corrects input
8. **Disable buttons** during submission to prevent double-submission
9. **Show spinner** in buttons during loading
10. **Use Arabic messages** for all user-facing text

## Testing Error Handling

### Manual Testing Checklist

- [ ] Network error (disconnect internet)
- [ ] Server error (500 response)
- [ ] Validation errors (invalid input)
- [ ] Duplicate entries
- [ ] Unauthorized access
- [ ] Not found errors
- [ ] Timeout errors
- [ ] Form validation errors
- [ ] Loading states display correctly
- [ ] Toast notifications appear and dismiss
- [ ] Retry buttons work
- [ ] Error messages are in Arabic
- [ ] Buttons are disabled during submission

## Future Enhancements

1. **Error Tracking Service**: Integrate with Sentry or similar service
2. **Offline Support**: Handle offline scenarios gracefully
3. **Error Recovery**: Implement automatic retry with exponential backoff
4. **User Feedback**: Collect user feedback on error messages
5. **Analytics**: Track error frequency and types
6. **Localization**: Support multiple languages beyond Arabic

## Related Documentation

- [Brand Colors](./BRAND_COLORS.md)
- [Component Guidelines](./COMPONENT_GUIDELINES.md)
- [API Integration](./API_INTEGRATION.md)
