import React from 'react';
import {
  CubeIcon,
  TagIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  PercentBadgeIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';

/**
 * Product information interface for installment detail
 */
export interface ProductInfo {
  id: number;
  name: string;
  category: string;
  installmentPrice: number;
  imageUrl?: string;
  termMonths: number;
  interestRate: number;
  totalWithInterest: number;
  depositAmount: number;
  depositPercentage: number;
}

/**
 * Props for ProductInfoCard component
 */
interface ProductInfoCardProps {
  product: ProductInfo;
}

/**
 * ProductInfoCard Component
 * Displays product information on the installment detail page
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
const ProductInfoCard: React.FC<ProductInfoCardProps> = ({ product }) => {
  /**
   * Format currency in Egyptian format
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  /**
   * Get term display text
   */
  const getTermText = (months: number): string => {
    if (months === 3) return '3 أشهر';
    if (months === 6) return '6 أشهر';
    if (months === 12) return '12 شهر';
    if (months === 24) return '24 شهر';
    return `${months} شهر`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300" dir="rtl">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-brand-primary-900">معلومات المنتج</h2>
        <div className="p-2 bg-brand-offwhite-100 rounded-lg">
          <CubeIcon className="w-5 h-5 text-brand-primary-900" />
        </div>
      </div>

      {/* Product Image - Requirement: 5.2 */}
      {product.imageUrl && (
        <div className="mb-6">
          <div className="relative w-full h-48 bg-brand-offwhite-100 rounded-lg overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center">
                    <svg class="w-16 h-16 text-brand-offwhite-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                `;
              }}
            />
          </div>
        </div>
      )}

      {/* Product Information */}
      <div className="space-y-4">
        {/* Product Name - Requirement: 5.1, 5.2 */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-brand-offwhite-100 rounded-lg mt-0.5">
            <CubeIcon className="w-4 h-4 text-brand-offwhite-700" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-brand-offwhite-700 mb-1">اسم المنتج</p>
            <p className="text-sm font-bold text-brand-primary-900">{product.name}</p>
          </div>
        </div>

        {/* Category - Requirement: 5.1, 5.2 */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-brand-offwhite-100 rounded-lg mt-0.5">
            <TagIcon className="w-4 h-4 text-brand-offwhite-700" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-brand-offwhite-700 mb-1">الفئة</p>
            <p className="text-sm font-medium text-brand-primary-900">{product.category}</p>
          </div>
        </div>

        {/* Cash Price - Requirement: 5.1, 5.2, 5.3 */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-brand-offwhite-100 rounded-lg mt-0.5">
            <BanknotesIcon className="w-4 h-4 text-brand-offwhite-700" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-brand-offwhite-700 mb-1">السعر النقدي</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-brand-primary-900">
                {formatCurrency(product.installmentPrice)}
              </span>
              <span className="text-xs text-brand-offwhite-700">ج.م</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-brand-offwhite-300" />

      {/* Installment Terms - Requirements: 5.4, 5.5 */}
      <div className="space-y-3 mb-6">
        {/* Term Length - Requirement: 5.4 */}
        <div className="flex items-center justify-between p-3 bg-brand-offwhite-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-brand-offwhite-700" />
            <span className="text-sm text-brand-offwhite-700">مدة القسط</span>
          </div>
          <span className="text-sm font-bold text-brand-primary-900">
            {getTermText(product.termMonths)}
          </span>
        </div>

        {/* Interest Rate - Requirement: 5.4 */}
        <div className="flex items-center justify-between p-3 bg-brand-offwhite-50 rounded-lg">
          <div className="flex items-center gap-2">
            <PercentBadgeIcon className="w-4 h-4 text-brand-offwhite-700" />
            <span className="text-sm text-brand-offwhite-700">نسبة الفائدة</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-brand-primary-900">
              {formatPercentage(product.interestRate)}
            </span>
            <span className="text-xs text-brand-offwhite-700">%</span>
          </div>
        </div>

        {/* Total Cost with Interest - Requirement: 5.5 */}
        <div className="flex items-center justify-between p-3 bg-brand-secondary-50 rounded-lg border border-brand-secondary-200">
          <div className="flex items-center gap-2">
            <CalculatorIcon className="w-4 h-4 text-brand-secondary-700" />
            <span className="text-sm font-medium text-brand-secondary-900">التكلفة الكلية</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-brand-secondary-900">
              {formatCurrency(product.totalWithInterest)}
            </span>
            <span className="text-xs text-brand-secondary-700">ج.م</span>
          </div>
        </div>

        {/* Deposit Amount and Percentage - Requirement: 5.6 */}
        <div className="flex items-center justify-between p-3 bg-brand-offwhite-50 rounded-lg">
          <div className="flex items-center gap-2">
            <BanknotesIcon className="w-4 h-4 text-brand-offwhite-700" />
            <span className="text-sm text-brand-offwhite-700">المقدم</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-brand-primary-900">
                {formatCurrency(product.depositAmount)}
              </span>
              <span className="text-xs text-brand-offwhite-700">ج.م</span>
            </div>
            <span className="text-xs text-brand-offwhite-600">
              ({formatPercentage(product.depositPercentage)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(ProductInfoCard);
