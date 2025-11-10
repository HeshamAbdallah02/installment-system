import React, { useState, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { WizardState } from '../../types/installment';
import CustomerSelection from './CustomerSelection';
import ProductSelection from './ProductSelection';
import TermsConfiguration from './TermsConfiguration';
import ReviewAndConfirm from './ReviewAndConfirm';

interface InstallmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * InstallmentWizard component
 * Multi-step wizard for creating installment plans
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */
const InstallmentWizard: React.FC<InstallmentWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  // Get first day of next month as default start date
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(1);
    return date;
  };

  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    customerId: null,
    productId: null,
    deposit: 0,
    termMonths: null,
    startDate: getDefaultStartDate(),
  });

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Update wizard state
  const updateWizardState = useCallback((updates: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (wizardState.currentStep < 4) {
      setWizardState((prev) => ({
        ...prev,
        currentStep: (prev.currentStep + 1) as 1 | 2 | 3 | 4,
      }));
    }
  }, [wizardState.currentStep]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    if (wizardState.currentStep > 1) {
      setWizardState((prev) => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as 1 | 2 | 3 | 4,
      }));
    }
  }, [wizardState.currentStep]);

  // Handle cancel with confirmation
  const handleCancel = useCallback(() => {
    setShowCancelDialog(true);
  }, []);

  const confirmCancel = useCallback(() => {
    setShowCancelDialog(false);
    setWizardState({
      currentStep: 1,
      customerId: null,
      productId: null,
      deposit: 0,
      termMonths: null,
      startDate: getDefaultStartDate(),
    });
    onClose();
  }, [onClose]);

  const cancelCancel = useCallback(() => {
    setShowCancelDialog(false);
  }, []);

  // Handle successful creation
  const handleSuccess = useCallback(
    (message: string) => {
      setWizardState({
        currentStep: 1,
        customerId: null,
        productId: null,
        deposit: 0,
        termMonths: null,
        startDate: getDefaultStartDate(),
      });
      onSuccess(message);
      onClose();
    },
    [onSuccess, onClose]
  );

  if (!isOpen) return null;

  const steps = [
    { number: 1, label: 'العميل' },
    { number: 2, label: 'المنتج' },
    { number: 3, label: 'الشروط' },
    { number: 4, label: 'المراجعة' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-brand-offwhite-400">
            <h2 className="text-2xl font-bold text-brand-primary-900">إنشاء قسط جديد</h2>
            <button
              type="button"
              onClick={handleCancel}
              className="text-brand-offwhite-700 hover:text-brand-primary-900 transition-colors"
              aria-label="إلغاء"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 py-4 border-b border-brand-offwhite-400">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                        step.number === wizardState.currentStep
                          ? 'bg-brand-primary-900 text-white'
                          : step.number < wizardState.currentStep
                            ? 'bg-brand-secondary-400 text-brand-primary-900'
                            : 'bg-brand-offwhite-300 text-brand-offwhite-700'
                      }`}
                    >
                      {step.number}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        step.number === wizardState.currentStep
                          ? 'text-brand-primary-900'
                          : 'text-brand-offwhite-700'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded transition-colors ${
                        step.number < wizardState.currentStep
                          ? 'bg-brand-secondary-400'
                          : 'bg-brand-offwhite-300'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {wizardState.currentStep === 1 && (
              <CustomerSelection
                wizardState={wizardState}
                updateWizardState={updateWizardState}
                onNext={handleNext}
              />
            )}
            {wizardState.currentStep === 2 && (
              <ProductSelection
                wizardState={wizardState}
                updateWizardState={updateWizardState}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            )}
            {wizardState.currentStep === 3 && (
              <TermsConfiguration
                wizardState={wizardState}
                updateWizardState={updateWizardState}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            )}
            {wizardState.currentStep === 4 && (
              <ReviewAndConfirm
                wizardState={wizardState}
                onPrevious={handlePrevious}
                onSuccess={handleSuccess}
                onError={onError}
              />
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" dir="rtl">
          <div className="fixed inset-0 bg-black bg-opacity-50" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-brand-primary-900 mb-4">تأكيد الإلغاء</h3>
              <p className="text-brand-offwhite-900 mb-6">
                هل تريد إلغاء إنشاء القسط؟ سيتم فقدان جميع البيانات المدخلة.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={confirmCancel}
                  className="flex-1 px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium"
                >
                  نعم، إلغاء
                </button>
                <button
                  type="button"
                  onClick={cancelCancel}
                  className="flex-1 px-4 py-2 bg-brand-offwhite-200 text-brand-primary-900 rounded-lg hover:bg-brand-offwhite-300 transition-colors font-medium"
                >
                  العودة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallmentWizard;
