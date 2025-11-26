import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '../../types/customer';

interface CustomersTableProps {
  customers: Customer[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Status badge component with brand colors
 */
const StatusBadge: React.FC<{ status: 'on-track' | 'overdue' | 'completed' }> = ({ status }) => {
  const statusConfig = {
    'on-track': {
      label: 'في الموعد',
      className: 'bg-brand-secondary-100 text-brand-secondary-900 border-brand-secondary-400',
    },
    overdue: {
      label: 'متأخر',
      className: 'bg-brand-primary-50 text-brand-primary-900 border-brand-primary-900',
    },
    completed: {
      label: 'مكتمل',
      className: 'bg-brand-offwhite-200 text-brand-offwhite-900 border-brand-offwhite-400',
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
      <div className="h-4 bg-brand-offwhite-300 rounded w-12"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-brand-offwhite-300 rounded-full w-16"></div>
    </td>
  </tr>
);

/**
 * CustomersTable component
 * Displays paginated list of customers with status badges
 * Requirements: 1.1, 1.6, 1.7, 1.8
 */
const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
  loading,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (customerId: number) => {
    navigate(`/customers/${customerId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" dir="rtl">
          <thead className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-primary-900 uppercase tracking-wider">
                الاسم
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-primary-900 uppercase tracking-wider">
                الرقم القومي
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-primary-900 uppercase tracking-wider">
                الهاتف
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-primary-900 uppercase tracking-wider">
                الأقساط
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-primary-900 uppercase tracking-wider">
                الحالة
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
            ) : customers.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-brand-offwhite-700 text-base">لا توجد نتائج</p>
                </td>
              </tr>
            ) : (
              // Customer rows
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => handleRowClick(customer.id)}
                  className="hover:bg-brand-offwhite-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-brand-primary-900">
                      {customer.fullName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-offwhite-900" dir="ltr">
                      {customer.nationalId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-offwhite-900" dir="ltr">
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-offwhite-900 text-center">
                      {customer.activeInstallmentsCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={customer.paymentStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && customers.length > 0 && (
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

export default CustomersTable;
