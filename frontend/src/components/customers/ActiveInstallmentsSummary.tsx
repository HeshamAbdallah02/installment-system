import React from 'react';

interface ActiveInstallmentsSummaryProps {
  totalActiveInstallments: number;
  totalRemainingBalance: number;
}

/**
 * ActiveInstallmentsSummary component
 * Displays summary of active installments and total balance
 * Requirements: 3.8
 */
const ActiveInstallmentsSummary: React.FC<ActiveInstallmentsSummaryProps> = ({
  totalActiveInstallments,
  totalRemainingBalance,
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total Active Installments */}
      <div className="bg-brand-secondary-50 rounded-lg border border-brand-secondary-400 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-brand-offwhite-700 mb-1">
              إجمالي الأقساط النشطة
            </p>
            <p className="text-3xl font-bold text-brand-primary-900">{totalActiveInstallments}</p>
          </div>
          <div className="w-12 h-12 bg-brand-secondary-400 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-brand-primary-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Total Remaining Balance */}
      <div className="bg-brand-primary-900 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-brand-secondary-400 mb-1">
              إجمالي المبلغ المتبقي
            </p>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalRemainingBalance)}</p>
          </div>
          <div className="w-12 h-12 bg-brand-secondary-400 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-brand-primary-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveInstallmentsSummary;
