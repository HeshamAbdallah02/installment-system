import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { InstallmentListItem } from '../../types/installment';
import ProgressModal from '../ProgressModal';

interface BulkRemindersModalProps {
  isOpen: boolean;
  selectedInstallments: InstallmentListItem[];
  onClose: () => void;
  onConfirm: (method: 'whatsapp' | 'sms' | 'both') => Promise<void>;
}

/**
 * BulkRemindersModal component
 * Modal for sending payment reminders to multiple customers with progress indicator
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.8
 */
const BulkRemindersModal: React.FC<BulkRemindersModalProps> = ({
  isOpen,
  selectedInstallments,
  onClose,
  onConfirm,
}) => {
  const [method, setMethod] = useState<'whatsapp' | 'sms' | 'both'>('both');
  const [loading, setLoading] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  // Reset method when modal opens
  useEffect(() => {
    if (isOpen) {
      setMethod('both');
      setSendProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setSendProgress(0);

      // Simulate progress updates for user feedback
      const progressInterval = setInterval(() => {
        setSendProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      await onConfirm(method);

      clearInterval(progressInterval);
      setSendProgress(100);

      // Small delay to show 100% before closing
      setTimeout(() => {
        onClose();
        setLoading(false);
        setSendProgress(0);
      }, 500);
    } catch (error) {
      // Error handling is done in parent component
      console.error('Reminder confirmation error:', error);
      setLoading(false);
      setSendProgress(0);
    }
  };

  // Get sample installment for preview
  const sampleInstallment = selectedInstallments[0];
  const previewMessage = sampleInstallment
    ? `عزيزي ${sampleInstallment.customerName}، نذكرك بموعد دفعة القسط المستحقة\nالمبلغ: ${sampleInstallment.monthlyPayment.toFixed(2)} ج.م\nتاريخ الاستحقاق: ${sampleInstallment.nextDueDate ? new Date(sampleInstallment.nextDueDate).toLocaleDateString('ar-EG') : 'غير محدد'}`
    : '';

  return (
    <>
      {/* Progress Modal */}
      <ProgressModal
        isOpen={loading}
        title="جاري إرسال التذكيرات"
        progress={sendProgress}
        message={`جاري إرسال تذكيرات لـ ${selectedInstallments.length} عملاء...`}
      />

      {/* Reminders Modal */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-brand-offwhite-400">
            <h2 className="text-2xl font-bold text-brand-primary-900">إرسال تذكيرات الدفع</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-brand-offwhite-700 hover:text-brand-primary-900 transition-colors"
              disabled={loading}
              aria-label="إغلاق"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Selected count */}
            <div className="bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg p-4">
              <p className="text-brand-primary-900 font-medium">
                سيتم إرسال تذكيرات لـ {selectedInstallments.length} عملاء
              </p>
            </div>

            {/* Reminder method selector */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-brand-primary-900">
                اختر طريقة الإرسال
              </label>

              <div className="space-y-2">
                {/* WhatsApp only */}
                <label className="flex items-center gap-3 p-4 border border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-100 transition-colors">
                  <input
                    type="radio"
                    name="method"
                    value="whatsapp"
                    checked={method === 'whatsapp'}
                    onChange={(e) => setMethod(e.target.value as 'whatsapp')}
                    className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900"
                    disabled={loading}
                  />
                  <span className="text-brand-offwhite-900">واتساب فقط</span>
                </label>

                {/* SMS only */}
                <label className="flex items-center gap-3 p-4 border border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-100 transition-colors">
                  <input
                    type="radio"
                    name="method"
                    value="sms"
                    checked={method === 'sms'}
                    onChange={(e) => setMethod(e.target.value as 'sms')}
                    className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900"
                    disabled={loading}
                  />
                  <span className="text-brand-offwhite-900">رسالة نصية فقط</span>
                </label>

                {/* Both */}
                <label className="flex items-center gap-3 p-4 border border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-100 transition-colors">
                  <input
                    type="radio"
                    name="method"
                    value="both"
                    checked={method === 'both'}
                    onChange={(e) => setMethod(e.target.value as 'both')}
                    className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900"
                    disabled={loading}
                  />
                  <span className="text-brand-offwhite-900">كلاهما</span>
                </label>
              </div>
            </div>

            {/* Reminder preview */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-brand-primary-900">
                معاينة الرسالة
              </label>
              <div className="bg-brand-offwhite-100 border border-brand-offwhite-400 rounded-lg p-4">
                <p className="text-brand-offwhite-900 whitespace-pre-line text-sm">
                  {previewMessage}
                </p>
              </div>
            </div>

            {/* Selected customers list (first 5) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-brand-primary-900">
                العملاء المحددون
              </label>
              <div className="bg-brand-offwhite-100 border border-brand-offwhite-400 rounded-lg p-4 max-h-40 overflow-y-auto">
                <ul className="space-y-1 text-sm text-brand-offwhite-900">
                  {selectedInstallments.slice(0, 5).map((inst) => (
                    <li key={inst.id}>• {inst.customerName}</li>
                  ))}
                  {selectedInstallments.length > 5 && (
                    <li className="text-brand-offwhite-700 italic">
                      ... و {selectedInstallments.length - 5} عملاء آخرين
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-brand-offwhite-400">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white text-brand-primary-900 border border-brand-offwhite-400 rounded-lg hover:bg-brand-offwhite-100 transition-colors font-medium"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'جاري الإرسال...' : 'إرسال التذكيرات'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkRemindersModal;
