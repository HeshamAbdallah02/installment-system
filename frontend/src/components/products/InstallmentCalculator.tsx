import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import installmentService from '../../services/installmentService';
import type { Product } from '../../types/product';
import type { InstallmentRatio } from '../../types/installment';

interface InstallmentCalculatorProps {
  product: Product;
}

interface CalculationResult {
  termMonths: number;
  depositAmount: number;
  financedAmount: number;
  ratioMultiplier: number;
  monthlyPayment: number;
  totalCost: number;
  interestAmount: number;
  interestPercentage: number;
}

/**
 * InstallmentCalculator Component
 * Displays installment calculations for each available term
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9
 * Performance: Memoized calculations, cached ratios
 */
const InstallmentCalculator: React.FC<InstallmentCalculatorProps> = ({ product }) => {
  const minDeposit = product.minDepositAmount || product.cashPrice * 0.2; // Default 20% if not set
  const [depositAmount, setDepositAmount] = useState<number>(minDeposit);

  // Fetch installment ratios - Requirement 9.3
  // Performance: Cache for 30 minutes
  const { data: ratios } = useQuery<InstallmentRatio[], Error>({
    queryKey: ['installmentRatios'],
    queryFn: () => installmentService.getInstallmentRatios(),
    staleTime: 30 * 60 * 1000, // 30 minutes cache
  });

  /**
   * Calculate installments for all available terms
   * Requirements: 9.3, 9.4, 9.5
   * Performance: Memoized to avoid recalculation on every render
   */
  const calculations = useMemo<CalculationResult[]>(() => {
    if (!ratios || !product.availableTerms || product.availableTerms.length === 0) {
      return [];
    }

    return product.availableTerms.map((termMonths) => {
      // Find the ratio for this term
      const ratio = ratios.find((r) => r.periodMonths === termMonths);
      const ratioMultiplier = ratio?.ratioMultiplier || 1.0;

      // Use custom rate if available for this product
      const effectiveRatio = product.customRates?.[termMonths] || ratioMultiplier;

      // Calculate financed amount
      const financedAmount = product.cashPrice - depositAmount;

      // Calculate total cost with ratio
      const totalCost = depositAmount + financedAmount * effectiveRatio;

      // Calculate monthly payment
      const monthlyPayment = (financedAmount * effectiveRatio) / termMonths;

      // Calculate interest
      const interestAmount = totalCost - product.cashPrice;
      const interestPercentage = (interestAmount / product.cashPrice) * 100;

      return {
        termMonths,
        depositAmount,
        financedAmount,
        ratioMultiplier: effectiveRatio,
        monthlyPayment,
        totalCost,
        interestAmount,
        interestPercentage,
      };
    });
  }, [depositAmount, product.cashPrice, product.availableTerms, product.customRates, ratios]);

  /**
   * Format currency - Requirement 9.6
   * Performance: Memoized formatter
   */
  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return (amount: number): string => formatter.format(amount);
  }, []);

  /**
   * Handle deposit change with validation - Requirement 9.2
   */
  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;

    // Ensure deposit is at least minimum and not more than cash price
    if (value >= minDeposit && value <= product.cashPrice) {
      setDepositAmount(value);
    }
  };

  /**
   * Calculate savings when paying cash - Requirement 9.8
   */
  const calculateSavings = (totalCost: number): number => {
    return totalCost - product.cashPrice;
  };

  return (
    <div className="bg-white rounded-lg border border-brand-offwhite-300 p-6">
      {/* Section Header */}
      <h3 className="text-xl font-bold text-brand-primary-900 mb-4">حاسبة الأقساط</h3>

      {/* Deposit Input - Requirements 9.2, 9.4 */}
      <div className="mb-6">
        <label htmlFor="deposit" className="block text-sm font-medium text-brand-primary-900 mb-2">
          المقدم (الحد الأدنى: {formatCurrency(minDeposit)} ج.م)
        </label>
        <div className="relative">
          <input
            type="number"
            id="deposit"
            value={depositAmount}
            onChange={handleDepositChange}
            min={minDeposit}
            max={product.cashPrice}
            step="100"
            className="w-full px-4 py-3 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-lg"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-offwhite-700">
            ج.م
          </span>
        </div>
        {depositAmount < minDeposit && (
          <p className="mt-2 text-sm text-brand-primary-900">
            المقدم يجب أن يكون على الأقل {formatCurrency(minDeposit)} ج.م
          </p>
        )}
      </div>

      {/* Calculations for each term - Requirement 9.3 */}
      <div className="space-y-4">
        {calculations.map((calc) => (
          <div
            key={calc.termMonths}
            className="bg-brand-offwhite-50 rounded-lg p-4 border border-brand-offwhite-300 hover:border-brand-primary-900 transition-colors"
          >
            {/* Term Header */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-brand-primary-900">{calc.termMonths} شهر</h4>
              {product.customRates?.[calc.termMonths] && (
                <span className="px-2 py-1 bg-brand-secondary-400 text-brand-primary-900 text-xs font-bold rounded">
                  معدلات مخصصة
                </span>
              )}
            </div>

            {/* Monthly Payment - Requirement 9.3 */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-sm text-brand-offwhite-700 mb-1">القسط الشهري</p>
                <p className="text-2xl font-bold text-brand-primary-900">
                  {formatCurrency(calc.monthlyPayment)} ج.م
                </p>
              </div>
              <div>
                <p className="text-sm text-brand-offwhite-700 mb-1">الإجمالي</p>
                <p className="text-xl font-bold text-brand-primary-900">
                  {formatCurrency(calc.totalCost)} ج.م
                </p>
              </div>
            </div>

            {/* Interest Details - Requirement 9.3 */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-brand-offwhite-300">
              <div>
                <p className="text-xs text-brand-offwhite-700 mb-1">مبلغ الفائدة</p>
                <p className="text-sm font-medium text-brand-offwhite-900">
                  {formatCurrency(calc.interestAmount)} ج.م
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-offwhite-700 mb-1">نسبة الفائدة</p>
                <p className="text-sm font-medium text-brand-offwhite-900">
                  {calc.interestPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cash vs Installment Comparison - Requirements 9.7, 9.8 */}
      {calculations.length > 0 && (
        <div className="mt-6 p-4 bg-brand-secondary-50 rounded-lg border border-brand-secondary-400">
          <h4 className="text-sm font-bold text-brand-primary-900 mb-3">
            مقارنة: الدفع النقدي مقابل التقسيط
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-brand-offwhite-700 mb-1">السعر النقدي</p>
              <p className="text-lg font-bold text-brand-primary-900">
                {formatCurrency(product.cashPrice)} ج.م
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-offwhite-700 mb-1">
                أقل سعر بالتقسيط ({calculations[0].termMonths} شهر)
              </p>
              <p className="text-lg font-bold text-brand-primary-900">
                {formatCurrency(calculations[0].totalCost)} ج.م
              </p>
            </div>
          </div>

          {/* Highlight Savings - Requirement 9.8 */}
          <div className="mt-3 pt-3 border-t border-brand-secondary-400">
            <p className="text-sm text-brand-primary-900">
              <span className="font-bold">
                وفر {formatCurrency(calculateSavings(calculations[0].totalCost))} ج.م
              </span>{' '}
              عند الدفع نقداً
            </p>
          </div>
        </div>
      )}

      {/* No terms available message */}
      {(!product.availableTerms || product.availableTerms.length === 0) && (
        <div className="text-center py-8 text-brand-offwhite-700">
          <p>لا توجد شروط تقسيط متاحة لهذا المنتج</p>
        </div>
      )}
    </div>
  );
};

export default InstallmentCalculator;
