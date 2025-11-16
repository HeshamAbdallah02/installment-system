import React from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import type { ProductStatistics as ProductStatsType } from '../../types/product';

interface ProductStatisticsProps {
  statistics: ProductStatsType;
}

/**
 * ProductStatistics Component
 * Displays product sales statistics with visual indicators
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 */
const ProductStatistics: React.FC<ProductStatisticsProps> = ({ statistics }) => {
  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (date: Date | null): string => {
    if (!date) return 'لا يوجد';

    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  /**
   * Get sales trend icon and color - Requirement 11.5
   */
  const getSalesTrendDisplay = () => {
    switch (statistics.salesTrend) {
      case 'INCREASING':
        return {
          icon: <ArrowTrendingUpIcon className="w-5 h-5" />,
          text: 'متزايد',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'DECREASING':
        return {
          icon: <ArrowTrendingDownIcon className="w-5 h-5" />,
          text: 'متناقص',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      case 'STABLE':
      default:
        return {
          icon: <MinusIcon className="w-5 h-5" />,
          text: 'مستقر',
          color: 'text-brand-secondary-500',
          bgColor: 'bg-brand-secondary-50',
        };
    }
  };

  const trendDisplay = getSalesTrendDisplay();

  /**
   * Get conversion rate color based on percentage
   */
  const getConversionRateColor = (rate: number): string => {
    if (rate >= 10) return 'text-green-600';
    if (rate >= 5) return 'text-brand-secondary-500';
    return 'text-brand-offwhite-700';
  };

  return (
    <div className="bg-white rounded-lg border border-brand-offwhite-300 p-6">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-6">
        <ChartBarIcon className="w-6 h-6 text-brand-primary-900" />
        <h3 className="text-xl font-bold text-brand-primary-900">إحصائيات المبيعات</h3>
      </div>

      {/* Installments Overview - Requirements 11.2, 11.3 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-brand-offwhite-50 rounded-lg p-4 text-center">
          <p className="text-sm text-brand-offwhite-700 mb-2">إجمالي الأقساط</p>
          <p className="text-3xl font-bold text-brand-primary-900">
            {statistics.totalInstallments}
          </p>
        </div>
        <div className="bg-brand-secondary-50 rounded-lg p-4 text-center border border-brand-secondary-400">
          <p className="text-sm text-brand-offwhite-700 mb-2">الأقساط النشطة</p>
          <p className="text-3xl font-bold text-brand-primary-900">
            {statistics.activeInstallments}
          </p>
        </div>
        <div className="bg-brand-offwhite-50 rounded-lg p-4 text-center">
          <p className="text-sm text-brand-offwhite-700 mb-2">الأقساط المكتملة</p>
          <p className="text-3xl font-bold text-brand-primary-900">
            {statistics.completedInstallments}
          </p>
        </div>
      </div>

      {/* Revenue - Requirement 11.4 */}
      <div className="mb-6 p-4 bg-gradient-to-br from-brand-primary-900 to-brand-primary-950 rounded-lg text-white">
        <div className="flex items-center gap-2 mb-2">
          <CurrencyDollarIcon className="w-5 h-5" />
          <p className="text-sm opacity-90">إجمالي الإيرادات</p>
        </div>
        <p className="text-3xl font-bold">{formatCurrency(statistics.totalRevenue)} ج.م</p>
      </div>

      {/* Terms Analysis - Requirements 11.5, 11.6 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-brand-offwhite-50 rounded-lg p-4">
          <p className="text-sm text-brand-offwhite-700 mb-2">متوسط المدة</p>
          <p className="text-2xl font-bold text-brand-primary-900">{statistics.averageTerm} شهر</p>
        </div>
        <div className="bg-brand-offwhite-50 rounded-lg p-4">
          <p className="text-sm text-brand-offwhite-700 mb-2">المدة الأكثر شيوعاً</p>
          <p className="text-2xl font-bold text-brand-primary-900">{statistics.popularTerm} شهر</p>
        </div>
      </div>

      {/* Sales Trend - Requirement 11.7 */}
      <div className="mb-6">
        <p className="text-sm text-brand-offwhite-700 mb-2">اتجاه المبيعات</p>
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${trendDisplay.bgColor}`}>
          <span className={trendDisplay.color}>{trendDisplay.icon}</span>
          <span className={`font-bold ${trendDisplay.color}`}>{trendDisplay.text}</span>
        </div>
      </div>

      {/* Last Sale Date - Requirement 11.8 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CalendarIcon className="w-5 h-5 text-brand-offwhite-700" />
          <p className="text-sm text-brand-offwhite-700">آخر عملية بيع</p>
        </div>
        <p className="text-lg font-medium text-brand-primary-900">
          {formatDate(statistics.lastSaleDate)}
        </p>
      </div>

      {/* Conversion Rate - Requirement 11.8 */}
      <div className="pt-6 border-t border-brand-offwhite-300">
        <p className="text-sm text-brand-offwhite-700 mb-2">معدل التحويل</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-brand-offwhite-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-brand-primary-900 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(statistics.conversionRate, 100)}%` }}
            />
          </div>
          <span
            className={`text-2xl font-bold ${getConversionRateColor(statistics.conversionRate)}`}
          >
            {statistics.conversionRate.toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-brand-offwhite-700 mt-2">نسبة المشاهدات التي تحولت إلى أقساط</p>
      </div>

      {/* No data message */}
      {statistics.totalInstallments === 0 && (
        <div className="text-center py-8 text-brand-offwhite-700">
          <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>لا توجد إحصائيات متاحة بعد</p>
          <p className="text-sm mt-2">سيتم عرض الإحصائيات بعد إنشاء أول قسط</p>
        </div>
      )}
    </div>
  );
};

export default ProductStatistics;
