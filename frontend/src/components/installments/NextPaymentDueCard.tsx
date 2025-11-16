import React from 'react';
import { CalendarIcon, BanknotesIcon, ClockIcon } from '@heroicons/react/24/outline';

/**
 * Schedule item interface for next payment
 */
export interface ScheduleItem {
  id: number;
  sequenceNumber: number;
  dueDate: Date;
  totalAmount: number;
  principalAmount: number;
  extraAmount: number;
  paidAmount: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';
  paidDate?: Date;
  daysOverdue?: number;
  isNextDue: boolean;
}

/**
 * Props for NextPaymentDueCard component
 */
interface NextPaymentDueCardProps {
  nextPayment: ScheduleItem | null;
  onPayNow: () => void;
}

/**
 * NextPaymentDueCard Component
 * Displays the next payment due with prominent styling
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 */
const NextPaymentDueCard: React.FC<NextPaymentDueCardProps> = ({ nextPayment, onPayNow }) => {
  // If no pending payments, show completion message
  if (!nextPayment) {
    return (
      <div
        className="bg-brand-offwhite-100 rounded-lg shadow-md p-8 border-2 border-brand-offwhite-400"
        dir="rtl"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-secondary-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-brand-secondary-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-brand-primary-900 mb-2">جميع الدفعات مكتملة</h3>
          <p className="text-brand-offwhite-700">تم سداد جميع الأقساط المستحقة بنجاح</p>
        </div>
      </div>
    );
  }

  // Calculate days until/overdue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextPayment.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine status
  const isDueToday = diffDays === 0;
  const isOverdue = diffDays < 0;
  const daysUntilDue = diffDays;
  const daysOverdue = Math.abs(diffDays);

  // Determine background color based on status
  let bgColorClass = 'bg-white';
  let borderColorClass = 'border-brand-offwhite-400';
  let statusTextClass = 'text-brand-offwhite-700';
  let statusText = '';

  if (isOverdue) {
    // Burgundy background for overdue
    bgColorClass = 'bg-brand-primary-50';
    borderColorClass = 'border-brand-primary-900';
    statusTextClass = 'text-brand-primary-900 font-bold';
    statusText = `متأخر ${daysOverdue} ${daysOverdue === 1 ? 'يوم' : 'يوم'}`;
  } else if (isDueToday) {
    // Gold background for due today
    bgColorClass = 'bg-brand-secondary-50';
    borderColorClass = 'border-brand-secondary-400';
    statusTextClass = 'text-brand-secondary-900 font-bold';
    statusText = 'مستحق اليوم';
  } else {
    // Normal background for upcoming
    statusTextClass = 'text-brand-offwhite-700';
    statusText = `باقي ${daysUntilDue} ${daysUntilDue === 1 ? 'يوم' : 'يوم'}`;
  }

  // Format date in Arabic using Gregorian calendar
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat('ar-EG-u-ca-gregory', options).format(new Date(date));
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div
      className={`${bgColorClass} rounded-lg shadow-lg p-6 border-2 ${borderColorClass} transition-all hover:shadow-xl`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${isOverdue ? 'bg-brand-primary-100' : isDueToday ? 'bg-brand-secondary-100' : 'bg-brand-offwhite-200'}`}
          >
            <CalendarIcon
              className={`w-6 h-6 ${isOverdue ? 'text-brand-primary-900' : isDueToday ? 'text-brand-secondary-900' : 'text-brand-offwhite-700'}`}
            />
          </div>
          <h2 className="text-2xl font-bold text-brand-primary-900">الدفعة القادمة</h2>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${isOverdue ? 'bg-brand-primary-100' : isDueToday ? 'bg-brand-secondary-100' : 'bg-brand-offwhite-200'}`}
        >
          <ClockIcon className={`w-5 h-5 ${statusTextClass}`} />
          <span className={`text-sm ${statusTextClass}`}>{statusText}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Due Date */}
        <div className="space-y-2">
          <p className="text-sm text-brand-offwhite-700 font-medium">تاريخ الاستحقاق</p>
          <p className="text-lg font-bold text-brand-primary-900">
            {formatDate(nextPayment.dueDate)}
          </p>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <p className="text-sm text-brand-offwhite-700 font-medium">المبلغ المستحق</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-brand-primary-900">
              {formatCurrency(nextPayment.totalAmount)}
            </p>
            <span className="text-sm text-brand-offwhite-700">ج.م</span>
          </div>
        </div>
      </div>

      {/* Installment Number */}
      <div className="mb-6">
        <p className="text-sm text-brand-offwhite-700">
          القسط رقم{' '}
          <span className="font-bold text-brand-primary-900">{nextPayment.sequenceNumber}</span>
        </p>
      </div>

      {/* Pay Now Button */}
      <button
        type="button"
        onClick={onPayNow}
        className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-bold text-lg transition-all ${
          isOverdue
            ? 'bg-brand-primary-900 hover:bg-brand-primary-950 text-white shadow-lg hover:shadow-xl'
            : isDueToday
              ? 'bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 shadow-lg hover:shadow-xl'
              : 'bg-brand-primary-900 hover:bg-brand-primary-950 text-white shadow-md hover:shadow-lg'
        }`}
      >
        <BanknotesIcon className="w-6 h-6" />
        <span>دفع الآن</span>
      </button>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(NextPaymentDueCard);
