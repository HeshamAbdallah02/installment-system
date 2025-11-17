import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import apiClient from '../../services/api';

interface ModifyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  installmentId: number;
  currentTerms: {
    monthlyAmount: number;
    termMonths: number;
    interestRate: number;
  };
  remainingBalance: number;
  completionPercentage: number;
}

interface ModifyTermsFormData {
  monthlyAmount?: number;
  termMonths?: number;
  interestRate?: number;
  reason: string;
  approvedBy: string;
}

interface SchedulePreviewItem {
  sequenceNumber: number;
  dueDate: Date;
  totalAmount: number;
  principalAmount: number;
  extraAmount: number;
}

/**
 * ModifyTermsModal Component
 * Modal for modifying installment terms
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9
 */
const ModifyTermsModal: React.FC<ModifyTermsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  installmentId,
  currentTerms,
  remainingBalance,
  completionPercentage,
}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [schedulePreview, setSchedulePreview] = useState<SchedulePreviewItem[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ModifyTermsFormData>({
    defaultValues: {
      monthlyAmount: currentTerms.monthlyAmount,
      termMonths: currentTerms.termMonths,
      interestRate: currentTerms.interestRate,
      reason: '',
      approvedBy: '',
    },
  });

  const newMonthlyAmount = watch('monthlyAmount');
  const newTermMonths = watch('termMonths');
  const newInterestRate = watch('interestRate');

  // Calculate new terms
  const calculatedNewTerms = useMemo(
    () => ({
      monthlyAmount: newMonthlyAmount || currentTerms.monthlyAmount,
      termMonths: newTermMonths || currentTerms.termMonths,
      interestRate: newInterestRate !== undefined ? newInterestRate : currentTerms.interestRate,
    }),
    [
      newMonthlyAmount,
      newTermMonths,
      newInterestRate,
      currentTerms.monthlyAmount,
      currentTerms.termMonths,
      currentTerms.interestRate,
    ]
  );

  const totalWithInterest = calculatedNewTerms.monthlyAmount * calculatedNewTerms.termMonths;

  // Check if modification is allowed
  const canModify = completionPercentage <= 50;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        monthlyAmount: currentTerms.monthlyAmount,
        termMonths: currentTerms.termMonths,
        interestRate: currentTerms.interestRate,
        reason: '',
        approvedBy: '',
      });
      setSchedulePreview([]);
    }
  }, [isOpen, currentTerms, reset]);

  // Generate schedule preview when terms change
  useEffect(() => {
    if (isOpen && calculatedNewTerms.termMonths > 0 && calculatedNewTerms.monthlyAmount > 0) {
      const preview: SchedulePreviewItem[] = [];
      const startDate = new Date();
      const principalPerMonth = remainingBalance / calculatedNewTerms.termMonths;

      for (let i = 0; i < Math.min(calculatedNewTerms.termMonths, 6); i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);

        preview.push({
          sequenceNumber: i + 1,
          dueDate,
          totalAmount: calculatedNewTerms.monthlyAmount,
          principalAmount: principalPerMonth,
          extraAmount: calculatedNewTerms.monthlyAmount - principalPerMonth,
        });
      }

      setSchedulePreview(preview);
    }
  }, [isOpen, calculatedNewTerms, remainingBalance]);

  // Modify terms mutation
  const modifyTermsMutation = useMutation({
    mutationFn: async (data: ModifyTermsFormData) => {
      const response = await apiClient.put(`/api/installments/${installmentId}/modify-terms`, {
        monthlyAmount: data.monthlyAmount,
        termMonths: data.termMonths,
        interestRate: data.interestRate,
        reason: data.reason,
        approvedBy: parseInt(data.approvedBy),
      });
      return response.data;
    },
    onSuccess: () => {
      showSuccess('تم تعديل الشروط بنجاح');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['installmentDetail', installmentId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });

      if (onSuccess) {
        onSuccess();
      }

      handleClose();
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { error?: { message?: string } } } };
      const errorMessage = apiError?.response?.data?.error?.message || 'حدث خطأ أثناء تعديل الشروط';
      showError(errorMessage);
      console.error('Modify terms error:', error);
    },
  });

  const onSubmit = (data: ModifyTermsFormData) => {
    if (!canModify) {
      showError('لا يمكن التعديل بعد إكمال أكثر من 50% من الدفعات');
      return;
    }

    if (!data.reason || data.reason.trim().length === 0) {
      showError('يرجى إدخال سبب التعديل');
      return;
    }

    if (!data.approvedBy) {
      showError('يرجى إدخال معرف المدير الموافق');
      return;
    }

    if (data.monthlyAmount && data.monthlyAmount <= 0) {
      showError('القسط الشهري يجب أن يكون أكبر من صفر');
      return;
    }

    if (data.termMonths && data.termMonths <= 0) {
      showError('مدة التقسيط يجب أن تكون أكبر من صفر');
      return;
    }

    if (data.interestRate !== undefined && data.interestRate < 0) {
      showError('نسبة الفائدة لا يمكن أن تكون سالبة');
      return;
    }

    if (modifyTermsMutation.isPending) {
      showError('جاري معالجة التعديل. يرجى الانتظار');
      return;
    }

    modifyTermsMutation.mutate(data);
  };

  const handleClose = () => {
    if (!modifyTermsMutation.isPending) {
      reset();
      setSchedulePreview([]);
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
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-brand-primary-900 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-white">تعديل شروط القسط</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-white hover:text-brand-secondary-200 transition-colors"
            aria-label="إغلاق"
            disabled={modifyTermsMutation.isPending}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Cannot Modify Warning */}
          {!canModify && (
            <div className="bg-brand-primary-50 border-2 border-brand-primary-900 rounded-lg p-4 flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-brand-primary-900 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-brand-primary-900 mb-1">⚠️ لا يمكن التعديل</p>
                <p className="text-sm text-brand-offwhite-700">
                  تم إكمال أكثر من 50% من الدفعات ({completionPercentage.toFixed(1)}%). لا يمكن
                  تعديل الشروط.
                </p>
              </div>
            </div>
          )}

          {/* Current Terms Display */}
          <div className="bg-brand-offwhite-100 border-2 border-brand-offwhite-400 rounded-lg p-5">
            <h3 className="text-lg font-bold text-brand-primary-900 mb-4">الشروط الحالية</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-brand-offwhite-300">
                <p className="text-sm text-brand-offwhite-700 mb-1">القسط الشهري</p>
                <p className="text-xl font-bold text-brand-primary-900">
                  {formatCurrency(currentTerms.monthlyAmount)} ج.م
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-brand-offwhite-300">
                <p className="text-sm text-brand-offwhite-700 mb-1">مدة التقسيط</p>
                <p className="text-xl font-bold text-brand-primary-900">
                  {currentTerms.termMonths} شهر
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-brand-offwhite-300">
                <p className="text-sm text-brand-offwhite-700 mb-1">نسبة الفائدة</p>
                <p className="text-xl font-bold text-brand-primary-900">
                  {currentTerms.interestRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* New Terms Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-brand-primary-900">الشروط الجديدة</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Monthly Amount */}
              <div>
                <label
                  htmlFor="monthlyAmount"
                  className="block text-sm font-semibold text-brand-primary-900 mb-2"
                >
                  القسط الشهري (ج.م)
                </label>
                <input
                  id="monthlyAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('monthlyAmount', {
                    min: { value: 0.01, message: 'القسط الشهري يجب أن يكون أكبر من صفر' },
                  })}
                  disabled={!canModify}
                  className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900 font-bold disabled:bg-brand-offwhite-100 disabled:cursor-not-allowed"
                  placeholder={currentTerms.monthlyAmount.toString()}
                />
                {errors.monthlyAmount && (
                  <p className="mt-1 text-sm text-brand-primary-900">
                    {errors.monthlyAmount.message}
                  </p>
                )}
              </div>

              {/* Term Months */}
              <div>
                <label
                  htmlFor="termMonths"
                  className="block text-sm font-semibold text-brand-primary-900 mb-2"
                >
                  مدة التقسيط (شهر)
                </label>
                <input
                  id="termMonths"
                  type="number"
                  min="1"
                  {...register('termMonths', {
                    min: { value: 1, message: 'مدة التقسيط يجب أن تكون شهر واحد على الأقل' },
                  })}
                  disabled={!canModify}
                  className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900 font-bold disabled:bg-brand-offwhite-100 disabled:cursor-not-allowed"
                  placeholder={currentTerms.termMonths.toString()}
                />
                {errors.termMonths && (
                  <p className="mt-1 text-sm text-brand-primary-900">{errors.termMonths.message}</p>
                )}
              </div>

              {/* Interest Rate */}
              <div>
                <label
                  htmlFor="interestRate"
                  className="block text-sm font-semibold text-brand-primary-900 mb-2"
                >
                  نسبة الفائدة (%)
                </label>
                <input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('interestRate', {
                    min: { value: 0, message: 'نسبة الفائدة لا يمكن أن تكون سالبة' },
                  })}
                  disabled={!canModify}
                  className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900 font-bold disabled:bg-brand-offwhite-100 disabled:cursor-not-allowed"
                  placeholder={currentTerms.interestRate.toString()}
                />
                {errors.interestRate && (
                  <p className="mt-1 text-sm text-brand-primary-900">
                    {errors.interestRate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-brand-offwhite-50 border-2 border-brand-offwhite-400 rounded-lg p-5">
            <h3 className="text-lg font-bold text-brand-primary-900 mb-4">مقارنة الشروط</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-brand-primary-900">
                    <th className="text-right py-3 px-4 font-bold text-brand-primary-900">البند</th>
                    <th className="text-center py-3 px-4 font-bold text-brand-offwhite-700">
                      القديم
                    </th>
                    <th className="text-center py-3 px-4 font-bold text-brand-primary-900">
                      الجديد
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-brand-offwhite-300">
                    <td className="py-3 px-4 font-medium text-brand-primary-900">القسط الشهري</td>
                    <td className="text-center py-3 px-4 text-brand-offwhite-700">
                      {formatCurrency(currentTerms.monthlyAmount)} ج.م
                    </td>
                    <td className="text-center py-3 px-4 font-bold text-brand-primary-900">
                      {formatCurrency(calculatedNewTerms.monthlyAmount)} ج.م
                    </td>
                  </tr>
                  <tr className="border-b border-brand-offwhite-300">
                    <td className="py-3 px-4 font-medium text-brand-primary-900">مدة التقسيط</td>
                    <td className="text-center py-3 px-4 text-brand-offwhite-700">
                      {currentTerms.termMonths} شهر
                    </td>
                    <td className="text-center py-3 px-4 font-bold text-brand-primary-900">
                      {calculatedNewTerms.termMonths} شهر
                    </td>
                  </tr>
                  <tr className="border-b border-brand-offwhite-300">
                    <td className="py-3 px-4 font-medium text-brand-primary-900">نسبة الفائدة</td>
                    <td className="text-center py-3 px-4 text-brand-offwhite-700">
                      {currentTerms.interestRate.toFixed(2)}%
                    </td>
                    <td className="text-center py-3 px-4 font-bold text-brand-primary-900">
                      {calculatedNewTerms.interestRate.toFixed(2)}%
                    </td>
                  </tr>
                  <tr className="bg-brand-primary-900">
                    <td className="py-3 px-4 font-bold text-white">الإجمالي مع الفائدة</td>
                    <td className="text-center py-3 px-4 text-brand-secondary-200">
                      {formatCurrency(currentTerms.monthlyAmount * currentTerms.termMonths)} ج.م
                    </td>
                    <td className="text-center py-3 px-4 font-bold text-brand-secondary-400">
                      {formatCurrency(totalWithInterest)} ج.م
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Recalculated Schedule Preview */}
          {schedulePreview.length > 0 && (
            <div className="bg-white border-2 border-brand-offwhite-400 rounded-lg p-5">
              <h3 className="text-lg font-bold text-brand-primary-900 mb-4">
                معاينة الجدول الجديد (أول {schedulePreview.length} دفعات)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-brand-primary-900">
                      <th className="text-right py-2 px-3 font-bold text-brand-primary-900">#</th>
                      <th className="text-right py-2 px-3 font-bold text-brand-primary-900">
                        تاريخ الاستحقاق
                      </th>
                      <th className="text-right py-2 px-3 font-bold text-brand-primary-900">
                        المبلغ الأصلي
                      </th>
                      <th className="text-right py-2 px-3 font-bold text-brand-primary-900">
                        الفائدة
                      </th>
                      <th className="text-right py-2 px-3 font-bold text-brand-primary-900">
                        الإجمالي
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedulePreview.map((item) => (
                      <tr key={item.sequenceNumber} className="border-b border-brand-offwhite-300">
                        <td className="py-2 px-3 text-brand-primary-900">{item.sequenceNumber}</td>
                        <td className="py-2 px-3 text-brand-offwhite-700">
                          {formatDate(item.dueDate)}
                        </td>
                        <td className="py-2 px-3 text-brand-offwhite-700">
                          {formatCurrency(item.principalAmount)} ج.م
                        </td>
                        <td className="py-2 px-3 text-brand-offwhite-700">
                          {formatCurrency(item.extraAmount)} ج.م
                        </td>
                        <td className="py-2 px-3 font-bold text-brand-primary-900">
                          {formatCurrency(item.totalAmount)} ج.م
                        </td>
                      </tr>
                    ))}
                    {calculatedNewTerms.termMonths > schedulePreview.length && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-2 px-3 text-center text-brand-offwhite-700 italic"
                        >
                          ... و {calculatedNewTerms.termMonths - schedulePreview.length} دفعة أخرى
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modification Reason */}
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-semibold text-brand-primary-900 mb-2"
            >
              سبب التعديل <span className="text-brand-primary-900">*</span>
            </label>
            <textarea
              id="reason"
              {...register('reason', {
                required: 'سبب التعديل مطلوب',
                minLength: { value: 10, message: 'يرجى إدخال سبب مفصل (10 أحرف على الأقل)' },
              })}
              disabled={!canModify}
              rows={3}
              className="w-full px-4 py-3 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900 resize-none disabled:bg-brand-offwhite-100 disabled:cursor-not-allowed"
              placeholder="اشرح سبب تعديل شروط القسط..."
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-brand-primary-900">{errors.reason.message}</p>
            )}
          </div>

          {/* Manager Approval Required */}
          <div className="bg-brand-secondary-50 border-2 border-brand-secondary-400 rounded-lg p-4 flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-brand-secondary-900 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-brand-primary-900 mb-2">
                ⚠️ يتطلب موافقة المدير
              </p>
              <p className="text-sm text-brand-offwhite-700 mb-3">
                تعديل شروط القسط يتطلب موافقة المدير. يرجى إدخال معرف المدير الموافق.
              </p>
              <div>
                <label
                  htmlFor="approvedBy"
                  className="block text-sm font-semibold text-brand-primary-900 mb-2"
                >
                  معرف المدير الموافق <span className="text-brand-primary-900">*</span>
                </label>
                <input
                  id="approvedBy"
                  type="number"
                  {...register('approvedBy', {
                    required: 'معرف المدير مطلوب',
                  })}
                  disabled={!canModify}
                  className="w-full px-4 py-2 border-2 border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-brand-primary-900 disabled:bg-brand-offwhite-100 disabled:cursor-not-allowed"
                  placeholder="أدخل معرف المدير"
                />
                {errors.approvedBy && (
                  <p className="mt-1 text-sm text-brand-primary-900">{errors.approvedBy.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-brand-offwhite-300">
            <button
              type="button"
              onClick={handleClose}
              disabled={modifyTermsMutation.isPending}
              className="flex-1 px-6 py-3 border-2 border-brand-offwhite-400 hover:bg-brand-offwhite-100 text-brand-primary-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={modifyTermsMutation.isPending || !canModify}
              className="flex-1 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {modifyTermsMutation.isPending ? (
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
                  جاري التعديل...
                </>
              ) : (
                'تأكيد التعديل'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModifyTermsModal;
