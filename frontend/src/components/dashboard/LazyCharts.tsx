import { lazy } from 'react';

/**
 * Lazy-loaded chart components for code splitting
 * Charts are heavy dependencies (Recharts library) so we split them into separate bundles
 * Requirement 9.6: Lazy load chart library
 */

export const CollectionTrendsChart = lazy(() => import('./CollectionTrendsChart'));

export const TopProductsChart = lazy(() => import('./TopProductsChart'));

// Chart loading fallback component
export const ChartLoader = () => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300 flex items-center justify-center h-[400px]">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-brand-primary-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-brand-offwhite-700 text-sm">جاري تحميل الرسم البياني...</p>
    </div>
  </div>
);
