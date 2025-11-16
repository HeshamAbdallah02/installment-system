import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
// import type { PaymentDetails } from '../../types/payment';
import { getPaymentDetails, getReceiptData } from '../../services/paymentService';
import ReceiptTemplate from './ReceiptTemplate';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  paymentId: number | null;
  onClose: () => void;
  onPrint?: (paymentId: number) => void;
}

/**
 * PaymentDetailsModal Component
 * Displays complete payment information including customer, installment, collector, and reversal details
 * Requirements: 6.7, 7.6, 7.7
 */
const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  paymentId,
  onClose,
  onPrint,
}) => {
  const [showReceipt, setShowReceipt] = React.useState(false);

  // Fetch payment details
  const {
    data: paymentDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['paymentDetails', paymentId],
    queryFn: () => getPaymentDetails(paymentId!),
    enabled: isOpen && !!paymentId,
  });

  // Fetch receipt data when showing receipt
  const { data: receiptData } = useQuery({
    queryKey: ['receipt', paymentId],
    queryFn: () => getReceiptData(paymentId!),
    enabled: !!paymentId && showReceipt,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const formatDateTime = (date: Date | string) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand-primary-900 text-white">
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
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${badge.className}`}
      >
        {badge.label}
      </span>
    );
  };

  const handlePrint = () => {
    if (paymentId) {
      if (onPrint) {
        onPrint(paymentId);
      } else {
        setShowReceipt(true);
      }
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
  };

  if (!isOpen || !paymentId) return null;

  // Show receipt
  if (showReceipt && receiptData) {
    return <ReceiptTemplate receipt={receiptData} onClose={handleCloseReceipt} />;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-brand-primary-900 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div>
            <h2 className="text-xl font-bold text-white">تفاصيل الدفع</h2>
            {paymentDetails && (
              <p className="text-brand-secondary-200 text-sm mt-1 direction-ltr text-right">
                {paymentDetails.paymentNumber}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-brand-secondary-200 transition-colors"
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-900"></div>
              <p className="mt-2 text-brand-offwhite-700">جاري التحميل...</p>
            </div>
          )}

          {error && (
            <div className="py-12 text-center">
              <p className="text-brand-primary-900 font-medium">حدث خطأ أثناء تحميل التفاصيل</p>
              <p className="text-sm text-brand-offwhite-700 mt-2">يرجى المحاولة مرة أخرى</p>
            </div>
          )}

          {paymentDetails && (
            <div className="space-y-6">
              {/* Payment Status */}
              <div className="flex items-center justify-between pb-4 border-b border-brand-offwhite-300">
                <div>
                  <p className="text-sm text-brand-offwhite-700 mb-1">حالة الدفع</p>
                  {getStatusBadge(paymentDetails.status, paymentDetails.isReversal)}
                </div>
                <div className="text-left">
                  <p className="text-sm text-brand-offwhite-700 mb-1">المبلغ</p>
                  <p className="text-2xl font-bold text-brand-primary-900">
                    {formatCurrency(paymentDetails.amount)}
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-bold text-brand-primary-900 mb-4">معلومات الدفع</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                    <p className="text-sm text-brand-offwhite-700 mb-1">تاريخ الدفع</p>
                    <p className="text-brand-primary-900 font-medium">
                      {formatDate(paymentDetails.paymentDate)}
                    </p>
                  </div>
                  <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                    <p className="text-sm text-brand-offwhite-700 mb-1">طريقة الدفع</p>
                    <p className="text-brand-primary-900 font-medium">
                      {getPaymentMethodLabel(paymentDetails.paymentMethod)}
                    </p>
                  </div>

                  {paymentDetails.referenceNumber && (
                    <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                      <p className="text-sm text-brand-offwhite-700 mb-1">رقم المرجع</p>
                      <p className="text-brand-primary-900 font-medium direction-ltr text-right">
                        {paymentDetails.referenceNumber}
                      </p>
                    </div>
                  )}

                  {paymentDetails.checkNumber && (
                    <>
                      <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                        <p className="text-sm text-brand-offwhite-700 mb-1">رقم الشيك</p>
                        <p className="text-brand-primary-900 font-medium direction-ltr text-right">
                          {paymentDetails.checkNumber}
                        </p>
                      </div>
                      {paymentDetails.bankName && (
                        <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                          <p className="text-sm text-brand-offwhite-700 mb-1">اسم البنك</p>
                          <p className="text-brand-primary-900 font-medium">
                            {paymentDetails.bankName}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {paymentDetails.notes && (
                  <div className="mt-4 bg-brand-offwhite-50 p-4 rounded-lg">
                    <p className="text-sm text-brand-offwhite-700 mb-1">ملاحظات</p>
                    <p className="text-brand-primary-900">{paymentDetails.notes}</p>
                  </div>
                )}
              </div>

              {/* Customer Details */}
              <div>
                <h3 className="text-lg font-bold text-brand-primary-900 mb-4">بيانات العميل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                    <p className="text-sm text-brand-offwhite-700 mb-1">الاسم</p>
                    <p className="text-brand-primary-900 font-medium">
                      {paymentDetails.customer.name}
                    </p>
                  </div>
                  <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                    <p className="text-sm text-brand-offwhite-700 mb-1">الرقم القومي</p>
                    <p className="text-brand-primary-900 font-medium direction-ltr text-right">
                      {paymentDetails.customer.nationalId}
                    </p>
                  </div>
                  <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                    <p className="text-sm text-brand-offwhite-700 mb-1">رقم الهاتف</p>
                    <p className="text-brand-primary-900 font-medium direction-ltr text-right">
                      {paymentDetails.customer.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Installment Reference */}
              <div>
                <h3 className="text-lg font-bold text-brand-primary-900 mb-4">بيانات القسط</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                    <p className="text-sm text-brand-offwhite-700 mb-1">المنتج</p>
                    <p className="text-brand-primary-900 font-medium">
                      {paymentDetails.installment.productName}
                    </p>
                  </div>
                  <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                    <p className="text-sm text-brand-offwhite-700 mb-1">رقم القسط</p>
                    <p className="text-brand-primary-900 font-medium">
                      {paymentDetails.installment.installmentNumber} من{' '}
                      {paymentDetails.installment.totalInstallments}
                    </p>
                  </div>
                  <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                    <p className="text-sm text-brand-offwhite-700 mb-1">رقم الطلب</p>
                    <p className="text-brand-primary-900 font-medium direction-ltr text-right">
                      #{paymentDetails.installment.orderId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Collector Information */}
              <div>
                <h3 className="text-lg font-bold text-brand-primary-900 mb-4">بيانات المحصل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                    <p className="text-sm text-brand-offwhite-700 mb-1">اسم المحصل</p>
                    <p className="text-brand-primary-900 font-medium">
                      {paymentDetails.collector.name}
                    </p>
                  </div>
                  <div className="bg-brand-offwhite-50 p-4 rounded-lg">
                    <p className="text-sm text-brand-offwhite-700 mb-1">الفرع</p>
                    <p className="text-brand-primary-900 font-medium">
                      {paymentDetails.collector.branchName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reversal Information */}
              {(paymentDetails.isReversal || paymentDetails.status === 'REVERSED') && (
                <div className="bg-brand-primary-50 border-2 border-brand-primary-900 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-brand-primary-900 mb-4 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-brand-primary-900 rounded-full"></span>
                    معلومات العكس
                  </h3>
                  <div className="space-y-3">
                    {paymentDetails.reversalReason && (
                      <div>
                        <p className="text-sm text-brand-offwhite-700 mb-1">سبب العكس</p>
                        <p className="text-brand-primary-900 font-medium">
                          {paymentDetails.reversalReason}
                        </p>
                      </div>
                    )}
                    {paymentDetails.reversedAt && (
                      <div>
                        <p className="text-sm text-brand-offwhite-700 mb-1">تاريخ العكس</p>
                        <p className="text-brand-primary-900 font-medium">
                          {formatDateTime(paymentDetails.reversedAt)}
                        </p>
                      </div>
                    )}
                    {paymentDetails.reversedBy && (
                      <div>
                        <p className="text-sm text-brand-offwhite-700 mb-1">تم العكس بواسطة</p>
                        <p className="text-brand-primary-900 font-medium">
                          {paymentDetails.reversedBy}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {paymentDetails && (
          <div className="sticky bottom-0 bg-brand-offwhite-50 px-6 py-4 border-t border-brand-offwhite-300 flex gap-3 rounded-b-xl">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors"
            >
              <PrinterIcon className="w-5 h-5" />
              طباعة الإيصال
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-brand-offwhite-400 hover:bg-white text-brand-primary-900 font-bold rounded-lg transition-colors"
            >
              إغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
