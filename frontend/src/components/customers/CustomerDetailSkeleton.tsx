import React from 'react';

/**
 * CustomerDetailSkeleton component
 * Loading skeleton for customer detail page
 * Requirement: 9 - Use loading skeletons for better UX
 */
const CustomerDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-brand-offwhite-300 rounded-lg"></div>
        <div className="h-8 bg-brand-offwhite-300 rounded w-64"></div>
      </div>

      {/* Personal Info Card Skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-brand-offwhite-300 rounded w-32"></div>
          <div className="h-10 bg-brand-offwhite-300 rounded w-24"></div>
        </div>
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <div className="h-4 bg-brand-offwhite-300 rounded w-24 mb-2"></div>
              <div className="h-5 bg-brand-offwhite-300 rounded w-40"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-6 bg-brand-offwhite-300 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-brand-offwhite-300 rounded w-32 mb-2"></div>
            <div className="h-8 bg-brand-offwhite-300 rounded w-20"></div>
          </div>
          <div>
            <div className="h-4 bg-brand-offwhite-300 rounded w-32 mb-2"></div>
            <div className="h-8 bg-brand-offwhite-300 rounded w-32"></div>
          </div>
        </div>
      </div>

      {/* Installments Grid Skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-6 bg-brand-offwhite-300 rounded w-40 mb-4"></div>
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="border border-brand-offwhite-300 rounded-lg p-4">
              <div className="h-5 bg-brand-offwhite-300 rounded w-48 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-brand-offwhite-300 rounded w-full"></div>
                <div className="h-4 bg-brand-offwhite-300 rounded w-3/4"></div>
                <div className="h-6 bg-brand-offwhite-300 rounded-full w-24 mt-3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History Skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-6 bg-brand-offwhite-300 rounded w-40 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-2 bg-brand-offwhite-300 rounded"></div>
              <div className="flex-1">
                <div className="h-5 bg-brand-offwhite-300 rounded w-32 mb-2"></div>
                <div className="h-4 bg-brand-offwhite-300 rounded w-48"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailSkeleton;
