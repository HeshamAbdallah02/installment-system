import React, { useState, useMemo } from 'react';
import {
  BanknotesIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';
import type { PaymentRecord } from '../../types/payment';

interface PaymentTimelineProps {
  payments: PaymentRecord[];
  onViewReceipt: (paymentId: number) => void;
  initialDisplayCount?: number;
}

/**
 * Payment method icon component
 */
const PaymentMethodIcon: React.FC<{ method: string }> = ({ method }) => {
  const iconClass = 'w-5 h-5';

  switch (method) {
    case 'CASH':
      return <BanknotesIcon className={iconClass} />;
    case 'BANK_TRANSFER':
      return <BuildingLibraryIcon className={iconClass} />;
    case 'CARD':
      return <CreditCardIcon className={iconClass} />;
    case 'CHECK':
      return <DocumentTextIcon className={iconClass} />;
    default:
      return <BanknotesIcon className={iconClass} />;
  }
};

/**
 * Payment method label in Arabic
 */
const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    CASH: 'نقدي',
    BANK_TRANSFER: 'تحويل بنكي',
    CARD: 'بطاقة',
    CHECK: 'شيك',
  };
  return labels[method] || method;
};

/**
 * Format date as relative time in Arabic
 */
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffDays === 0) {
    return 'اليوم';
  } else if (diffDays === 1) {
    return 'أمس';
  } else if (diffDays < 7) {
    return `منذ ${diffDays} أيام`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
  } else if (diffMonths < 12) {
    return `منذ ${diffMonths} ${diffMonths === 1 ? 'شهر' : 'أشهر'}`;
  } else {
    return `منذ ${diffYears} ${diffYears === 1 ? 'سنة' : 'سنوات'}`;
  }
};

/**
 * Format date in Arabic using Gregorian calendar
 */
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('ar-EG-u-ca-gregory', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format currency in Egyptian Pounds
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Empty state component
 */
const EmptyState: React.FC = () => (
  <div className="text-center py-12">
    <ReceiptPercentIcon className="w-16 h-16 text-brand-offwhite-400 mx-auto mb-4" />
    <p className="text-brand-offwhite-700 text-lg">لا توجد دفعات</p>
    <p className="text-brand-offwhite-600 text-sm mt-2">لم يتم تسجيل أي دفعات لهذا القسط بعد</p>
  </div>
);

/**
 * PaymentTimeline component with lazy loading
 * Displays payment history in a vertical timeline format
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
 * Performance: Implements lazy loading to show initial set and load more on demand
 */
const PaymentTimeline: React.FC<PaymentTimelineProps> = ({
  payments,
  onViewReceipt,
  initialDisplayCount = 10,
}) => {
  const [displayCount, setDisplayCount] = useState(initialDisplayCount);

  // Memoize sorted payments to avoid re-sorting on every render
  const sortedPayments = useMemo(
    () =>
      [...payments].sort(
        (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      ),
    [payments]
  );

  // Show empty state when no payments
  if (sortedPayments.length === 0) {
    return <EmptyState />;
  }

  // Get payments to display (lazy loading)
  const displayedPayments = sortedPayments.slice(0, displayCount);
  const hasMore = displayCount < sortedPayments.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 10, sortedPayments.length));
  };

  return (
    <div className="space-y-6">
      {displayedPayments.map((payment, index) => {
        const isPartial = payment.status === 'PARTIAL';
        const isReversed = payment.isReversal || payment.status === 'REVERSED';

        return (
          <div key={payment.id} className="relative">
            {/* Timeline line */}
            {index < displayedPayments.length - 1 && (
              <div className="absolute top-10 right-[19px] w-0.5 h-full bg-brand-offwhite-300" />
            )}

            {/* Payment item */}
            <div className="flex gap-4">
              {/* Timeline dot with icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                  isReversed
                    ? 'bg-brand-offwhite-300 text-brand-offwhite-700'
                    : 'bg-brand-secondary-100 text-brand-secondary-900'
                }`}
              >
                <PaymentMethodIcon method={payment.paymentMethod} />
              </div>

              {/* Payment details */}
              <div className="flex-1 bg-white rounded-lg border border-brand-offwhite-300 p-4 shadow-sm">
                {/* Date and relative time */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-brand-primary-900">
                    {formatDate(payment.paymentDate)}
                  </span>
                  <span className="text-xs text-brand-offwhite-600">
                    {formatRelativeTime(payment.paymentDate)}
                  </span>
                </div>

                {/* Amount and payment method */}
                <div
                  className={`flex items-center gap-2 mb-2 ${
                    isReversed ? 'line-through text-brand-offwhite-600' : ''
                  }`}
                >
                  <span className="text-2xl font-bold text-brand-primary-900">
                    {formatCurrency(payment.amount)} ج.م
                  </span>
                  <span className="text-sm text-brand-offwhite-700">
                    - {getPaymentMethodLabel(payment.paymentMethod)}
                  </span>
                </div>

                {/* Receipt number and collector */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-brand-offwhite-700">
                    <span className="font-medium">إيصال:</span> {payment.paymentNumber}
                  </div>
                  <div className="text-sm text-brand-offwhite-700">
                    <span className="font-medium">المحصل:</span> {payment.collectorName}
                  </div>
                </div>

                {/* Badges and actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Partial payment indicator */}
                    {isPartial && !isReversed && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-secondary-100 text-brand-secondary-900 border border-brand-secondary-400">
                        دفعة جزئية
                      </span>
                    )}

                    {/* Reversed badge */}
                    {isReversed && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-offwhite-300 text-brand-offwhite-900 border border-brand-offwhite-500">
                        معكوس
                      </span>
                    )}
                  </div>

                  {/* View receipt link */}
                  {!isReversed && (
                    <button
                      type="button"
                      onClick={() => onViewReceipt(payment.id)}
                      className="text-sm text-brand-primary-900 hover:text-brand-primary-950 font-medium transition-colors"
                    >
                      عرض الإيصال ←
                    </button>
                  )}
                </div>

                {/* Reversal reason */}
                {isReversed && payment.reversalReason && (
                  <div className="mt-3 pt-3 border-t border-brand-offwhite-300">
                    <p className="text-sm text-brand-offwhite-700">
                      <span className="font-medium">سبب العكس:</span> {payment.reversalReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={handleLoadMore}
            className="px-6 py-2 text-sm font-medium text-brand-primary-900 hover:text-brand-primary-950 hover:bg-brand-offwhite-100 rounded-lg transition-colors border border-brand-offwhite-300"
          >
            عرض المزيد ({sortedPayments.length - displayCount} متبقي)
          </button>
        </div>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(PaymentTimeline);
