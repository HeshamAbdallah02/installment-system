import React from 'react';
import {
  BanknotesIcon,
  CreditCardIcon,
  ClockIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface KeyMetricsCardsProps {
  totalAmount: number;
  depositAmount: number;
  remainingBalance: number;
  monthlyAmount: number;
  progressPercentage: number;
}

/**
 * KeyMetricsCards component with performance optimization
 * Displays 5 key metric cards with brand colors
 * Requirements: 1.2, 1.3
 * Performance: Memoized to prevent unnecessary re-renders
 */
const KeyMetricsCards: React.FC<KeyMetricsCardsProps> = ({
  totalAmount,
  depositAmount,
  remainingBalance,
  monthlyAmount,
  progressPercentage,
}) => {
  const formatCurrency = React.useCallback((amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" dir="rtl">
      {/* Total Amount Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-brand-offwhite-700">الإجمالي</span>
          <BanknotesIcon className="w-5 h-5 text-brand-primary-900" />
        </div>
        <p className="text-2xl font-bold text-brand-primary-900">{formatCurrency(totalAmount)}</p>
      </div>

      {/* Deposit Paid Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-brand-offwhite-700">المقدم</span>
          <CreditCardIcon className="w-5 h-5 text-brand-secondary-600" />
        </div>
        <p className="text-2xl font-bold text-brand-secondary-700">
          {formatCurrency(depositAmount)}
        </p>
      </div>

      {/* Remaining Balance Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-brand-offwhite-700">المتبقي</span>
          <ClockIcon className="w-5 h-5 text-brand-primary-900" />
        </div>
        <p className="text-2xl font-bold text-brand-primary-900">
          {formatCurrency(remainingBalance)}
        </p>
      </div>

      {/* Monthly Payment Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-brand-offwhite-700">القسط الشهري</span>
          <CalendarIcon className="w-5 h-5 text-brand-secondary-600" />
        </div>
        <p className="text-2xl font-bold text-brand-secondary-700">
          {formatCurrency(monthlyAmount)}
        </p>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-brand-offwhite-700">التقدم</span>
          <span className="text-lg font-bold text-brand-primary-900">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-brand-offwhite-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-brand-secondary-400 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(KeyMetricsCards);
