import React from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

/**
 * Payment consistency levels
 */
export type PaymentConsistency = 'GOOD' | 'FAIR' | 'POOR';

/**
 * Installment statistics interface
 */
export interface InstallmentStats {
  onTimePaymentsCount: number;
  latePaymentsCount: number;
  totalPayments: number;
  onTimePercentage: number;
  averageDaysToPay: number;
  paymentConsistency: PaymentConsistency;
  totalInterestPaid: number;
  remainingInterest: number;
  expectedCompletionDate: Date;
}

/**
 * Props for InstallmentStatisticsCard component
 */
interface InstallmentStatisticsCardProps {
  statistics: InstallmentStats;
}

/**
 * InstallmentStatisticsCard Component
 * Displays payment statistics and performance indicators
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */
const InstallmentStatisticsCard: React.FC<InstallmentStatisticsCardProps> = ({ statistics }) => {
  /**
   * Format date in Arabic
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  /**
   * Get consistency configuration
   * Requirement: 13.4, 13.6
   * Using brand colors: Good (gold), Fair (off-white), Poor (burgundy)
   */
  const getConsistencyConfig = (consistency: PaymentConsistency) => {
    const configs = {
      GOOD: {
        label: 'ممتاز',
        icon: '✓',
        bgColor: 'bg-brand-secondary-50',
        textColor: 'text-brand-secondary-900',
        borderColor: 'border-brand-secondary-400',
      },
      FAIR: {
        label: 'جيد',
        icon: '○',
        bgColor: 'bg-brand-offwhite-100',
        textColor: 'text-brand-offwhite-900',
        borderColor: 'border-brand-offwhite-500',
      },
      POOR: {
        label: 'ضعيف',
        icon: '✕',
        bgColor: 'bg-brand-primary-50',
        textColor: 'text-brand-primary-900',
        borderColor: 'border-brand-primary-900',
      },
    };

    return configs[consistency];
  };

  const consistencyConfig = getConsistencyConfig(statistics.paymentConsistency);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300" dir="rtl">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-brand-primary-900">الإحصائيات</h2>
        <div className="p-2 bg-brand-offwhite-100 rounded-lg">
          <ChartBarIcon className="w-5 h-5 text-brand-primary-900" />
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="space-y-4">
        {/* On-Time Payments - Requirement: 13.1 */}
        <div className="flex items-center justify-between p-3 bg-brand-offwhite-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-brand-secondary-700" />
            <span className="text-sm text-brand-offwhite-700">دفعات في الموعد</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-brand-secondary-900">
              {statistics.onTimePaymentsCount}
            </span>
            <span className="text-xs text-brand-offwhite-600">
              ({statistics.onTimePercentage.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Late Payments - Requirement: 13.2 */}
        <div className="flex items-center justify-between p-3 bg-brand-offwhite-50 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationCircleIcon className="w-5 h-5 text-brand-primary-700" />
            <span className="text-sm text-brand-offwhite-700">دفعات متأخرة</span>
          </div>
          <span className="text-lg font-bold text-brand-primary-900">
            {statistics.latePaymentsCount}
          </span>
        </div>

        {/* Average Days to Pay - Requirement: 13.3 */}
        <div className="flex items-center justify-between p-3 bg-brand-offwhite-50 rounded-lg">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-brand-offwhite-700" />
            <span className="text-sm text-brand-offwhite-700">متوسط أيام الدفع</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-brand-primary-900">
              {statistics.averageDaysToPay.toFixed(1)}
            </span>
            <span className="text-xs text-brand-offwhite-700">يوم</span>
          </div>
        </div>

        {/* Payment Consistency - Requirement: 13.4, 13.6 */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg border ${consistencyConfig.bgColor} ${consistencyConfig.borderColor}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{consistencyConfig.icon}</span>
            <span className={`text-sm font-medium ${consistencyConfig.textColor}`}>
              الأداء العام
            </span>
          </div>
          <span className={`text-lg font-bold ${consistencyConfig.textColor}`}>
            {consistencyConfig.label}
          </span>
        </div>

        {/* Expected Completion Date - Requirement: 13.5 */}
        <div className="flex items-center justify-between p-3 bg-brand-secondary-50 rounded-lg border border-brand-secondary-200">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-secondary-700" />
            <span className="text-sm font-medium text-brand-secondary-900">
              تاريخ الإنهاء المتوقع
            </span>
          </div>
          <span className="text-sm font-bold text-brand-secondary-900">
            {formatDate(statistics.expectedCompletionDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(InstallmentStatisticsCard);
