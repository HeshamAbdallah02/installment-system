import React, { useState } from 'react';
import { Cog6ToothIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import type { AlertSettings } from '../../utils/alertLogic';
import { DEFAULT_ALERT_SETTINGS } from '../../utils/alertLogic';

interface AlertSettingsPanelProps {
  settings: AlertSettings;
  onUpdateSettings: (settings: Partial<AlertSettings>) => void;
  onResetSettings: () => void;
}

/**
 * AlertSettingsPanel Component
 * Allows users to customize alert thresholds
 * Requirement 10.3: Create settings panel in dashboard header
 */
const AlertSettingsPanel: React.FC<AlertSettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleOpen = () => {
    setLocalSettings(settings);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_ALERT_SETTINGS);
    onResetSettings();
  };

  const handleOverdueChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setLocalSettings({ ...localSettings, overdueThreshold: numValue });
    }
  };

  const handleCollectionRateChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setLocalSettings({ ...localSettings, collectionRateThreshold: numValue });
    }
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-brand-offwhite-200 hover:bg-brand-offwhite-300 text-brand-primary-900 rounded-lg transition-colors duration-200"
        aria-label="إعدادات التنبيهات"
      >
        <Cog6ToothIcon className="w-5 h-5" />
        <span className="text-sm font-medium hidden tablet:inline">إعدادات التنبيهات</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Modal Content */}
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleClose}
                className="p-1 hover:bg-brand-offwhite-100 rounded-lg transition-colors"
                aria-label="إغلاق"
              >
                <XMarkIcon className="w-6 h-6 text-brand-offwhite-700" />
              </button>
              <h2 className="text-xl font-bold text-brand-primary-900">إعدادات التنبيهات</h2>
            </div>

            {/* Settings Form */}
            <div className="space-y-6">
              {/* Overdue Threshold Setting */}
              <div>
                <label
                  htmlFor="overdue-threshold"
                  className="block text-sm font-medium text-brand-primary-900 text-right mb-2"
                >
                  حد المبالغ المتأخرة (%)
                </label>
                <p className="text-xs text-brand-offwhite-700 text-right mb-3">
                  عرض تنبيه عندما تتجاوز المبالغ المتأخرة هذه النسبة من إجمالي المستحقات
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-brand-primary-900 min-w-[60px] text-center">
                    {localSettings.overdueThreshold}%
                  </span>
                  <input
                    id="overdue-threshold"
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={localSettings.overdueThreshold}
                    onChange={(e) => handleOverdueChange(e.target.value)}
                    className="flex-1 h-2 bg-brand-offwhite-300 rounded-lg appearance-none cursor-pointer accent-brand-primary-900"
                  />
                </div>
                <div className="flex justify-between text-xs text-brand-offwhite-600 mt-1">
                  <span>50%</span>
                  <span>0%</span>
                </div>
              </div>

              {/* Collection Rate Threshold Setting */}
              <div>
                <label
                  htmlFor="collection-rate-threshold"
                  className="block text-sm font-medium text-brand-primary-900 text-right mb-2"
                >
                  حد معدل التحصيل (%)
                </label>
                <p className="text-xs text-brand-offwhite-700 text-right mb-3">
                  عرض تنبيه عندما ينخفض معدل التحصيل عن هذه النسبة
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-brand-primary-900 min-w-[60px] text-center">
                    {localSettings.collectionRateThreshold}%
                  </span>
                  <input
                    id="collection-rate-threshold"
                    type="range"
                    min="50"
                    max="100"
                    step="1"
                    value={localSettings.collectionRateThreshold}
                    onChange={(e) => handleCollectionRateChange(e.target.value)}
                    className="flex-1 h-2 bg-brand-offwhite-300 rounded-lg appearance-none cursor-pointer accent-brand-primary-900"
                  />
                </div>
                <div className="flex justify-between text-xs text-brand-offwhite-600 mt-1">
                  <span>100%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-brand-secondary-50 border border-brand-secondary-200 rounded-lg p-4">
                <p className="text-xs text-brand-secondary-900 text-right">
                  💡 سيتم حفظ هذه الإعدادات تلقائياً في المتصفح الخاص بك
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-offwhite-200 hover:bg-brand-offwhite-300 text-brand-primary-900 rounded-lg font-medium transition-colors duration-200"
              >
                <ArrowPathIcon className="w-5 h-5" />
                <span>إعادة تعيين</span>
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white rounded-lg font-medium transition-colors duration-200"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertSettingsPanel;
