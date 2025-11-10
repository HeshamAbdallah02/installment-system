import React from 'react';
import { PaymentHistoryItem } from '../../types/customer';

interface PaymentHistoryTimelineProps {
  paymentHistory: PaymentHistoryItem[];
}

/**
 * PaymentHistoryTimeline component
 * Displays payment records in chronological order with Arabic date formatting
 * Requirements: 3.6
 */
const PaymentHistoryTimeline: React.FC<PaymentHistoryTimelineProps> = ({ paymentHistory }) => {
  // Format date to Arabic
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get payment method label
  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      cash: 'نقدي',
      card: 'بطاقة',
      bank_transfer: 'تحويل بنكي',
      mobile_wallet: 'محفظة إلكترونية',
    };
    return methodMap[method.toLowerCase()] || method;
  };

  // Empty state
  if (paymentHistory.length === 0) {
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-brand-primary-900 mb-2">لا يوجد سجل دفعات</h3>
          <p className="text-brand-offwhite-700">لم يتم تسجيل أي دفعات لهذا العميل بعد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-brand-offwhite-400 p-6">
      <h2 className="text-xl font-bold text-brand-primary-900 mb-6">سجل الدفعات</h2>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-brand-offwhite-300"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {paymentHistory.map((payment) => (
            <div key={payment.id} className="relative pr-12">
              {/* Timeline dot */}
              <div className="absolute right-2.5 top-1 w-3 h-3 bg-brand-secondary-400 rounded-full border-2 border-white"></div>

              {/* Payment card */}
              <div className="bg-brand-offwhite-50 rounded-lg p-4 hover:bg-brand-secondary-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-brand-primary-900 mb-1">
                      {formatDate(payment.date)}
                    </p>
                    <p className="text-xs text-brand-offwhite-700">
                      رقم الطلب: {payment.orderNumber}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-brand-primary-900">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-secondary-400 text-brand-primary-900">
                    {getPaymentMethodLabel(payment.paymentMethod)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary footer */}
      <div className="mt-6 pt-6 border-t border-brand-offwhite-300">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-brand-offwhite-700">إجمالي الدفعات</span>
          <span className="text-lg font-bold text-brand-primary-900">
            {paymentHistory.length} دفعة
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryTimeline;
