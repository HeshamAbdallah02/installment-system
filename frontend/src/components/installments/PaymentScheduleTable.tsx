import React from 'react';
import {
  CalendarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Schedule item interface
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
 * Props for PaymentScheduleTable component
 */
interface PaymentScheduleTableProps {
  schedule: ScheduleItem[];
  onPayClick: (scheduleId: number) => void;
}

/**
 * Status badge component for payment status
 */
const StatusBadge: React.FC<{ status: ScheduleItem['status'] }> = ({ status }) => {
  const statusConfig = {
    PENDING: {
      label: 'معلق',
      className: 'bg-brand-offwhite-200 text-brand-offwhite-900 border-brand-offwhite-500',
      icon: ClockIcon,
    },
    PAID: {
      label: 'مدفوع',
      className: 'bg-brand-secondary-100 text-brand-secondary-900 border-brand-secondary-400',
      icon: CheckCircleIcon,
    },
    OVERDUE: {
      label: 'متأخر',
      className: 'bg-brand-primary-50 text-brand-primary-900 border-brand-primary-900',
      icon: ExclamationCircleIcon,
    },
    PARTIAL: {
      label: 'جزئي',
      className: 'bg-brand-secondary-50 text-brand-secondary-900 border-brand-secondary-300',
      icon: ClockIcon,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
};

/**
 * Memoized schedule row component for better performance
 */
const ScheduleRow: React.FC<{
  item: ScheduleItem;
  onPayClick: (scheduleId: number) => void;
  formatDate: (date: Date) => string;
  formatCurrency: (amount: number) => string;
  calculateDaysOverdue: (dueDate: Date) => number;
}> = React.memo(({ item, onPayClick, formatDate, formatCurrency, calculateDaysOverdue }) => {
  const isOverdue = item.status === 'OVERDUE';
  const isNextDue = item.isNextDue;
  const daysOverdue = isOverdue ? calculateDaysOverdue(item.dueDate) : 0;

  let rowClassName =
    'border-b border-brand-offwhite-200 hover:bg-brand-offwhite-50 transition-colors';

  if (isOverdue) {
    rowClassName =
      'border-b border-brand-primary-200 bg-brand-primary-50 hover:bg-brand-primary-100 transition-colors';
  } else if (isNextDue) {
    rowClassName =
      'border-b border-brand-secondary-300 bg-brand-secondary-50 hover:bg-brand-secondary-100 transition-colors';
  }

  return (
    <tr className={rowClassName}>
      <td className="px-6 py-4">
        <span className="font-bold text-brand-primary-900">{item.sequenceNumber}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-brand-offwhite-900">{formatDate(item.dueDate)}</span>
          {isOverdue && daysOverdue > 0 && (
            <span className="text-xs font-bold text-brand-primary-900">
              متأخر {daysOverdue} {daysOverdue === 1 ? 'يوم' : 'يوم'}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-brand-primary-900">
            {formatCurrency(item.totalAmount)}
          </span>
          <span className="text-xs text-brand-offwhite-700">ج.م</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-6 py-4">
        {item.paidDate ? (
          <span className="text-brand-offwhite-900">{formatDate(item.paidDate)}</span>
        ) : (
          <span className="text-brand-offwhite-500">-</span>
        )}
      </td>
      <td className="px-6 py-4">
        {(item.status === 'PENDING' || item.status === 'OVERDUE' || item.status === 'PARTIAL') && (
          <button
            type="button"
            onClick={() => onPayClick(item.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isOverdue
                ? 'bg-brand-primary-900 hover:bg-brand-primary-950 text-white shadow-md hover:shadow-lg'
                : 'bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 shadow-sm hover:shadow-md'
            }`}
          >
            <BanknotesIcon className="w-4 h-4" />
            <span>دفع</span>
          </button>
        )}
        {item.status === 'PAID' && (
          <div className="flex items-center gap-2 text-brand-secondary-900">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">مكتمل</span>
          </div>
        )}
      </td>
    </tr>
  );
});

ScheduleRow.displayName = 'ScheduleRow';

/**
 * PaymentScheduleTable Component with optimized rendering
 * Displays the complete payment schedule with status and actions
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
 * Performance: Uses React.memo for row components to prevent unnecessary re-renders
 */
const PaymentScheduleTable: React.FC<PaymentScheduleTableProps> = ({ schedule, onPayClick }) => {
  // Format date in Arabic using Gregorian calendar - memoized
  const formatDate = React.useCallback((date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    return new Intl.DateTimeFormat('ar-EG-u-ca-gregory', options).format(new Date(date));
  }, []);

  // Format currency - memoized
  const formatCurrency = React.useCallback((amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Calculate totals - memoized
  const { totalScheduled, totalPaid } = React.useMemo(() => {
    const scheduled = schedule.reduce((sum, item) => sum + item.totalAmount, 0);
    const paid = schedule.reduce((sum, item) => sum + item.paidAmount, 0);
    return { totalScheduled: scheduled, totalPaid: paid };
  }, [schedule]);

  // Calculate days overdue for display - memoized
  const calculateDaysOverdue = React.useCallback((dueDate: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md border border-brand-offwhite-300" dir="rtl">
      {/* Section Header */}
      <div className="p-6 border-b border-brand-offwhite-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary-50 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-brand-primary-900" />
          </div>
          <h2 className="text-xl font-bold text-brand-primary-900">جدول الدفعات</h2>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
              <th className="px-6 py-4 text-start text-sm font-bold text-brand-primary-900">#</th>
              <th className="px-6 py-4 text-start text-sm font-bold text-brand-primary-900">
                تاريخ الاستحقاق
              </th>
              <th className="px-6 py-4 text-start text-sm font-bold text-brand-primary-900">
                المبلغ
              </th>
              <th className="px-6 py-4 text-start text-sm font-bold text-brand-primary-900">
                الحالة
              </th>
              <th className="px-6 py-4 text-start text-sm font-bold text-brand-primary-900">
                تاريخ الدفع
              </th>
              <th className="px-6 py-4 text-start text-sm font-bold text-brand-primary-900">
                إجراء
              </th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item) => (
              <ScheduleRow
                key={item.id}
                item={item}
                onPayClick={onPayClick}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                calculateDaysOverdue={calculateDaysOverdue}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Summary */}
      <div className="p-6 bg-brand-offwhite-50 border-t border-brand-offwhite-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">إجمالي المبلغ المجدول</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-brand-primary-900">
                  {formatCurrency(totalScheduled)}
                </span>
                <span className="text-sm text-brand-offwhite-700">ج.م</span>
              </div>
            </div>
            <div className="h-12 w-px bg-brand-offwhite-300" />
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">إجمالي المبلغ المدفوع</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-brand-secondary-900">
                  {formatCurrency(totalPaid)}
                </span>
                <span className="text-sm text-brand-offwhite-700">ج.م</span>
              </div>
            </div>
            <div className="h-12 w-px bg-brand-offwhite-300" />
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">المتبقي</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-brand-primary-900">
                  {formatCurrency(totalScheduled - totalPaid)}
                </span>
                <span className="text-sm text-brand-offwhite-700">ج.م</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(PaymentScheduleTable);
