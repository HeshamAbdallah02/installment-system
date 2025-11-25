import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import installmentService from '../../services/installmentService';
import type { InstallmentRatio } from '../../types/installment';

interface CustomInstallmentRatesProps {
  availableTerms: number[];
  customRates?: Record<number, number>;
  installmentPrice: number;
  minDeposit: number;
  onChange: (customRates: Record<number, number> | undefined) => void;
  disabled?: boolean;
}

/**
 * CustomInstallmentRates Component
 * Allows setting custom interest rates per term for specific products
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8
 */
const CustomInstallmentRates: React.FC<CustomInstallmentRatesProps> = ({
  availableTerms,
  customRates,
  installmentPrice,
  minDeposit,
  onChange,
  disabled = false,
}) => {
  const [useCustomRates, setUseCustomRates] = useState<boolean>(!!customRates);
  const [rates, setRates] = useState<Record<number, number>>(customRates || {});
  const [errors, setErrors] = useState<Record<number, string>>({});

  // Fetch default installment ratios - Requirement 12.3
  const { data: defaultRatios } = useQuery<InstallmentRatio[], Error>({
    queryKey: ['installmentRatios'],
    queryFn: () => installmentService.getInstallmentRatios(),
    staleTime: 30 * 60 * 1000, // 30 minutes cache
  });

  /**
   * Initialize rates when custom rates change
   */
  useEffect(() => {
    if (customRates) {
      setRates(customRates);
      setUseCustomRates(true);
    }
  }, [customRates]);

  /**
   * Validate rate is within acceptable range (0-20%)
   * Requirement 12.4
   */
  const validateRate = (rate: number): string | null => {
    if (rate < 1.0) {
      return 'المعدل يجب أن يكون 1.00 على الأقل (0% فائدة)';
    }
    if (rate > 1.2) {
      return 'المعدل يجب أن يكون 1.20 كحد أقصى (20% فائدة)';
    }
    return null;
  };

  /**
   * Handle custom rates toggle - Requirement 12.1
   */
  const handleToggle = (checked: boolean) => {
    setUseCustomRates(checked);

    if (!checked) {
      // Reset to default rates
      setRates({});
      setErrors({});
      onChange(undefined);
    } else {
      // Initialize with default ratios
      if (defaultRatios) {
        const initialRates: Record<number, number> = {};
        availableTerms.forEach((term) => {
          const defaultRatio = defaultRatios.find((r) => r.periodMonths === term);
          if (defaultRatio) {
            initialRates[term] = defaultRatio.ratioMultiplier;
          }
        });
        setRates(initialRates);
        onChange(initialRates);
      }
    }
  };

  /**
   * Handle rate change for a specific term - Requirement 12.2
   */
  const handleRateChange = (term: number, value: string) => {
    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return;
    }

    // Validate rate
    const error = validateRate(numValue);
    setErrors((prev) => ({
      ...prev,
      [term]: error || '',
    }));

    // Update rates
    const newRates = {
      ...rates,
      [term]: numValue,
    };
    setRates(newRates);

    // Only propagate if no errors
    if (!error) {
      onChange(newRates);
    }
  };

  /**
   * Reset to default rates - Requirement 12.5
   */
  const handleReset = () => {
    if (defaultRatios) {
      const defaultRates: Record<number, number> = {};
      availableTerms.forEach((term) => {
        const defaultRatio = defaultRatios.find((r) => r.periodMonths === term);
        if (defaultRatio) {
          defaultRates[term] = defaultRatio.ratioMultiplier;
        }
      });
      setRates(defaultRates);
      setErrors({});
      onChange(defaultRates);
    }
  };

  /**
   * Calculate monthly payment preview - Requirement 12.4
   */
  const calculateMonthlyPayment = (term: number, rate: number): number => {
    const financedAmount = installmentPrice - minDeposit;
    return (financedAmount * rate) / term;
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Get default ratio for a term
   */
  const getDefaultRatio = (term: number): number | undefined => {
    return defaultRatios?.find((r) => r.periodMonths === term)?.ratioMultiplier;
  };

  /**
   * Calculate interest percentage from ratio
   */
  const calculateInterestPercentage = (ratio: number): number => {
    return (ratio - 1.0) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Toggle Custom Rates - Requirement 12.1 */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useCustomRates}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={disabled}
            className="w-5 h-5 text-brand-primary-900 border-brand-offwhite-400 rounded focus:ring-2 focus:ring-brand-primary-900"
          />
          <span className="text-sm font-medium text-brand-primary-900">استخدام معدلات مخصصة</span>
        </label>

        {/* Reset Button - Requirement 12.5 */}
        {useCustomRates && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-offwhite-100 hover:bg-brand-offwhite-200 text-brand-primary-900 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>إعادة تعيين</span>
          </button>
        )}
      </div>

      {/* Custom Rates Inputs - Requirements 12.2, 12.4 */}
      {useCustomRates && (
        <div className="space-y-3 p-4 bg-brand-offwhite-50 rounded-lg border border-brand-offwhite-300">
          <p className="text-sm text-brand-offwhite-700 mb-3">
            المعدل المخصص = 1.00 (بدون فائدة) إلى 1.20 (20% فائدة)
          </p>

          {availableTerms.map((term) => {
            const currentRate = rates[term] || getDefaultRatio(term) || 1.0;
            const defaultRate = getDefaultRatio(term);
            const monthlyPayment = calculateMonthlyPayment(term, currentRate);
            const interestPercentage = calculateInterestPercentage(currentRate);

            return (
              <div key={term} className="bg-white rounded-lg p-4 border border-brand-offwhite-300">
                {/* Term Header */}
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-bold text-brand-primary-900">{term} شهر</h5>
                  {defaultRate && (
                    <span className="text-xs text-brand-offwhite-700">
                      المعدل الافتراضي: {defaultRate.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Rate Input */}
                <div className="mb-3">
                  <label
                    htmlFor={`rate-${term}`}
                    className="block text-xs text-brand-offwhite-700 mb-1"
                  >
                    معدل الضرب ({interestPercentage.toFixed(1)}% فائدة)
                  </label>
                  <input
                    type="number"
                    id={`rate-${term}`}
                    value={currentRate}
                    onChange={(e) => handleRateChange(term, e.target.value)}
                    min="1.00"
                    max="1.20"
                    step="0.01"
                    disabled={disabled}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                      errors[term]
                        ? 'border-brand-primary-700 bg-brand-primary-50'
                        : 'border-brand-offwhite-400'
                    }`}
                  />
                  {errors[term] && (
                    <p className="mt-1 text-xs text-brand-primary-700">{errors[term]}</p>
                  )}
                </div>

                {/* Monthly Payment Preview - Requirement 12.4 */}
                <div className="pt-3 border-t border-brand-offwhite-300">
                  <p className="text-xs text-brand-offwhite-700 mb-1">القسط الشهري المتوقع</p>
                  <p className="text-lg font-bold text-brand-primary-900">
                    {formatCurrency(monthlyPayment)} ج.م
                  </p>
                </div>
              </div>
            );
          })}

          {/* Custom Rates Badge Info - Requirement 12.6 */}
          <div className="flex items-center gap-2 p-3 bg-brand-secondary-50 rounded-lg border border-brand-secondary-400">
            <span className="px-2 py-1 bg-brand-secondary-400 text-brand-primary-900 text-xs font-bold rounded">
              معدلات مخصصة
            </span>
            <p className="text-xs text-brand-primary-900">
              سيتم عرض هذه الشارة على المنتج للإشارة إلى المعدلات المخصصة
            </p>
          </div>
        </div>
      )}

      {/* Info Message */}
      {!useCustomRates && (
        <p className="text-sm text-brand-offwhite-700 p-3 bg-brand-offwhite-50 rounded-lg">
          سيتم استخدام معدلات التقسيط الافتراضية للنظام
        </p>
      )}
    </div>
  );
};

export default CustomInstallmentRates;
