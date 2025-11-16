import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface KeyboardShortcutsLegendProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  key: string;
  description: string;
}

/**
 * KeyboardShortcutsLegend Component
 * Displays all available keyboard shortcuts in Arabic
 * Requirements: 14.7, 14.8
 */
const KeyboardShortcutsLegend: React.FC<KeyboardShortcutsLegendProps> = ({ isOpen, onClose }) => {
  const shortcuts: Shortcut[] = [
    { key: 'Enter', description: 'تأكيد الدفع' },
    { key: 'Esc', description: 'إغلاق النافذة' },
    { key: 'Ctrl + P', description: 'طباعة الإيصال الأخير' },
    { key: 'Space', description: 'فتح دفع سريع للصف المحدد' },
    { key: '1-9', description: 'اختيار عميل من القائمة' },
    { key: 'Tab', description: 'الانتقال بين الحقول' },
    { key: '?', description: 'عرض/إخفاء هذه القائمة' },
  ];

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
        {/* Header */}
        <div className="bg-brand-primary-900 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-white">اختصارات لوحة المفاتيح</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-brand-secondary-200 transition-colors"
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6">
          <div className="space-y-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-brand-offwhite-50 rounded-lg border border-brand-offwhite-300"
              >
                <span className="text-brand-primary-900 font-medium">{shortcut.description}</span>
                <kbd className="px-3 py-1.5 bg-white border-2 border-brand-offwhite-400 rounded-md text-brand-primary-900 font-mono font-bold text-sm shadow-sm">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-6 p-4 bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg">
            <p className="text-sm text-brand-primary-900">
              💡 الاختصارات لا تعمل أثناء الكتابة في حقول الإدخال
            </p>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsLegend;
