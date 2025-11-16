import React, { useState } from 'react';
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface BulkExportModalProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onExport: (format: 'excel' | 'pdf') => Promise<void>;
}

/**
 * BulkExportModal Component
 * Modal for bulk exporting multiple installments to PDF or Excel
 */
const BulkExportModal: React.FC<BulkExportModalProps> = ({
  isOpen,
  selectedCount,
  onClose,
  onExport,
}) => {
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-brand-primary-900 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <DocumentArrowDownIcon className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">تصدير الأقساط</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-brand-secondary-200 transition-colors"
            aria-label="إغلاق"
            disabled={isExporting}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Selection Info */}
          <div className="bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg p-4">
            <p className="text-brand-primary-900 font-medium">
              سيتم تصدير <span className="font-bold text-xl">{selectedCount}</span> قسط
            </p>
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-sm font-semibold text-brand-primary-900 mb-3">
              اختر صيغة التصدير
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Excel */}
              <label className="flex items-center gap-3 p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={format === 'excel'}
                  onChange={(e) => setFormat(e.target.value as 'excel')}
                  className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900"
                  disabled={isExporting}
                />
                <div className="flex-1">
                  <div className="text-brand-primary-900 font-bold">Excel</div>
                  <div className="text-xs text-brand-offwhite-700">ملف Excel للتحليل</div>
                </div>
              </label>

              {/* PDF */}
              <label className="flex items-center gap-3 p-4 border-2 border-brand-offwhite-400 rounded-lg cursor-pointer hover:bg-brand-offwhite-50 transition-colors has-[:checked]:border-brand-primary-900 has-[:checked]:bg-brand-secondary-50">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={(e) => setFormat(e.target.value as 'pdf')}
                  className="w-4 h-4 text-brand-primary-900 focus:ring-brand-primary-900"
                  disabled={isExporting}
                />
                <div className="flex-1">
                  <div className="text-brand-primary-900 font-bold">PDF</div>
                  <div className="text-xs text-brand-offwhite-700">ملف PDF للطباعة</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-brand-offwhite-300">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-6 py-3 border-2 border-brand-offwhite-400 hover:bg-brand-offwhite-100 text-brand-primary-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
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

export default BulkExportModal;
