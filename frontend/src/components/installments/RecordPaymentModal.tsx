import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { PaymentFormData } from '../../types/payment';
import { recordPayment } from '../../services/paymentService';
import { useToast } from '../../hooks/useToast';
import type { ScheduleItem } from './NextPaymentDueCard';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  installmentId: number;
  pendingPayments: ScheduleItem[];
  preSelectedScheduleId?: number;
}

/**
 * RecordPaymentModal Component
 * Modal for recording payments from installment detail page
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */
const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  installmentId,
  pendingPayments,
  preSelectedScheduleId,
}) => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    preSelectedScheduleId || null
  );
  const queryClient = useQueryClient();
  const { showSuccess: showSuccessToast, showError } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    defaultValues: {
      amount: 0,
      paymentMethod: 'CASH',
      paymentDate: new Date(),
      notes: '',
    },
  });

  const paymentMethod = watch('paymentMethod');
  const amount = watch('amount');

  // Get selected payment details
  const selectedPayment = pendingPayments.find((p) => p.id === selectedScheduleId);
  const currentAmountDue = selectedPayment?.totalAmount || 0;
  const isPartialPayment = amount > 0 && amount < currentAmountDue;
  const remainingBalance = currentAmountDue - amount;

  // Update amount when payment is selected
  useEffect(() => {
    if (selectedPayment) {
      setValue('amount', selectedPayment.totalAmount);
    }
  }, [selectedPayment, setValue]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialScheduleId = preSelectedScheduleId || pendingPayments[0]?.id || null;
      setSelectedScheduleId(initialScheduleId);

      const initialPayment = pendingPayments.find((p) => p.id === initialScheduleId);
      reset({
        amount: initialPayment?.totalAmount || 0,
        paymentMethod: 'CASH',
        paymentDate: new Date(),
        notes: '',
        referenceNumber: '',
        checkNumber: '',
        bankName: '',
      });
    }
  }, [isOpen, preSelectedScheduleId, pendingPayments, reset, setValue]);

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) => {
      if (!selectedScheduleId) throw new Error('No payment selected');
      return recordPayment(selectedScheduleId, data);
    },
    onSuccess: () => {
      showSuccessToast('تم تسجيل الدفع بنجاح');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['installmentDetail', installmentId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });

      if (onSuccess) {
        onSuccess();
      }

      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدفع';
      showError(errorMessage);
      console.error('Payment recording error:', error);
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    if (!selectedScheduleId) {
      showError('يرجى اختيار دفعة');
      return;
    }

    if (data.amount <= 0) {
      showError('المبلغ يجب أن يكون أكبر من صفر');
      return;
    }

    if (data.amount > currentAmountDue) {
      showError('المبلغ يتجاوز المستحق');
      return;
    }

    if (recordPaymentMutation.isPending) {
      showError('جاري معالجة الدفع. يرجى الانتظار');
      return;
    }

    recordPaymentMutation.mutate(data);
  };

  const handleClose = () => {
    if (!recordPaymentMutation.isPending) {
      reset();
      setSelectedScheduleId(null);
      onClose();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  if (!isOpen) return null;

  return (
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
        <div className="sticky top-0 bg-brand-primary-900 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-white">تسجيل دفعة</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-white hover:text-brand-secondary-200 transition-colors"
            aria-label="إغلاق"
            disabled={recordPaymentMutation.isPending}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Payment Selector */}
          <div>
            <label
              htmlFor="scheduleId"
              className="block text-sm font-semibold text-brand-primary-900 mb-3"
            >
              اختر الدفعة
            </label>
            <select
              id="scheduleId"
              value={selectedScheduleId || ''}
              onChange={(e) => setSelectedScheduleId(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900 font-medium"
            >
              <option value="">اختر دفعة...</option>
              {pendingPayments.map((payment) => (
                <option key={payment.id} value={payment.id}>
                  القسط {payment.sequenceNumber} - {formatDate(payment.dueDate)} -{' '}
                  {formatCurrency(payment.totalAmount)} ج.م
                  {payment.status === 'OVERDUE' && ' (متأخر)'}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-semibold text-brand-primary-900 mb-2"
            >
              المبلغ المستحق
            </label>
            <div className="relative">
              <input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount', {
                  required: 'المبلغ مطلوب',
                  min: { value: 0.01, message: 'المبلغ يجب أن يكون أكبر من صفر' },
                  max: { value: currentAmountDue, message: 'المبلغ يتجاوز المستحق' },
                })}
                disabled={!selectedScheduleId}
                className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900 font-bold text-lg disabled:bg-brand-offwhite-100 disabled:cursor-not-allowed"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-offwhite-700">
                ج.م
              </span>
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-brand-primary-900">{errors.amount.message}</p>
            )}

            {/* Partial Payment Warning */}
            {isPartialPayment && (
              <div className="mt-3 p-3 bg-brand-secondary-50 border-2 border-brand-secondary-400 rounded-lg flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-brand-secondary-900 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-brand-primary-900">⚠️ دفعة جزئية</p>
                  <p className="text-sm text-brand-offwhite-700 mt-1">
                    المتبقي: {formatCurrency(remainingBalance)} ج.م
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-sm font-semibold text-brand-primary-900 mb-3">
              طريقة الدفع
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
              disabled={recordPaymentMutation.isPending}
              className="flex-1 px-6 py-3 border-2 border-brand-offwhite-400 hover:bg-brand-offwhite-100 text-brand-primary-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending || !selectedScheduleId}
              className="flex-1 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {recordPaymentMutation.isPending ? (
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
                'تأكيد الدفع'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
