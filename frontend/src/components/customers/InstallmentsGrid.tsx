import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { CustomerInstallment } from '../../types/customer';

interface InstallmentsGridProps {
  installments: CustomerInstallment[];
  customerId: number;
}

/**
 * InstallmentsGrid component
 * Displays active installments with progress bars and status badges
 * Requirements: 3.4, 3.5, 3.9
 */
const InstallmentsGrid: React.FC<InstallmentsGridProps> = ({ installments, customerId }) => {
  const navigate = useNavigate();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'on-track': {
        label: 'في الموعد',
        className: 'bg-brand-secondary-400 text-brand-primary-900',
      },
      'due-soon': {
        label: 'مستحق قريباً',
        className: 'bg-orange-500 text-white',
      },
      overdue: {
        label: 'متأخر',
        className: 'bg-brand-primary-900 text-white',
      },
      completed: {
        label: 'مكتمل',
        className: 'bg-brand-offwhite-300 text-brand-primary-900',
      },
    };

    const statusInfo = statusMap[status.toLowerCase()] || statusMap['on-track'];
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  // Handle add new installment
  const handleAddInstallment = () => {
    // Navigate to installment wizard with pre-selected customer
    navigate(`/installments/new?customerId=${customerId}`);
  };

  // Empty state
  if (installments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-brand-offwhite-400 p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-offwhite-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-brand-offwhite-700"
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
          <h3 className="text-lg font-semibold text-brand-primary-900 mb-2">لا توجد أقساط نشطة</h3>
          <p className="text-brand-offwhite-700 mb-6">لم يتم إنشاء أي أقساط لهذا العميل بعد</p>
          <button
            onClick={handleAddInstallment}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            <span>إضافة قسط جديد</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-brand-primary-900">الأقساط النشطة</h2>
        <button
          onClick={handleAddInstallment}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          <span>إضافة قسط جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {installments.map((installment) => (
          <div
            key={installment.id}
            className="bg-white rounded-lg shadow-sm border border-brand-offwhite-400 p-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-brand-primary-900 mb-1">
                  {installment.productName}
                </h3>
                <p className="text-sm text-brand-offwhite-700">
                  {installment.paidInstallments} من {installment.totalInstallments} دفعة
                </p>
              </div>
              {getStatusBadge(installment.status)}
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-brand-offwhite-700 mb-1">إجمالي المبلغ</p>
                <p className="text-sm font-semibold text-brand-primary-900">
                  {formatCurrency(installment.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-offwhite-700 mb-1">القسط الشهري</p>
                <p className="text-sm font-semibold text-brand-primary-900">
                  {formatCurrency(installment.monthlyPayment)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-brand-offwhite-700 mb-1">المبلغ المتبقي</p>
                <p className="text-lg font-bold text-brand-primary-900">
                  {formatCurrency(installment.remainingBalance)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-brand-offwhite-700">التقدم</span>
                <span className="text-xs font-bold text-brand-primary-900">
                  {installment.progressPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-brand-offwhite-200 rounded-full h-2.5">
                <div
                  className="bg-brand-secondary-400 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${installment.progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              className="w-full mt-4 px-4 py-2 bg-brand-secondary-400 text-brand-primary-900 rounded-lg hover:bg-brand-secondary-500 transition-colors font-medium"
              onClick={() => {
                // This will be implemented in task 4.4
                console.log('Record payment for installment:', installment.id);
              }}
            >
              تسجيل دفعة
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstallmentsGrid;
