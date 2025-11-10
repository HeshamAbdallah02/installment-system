import React, { useMemo } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { MetricCardSkeleton } from './SkeletonLoaders';

interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage';
  alert?: boolean;
  loading?: boolean;
}

// Memoize MetricCard to prevent unnecessary re-renders - Requirement 9.6
const MetricCard: React.FC<MetricCardProps> = React.memo(
  ({ title, value, trend, icon, format = 'number', alert = false, loading = false }) => {
    // Memoize value formatting to avoid recalculation on every render - Requirement 9.6
    const formattedValue = useMemo(() => {
      if (typeof value === 'string') return value;

      switch (format) {
        case 'currency':
          return `${value.toLocaleString('ar-EG')} ج.م`;
        case 'percentage':
          return `${value.toFixed(1)}%`;
        case 'number':
        default:
          return value.toLocaleString('ar-EG');
      }
    }, [value, format]);

    if (loading) {
      return <MetricCardSkeleton />;
    }

    return (
      <div
        className={`bg-white rounded-xl shadow-lg p-4 tablet:p-6 border-2 transition-shadow duration-300 hover:shadow-xl ${
          alert ? 'border-brand-primary-900 bg-brand-primary-50' : 'border-brand-offwhite-300'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-brand-secondary-100 rounded-lg text-brand-primary-900">
            {icon}
          </div>
          <div className="flex items-center gap-2">
            {/* Alert Warning Icon - Requirement 10.2: Show warning icon next to metric */}
            {alert && (
              <div className="flex items-center justify-center w-8 h-8 bg-brand-primary-900 rounded-full">
                <ExclamationTriangleIcon className="w-5 h-5 text-white" />
              </div>
            )}
            {trend && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${
                  trend.direction === 'up'
                    ? 'bg-brand-secondary-100 text-brand-secondary-700'
                    : 'bg-brand-primary-100 text-brand-primary-700'
                }`}
              >
                {trend.direction === 'up' ? (
                  <ArrowUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4" />
                )}
                <span>{Math.abs(trend.value).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-xs tablet:text-sm font-medium text-brand-offwhite-700 mb-2 text-right">
          {title}
        </h3>

        <p className="text-2xl tablet:text-3xl font-bold text-brand-primary-900 text-right">
          {formattedValue}
        </p>
      </div>
    );
  }
);

MetricCard.displayName = 'MetricCard';

export default MetricCard;
