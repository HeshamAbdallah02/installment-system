import React, { useState, useEffect, useCallback } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { WizardState } from '../../types/installment';
import installmentService from '../../services/installmentService';
import { getErrorMessage, logError } from '../../utils/errorHandling';

interface TermsConfigurationProps {
  wizardState: WizardState;
  updateWizardState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * TermsConfiguration component - Step 3 of installment wizard
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */
const TermsConfiguration: React.FC<TermsConfigurationProps> = ({
  wizardState,
  updateWizardState,
  onNext,
  onPrevious,
}) => {
  const [termMonths, setTermMonths] = useState<3 | 6 | null>(wizardState.termMonths);
  const [startDate, setStartDate] = useState(wizardState.startDate.toISOString().split('T')[0]);
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ term?: string }>({});

  const totalAmount = wizardState.totalAmount || 0;
  const availableTerms = [3, 6]; // Only 3 and 6 months plans

  // Calculate installment when values change (no deposit)
  useEffect(() => {
    const calculateInstallment = async () => {
      // Validate term
      if (!termMonths) {
        setErrors((prev) => ({ ...prev, term: 'يرجى اختيار مدة التقسيط' }));
        return;
      }

      // Clear term error
      setErrors((prev) => ({ ...prev, term: undefined }));

      // Calculate
      try {
        setCalculating(true);
        setCalculationError(null);
        const calculation = await installmentService.calculateInstallment(totalAmount, termMonths);

        updateWizardState({
          termMonths,
          startDate: new Date(startDate),
          calculation,
        });
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setCalculationError(errorMessage);
        logError(err, 'TermsConfiguration - calculateInstallment');
      } finally {
        setCalculating(false);
      }
    };

    // Debounce calculation
    const timer = setTimeout(() => {
      if (termMonths) {
        calculateInstallment();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [termMonths, startDate, totalAmount, updateWizardState]);

  // Handle term change
  const handleTermChange = useCallback((term: 3 | 6) => {
    setTermMonths(term);
  }, []);

  // Handle start date change
  const handleStartDateChange = useCallback((value: string) => {
    setStartDate(value);
  }, []);

  // Handle next button
  const handleNext = useCallback(() => {
    if (wizardState.termMonths && wizardState.calculation && !errors.term) {
      onNext();
    }
  }, [wizardState, errors, onNext]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculation = wizardState.calculation;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-brand-primary-900 mb-2">تكوين شروط التقسيط</h3>
        <p className="text-brand-offwhite-700">
          اختر مدة التقسيط وتاريخ البدء - الدفعة الأولى فورية
        </p>
      </div>

      {/* Total Amount Display */}
      <div className="bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-brand-offwhite-700">إجمالي المبلغ:</span>
          <span className="text-2xl font-bold text-brand-primary-900">
            {formatCurrency(totalAmount)} ج.م
          </span>
        </div>
        <p className="text-sm text-brand-offwhite-700 mt-2">
          💡 الدفعة الأولى تُدفع فوراً، ثم دفعات شهرية متساوية
        </p>
      </div>

      {/* Term Length Selector */}
      <div>
        <label className="block text-sm font-medium text-brand-primary-900 mb-2">
          مدة التقسيط <span className="text-brand-primary-700">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          {availableTerms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleTermChange(term as 3 | 6)}
              className={`px-6 py-4 border-2 rounded-lg font-bold text-lg transition-all ${
                termMonths === term
                  ? 'border-brand-primary-900 bg-brand-secondary-50 text-brand-primary-900'
                  : 'border-brand-offwhite-400 text-brand-offwhite-700 hover:border-brand-secondary-400'
              }`}
            >
              {term} شهر
            </button>
          ))}
        </div>
        {errors.term && <p className="mt-1 text-sm text-brand-primary-700">{errors.term}</p>}
      </div>

      {/* Start Date */}
      <div>
        <label
          htmlFor="startDate"
          className="block text-sm font-medium text-brand-primary-900 mb-1"
        >
          تاريخ البدء <span className="text-brand-primary-700">*</span>
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          className="w-full px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
        />
        <p className="mt-1 text-sm text-brand-offwhite-700">الافتراضي: أول يوم من الشهر القادم</p>
      </div>

      {/* Calculation Breakdown */}
      {calculation && !calculating && (
        <div className="bg-brand-offwhite-100 border border-brand-offwhite-400 rounded-lg p-4 space-y-3">
          <h4 className="font-bold text-brand-primary-900 mb-3">تفاصيل الحساب</h4>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-brand-offwhite-700">إجمالي المبلغ:</span>
              <span className="text-brand-primary-900 font-medium">
                {formatCurrency(totalAmount)} ج.م
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-brand-offwhite-700">عدد الأقساط:</span>
              <span className="text-brand-primary-900 font-medium">
                {wizardState.termMonths} شهر
              </span>
            </div>

            <div className="flex justify-between bg-brand-secondary-100 -mx-4 px-4 py-3 mt-3">
              <span className="font-bold text-brand-primary-900">القسط الشهري:</span>
              <span className="text-2xl font-bold text-brand-primary-900">
                {formatCurrency(calculation.monthlyAmount)} ج.م
              </span>
            </div>

            <div className="text-sm text-brand-offwhite-700 mt-3 bg-brand-offwhite-100 -mx-4 px-4 py-2">
              💡 الدفعة الأولى ({formatCurrency(calculation.monthlyAmount)} ج.م) تُدفع فوراً
            </div>
          </div>
        </div>
      )}

      {calculating && (
        <div className="text-center py-4">
          <div className="w-12 h-12 border-4 border-brand-primary-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-brand-primary-900 font-semibold">جاري الحساب...</p>
        </div>
      )}

      {/* Calculation Error */}
      {calculationError && !calculating && (
        <div className="bg-brand-primary-50 border border-brand-primary-700 rounded-lg p-4 flex items-start gap-3">
          <ExclamationCircleIcon className="w-6 h-6 text-brand-primary-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-brand-primary-900 mb-2">خطأ في الحساب</h4>
            <p className="text-brand-primary-700">{calculationError}</p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 pt-4">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-2 bg-brand-offwhite-200 text-brand-primary-900 rounded-lg hover:bg-brand-offwhite-300 transition-colors font-medium"
        >
          السابق
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={
            !wizardState.termMonths || !wizardState.calculation || !!errors.term || calculating
          }
          className="px-6 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          التالي
        </button>
      </div>
    </div>
  );
};

export default TermsConfiguration;
