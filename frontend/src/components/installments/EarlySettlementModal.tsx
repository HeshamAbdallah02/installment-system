import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import apiClient from '../../services/api';

interface EarlySettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  installmentId: number;
  remainingBalance: number;
  remainingPrincipal: number;
  remainingInterest: number;
}

interface SettlementFormData {
  discountPercentage: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
  paymentDate: Date;
  referenceNumber?: string;
  checkNumber?: string;
  bankName?: string;
  approvedBy?: string;
}

interface SettlementCalculation {
  remainingPrincipal: number;
  remainingInterest: number;
  totalBeforeDiscount: number;
  discountPercentage: number;
  discountAmount: number;
  finalSettlementAmount: number;
}

/**
 * EarlySettlementModal Component
 * Modal for processing early settlement of installment plans
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9
 */
const EarlySettlementModal: React.FC<EarlySettlementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  installmentId,
  remainingBalance,
  remainingPrincipal,
  remainingInterest,
}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SettlementFormData>({
    defaultValues: {
      discountPercentage: 0,
      paymentMethod: 'CASH',
      paymentDate: new Date(),
      referenceNumber: '',
      checkNumber: '',
      bankName: '',
      approvedBy: '',
    },
  });

  const discountPercentage = watch('discountPercentage') || 0;
  const paymentMethod = watch('paymentMethod');

  // Calculate settlement amounts
  const calculation: SettlementCalculation = {
    remainingPrincipal,
    remainingInterest,
    totalBeforeDiscount: remainingBalance,
    discountPercentage,
    discountAmount: (remainingBalance * discountPercentage) / 100,
    finalSettlementAmount: remainingBalance - (remainingBalance * discountPercentage) / 100,
  };

  const requiresManagerApproval = discountPercentage > 0;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        discountPercentage: 0,
        paymentMethod: 'CASH',
        paymentDate: new Date(),
        referenceNumber: '',
        checkNumber: '',
        bankName: '',
        approvedBy: '',
      });
    }
  }, [isOpen, reset]);

  // Process settlement mutation
  const processSettlementMutation = useMutation({
    mutationFn: async (data: SettlementFormData) => {
      const response = await apiClient.post(`/api/installments/${installmentId}/early-settlement`, {
        discountPercentage: data.discountPercentage,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        approvedBy: data.approvedBy ? parseInt(data.approvedBy) : undefined,
        referenceNumber: data.referenceNumber,
        checkNumber: data.checkNumber,
        bankName: data.bankName,
      });
      return response.data;
    },
    onSuccess: () => {
      showSuccess('تم التسوية المبكرة بنجاح');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['installmentDetail', installmentId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });

      if (onSuccess) {
        onSuccess();
      }

      handleClose();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error?.message || 'حدث خطأ أثناء معالجة التسوية المبكرة';
      showError(errorMessage);
      console.error('Early settlement error:', error);
    },
  });

  const onSubmit = (data: SettlementFormData) => {
    if (data.discountPercentage < 0 || data.discountPercentage > 100) {
      showError('نسبة الخصم يجب أن تكون بين 0 و 100');
      return;
    }

    if (requiresManagerApproval && !data.approvedBy) {
      showError('يتطلب موافقة المدير للخصم');
      return;
    }

    if (processSettlementMutation.isPending) {
      showError('جاري معالجة التسوية. يرجى الانتظار');
      return;
    }

    processSettlementMutation.mutate(data);
  };

  const handleClose = () => {
    if (!processSettlementMutation.isPending) {
      reset();
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

  if (!isOpen) return null;

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
          <h2 className="text-xl font-bold text-white">تسوية مبكرة</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-white hover:text-brand-secondary-200 transition-colors"
            aria-label="إغلاق"
            disabled={processSettlementMutation.isPending}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Settlement Calculation Breakdown */}
          <div className="bg-brand-offwhite-100 border-2 border-brand-offwhite-400 rounded-lg p-5">
            <h3 className="text-lg font-bold text-brand-primary-900 mb-4">تفاصيل التسوية</h3>
            <div className="space-y-3">
              {/* Remaining Principal */}
              <div className="flex justify-between items-center py-2 border-b border-brand-offwhite-300">
                <span className="text-brand-offwhite-700 font-medium">المبلغ الأصلي المتبقي:</span>
                <span className="text-brand-primary-900 font-bold text-lg">
                  {formatCurrency(calculation.remainingPrincipal)} ج.م
                </span>
              </div>

              {/* Remaining Interest */}
              <div className="flex justify-between items-center py-2 border-b border-brand-offwhite-300">
                <span className="text-brand-offwhite-700 font-medium">الفائدة المتبقية:</span>
                <span className="text-brand-primary-900 font-bold text-lg">
                  {formatCurrency(calculation.remainingInterest)} ج.م
                </span>
              </div>

              {/* Total Before Discount */}
              <div className="flex justify-between items-center py-2 border-b-2 border-brand-primary-900">
                <span className="text-brand-primary-900 font-bold">الإجمالي قبل الخصم:</span>
                <span className="text-brand-primary-900 font-bold text-xl">
                  {formatCurrency(calculation.totalBeforeDiscount)} ج.م
                </span>
              </div>

              {/* Discount Amount */}
              {calculation.discountAmount > 0 && (
                <div className="flex justify-between items-center py-2 bg-brand-secondary-50 px-3 rounded">
                  <span className="text-brand-secondary-900 font-medium">
                    الخصم ({calculation.discountPercentage}%):
                  </span>
                  <span className="text-brand-secondary-900 font-bold text-lg">
                    - {formatCurrency(calculation.discountAmount)} ج.م
                  </span>
                </div>
              )}

              {/* Final Settlement Amount */}
              <div className="flex justify-between items-center py-3 bg-brand-primary-900 px-4 rounded-lg mt-3">
                <span className="text-white font-bold text-lg">المبلغ النهائي للتسوية:</span>
                <span className="text-brand-secondary-400 font-bold text-2xl">
                  {formatCurrency(calculation.finalSettlementAmount)} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Discount Percentage Input */}
          <div>
            <label
              htmlFor="discountPercentage"
              className="block text-sm font-semibold text-brand-primary-900 mb-2"
            >
              نسبة الخصم (%)
            </label>
            <input
              id="discountPercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('discountPercentage', {
                min: { value: 0, message: 'نسبة الخصم لا يمكن أن تكون سالبة' },
                max: { value: 100, message: 'نسبة الخصم لا يمكن أن تتجاوز 100%' },
              })}
              className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900 font-bold text-lg"
              placeholder="0.00"
            />
            {errors.discountPercentage && (
              <p className="mt-1 text-sm text-brand-primary-900">
                {errors.discountPercentage.message}
              </p>
            )}
            <p className="mt-2 text-sm text-brand-offwhite-700">
              أدخل 0 للتسوية بدون خصم، أو نسبة الخصم المطلوبة
            </p>
          </div>

          {/* Manager Approval Required Notice */}
          {requiresManagerApproval && (
            <div className="bg-brand-secondary-50 border-2 border-brand-secondary-400 rounded-lg p-4 flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-brand-secondary-900 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-primary-900 mb-2">
                  ⚠️ يتطلب موافقة المدير
                </p>
                <p className="text-sm text-brand-offwhite-700 mb-3">
                  التسوية بخصم تتطلب موافقة المدير. يرجى إدخال معرف المدير الموافق.
                </p>
                <div>
                  <label
                    htmlFor="approvedBy"
                    className="block text-sm font-semibold text-brand-primary-900 mb-2"
                  >
                    معرف المدير الموافق
                  </label>
                  <input
                    id="approvedBy"
                    type="number"
                    {...register('approvedBy', {
                      required: requiresManagerApproval ? 'معرف المدير مطلوب للخصم' : false,
                    })}
                    className="w-full px-4 py-2 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900"
                    placeholder="أدخل معرف المدير"
                  />
                  {errors.approvedBy && (
                    <p className="mt-1 text-sm text-brand-primary-900">
                      {errors.approvedBy.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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
                {paymentMethod === 'CASH' && (
                  <CheckCircleIcon className="w-5 h-5 text-brand-primary-900" />
                )}
              </label>

              <label className="relative flex items-center p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  value="BANK_TRANSFER"
                  {...register('paymentMethod', { required: true })}
                  className="sr-only"
                />
                <span className="flex-1 text-brand-primary-900 font-medium">تحويل بنكي</span>
                {paymentMethod === 'BANK_TRANSFER' && (
                  <CheckCircleIcon className="w-5 h-5 text-brand-primary-900" />
                )}
              </label>

              <label className="relative flex items-center p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  value="CARD"
                  {...register('paymentMethod', { required: true })}
                  className="sr-only"
                />
                <span className="flex-1 text-brand-primary-900 font-medium">بطاقة</span>
                {paymentMethod === 'CARD' && (
                  <CheckCircleIcon className="w-5 h-5 text-brand-primary-900" />
                )}
              </label>

              <label className="relative flex items-center p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  value="CHECK"
                  {...register('paymentMethod', { required: true })}
                  className="sr-only"
                />
                <span className="flex-1 text-brand-primary-900 font-medium">شيك</span>
                {paymentMethod === 'CHECK' && (
                  <CheckCircleIcon className="w-5 h-5 text-brand-primary-900" />
                )}
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

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-brand-offwhite-300">
            <button
              type="button"
              onClick={handleClose}
              disabled={processSettlementMutation.isPending}
              className="flex-1 px-6 py-3 border-2 border-brand-offwhite-400 hover:bg-brand-offwhite-100 text-brand-primary-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={processSettlementMutation.isPending}
              className="flex-1 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processSettlementMutation.isPending ? (
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
                  جاري المعالجة...
                </>
              ) : (
                'تأكيد التسوية'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EarlySettlementModal;
