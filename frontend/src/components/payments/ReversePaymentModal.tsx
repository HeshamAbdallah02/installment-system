import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import ToastNotification from '../ToastNotification';
import type { PaymentRecord } from '../../types/payment';

interface ReversePaymentModalProps {
  isOpen: boolean;
  payment: PaymentRecord | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * ReversePaymentModal Component
 * Allows reversing a payment with reason and confirmation
 * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.9
 */
const ReversePaymentModal: React.FC<ReversePaymentModalProps> = ({
  isOpen,
  payment,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const queryClient = useQueryClient();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setReason('');
      setConfirmed(false);
    }
  }, [isOpen]);

  // Reverse payment mutation
  const reversePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: number; reason: string }) => {
      const response = await fetch(`/api/payments/${paymentId}/reverse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'فشل عكس الدفع');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
      queryClient.invalidateQueries({ queryKey: ['paymentDetails'] });
      queryClient.invalidateQueries({ queryKey: ['todaysDues'] });
      queryClient.invalidateQueries({ queryKey: ['overdueDues'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });

      // Show success message
      showSuccess('تم عكس الدفع بنجاح');

      // Reset form
      setReason('');
      setConfirmed(false);

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    },
    onError: (error: Error) => {
      showError(error.message || 'حدث خطأ أثناء عكس الدفع');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!payment) return;

    // Validate reason
    if (!reason.trim()) {
      showError('سبب العكس مطلوب');
      return;
    }

    // Validate confirmation
    if (!confirmed) {
      showError('يرجى تأكيد عكس الدفع');
      return;
    }

    // Submit reversal
    reversePaymentMutation.mutate({
      paymentId: payment.id,
      reason: reason.trim(),
    });
  };

  const handleClose = () => {
    if (reversePaymentMutation.isPending) return;
    setReason('');
    setConfirmed(false);
    onClose();
  };

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

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: 'نقدي',
      BANK_TRANSFER: 'تحويل بنكي',
      CARD: 'بطاقة',
      CHECK: 'شيك',
    };
    return labels[method] || method;
  };

  if (!isOpen || !payment) return null;

  return (
    <>
      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        dir="rtl"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-brand-primary-900 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-brand-secondary-400" />
              <h2 className="text-xl font-bold text-white">عكس الدفع</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={reversePaymentMutation.isPending}
              className="text-white hover:text-brand-secondary-200 transition-colors disabled:opacity-50"
              aria-label="إغلاق"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Warning Message */}
            <div className="mb-6 bg-brand-secondary-50 border-2 border-brand-secondary-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-brand-primary-900 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-brand-primary-900 mb-1">تحذير</h3>
                  <p className="text-sm text-brand-offwhite-900">
                    عكس الدفع سيقوم بإلغاء هذه العملية وإعادة حالة القسط إلى ما كانت عليه قبل الدفع.
                    هذا الإجراء سيتم تسجيله في سجل الأحداث ولا يمكن التراجع عنه.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-brand-primary-900 mb-4">ملخص الدفع</h3>
              <div className="bg-brand-offwhite-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-offwhite-700">رقم الإيصال</span>
                  <span className="font-medium text-brand-primary-900 direction-ltr">
                    {payment.paymentNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-offwhite-700">العميل</span>
                  <span className="font-medium text-brand-primary-900">{payment.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-offwhite-700">المبلغ</span>
                  <span className="font-bold text-xl text-brand-primary-900">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-offwhite-700">طريقة الدفع</span>
                  <span className="font-medium text-brand-primary-900">
                    {getPaymentMethodLabel(payment.paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-offwhite-700">تاريخ الدفع</span>
                  <span className="font-medium text-brand-primary-900">
                    {formatDate(payment.paymentDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-offwhite-700">المحصل</span>
                  <span className="font-medium text-brand-primary-900">
                    {payment.collectorName}
                  </span>
                </div>
                {payment.productName && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-brand-offwhite-700">المنتج</span>
                    <span className="font-medium text-brand-primary-900">
                      {payment.productName}
                    </span>
                  </div>
                )}
                {payment.installmentNumber && payment.totalInstallments && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-brand-offwhite-700">القسط</span>
                    <span className="font-medium text-brand-primary-900">
                      {payment.installmentNumber} من {payment.totalInstallments}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Reversal Reason */}
            <div className="mb-6">
              <label
                htmlFor="reason"
                className="block text-sm font-bold text-brand-primary-900 mb-2"
              >
                سبب العكس <span className="text-brand-primary-900">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="يرجى توضيح سبب عكس هذا الدفع..."
                rows={4}
                disabled={reversePaymentMutation.isPending}
                className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 disabled:bg-brand-offwhite-100 disabled:cursor-not-allowed resize-none"
                required
              />
              <p className="mt-2 text-xs text-brand-offwhite-700">
                سيتم حفظ السبب في سجل الأحداث ويمكن الاطلاع عليه لاحقاً
              </p>
            </div>

            {/* Confirmation Checkbox */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={reversePaymentMutation.isPending}
                  className="mt-1 w-5 h-5 text-brand-primary-900 border-2 border-brand-offwhite-400 rounded focus:ring-2 focus:ring-brand-primary-900 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-brand-offwhite-900">
                  أؤكد أنني أرغب في عكس هذا الدفع وأدرك أن هذا الإجراء سيتم تسجيله في سجل الأحداث
                </span>
              </label>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={reversePaymentMutation.isPending}
                className="flex-1 px-6 py-3 min-h-[44px] border-2 border-brand-offwhite-400 hover:bg-brand-offwhite-50 text-brand-primary-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={reversePaymentMutation.isPending || !reason.trim() || !confirmed}
                className="flex-1 px-6 py-3 min-h-[44px] bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {reversePaymentMutation.isPending ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>جاري العكس...</span>
                  </>
                ) : (
                  'تأكيد العكس'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ReversePaymentModal;
