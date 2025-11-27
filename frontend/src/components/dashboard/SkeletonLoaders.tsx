import React from 'react';

/**
 * Skeleton loader for MetricCard component
 * Shows pulsing animation while data is loading
 */
export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-brand-offwhite-300 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-brand-offwhite-200 rounded-lg"></div>
        <div className="w-16 h-6 bg-brand-offwhite-200 rounded"></div>
      </div>
      <div className="h-4 bg-brand-offwhite-200 rounded w-3/4 mb-3"></div>
      <div className="h-8 bg-brand-offwhite-200 rounded w-1/2"></div>
    </div>
  );
};

/**
 * Skeleton loader for ActivityItem component
 * Shows pulsing animation for activity feed items
 */
export const ActivityItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg animate-pulse">
      <div className="w-6 h-6 bg-brand-offwhite-200 rounded-full flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-brand-offwhite-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-brand-offwhite-200 rounded w-full mb-2"></div>
        <div className="h-3 bg-brand-offwhite-200 rounded w-1/2"></div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for chart components
 * Shows pulsing animation with chart-like structure
 */
export const ChartSkeleton: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300 animate-pulse">
      {title && <div className="h-6 bg-brand-offwhite-200 rounded w-1/3 mb-4"></div>}
      <div className="space-y-3">
        <div className="h-4 bg-brand-offwhite-200 rounded w-full"></div>
        <div className="h-4 bg-brand-offwhite-200 rounded w-5/6"></div>
        <div className="h-4 bg-brand-offwhite-200 rounded w-4/6"></div>
        <div className="h-4 bg-brand-offwhite-200 rounded w-3/6"></div>
        <div className="h-4 bg-brand-offwhite-200 rounded w-2/6"></div>
      </div>
      <div className="mt-6 h-48 bg-brand-offwhite-200 rounded"></div>
    </div>
  );
};

/**
 * Generic loading spinner component
 * Used for inline loading states
 */
export const LoadingSpinner: React.FC<{ text?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  text = 'جاري التحميل...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-brand-primary-900 ${sizeClasses[size]} mb-3`}
      ></div>
      {text && <p className="text-brand-offwhite-700 text-center">{text}</p>}
    </div>
  );
};

/**
 * Full-page skeleton loader for dashboard
 * Shows complete dashboard structure while loading
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton title="اتجاه التحصيل الشهري" />
        <ChartSkeleton title="أفضل المنتجات" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton title="أفضل المنتجات" />
        <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300 animate-pulse">
          <div className="h-6 bg-brand-offwhite-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};
