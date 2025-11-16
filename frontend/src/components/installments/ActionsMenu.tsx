import React, { useState, useRef, useEffect } from 'react';
import {
  EllipsisVerticalIcon,
  BanknotesIcon,
  BellIcon,
  PrinterIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface ActionsMenuProps {
  onRecordPayment: () => void;
  onSendReminder: () => void;
  onPrintAgreement: () => void;
  onModifyTerms: () => void;
  onEarlySettlement: () => void;
  onCancelInstallment: () => void;
  onExport: () => void;
}

/**
 * ActionsMenu component
 * Dropdown menu with all installment actions
 * Requirements: 1.5, 6.1, 7.1, 8.1, 9.1, 12.1, 14.1, 15.1
 */
const ActionsMenu: React.FC<ActionsMenuProps> = ({
  onRecordPayment,
  onSendReminder,
  onPrintAgreement,
  onModifyTerms,
  onEarlySettlement,
  onCancelInstallment,
  onExport,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white text-brand-primary-900 border border-brand-primary-900 rounded-lg hover:bg-brand-primary-900 hover:text-white transition-colors"
        aria-label="إجراءات"
      >
        <span className="font-medium">إجراءات</span>
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-brand-offwhite-300 z-50">
          <div className="py-2" dir="rtl">
            {/* Record Payment */}
            <button
              type="button"
              onClick={() => handleAction(onRecordPayment)}
              className="w-full flex items-center gap-3 px-4 py-3 text-right text-brand-offwhite-900 hover:bg-brand-offwhite-50 transition-colors"
            >
              <BanknotesIcon className="w-5 h-5 text-brand-secondary-600" />
              <span>تسجيل دفعة</span>
            </button>

            {/* Send Reminder */}
            <button
              type="button"
              onClick={() => handleAction(onSendReminder)}
              className="w-full flex items-center gap-3 px-4 py-3 text-right text-brand-offwhite-900 hover:bg-brand-offwhite-50 transition-colors"
            >
              <BellIcon className="w-5 h-5 text-brand-secondary-600" />
              <span>إرسال تذكير</span>
            </button>

            {/* Print Agreement */}
            <button
              type="button"
              onClick={() => handleAction(onPrintAgreement)}
              className="w-full flex items-center gap-3 px-4 py-3 text-right text-brand-offwhite-900 hover:bg-brand-offwhite-50 transition-colors"
            >
              <PrinterIcon className="w-5 h-5 text-brand-offwhite-700" />
              <span>طباعة العقد</span>
            </button>

            <div className="border-t border-brand-offwhite-300 my-2" />

            {/* Modify Terms */}
            <button
              type="button"
              onClick={() => handleAction(onModifyTerms)}
              className="w-full flex items-center gap-3 px-4 py-3 text-right text-brand-offwhite-900 hover:bg-brand-offwhite-50 transition-colors"
            >
              <PencilIcon className="w-5 h-5 text-brand-offwhite-700" />
              <span>تعديل الشروط</span>
            </button>

            {/* Early Settlement */}
            <button
              type="button"
              onClick={() => handleAction(onEarlySettlement)}
              className="w-full flex items-center gap-3 px-4 py-3 text-right text-brand-offwhite-900 hover:bg-brand-offwhite-50 transition-colors"
            >
              <CheckCircleIcon className="w-5 h-5 text-brand-secondary-600" />
              <span>تسوية مبكرة</span>
            </button>

            <div className="border-t border-brand-offwhite-300 my-2" />

            {/* Cancel Installment */}
            <button
              type="button"
              onClick={() => handleAction(onCancelInstallment)}
              className="w-full flex items-center gap-3 px-4 py-3 text-right text-brand-primary-900 hover:bg-brand-primary-50 transition-colors"
            >
              <XCircleIcon className="w-5 h-5 text-brand-primary-900" />
              <span>إلغاء القسط</span>
            </button>

            <div className="border-t border-brand-offwhite-300 my-2" />

            {/* Export */}
            <button
              type="button"
              onClick={() => handleAction(onExport)}
              className="w-full flex items-center gap-3 px-4 py-3 text-right text-brand-offwhite-900 hover:bg-brand-offwhite-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5 text-brand-offwhite-700" />
              <span>تصدير</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsMenu;
