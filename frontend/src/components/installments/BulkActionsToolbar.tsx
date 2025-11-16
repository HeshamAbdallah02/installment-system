import React from 'react';
import { PaperAirplaneIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSendReminders: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}

/**
 * BulkActionsToolbar component
 * Displays bulk action buttons when installments are selected
 * Requirements: 11.4, 11.5, 11.6
 */
const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  onSendReminders,
  onExport,
  onClearSelection,
}) => {
  // Hide toolbar when no items are selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className="bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg px-6 py-4 flex items-center justify-between"
      dir="rtl"
    >
      {/* Selection counter */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-brand-primary-900">
          تم تحديد {selectedCount} من {totalCount}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {/* Send Reminders button */}
        <button
          type="button"
          onClick={onSendReminders}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium text-sm"
          title="إرسال تذكيرات"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
          <span>إرسال تذكيرات</span>
        </button>

        {/* Export button */}
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-brand-secondary-400 text-brand-primary-900 rounded-lg hover:bg-brand-secondary-500 transition-colors font-medium text-sm"
          title="تصدير"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          <span>تصدير</span>
        </button>

        {/* Clear Selection button */}
        <button
          type="button"
          onClick={onClearSelection}
          className="flex items-center gap-2 px-4 py-2 bg-white text-brand-primary-900 border border-brand-offwhite-400 rounded-lg hover:bg-brand-offwhite-100 transition-colors font-medium text-sm"
          title="إلغاء التحديد"
        >
          <XMarkIcon className="w-4 h-4" />
          <span>إلغاء التحديد</span>
        </button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
