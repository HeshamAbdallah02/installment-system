# Error Handling Implementation

## Overview

Comprehensive error handling has been implemented for the Installment Detail View feature, covering all aspects from backend validation to frontend display.

## Requirements Covered

- **1.8**: Show loading skeleton while fetching data
- **1.9**: Display "القسط غير موجود" (Installment not found) error when installment is not found
- **9.9**: Handle cancellation restrictions (cannot cancel completed installments)
- **14.9**: Handle modification restrictions (cannot modify after 50% completion)

## Architecture

### Backend Error Handling

#### 1. Custom Error Classes

**InstallmentDetailError** (`backend/src/services/installmentDetailService.ts`):

- Custom error class for installment detail operations
- Includes error code and Arabic message
- Used throughout the service layer

```typescript
class InstallmentDetailError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'InstallmentDetailError';
  }
}
```

#### 2. Error Codes

All error scenarios are handled with specific error codes:

**General Errors:**

- `INSTALLMENT_NOT_FOUND`: القسط غير موجود
- `UNAUTHORIZED_ACCESS`: غير مصرح بالوصول لهذا القسط
- `INVALID_ID`: معرف خطة التقسيط غير صالح
- `SERVER_ERROR`: خطأ في الخادم. يرجى المحاولة مرة أخرى

**Modification/Cancellation Restrictions:**

- `CANNOT_MODIFY_COMPLETED`: لا يمكن تعديل قسط مكتمل
- `CANNOT_CANCEL_COMPLETED`: لا يمكن إلغاء قسط مكتمل
- `CANNOT_MODIFY`: لا يمكن تعديل قسط مكتمل أو ملغي
- `MODIFICATION_LIMIT_EXCEEDED`: لا يمكن التعديل بعد إكمال أكثر من 50% من الدفعات
- `ALREADY_CANCELLED`: القسط ملغي بالفعل
- `ALREADY_COMPLETED`: القسط مكتمل بالفعل

**Payment Errors:**

- `SCHEDULE_NOT_FOUND`: القسط غير موجود
- `ALREADY_PAID`: القسط مدفوع بالفعل
- `INVALID_AMOUNT`: المبلغ يجب أن يكون أكبر من صفر
- `AMOUNT_EXCEEDS_DUE`: المبلغ يتجاوز المستحق
- `NO_PENDING_PAYMENTS`: لا توجد دفعات معلقة

**Approval Errors:**

- `MANAGER_APPROVAL_REQUIRED`: يتطلب موافقة المدير

**Settlement Errors:**

- `INVALID_DISCOUNT`: نسبة الخصم غير صالحة

**Reminder Errors:**

- `INVALID_PHONE`: رقم الهاتف غير صالح
- `INVALID_METHOD`: طريقة الإرسال غير صالحة

#### 3. Controller Error Handling

All controllers catch errors and return appropriate HTTP status codes with Arabic error messages:

```typescript
try {
  // Operation
} catch (error) {
  if (error instanceof InstallmentDetailError) {
    if (error.code === 'INSTALLMENT_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: {
          code: 'INSTALLMENT_NOT_FOUND',
          message: 'القسط غير موجود',
        },
      });
      return;
    }
    // ... other error codes
  }

  // Generic server error
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى',
    },
  });
}
```

### Frontend Error Handling

#### 1. Error Constants

**`frontend/src/constants/errors.ts`**:

- Centralized error messages in Arabic
- Error code to message mapping
- Helper functions for extracting API errors

```typescript
export const INSTALLMENT_DETAIL_ERRORS = {
  INSTALLMENT_NOT_FOUND: 'القسط غير موجود',
  UNAUTHORIZED_ACCESS: 'غير مصرح بالوصول لهذا القسط',
  // ... more error codes
};

export function getErrorMessage(errorCode: string): string {
  // Returns Arabic error message for code
}

export function extractApiError(error: any): ApiError {
  // Extracts error information from axios error
}
```

#### 2. API Client Interceptors

**`frontend/src/services/api.ts`**:

