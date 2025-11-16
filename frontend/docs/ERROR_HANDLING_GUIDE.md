# Error Handling Guide

## Overview

Comprehensive error handling for Product & Inventory Management feature.

## Components

### Toast Notifications

- Location: `frontend/src/components/common/Toast.tsx`
- Types: success, error, info
- Auto-dismiss after 5 seconds
- Manual close button

### Loading Spinner

- Location: `frontend/src/components/common/LoadingSpinner.tsx`
- Sizes: sm, md, lg
- Optional message
- Full-screen mode

### Validation Utilities

- Location: `frontend/src/utils/productValidation.ts`
- Image validation (type, size)
- Price validation
- Deposit validation
- Error message extraction

## Backend Error Messages

All error messages in Arabic at `backend/src/middleware/errorHandler.ts`

## Usage Examples

### Toast

```tsx
const { toast, showSuccess, showError, hideToast } = useToast();
showSuccess('تم إضافة المنتج بنجاح');
<Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />;
```

### Loading

```tsx
<LoadingSpinner size="md" message="جاري التحميل..." />
```

### Validation

```tsx
import { validateProductImage, extractErrorMessage } from '../utils/productValidation';
const error = validateProductImage(file);
if (error) showError(error);
```
