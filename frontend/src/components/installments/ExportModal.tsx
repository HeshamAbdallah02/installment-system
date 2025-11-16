import React, { useState, useEffect } from 'react';
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../hooks/useToast';
import apiClient from '../../services/api';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  installmentId: number;
  installmentPlanId: string;
}

interface ExportOptions {
  includePaymentSchedule: boolean;
  includePaymentHistory: boolean;
  includeCustomerInfo: boolean;
  includeActivityLog: boolean;
}

/**
 * ExportModal Component
 * Modal for exporting installment details to PDF or Excel
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7
 */
const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  installmentId,
  installmentPlanId,
}) => {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [options, setOptions] = useState<ExportOptions>({
    includePaymentSchedule: true,
    includePaymentHistory: true,
    includeCustomerInfo: true,
    includeActivityLog: true,
  });

  const { showSuccess, showError } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormat('pdf');
      setOptions({
        includePaymentSchedule: true,
        includePaymentHistory: true,
        includeCustomerInfo: true,
        includeActivityLog: true,
      });
    }
  }, [isOpen]);

  // Toggle option
  const toggleOption = (key: keyof ExportOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/api/installments/${installmentId}/export`,
        {
          format,
          options,
        },
        {
          responseType: 'blob', // Important for file download
        }
      );
      return response.data;
    },
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      link.setAttribute('download', `installment_${installmentPlanId}_${timestamp}.${extension}`);

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('تم التصدير بنجاح');
      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء التصدير';
      showError(errorMessage);
      console.error('Export error:', error);
    },
  });

  const handleExport = () => {
    if (exportMutation.isPending) {
      showError('جاري التصدير. يرجى الانتظار');
      return;
    }

    // Validate at least one option is selected
    const hasSelectedOption = Object.values(options).some((value) => value);
    if (!hasSelectedOption) {
      showError('يرجى اختيار عنصر واحد على الأقل للتصدير');
      return;
    }

    exportMutation.mutate();
  };

  const handleClose = () => {
    if (!exportMutation.isPending) {
      onClose();
    }
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
          <div className="flex items-center gap-3">
            <DocumentArrowDownIcon className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">تصدير تفاصيل القسط</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white hover:text-brand-secondary-200 transition-colors"
            aria-label="إغلاق"
            disabled={exportMutation.isPending}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Installment Info */}
          <div className="bg-brand-offwhite-100 border border-brand-offwhite-400 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-brand-offwhite-700">رقم القسط:</span>
              <span className="text-brand-primary-900 font-bold">{installmentPlanId}</span>
            </div>
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-sm font-semibold text-brand-primary-900 mb-3">
              اختر صيغة التصدير
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* PDF */}
              <label className="flex items-center gap-3 p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={(e) => setFormat(e.target.value as 'pdf')}
                  className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900"
                  disabled={exportMutation.isPending}
                />
                <div className="flex-1">
                  <div className="text-brand-primary-900 font-bold">PDF</div>
                  <div className="text-xs text-brand-offwhite-700">ملف PDF للطباعة</div>
                </div>
              </label>

              {/* Excel */}
              <label className="flex items-center gap-3 p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={format === 'excel'}
                  onChange={(e) => setFormat(e.target.value as 'excel')}
                  className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900"
                  disabled={exportMutation.isPending}
                />
                <div className="flex-1">
                  <div className="text-brand-primary-900 font-bold">Excel</div>
                  <div className="text-xs text-brand-offwhite-700">ملف Excel للتحليل</div>
                </div>
              </label>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-semibold text-brand-primary-900 mb-3">
              اختر البيانات المراد تصديرها
            </label>
            <div className="space-y-2">
              {/* Payment Schedule */}
              <label className="flex items-center gap-3 p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="checkbox"
                  checked={options.includePaymentSchedule}
                  onChange={() => toggleOption('includePaymentSchedule')}
                  className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900 rounded"
                  disabled={exportMutation.isPending}
                />
                <div className="flex-1">
                  <div className="text-brand-primary-900 font-medium">جدول الدفعات</div>
                  <div className="text-xs text-brand-offwhite-700">
                    جميع الدفعات المجدولة مع التواريخ والمبالغ
                  </div>
                </div>
              </label>

              {/* Payment History */}
              <label className="flex items-center gap-3 p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="checkbox"
                  checked={options.includePaymentHistory}
                  onChange={() => toggleOption('includePaymentHistory')}
                  className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900 rounded"
                  disabled={exportMutation.isPending}
                />
                <div className="flex-1">
                  <div className="text-brand-primary-900 font-medium">سجل الدفعات</div>
                  <div className="text-xs text-brand-offwhite-700">
                    جميع الدفعات المسجلة مع التفاصيل
                  </div>
                </div>
              </label>

              {/* Customer Info */}
              <label className="flex items-center gap-3 p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="checkbox"
                  checked={options.includeCustomerInfo}
                  onChange={() => toggleOption('includeCustomerInfo')}
                  className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900 rounded"
                  disabled={exportMutation.isPending}
                />
                <div className="flex-1">
                  <div className="text-brand-primary-900 font-medium">معلومات العميل</div>
                  <div className="text-xs text-brand-offwhite-700">
                    الاسم، الهاتف، العنوان، والبيانات الشخصية
                  </div>
                </div>
              </label>

              {/* Activity Log */}
              <label className="flex items-center gap-3 p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="checkbox"
                  checked={options.includeActivityLog}
                  onChange={() => toggleOption('includeActivityLog')}
                  className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900 rounded"
                  disabled={exportMutation.isPending}
                />
                <div className="flex-1">
                  <div className="text-brand-primary-900 font-medium">سجل النشاطات</div>
                  <div className="text-xs text-brand-offwhite-700">
                    جميع الإجراءات والتعديلات على القسط
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg p-4">
            <p className="text-sm text-brand-offwhite-900">
              <span className="font-semibold text-brand-primary-900">ملاحظة:</span> سيتم تنسيق الملف
              باللغة العربية مع دعم الاتجاه من اليمين إلى اليسار (RTL).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-brand-offwhite-300">
          <button
            type="button"
            onClick={handleClose}
            disabled={exportMutation.isPending}
            className="flex-1 px-6 py-3 border-2 border-brand-offwhite-400 hover:bg-brand-offwhite-100 text-brand-primary-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="flex-1 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exportMutation.isPending ? (
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
                جاري التصدير...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="w-5 h-5" />
                تصدير
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