- Request interceptor adds auth token
- Response interceptor handles common errors:
  - 401 Unauthorized: Redirects to login
  - Network errors: Shows connection error
  - Timeout errors: Shows timeout message

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear token and redirect to login
    }

    // Handle network errors
    if (!error.response) {
      error.isNetworkError = true;
      error.message = 'خطأ في الاتصال...';
    }

    return Promise.reject(error);
  }
);
```

#### 3. Service Layer

**`frontend/src/services/installmentDetailService.ts`**:

- Wraps all API calls with try-catch
- Extracts and throws structured errors
- Provides type-safe error handling

```typescript
async getInstallmentDetail(installmentId: number): Promise<any> {
  try {
    const response = await apiClient.get(`/api/installments/${installmentId}/detail`);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
}
```

#### 4. Custom Hooks

**`frontend/src/hooks/useInstallmentDetail.ts`**:

- `useInstallmentDetail`: Fetches data with loading and error states
- `useInstallmentDetailActions`: Handles actions with error handling
- Provides `refetch` and `clearError` functions

```typescript
export function useInstallmentDetail(installmentId: number | null) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Fetch data with error handling
  // Return data, loading, error, refetch, clearError
}
```

#### 5. Error Display Component

**`frontend/src/components/common/ErrorDisplay.tsx`**:

- Displays errors in Arabic with appropriate styling
- Supports multiple variants: inline, banner, modal
- Provides retry and dismiss actions
- Shows error code and details (in development)

```tsx
<ErrorDisplay
  error={error}
  onRetry={refetch}
  onDismiss={() => navigate('/installments')}
  variant="banner"
/>
```

#### 6. Page-Level Error Handling

**`frontend/src/pages/InstallmentDetail.tsx`**:

- Uses `useInstallmentDetail` hook for data fetching
- Shows loading skeleton while fetching
- Displays error banner if fetch fails
- Shows not found message if installment doesn't exist
- Refreshes data after successful operations

```tsx
const { data: installment, loading, error, refetch } = useInstallmentDetail(installmentId);

if (loading) return <InstallmentDetailSkeleton />;
if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
if (!installment) return <NotFoundMessage />;
```

## Error Flow

### 1. Backend Error Flow

```
Service Layer Error
  ↓
throw InstallmentDetailError(code, message)
  ↓
Controller catches error
  ↓
Check error type and code
  ↓
Return appropriate HTTP status + JSON error response
  ↓
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Arabic error message'
  }
}
```

### 2. Frontend Error Flow

```
API Call
  ↓
Axios interceptor catches error
  ↓
extractApiError() processes error
  ↓
Service throws ApiError
  ↓
Hook catches error and sets error state
  ↓
Component displays ErrorDisplay
  ↓
User sees Arabic error message with retry option
```

## Loading States

### Backend

- All async operations use try-catch
- Proper error propagation through service → controller → response

### Frontend

- Loading skeleton shown during data fetch
- Loading indicators on buttons during actions
- Disabled state prevents duplicate submissions

## Validation

### Backend Validation

- Input validation in controllers
- Business logic validation in services
- Database constraint validation

### Frontend Validation

- Form validation using react-hook-form
- Real-time validation feedback
- Arabic validation messages

## Testing Error Handling

### Backend Tests

```typescript
describe('Error Handling', () => {
  it('should return 404 for non-existent installment', async () => {
    const response = await request(app).get('/api/installments/999999/detail').expect(404);

    expect(response.body.error.code).toBe('INSTALLMENT_NOT_FOUND');
    expect(response.body.error.message).toBe('القسط غير موجود');
  });
});
```

### Frontend Tests

```typescript
describe('ErrorDisplay', () => {
  it('should display error message in Arabic', () => {
    render(<ErrorDisplay error={{ code: 'TEST', message: 'خطأ اختبار' }} />);
    expect(screen.getByText('خطأ اختبار')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Always use Arabic error messages** for user-facing errors
2. **Include error codes** for debugging and logging
3. **Provide retry mechanisms** where appropriate
4. **Show loading states** during async operations
5. **Handle network errors** gracefully
6. **Log errors** for debugging (development only)
7. **Never expose sensitive information** in error messages
8. **Use consistent error response format** across all endpoints
9. **Validate input** on both frontend and backend
10. **Test error scenarios** thoroughly

## Error Message Guidelines

### Good Error Messages ✅

- "القسط غير موجود" (Installment not found)
- "لا يمكن إلغاء قسط مكتمل" (Cannot cancel completed installment)
- "يتطلب موافقة المدير" (Manager approval required)

### Bad Error Messages ❌

- "Error 404" (Not in Arabic)
- "Something went wrong" (Too vague)
- "Database query failed" (Too technical)

## Future Improvements

1. Add error tracking service (e.g., Sentry)
2. Implement error analytics
3. Add more specific error codes
4. Improve error recovery mechanisms
5. Add offline error handling
6. Implement error boundaries for React components
7. Add error notification system
8. Create error documentation for users

## Related Files

### Backend

- `backend/src/services/installmentDetailService.ts`
- `backend/src/controllers/installmentController.ts`
- `backend/src/middleware/errorHandler.ts`

### Frontend

- `frontend/src/constants/errors.ts`
- `frontend/src/services/api.ts`
- `frontend/src/services/installmentDetailService.ts`
- `frontend/src/hooks/useInstallmentDetail.ts`
- `frontend/src/components/common/ErrorDisplay.tsx`
- `frontend/src/pages/InstallmentDetail.tsx`
