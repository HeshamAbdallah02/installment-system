import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { InstallmentListItem } from '../../types/installment';

interface InstallmentsGridProps {
  installments: InstallmentListItem[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Status badge component with brand colors
 * Requirements: 9.2
 */
const StatusBadge: React.FC<{ status: 'on-track' | 'due-soon' | 'overdue' }> = ({ status }) => {
  const statusConfig = {
    'on-track': {
      label: 'في الموعد',
      className: 'bg-brand-secondary-100 text-brand-secondary-900 border-brand-secondary-400',
    },
    'due-soon': {
      label: 'مستحق قريباً',
      className: 'bg-brand-secondary-200 text-brand-secondary-900 border-brand-secondary-500',
    },
    overdue: {
      label: 'متأخر',
      className: 'bg-brand-primary-50 text-brand-primary-900 border-brand-primary-900',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
};

/**
 * Loading skeleton for table rows
 */
const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-brand-offwhite-300 animate-pulse">
    <td className="px-6 py-4">
      <div className="h-4 bg-brand-offwhite-300 rounded w-32"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-brand-offwhite-300 rounded w-28"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-brand-offwhite-300 rounded w-24"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-brand-offwhite-300 rounded w-20"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-brand-offwhite-300 rounded-full w-16"></div>
    </td>
  </tr>
);

/**
 * InstallmentsGrid component
 * Displays paginated list of active installments with status badges
 * Requirements: 9.1, 9.2, 9.5, 9.9
 */
const InstallmentsGrid: React.FC<InstallmentsGridProps> = ({
  installments,
  loading,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (installmentId: number) => {
    navigate(`/installments/${installmentId}`);
  };

  const handlePrintAgreement = (e: React.MouseEvent, installmentId: number) => {
    e.stopPropagation(); // Prevent row click
    navigate(`/installments/${installmentId}/agreement`);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" dir="rtl">
          <thead className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-primary-900 uppercase tracking-wider">
                اسم العميل
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-primary-900 uppercase tracking-wider">
                المنتج
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-primary-900 uppercase tracking-wider">
                القسط الشهري
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-primary-900 uppercase tracking-wider">
                تاريخ الاستحقاق التالي
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-primary-900 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-primary-900 uppercase tracking-wider">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-offwhite-200">
            {loading ? (
              // Loading skeleton
              <>
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </>
            ) : installments.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-brand-offwhite-700 text-base">لا توجد أقساط نشطة</p>
                </td>
              </tr>
            ) : (
              // Installment rows
              installments.map((installment) => (
                <tr
                  key={installment.id}
                  onClick={() => handleRowClick(installment.id)}
                  className="hover:bg-brand-offwhite-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-brand-primary-900">
                      {installment.customerName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-offwhite-900">{installment.productName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-offwhite-900">
                      {formatCurrency(installment.monthlyPayment)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-offwhite-900">
                      {formatDate(installment.nextDueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={installment.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => handlePrintAgreement(e, installment.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-brand-primary-900 hover:text-white bg-white hover:bg-brand-primary-900 border border-brand-primary-900 rounded-lg transition-colors"
                      title="طباعة العقد"
                    >
                      <PrinterIcon className="w-4 h-4" />
                      <span>طباعة</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && installments.length > 0 && (
        <div className="px-6 py-4 bg-brand-offwhite-50 border-t border-brand-offwhite-300 flex items-center justify-between">
          <div className="text-sm text-brand-offwhite-700">
            صفحة {currentPage} من {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 1
                  ? 'bg-brand-offwhite-200 text-brand-offwhite-500 cursor-not-allowed'
                  : 'bg-white text-brand-primary-900 border border-brand-offwhite-400 hover:bg-brand-offwhite-100'
              }`}
            >
              السابق
            </button>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === totalPages
                  ? 'bg-brand-offwhite-200 text-brand-offwhite-500 cursor-not-allowed'
                  : 'bg-white text-brand-primary-900 border border-brand-offwhite-400 hover:bg-brand-offwhite-100'
              }`}
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallmentsGrid;
