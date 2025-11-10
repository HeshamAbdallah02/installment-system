import React, { useState, useEffect, useCallback } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { WizardState } from '../../types/installment';
import installmentService from '../../services/installmentService';
import { validateDeposit, getErrorMessage, logError } from '../../utils/errorHandling';

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
  const [deposit, setDeposit] = useState(wizardState.deposit.toString());
  const [termMonths, setTermMonths] = useState<3 | 6 | 12 | 24 | null>(wizardState.termMonths);
  const [startDate, setStartDate] = useState(wizardState.startDate.toISOString().split('T')[0]);
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ deposit?: string; term?: string }>({});

  const productPrice = wizardState.productPrice || 0;
  const minDeposit = 0; // Can be fetched from product if needed
  const availableTerms = [3, 6, 12, 24];

  // Calculate installment when values change
  useEffect(() => {
    const calculateInstallment = async () => {
      const depositAmount = parseFloat(deposit);

      // Validate deposit using utility function
      const depositValidation = validateDeposit(depositAmount, productPrice, minDeposit);
      if (depositValidation !== true) {
        setErrors((prev) => ({ ...prev, deposit: depositValidation }));
        return;
      }

      // Clear deposit error
      setErrors((prev) => ({ ...prev, deposit: undefined }));

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
        const calculation = await installmentService.calculateInstallment(
          productPrice,
          depositAmount,
          termMonths
        );

        updateWizardState({
          deposit: depositAmount,
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
      if (deposit && termMonths) {
        calculateInstallment();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [deposit, termMonths, startDate, productPrice, minDeposit, updateWizardState]);

  // Handle deposit change
  const handleDepositChange = useCallback((value: string) => {
    setDeposit(value);
  }, []);

  // Handle term change
  const handleTermChange = useCallback((term: 3 | 6 | 12 | 24) => {
    setTermMonths(term);
  }, []);

  // Handle start date change
  const handleStartDateChange = useCallback((value: string) => {
    setStartDate(value);
  }, []);

  // Handle next button
  const handleNext = useCallback(() => {
    if (
      wizardState.deposit &&
      wizardState.termMonths &&
      wizardState.calculation &&
      !errors.deposit &&
      !errors.term
    ) {
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
        <p className="text-brand-offwhite-700">حدد المقدم ومدة التقسيط وتاريخ البدء</p>
      </div>

      {/* Product Price Display */}
      <div className="bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-brand-offwhite-700">سعر المنتج:</span>
          <span className="text-2xl font-bold text-brand-primary-900">
            {formatCurrency(productPrice)} ج.م
          </span>
        </div>
      </div>

      {/* Deposit Amount */}
      <div>
        <label htmlFor="deposit" className="block text-sm font-medium text-brand-primary-900 mb-1">
          المقدم <span className="text-brand-primary-700">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            id="deposit"
            value={deposit}
            onChange={(e) => handleDepositChange(e.target.value)}
            min={minDeposit}
            max={productPrice}
            step="0.01"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
              errors.deposit ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
            }`}
            placeholder="أدخل المقدم"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-offwhite-700">
            ج.م
          </span>
        </div>
        {errors.deposit && <p className="mt-1 text-sm text-brand-primary-700">{errors.deposit}</p>}
        {minDeposit > 0 && (
          <p className="mt-1 text-sm text-brand-offwhite-700">
            الحد الأدنى: {formatCurrency(minDeposit)} ج.م
          </p>
        )}
      </div>

      {/* Term Length Selector */}
      <div>
        <label className="block text-sm font-medium text-brand-primary-900 mb-2">
          مدة التقسيط <span className="text-brand-primary-700">*</span>
        </label>
        <div className="grid grid-cols-4 gap-3">
          {availableTerms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleTermChange(term as 3 | 6 | 12 | 24)}
              className={`px-4 py-3 border-2 rounded-lg font-medium transition-all ${
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
              <span className="text-brand-offwhite-700">سعر المنتج:</span>
              <span className="text-brand-primary-900 font-medium">
                {formatCurrency(productPrice)} ج.م
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-brand-offwhite-700">المقدم:</span>
              <span className="text-brand-primary-900 font-medium">
                -{' '}
                {formatCurrency(calculation.financedAmount - (productPrice - parseFloat(deposit)))}{' '}
                ج.م
              </span>
            </div>

            <div className="flex justify-between pt-2 border-t border-brand-offwhite-400">
              <span className="text-brand-offwhite-700">المبلغ الممول:</span>
              <span className="text-brand-primary-900 font-medium">
                {formatCurrency(calculation.financedAmount)} ج.م
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-brand-offwhite-700">
                نسبة التقسيط ({calculation.ratioMultiplier}):
              </span>
              <span className="text-brand-primary-900 font-medium">
                + {formatCurrency(calculation.totalWithRatio - calculation.financedAmount)} ج.م
              </span>
            </div>

            <div className="flex justify-between pt-2 border-t border-brand-offwhite-400">
              <span className="text-brand-offwhite-700">إجمالي المبلغ الممول:</span>
              <span className="text-brand-primary-900 font-medium">
                {formatCurrency(calculation.totalWithRatio)} ج.م
              </span>
            </div>

            <div className="flex justify-between bg-brand-secondary-100 -mx-4 px-4 py-3 mt-3">
              <span className="font-bold text-brand-primary-900">القسط الشهري:</span>
              <span className="text-2xl font-bold text-brand-primary-900">
                {formatCurrency(calculation.monthlyAmount)} ج.م
              </span>
            </div>

            <div className="flex justify-between pt-2 border-t border-brand-offwhite-400">
              <span className="font-bold text-brand-primary-900">إجمالي المدفوعات:</span>
              <span className="text-xl font-bold text-brand-primary-900">
                {formatCurrency(calculation.totalToPay)} ج.م
              </span>
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
            !wizardState.deposit ||
            !wizardState.termMonths ||
            !wizardState.calculation ||
            !!errors.deposit ||
            !!errors.term ||
            calculating
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
