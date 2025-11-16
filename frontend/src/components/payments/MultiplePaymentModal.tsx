import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, CheckCircleIcon, PrinterIcon } from '@heroicons/react/24/outline';
import type { TodaysDue, OverdueDue, PaymentFormData } from '../../types/payment';
import { recordMultiplePayments } from '../../services/paymentService';
import { useToast } from '../../hooks/useToast';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface MultiplePaymentModalProps {
  isOpen: boolean;
  selectedDues: TodaysDue[] | OverdueDue[];
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * MultiplePaymentModal Component
 * Modal for recording multiple installment payments for the same customer
 * Requirements: 15.4, 15.5, 15.6, 15.7, 15.9
 */
const MultiplePaymentModal: React.FC<MultiplePaymentModalProps> = ({
  isOpen,
  selectedDues,
  onClose,
  onSuccess,
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentCount, setPaymentCount] = useState(0);
  const queryClient = useQueryClient();
  const { showSuccess: showSuccessToast, showError } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    defaultValues: {
      paymentMethod: 'CASH',
      paymentDate: new Date(),
      notes: '',
    },
  });

  const paymentMethod = watch('paymentMethod');

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return selectedDues.reduce((sum, due) => sum + due.amountDue, 0);
  }, [selectedDues]);

  // Get customer name
  const customerName = selectedDues.length > 0 ? selectedDues[0].customerName : '';
  const customerPhone = selectedDues.length > 0 ? selectedDues[0].phone : '';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && selectedDues.length > 0) {
      reset({
        paymentMethod: 'CASH',
        paymentDate: new Date(),
        notes: '',
        referenceNumber: '',
        checkNumber: '',
        bankName: '',
      });
      setShowSuccess(false);
      setPaymentCount(0);
    }
  }, [isOpen, selectedDues, reset]);

  // Keyboard shortcuts for modal (Requirements: 14.1, 14.2)
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'Escape',
        description: 'إغلاق',
        action: () => {
          if (!recordMultiplePaymentsMutation.isPending) {
            onClose();
          }
        },
      },
    ],
    enabled: isOpen,
  });

  // Record multiple payments mutation
  const recordMultiplePaymentsMutation = useMutation({
    mutationFn: (data: PaymentFormData) => {
      const scheduleIds = selectedDues.map((due) => due.scheduleId);
      return recordMultiplePayments(scheduleIds, data);
    },
    onSuccess: (response) => {
      setPaymentCount(response.count);
      setShowSuccess(true);
      showSuccessToast(`تم تسجيل ${response.count} دفعات بنجاح`);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['todaysDues'] });
      queryClient.invalidateQueries({ queryKey: ['overdueDues'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء تسجيل الدفعات';
      showError(errorMessage);
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    recordMultiplePaymentsMutation.mutate(data);
  };

  const handleClose = () => {
    if (!recordMultiplePaymentsMutation.isPending) {
      reset();
      setShowSuccess(false);
      setPaymentCount(0);
      onClose();
    }
  };

  const handlePrintReceipt = () => {
    // TODO: Implement combined receipt printing
    window.print();
  };

  const handleSendWhatsApp = () => {
    if (selectedDues.length > 0) {
      const message = `تم استلام ${paymentCount} دفعات بإجمالي ${formatCurrency(totalAmount)}`;
      const phone = customerPhone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (!isOpen || selectedDues.length === 0) return null;

  // Success state
  if (showSuccess) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        dir="rtl"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-brand-secondary-100 p-3">
              <CheckCircleIcon className="w-16 h-16 text-brand-secondary-600" />
            </div>
          </div>

          {/* Success Message */}
          <h3 className="text-2xl font-bold text-brand-primary-900 text-center mb-2">
            تم تسجيل الدفعات بنجاح
          </h3>
          <p className="text-brand-offwhite-700 text-center mb-6">
            تم تسجيل {paymentCount} دفعات بإجمالي {formatCurrency(totalAmount)}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors"
            >
              <PrinterIcon className="w-5 h-5" />
              طباعة الإيصال المجمع (Ctrl+P)
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full px-6 py-3 bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 font-bold rounded-lg transition-colors"
            >
              إرسال عبر واتساب
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full px-6 py-3 border-2 border-brand-offwhite-400 hover:bg-brand-offwhite-100 text-brand-primary-900 font-bold rounded-lg transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment form state
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir="rtl"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-brand-primary-900 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-white">دفع متعدد - {customerName}</h2>
            <p className="text-brand-secondary-200 text-sm mt-1">
              {selectedDues.length} أقساط محددة • الإجمالي: {formatCurrency(totalAmount)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white hover:text-brand-secondary-200 transition-colors"
            aria-label="إغلاق"
            disabled={recordMultiplePaymentsMutation.isPending}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Selected Installments List */}
          <div>
            <h3 className="text-sm font-semibold text-brand-primary-900 mb-3">الأقساط المحددة</h3>
            <div className="bg-brand-offwhite-50 rounded-lg border border-brand-offwhite-300 overflow-hidden">
              <table className="w-full">
                <thead className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-brand-primary-900">
                      القسط
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-brand-primary-900">
                      المنتج
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-brand-primary-900">
                      تاريخ الاستحقاق
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-brand-primary-900">
                      المبلغ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-offwhite-200">
                  {selectedDues.map((due) => (
                    <tr key={due.scheduleId} className="hover:bg-brand-offwhite-100">
                      <td className="px-4 py-3 text-sm text-brand-primary-900">
                        {due.installmentNumber} من {due.totalInstallments}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-offwhite-700">
                        {due.productName}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-offwhite-700">
                        {new Date(due.dueDate).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-brand-primary-900">
                        {formatCurrency(due.amountDue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-brand-secondary-50 border-t-2 border-brand-primary-900">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-sm font-bold text-brand-primary-900 text-right"
                    >
                      الإجمالي
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-brand-primary-900">
                      {formatCurrency(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-sm font-semibold text-brand-primary-900 mb-3">
              طريقة الدفع (موحدة لجميع الأقساط)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative flex items-center p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  value="CASH"
                  {...register('paymentMethod', { required: true })}
                  className="sr-only"
                />
                <span className="flex-1 text-brand-primary-900 font-medium">نقدي</span>
              </label>

              <label className="relative flex items-center p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  value="BANK_TRANSFER"
                  {...register('paymentMethod', { required: true })}
                  className="sr-only"
                />
                <span className="flex-1 text-brand-primary-900 font-medium">تحويل بنكي</span>
              </label>

              <label className="relative flex items-center p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  value="CARD"
                  {...register('paymentMethod', { required: true })}
                  className="sr-only"
                />
                <span className="flex-1 text-brand-primary-900 font-medium">بطاقة</span>
              </label>

              <label className="relative flex items-center p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  value="CHECK"
                  {...register('paymentMethod', { required: true })}
                  className="sr-only"
                />
                <span className="flex-1 text-brand-primary-900 font-medium">شيك</span>
              </label>
            </div>
          </div>

          {/* Conditional Fields - Bank Transfer */}
          {paymentMethod === 'BANK_TRANSFER' && (
            <div>
              <label
                htmlFor="referenceNumber"
                className="block text-sm font-semibold text-brand-primary-900 mb-2"
              >
                رقم المرجع
              </label>
              <input
                id="referenceNumber"
                type="text"
                {...register('referenceNumber', {
                  required:
                    paymentMethod === 'BANK_TRANSFER' ? 'رقم المرجع مطلوب للتحويل البنكي' : false,
                })}
                className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900"
                placeholder="أدخل رقم المرجع"
              />
              {errors.referenceNumber && (
                <p className="mt-1 text-sm text-brand-primary-900">
                  {errors.referenceNumber.message}
                </p>
              )}
            </div>
          )}

          {/* Conditional Fields - Check */}
          {paymentMethod === 'CHECK' && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="checkNumber"
                  className="block text-sm font-semibold text-brand-primary-900 mb-2"
                >
                  رقم الشيك
                </label>
                <input
                  id="checkNumber"
                  type="text"
                  {...register('checkNumber', {
                    required: paymentMethod === 'CHECK' ? 'رقم الشيك مطلوب' : false,
                  })}
                  className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900"
                  placeholder="أدخل رقم الشيك"
                />
                {errors.checkNumber && (
                  <p className="mt-1 text-sm text-brand-primary-900">
                    {errors.checkNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="bankName"
                  className="block text-sm font-semibold text-brand-primary-900 mb-2"
                >
                  اسم البنك
                </label>
                <input
                  id="bankName"
                  type="text"
                  {...register('bankName', {
                    required: paymentMethod === 'CHECK' ? 'اسم البنك مطلوب' : false,
                  })}
                  className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900"
                  placeholder="أدخل اسم البنك"
                />
                {errors.bankName && (
                  <p className="mt-1 text-sm text-brand-primary-900">{errors.bankName.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment Date */}
          <div>
            <label
              htmlFor="paymentDate"
              className="block text-sm font-semibold text-brand-primary-900 mb-2"
            >
              تاريخ الدفع
            </label>
            <input
              id="paymentDate"
              type="date"
              {...register('paymentDate', { required: 'تاريخ الدفع مطلوب' })}
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900"
            />
            {errors.paymentDate && (
              <p className="mt-1 text-sm text-brand-primary-900">{errors.paymentDate.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-brand-primary-900 mb-2"
            >
              ملاحظات (اختياري)
            </label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900 resize-none"
              placeholder="أضف ملاحظات إضافية..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-brand-offwhite-300">
            <button
              type="button"
              onClick={handleClose}
              disabled={recordMultiplePaymentsMutation.isPending}
              className="flex-1 px-6 py-3 border-2 border-brand-offwhite-400 hover:bg-brand-offwhite-100 text-brand-primary-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء (Esc)
            </button>
            <button
              type="submit"
              disabled={recordMultiplePaymentsMutation.isPending}
              className="flex-1 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {recordMultiplePaymentsMutation.isPending ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  جاري التسجيل...
                </>
              ) : (
                `تأكيد دفع ${selectedDues.length} أقساط (Enter)`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MultiplePaymentModal;
