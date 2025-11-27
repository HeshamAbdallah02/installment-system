# Dashboard Components - Loading, Error, and Empty States

This document describes the loading, error handling, and empty state components implemented for the dashboard.

## Overview

Task 9 "Add loading and error states" has been completed with three sub-tasks:

- 9.1: Skeleton loaders
- 9.2: Error handling
- 9.3: Empty states

## Components Created

### 1. SkeletonLoaders.tsx

Provides reusable skeleton loader components with pulsing animations:

- **MetricCardSkeleton**: Skeleton for metric cards
- **ActivityItemSkeleton**: Skeleton for activity feed items
- **ChartSkeleton**: Skeleton for chart components
- **LoadingSpinner**: Generic loading spinner with customizable size
- **DashboardSkeleton**: Full dashboard skeleton loader

**Usage:**

```tsx
import { MetricCardSkeleton, LoadingSpinner } from './components/dashboard';

// In component
{
  loading && <MetricCardSkeleton />;
}
{
  loading && <LoadingSpinner text="جاري التحميل..." size="md" />;
}
```

### 2. ErrorStates.tsx

Provides error handling components with retry functionality:

- **ErrorState**: Generic error display with retry button
- **MetricCardError**: Compact error for metric cards
- **ChartError**: Error display for charts
- **ERROR_MESSAGES**: Arabic error messages constants
- **getErrorMessage()**: Helper to extract appropriate error message
- **logError()**: Helper to log errors to console

**Usage:**

```tsx
import { ErrorState, ERROR_MESSAGES, getErrorMessage } from './components/dashboard';

// In component
{
  error && <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
}
```

### 3. EmptyStates.tsx

Provides empty state components with helpful messages:

- **EmptyState**: Generic empty state component
- **ActivitiesEmptyState**: Empty state for activities feed
- **CollectionTrendsEmptyState**: Empty state for collection trends chart
- **TopProductsEmptyState**: Empty state for top products chart
- **DashboardEmptyState**: Empty state for entire dashboard
- **AnalyticsEmptyState**: Empty state for analytics page

**Usage:**

```tsx
import { ActivitiesEmptyState, TopProductsEmptyState } from './components/dashboard';

// In component
{
  !loading && data.length === 0 && <ActivitiesEmptyState />;
}
{
  !loading && products.length === 0 && <TopProductsEmptyState onAddInstallment={handleAdd} />;
}
```

### 4. useToast.ts Hook

Custom hook for managing toast notifications:

```tsx
import { useToast } from '../hooks/useToast';

const { toast, showSuccess, showError, showInfo, hideToast } = useToast();

// Show notifications
showSuccess('تم الحفظ بنجاح');
showError('حدث خطأ أثناء الحفظ');
showInfo('معلومة مهمة');

// Use with ToastNotification component
<ToastNotification
  message={toast.message}
  type={toast.type}
  isVisible={toast.isVisible}
  onClose={hideToast}
/>;
```

## Updated Components

### MetricCard

- Now uses `MetricCardSkeleton` for loading state
- Props: `loading?: boolean`

### ActivitiesFeed

- Uses `ActivityItemSkeleton` for loading items
- Uses `ActivitiesEmptyState` for empty state
- Added error handling with retry
- Props: `loading?: boolean`, `error?: string`, `onRefresh?: () => void`

### CollectionTrendsChart

- Uses `LoadingSpinner` for loading state
- Uses `ErrorState` for error display
- Uses `CollectionTrendsEmptyState` for empty data
- Props: `loading?: boolean`, `error?: string`, `onRetry?: () => void`, `onAddPayment?: () => void`

### TopProductsChart

- Uses `LoadingSpinner` for loading state
- Uses `ErrorState` for error display
- Uses `TopProductsEmptyState` for empty data
- Props: `loading?: boolean`, `error?: string`, `onRetry?: () => void`, `onAddInstallment?: () => void`

## Integration Example

The Dashboard page has been updated to use the new error handling:

```tsx
<CollectionTrendsChart
  data={collectionTrends ?? []}
  loading={trendsLoading}
  error={trendsError ? 'فشل تحميل اتجاه التحصيل. يرجى المحاولة مرة أخرى' : undefined}
  onRetry={() => refetchTrends()}
  onAddPayment={handleRecordPayment}
/>

<TopProductsChart
  data={topProducts ?? []}
  loading={productsLoading}
  error={productsError ? 'فشل تحميل أفضل المنتجات. يرجى المحاولة مرة أخرى' : undefined}
  onRetry={() => refetchProducts()}
  onProductClick={handleProductClick}
  onAddInstallment={handleAddInstallment}
/>
```

## Brand Colors

All components use the official brand colors:

- **Primary (Burgundy)**: `brand-primary-*` for errors, alerts, and primary actions
- **Secondary (Gold)**: `brand-secondary-*` for success states and highlights
- **Neutral (Off-white)**: `brand-offwhite-*` for backgrounds and subtle elements

## Accessibility

- All loading states include Arabic text labels
- Error messages are clear and actionable
- Empty states provide helpful guidance
- Retry buttons are clearly labeled
- Color contrast meets WCAG standards

## Performance

- Skeleton loaders use CSS animations (no JavaScript)
- Components are memoized where appropriate
- Error logging is non-blocking
- Toast notifications auto-dismiss after 3 seconds

## Testing

All components have been checked for:

- TypeScript type safety
- ESLint compliance
- Brand color usage
- RTL layout support
- Responsive design
