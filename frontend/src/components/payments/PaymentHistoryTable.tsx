import React from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import type { PaymentRecord } from '../../types/payment';

interface PaymentHistoryTableProps {
  payments: PaymentRecord[];
  loading: boolean;
  onViewDetails: (paymentId: number) => void;
  onPrintReceipt: (paymentId: number) => void;
  onReversePayment: (paymentId: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  payments,
  loading,
  onViewDetails,
  onPrintReceipt,
  onReversePayment,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [openMenuId, setOpenMenuId] = React.useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: 'نقدي',
      BANK_TRANSFER: 'تحويل بنكي',
      CARD: 'بطاقة',
      CHECK: 'شيك',
    };
    return labels[method] || method;
  };

  const getStatusBadge = (status: string, isReversal: boolean) => {
    if (isReversal) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary-900 text-white">
          معكوس
        </span>
      );
    }

    const badges: Record<string, { label: string; className: string }> = {
      COMPLETED: {
        label: 'مكتمل',
        className: 'bg-brand-secondary-400 text-brand-primary-900',
      },
      PARTIAL: {
        label: 'جزئي',
        className: 'bg-brand-secondary-200 text-brand-primary-900',
      },
      REVERSED: {
        label: 'معكوس',
        className: 'bg-brand-primary-900 text-white',
      },
    };

    const badge = badges[status] || badges.COMPLETED;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}
      >
        {badge.label}
      </span>
    );
  };

  const handleMenuToggle = (paymentId: number) => {
    setOpenMenuId(openMenuId === paymentId ? null : paymentId);
  };

  const handleAction = (action: () => void) => {
    setOpenMenuId(null);
    action();
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-900"></div>
        <p className="mt-2 text-brand-offwhite-700">جاري التحميل...</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-lg font-medium text-brand-offwhite-700">لا توجد مدفوعات</p>
        <p className="text-sm text-brand-offwhite-600 mt-2">
          لم يتم العثور على مدفوعات تطابق معايير البحث
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                التاريخ
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                رقم الإيصال
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                العميل
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                المبلغ
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                طريقة الدفع
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                المحصل
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                الحالة
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-brand-primary-900">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-offwhite-200">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                onClick={() => onViewDetails(payment.id)}
                className="hover:bg-brand-offwhite-50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-4">
                  <p className="text-sm text-brand-offwhite-700">
                    {formatDate(payment.paymentDate)}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-brand-primary-900 direction-ltr text-right">
                    {payment.paymentNumber}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-brand-primary-900">
                    {payment.customerName}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-brand-primary-900">
                    {formatCurrency(payment.amount)}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-brand-offwhite-700">
                    {getPaymentMethodLabel(payment.paymentMethod)}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-brand-offwhite-700">{payment.collectorName}</p>
                </td>
                <td className="px-4 py-4">{getStatusBadge(payment.status, payment.isReversal)}</td>
                <td className="px-4 py-4 text-center">
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuToggle(payment.id);
                      }}
                      className="p-2 min-h-[44px] min-w-[44px] hover:bg-brand-offwhite-100 rounded-lg transition-colors"
                      aria-label="قائمة الإجراءات"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5 text-brand-offwhite-700" />
                    </button>

                    {/* Actions Menu */}
                    {openMenuId === payment.id && (
                      <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />

                        {/* Menu */}
                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-brand-offwhite-300 z-20">
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(() => onViewDetails(payment.id));
                              }}
                              className="w-full px-4 py-2 text-right text-sm text-brand-offwhite-900 hover:bg-brand-offwhite-50 transition-colors"
                            >
                              عرض التفاصيل
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(() => onPrintReceipt(payment.id));
                              }}
                              className="w-full px-4 py-2 text-right text-sm text-brand-offwhite-900 hover:bg-brand-offwhite-50 transition-colors"
                            >
                              طباعة الإيصال
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(() => onReversePayment(payment.id));
                              }}
                              disabled={payment.isReversal || payment.status === 'REVERSED'}
                              className={`w-full px-4 py-2 text-right text-sm transition-colors ${
                                payment.isReversal || payment.status === 'REVERSED'
                                  ? 'text-brand-offwhite-400 cursor-not-allowed'
                                  : 'text-brand-primary-900 hover:bg-brand-offwhite-50'
                              }`}
                            >
                              عكس الدفع
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-brand-offwhite-300 flex items-center justify-between">
          <div className="text-sm text-brand-offwhite-700">
            صفحة {currentPage} من {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-brand-offwhite-100 text-brand-offwhite-400 cursor-not-allowed'
                  : 'bg-brand-primary-900 text-white hover:bg-brand-primary-950'
              }`}
            >
              السابق
            </button>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? 'bg-brand-offwhite-100 text-brand-offwhite-400 cursor-not-allowed'
                  : 'bg-brand-primary-900 text-white hover:bg-brand-primary-950'
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

export default PaymentHistoryTable;
