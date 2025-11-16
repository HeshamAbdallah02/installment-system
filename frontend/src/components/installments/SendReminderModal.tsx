import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../hooks/useToast';
import apiClient from '../../services/api';

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  installmentId: number;
  customerName: string;
  customerPhone: string;
  nextDueAmount: number;
  nextDueDate: Date | null;
}

/**
 * SendReminderModal Component
 * Modal for sending payment reminders to customers
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */
const SendReminderModal: React.FC<SendReminderModalProps> = ({
  isOpen,
  onClose,
  installmentId,
  customerName,
  customerPhone,
  nextDueAmount,
  nextDueDate,
}) => {
  const [method, setMethod] = useState<'whatsapp' | 'sms' | 'both'>('whatsapp');
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  // Reset method when modal opens
  useEffect(() => {
    if (isOpen) {
      setMethod('whatsapp');
    }
  }, [isOpen]);

  // Validate phone number
  const isValidPhone = customerPhone && customerPhone.trim().length > 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return 'غير محدد';
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  // Prepare reminder message preview
  const reminderMessage = `عزيزي ${customerName}، نذكرك بموعد دفعة القسط المستحقة\nالمبلغ: ${formatCurrency(nextDueAmount)} ج.م\nتاريخ الاستحقاق: ${formatDate(nextDueDate)}`;

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (reminderMethod: 'whatsapp' | 'sms' | 'both') => {
      const response = await apiClient.post(`/api/installments/${installmentId}/reminder`, {
        method: reminderMethod,
      });
      return response.data;
    },
    onSuccess: () => {
      showSuccess('تم إرسال التذكير بنجاح');

      // Invalidate queries to refresh activity log
      queryClient.invalidateQueries({ queryKey: ['installmentDetail', installmentId] });
      queryClient.invalidateQueries({ queryKey: ['installmentActivities', installmentId] });

      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال التذكير';
      showError(errorMessage);
      console.error('Send reminder error:', error);
    },
  });

  const handleSendReminder = () => {
    if (!isValidPhone) {
      showError('رقم الهاتف غير صالح');
      return;
    }

    if (sendReminderMutation.isPending) {
      showError('جاري إرسال التذكير. يرجى الانتظار');
      return;
    }

    sendReminderMutation.mutate(method);
  };

  const handleClose = () => {
    if (!sendReminderMutation.isPending) {
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
          <h2 className="text-xl font-bold text-white">إرسال تذكير بالدفع</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-white hover:text-brand-secondary-200 transition-colors"
            aria-label="إغلاق"
            disabled={sendReminderMutation.isPending}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-brand-offwhite-100 border border-brand-offwhite-400 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-brand-primary-900 mb-3">معلومات العميل</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-brand-offwhite-700">الاسم:</span>
                <span className="text-brand-primary-900 font-medium">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-offwhite-700">رقم الهاتف:</span>
                <span className="text-brand-primary-900 font-medium">
                  {customerPhone || 'غير متوفر'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-offwhite-700">المبلغ المستحق:</span>
                <span className="text-brand-primary-900 font-bold">
                  {formatCurrency(nextDueAmount)} ج.م
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-offwhite-700">تاريخ الاستحقاق:</span>
                <span className="text-brand-primary-900 font-medium">
                  {formatDate(nextDueDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Phone Validation Warning */}
          {!isValidPhone && (
            <div className="bg-brand-primary-50 border-2 border-brand-primary-900 rounded-lg p-4 flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-brand-primary-900 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand-primary-900">
                  ⚠️ رقم الهاتف غير صالح
                </p>
                <p className="text-sm text-brand-offwhite-700 mt-1">
                  لا يمكن إرسال التذكير. يرجى تحديث رقم هاتف العميل أولاً.
                </p>
              </div>
            </div>
          )}

          {/* Message Preview */}
          <div>
            <label className="block text-sm font-semibold text-brand-primary-900 mb-2">
              معاينة الرسالة
            </label>
            <div className="bg-brand-offwhite-100 border border-brand-offwhite-400 rounded-lg p-4">
              <p className="text-brand-offwhite-900 whitespace-pre-line text-sm">
                {reminderMessage}
              </p>
            </div>
          </div>

          {/* Reminder Method Selector */}
          <div>
            <label className="block text-sm font-semibold text-brand-primary-900 mb-3">
              اختر طريقة الإرسال
            </label>
            <div className="space-y-2">
              {/* WhatsApp */}
              <label className="flex items-center gap-3 p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  name="method"
                  value="whatsapp"
                  checked={method === 'whatsapp'}
                  onChange={(e) => setMethod(e.target.value as 'whatsapp')}
                  className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900"
                  disabled={sendReminderMutation.isPending || !isValidPhone}
                />
                <span className="flex-1 text-brand-primary-900 font-medium">واتساب</span>
              </label>

              {/* SMS */}
              <label className="flex items-center gap-3 p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  name="method"
                  value="sms"
                  checked={method === 'sms'}
                  onChange={(e) => setMethod(e.target.value as 'sms')}
                  className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900"
                  disabled={sendReminderMutation.isPending || !isValidPhone}
                />
                <span className="flex-1 text-brand-primary-900 font-medium">رسالة نصية (SMS)</span>
              </label>

              {/* Both */}
              <label className="flex items-center gap-3 p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  name="method"
                  value="both"
                  checked={method === 'both'}
                  onChange={(e) => setMethod(e.target.value as 'both')}
                  className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900"
                  disabled={sendReminderMutation.isPending || !isValidPhone}
                />
                <span className="flex-1 text-brand-primary-900 font-medium">
                  كلاهما (واتساب + SMS)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-brand-offwhite-300">
          <button
            type="button"
            onClick={handleClose}
            disabled={sendReminderMutation.isPending}
            className="flex-1 px-6 py-3 border-2 border-brand-offwhite-400 hover:bg-brand-offwhite-100 text-brand-primary-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSendReminder}
            disabled={sendReminderMutation.isPending || !isValidPhone}
            className="flex-1 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sendReminderMutation.isPending ? (
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
                جاري الإرسال...
              </>
            ) : (
              'إرسال التذكير'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendReminderModal;
