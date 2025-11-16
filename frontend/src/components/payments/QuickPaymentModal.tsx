import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { XMarkIcon, CheckCircleIcon, PrinterIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { TodaysDue, OverdueDue, PaymentFormData } from '../../types/payment';
import {
  recordPayment,
  recordAdvancePayment,
  getReceiptData,
  getUpcomingInstallments,
} from '../../services/paymentService';
import { useToast } from '../../hooks/useToast';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import ReceiptTemplate from './ReceiptTemplate';
import { validatePaymentForm } from '../../utils/paymentValidation';
import { getPaymentErrorMessage, isDuplicateSubmissionError } from '../../utils/apiErrorHandler';
// import LoadingSpinner from '../LoadingSpinner';

interface QuickPaymentModalProps {
  isOpen: boolean;
  duePayment: TodaysDue | OverdueDue | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * QuickPaymentModal Component
 * Modal for quick payment recording with minimal steps
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1-4.6
 */
const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  isOpen,
  duePayment,
  onClose,
  onSuccess,
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isAdvancePayment, setIsAdvancePayment] = useState(false);
  const [selectedFutureInstallment, setSelectedFutureInstallment] = useState<number | null>(null);
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
      amount: duePayment?.amountDue || 0,
      paymentMethod: 'CASH',
      paymentDate: new Date(),
      notes: '',
    },
  });

  const paymentMethod = watch('paymentMethod');
  const amount = watch('amount');

  // Fetch upcoming installments for advance payment option
  const { data: upcomingInstallments } = useQuery({
    queryKey: ['upcomingInstallments', duePayment?.customerId],
    queryFn: () => getUpcomingInstallments(duePayment!.customerId),
    enabled: isOpen && !!duePayment && isAdvancePayment,
  });

  // Fetch receipt data when payment is successful
  const { data: receiptData } = useQuery({
    queryKey: ['receipt', paymentId],
    queryFn: () => getReceiptData(paymentId!),
    enabled: !!paymentId && showReceipt,
  });

  // Define handlers before using them in hooks
  const handleClose = () => {
    if (!recordPaymentMutation.isPending) {
      reset();
      setShowSuccess(false);
      setPaymentId(null);
      setShowReceipt(false);
      setIsAdvancePayment(false);
      setSelectedFutureInstallment(null);
      onClose();
    }
  };

  const handlePrintReceipt = () => {
    if (paymentId) {
      setShowReceipt(true);
    }
  };

  // Keyboard shortcuts for modal (Requirements: 14.1, 14.2, 14.6)
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'Escape',
        description: 'إغلاق',
        action: handleClose,
      },
      {
        key: 'p',
        ctrl: true,
        description: 'طباعة الإيصال',
        action: () => {
          if (showSuccess && paymentId) {
            handlePrintReceipt();
          }
        },
      },
    ],
    enabled: isOpen,
  });

  // Reset form when modal opens with new payment
  useEffect(() => {
    if (isOpen && duePayment) {
      reset({
        amount: duePayment.amountDue,
        paymentMethod: 'CASH',
        paymentDate: new Date(),
        notes: '',
        referenceNumber: '',
        checkNumber: '',
        bankName: '',
      });
      setShowSuccess(false);
      setPaymentId(null);
      setShowReceipt(false);
      setIsAdvancePayment(false);
      setSelectedFutureInstallment(null);
    }
  }, [isOpen, duePayment, reset]);

  // Update amount when advance payment installment is selected
  useEffect(() => {
    if (isAdvancePayment && selectedFutureInstallment && upcomingInstallments) {
      const installment = upcomingInstallments.installments.find(
        (inst) => inst.scheduleId === selectedFutureInstallment
      );
      if (installment) {
        setValue('amount', installment.amountDue);
      }
    } else if (!isAdvancePayment && duePayment) {
      setValue('amount', duePayment.amountDue);
    }
  }, [isAdvancePayment, selectedFutureInstallment, upcomingInstallments, duePayment, setValue]);

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) => {
      if (!duePayment) throw new Error('No payment selected');

      // Use advance payment endpoint if advance payment is selected
      if (isAdvancePayment && selectedFutureInstallment) {
        return recordAdvancePayment(selectedFutureInstallment, data);
      }

      return recordPayment(duePayment.scheduleId, data);
    },
    onSuccess: (payment) => {
      setPaymentId(payment.id);
      setShowSuccess(true);
      showSuccessToast(isAdvancePayment ? 'تم تسجيل الدفعة المقدمة بنجاح' : 'تم تسجيل الدفع بنجاح');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['todaysDues'] });
      queryClient.invalidateQueries({ queryKey: ['overdueDues'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingInstallments'] });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: unknown) => {
      // Use enhanced error handling
      const errorMessage = getPaymentErrorMessage(error);

      // Show specific message for duplicate submissions
      if (isDuplicateSubmissionError(error)) {
        showError('تم إرسال هذا الطلب بالفعل. يرجى الانتظار قليلاً');
      } else {
        showError(errorMessage);
      }

      // Log error for debugging
      console.error('Payment recording error:', error);
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    // Validate advance payment selection
    if (isAdvancePayment && !selectedFutureInstallment) {
      showError('يرجى اختيار قسط مستقبلي');
      return;
    }

    // Validate payment form data
    const validationErrors = validatePaymentForm({
      amount: data.amount,
      remainingAmount: currentAmountDue,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      checkNumber: data.checkNumber,
      bankName: data.bankName,
      paymentDate: data.paymentDate,
    });

    // Show validation errors
    if (validationErrors.length > 0) {
      showError(validationErrors[0].message);
      return;
    }

    // Prevent duplicate submissions by disabling button
    if (recordPaymentMutation.isPending) {
      showError('جاري معالجة الدفع. يرجى الانتظار');
      return;
    }

    recordPaymentMutation.mutate(data);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
  };

  const handleSendWhatsApp = () => {
    if (duePayment && paymentId) {
      const message = `تم استلام دفعة بمبلغ ${amount} ج.م للقسط رقم ${duePayment.installmentNumber}`;
      const phone = duePayment.phone.replace(/[^0-9]/g, '');
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

  // Calculate partial payment based on current context
  const getCurrentAmountDue = () => {
    if (isAdvancePayment && selectedFutureInstallment && upcomingInstallments) {
      const installment = upcomingInstallments.installments.find(
        (inst) => inst.scheduleId === selectedFutureInstallment
      );
      return installment?.amountDue || 0;
    }
    return duePayment?.amountDue || 0;
  };

  const currentAmountDue = getCurrentAmountDue();
  const isPartialPayment = amount < currentAmountDue;
  const remainingBalance = currentAmountDue - amount;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  if (!isOpen || !duePayment) return null;

  // Show receipt
  if (showReceipt && receiptData) {
    return <ReceiptTemplate receipt={receiptData} onClose={handleCloseReceipt} />;
  }

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
            تم تسجيل الدفع بنجاح
          </h3>
          <p className="text-brand-offwhite-700 text-center mb-6">
            تم تسجيل دفعة بمبلغ {formatCurrency(amount)}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors"
            >
              <PrinterIcon className="w-5 h-5" />
              طباعة الإيصال (Ctrl+P)
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
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-brand-primary-900 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-white">دفع سريع - {duePayment.customerName}</h2>
            <p className="text-brand-secondary-200 text-sm mt-1">
              القسط: {duePayment.installmentNumber} من {duePayment.totalInstallments} • المنتج:{' '}
              {duePayment.productName}
            </p>
          </div>
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
          {/* Advance Payment Toggle */}
          <div className="bg-brand-secondary-50 border-2 border-brand-secondary-400 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdvancePayment}
                onChange={(e) => {
                  setIsAdvancePayment(e.target.checked);
                  setSelectedFutureInstallment(null);
                }}
                className="w-5 h-5 rounded border-brand-offwhite-400 text-brand-primary-900 focus:ring-brand-primary-900"
              />
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-brand-primary-900" />
                <span className="text-sm font-semibold text-brand-primary-900">
                  دفعة مقدمة (دفع قسط مستقبلي)
                </span>
              </div>
            </label>
          </div>

          {/* Upcoming Installments Selection */}
          {isAdvancePayment && (
            <div>
              <label className="block text-sm font-semibold text-brand-primary-900 mb-3">
                اختر القسط المستقبلي
              </label>
              {upcomingInstallments && upcomingInstallments.installments.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {upcomingInstallments.installments.map((installment) => (
                    <label
                      key={installment.scheduleId}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedFutureInstallment === installment.scheduleId
                          ? 'border-brand-primary-900 bg-brand-secondary-50'
                          : 'border-brand-offwhite-400 hover:bg-brand-offwhite-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="futureInstallment"
                        value={installment.scheduleId}
                        checked={selectedFutureInstallment === installment.scheduleId}
                        onChange={() => setSelectedFutureInstallment(installment.scheduleId)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-brand-primary-900">
                            القسط {installment.installmentNumber} من {installment.totalInstallments}
                          </span>
                          <span className="px-2 py-0.5 bg-brand-secondary-400 text-brand-primary-900 text-xs font-semibold rounded">
                            مقدم
                          </span>
                        </div>
                        <p className="text-xs text-brand-offwhite-700">
                          تاريخ الاستحقاق: {formatDate(installment.dueDate)}
                        </p>
                        <p className="text-xs text-brand-offwhite-700">{installment.productName}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-brand-primary-900">
                          {formatCurrency(installment.amountDue)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-brand-offwhite-50 rounded-lg border border-brand-offwhite-300">
                  <p className="text-sm text-brand-offwhite-700">لا توجد أقساط مستقبلية متاحة</p>
                </div>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-semibold text-brand-primary-900 mb-2"
            >
              {isAdvancePayment ? 'المبلغ المستحق للقسط المحدد' : 'المبلغ المستحق'}
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
                disabled={isAdvancePayment && !selectedFutureInstallment}
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
              <div className="mt-3 p-3 bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg">
                <p className="text-sm font-semibold text-brand-primary-900">
                  ⚠️ دفعة جزئية - المتبقي: {formatCurrency(remainingBalance)}
                </p>
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
                <span className="w-5 h-5 border-2 border-brand-offwhite-400 rounded-full flex items-center justify-center peer-checked:border-brand-primary-900">
                  <span className="w-3 h-3 bg-brand-primary-900 rounded-full hidden peer-checked:block"></span>
                </span>
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
              إلغاء (Esc)
            </button>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending}
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
                'تأكيد الدفع (Enter)'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickPaymentModal;
