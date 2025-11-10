import React from 'react';
import { CalendarIcon, BanknotesIcon, CreditCardIcon } from '@heroicons/react/24/outline';

interface RevenueForecastMonth {
  month: string;
  year: number;
  expectedAmount: number;
  installmentCount: number;
}

const RevenueForecastTable: React.FC = () => {
  // Mock data - TODO: Replace with actual API call that calculates from scheduled payments
  const forecastData: RevenueForecastMonth[] = [
    {
      month: 'ديسمبر',
      year: 2024,
      expectedAmount: 450000,
      installmentCount: 45,
    },
    {
      month: 'يناير',
      year: 2025,
      expectedAmount: 520000,
      installmentCount: 52,
    },
    {
      month: 'فبراير',
      year: 2025,
      expectedAmount: 480000,
      installmentCount: 48,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ar-EG').format(value);
  };

  const totalExpected = forecastData.reduce((sum, month) => sum + month.expectedAmount, 0);
  const totalInstallments = forecastData.reduce((sum, month) => sum + month.installmentCount, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-brand-offwhite-300 overflow-hidden">
      <div className="p-6 border-b border-brand-offwhite-300">
        <h2 className="text-xl font-bold text-brand-primary-900 text-right">
          توقعات الإيرادات للأشهر القادمة
        </h2>
        <p className="text-sm text-brand-offwhite-700 text-right mt-2">
          بناءً على الدفعات المجدولة للأقساط النشطة
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" dir="rtl">
          <thead className="bg-brand-primary-900 text-white">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  <span>الشهر</span>
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <BanknotesIcon className="w-5 h-5" />
                  <span>المبلغ المتوقع</span>
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5" />
                  <span>عدد الأقساط</span>
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold">متوسط القسط</th>
            </tr>
          </thead>
          <tbody>
            {forecastData.map((month, index) => {
              const averageInstallment = month.expectedAmount / month.installmentCount;
              return (
                <tr
                  key={`${month.month}-${month.year}`}
                  className={`border-b border-brand-offwhite-200 hover:bg-brand-offwhite-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-brand-offwhite-50'
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-brand-primary-900">
                    {month.month} {month.year}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-brand-secondary-700">
                    {formatCurrency(month.expectedAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-offwhite-900">
                    {formatNumber(month.installmentCount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-offwhite-900">
                    {formatCurrency(averageInstallment)}
                  </td>
                </tr>
              );
            })}
            {/* Total Row */}
            <tr className="bg-brand-secondary-50 font-bold border-t-2 border-brand-primary-900">
              <td className="px-6 py-4 text-sm text-brand-primary-900">الإجمالي</td>
              <td className="px-6 py-4 text-sm text-brand-primary-900">
                {formatCurrency(totalExpected)}
              </td>
              <td className="px-6 py-4 text-sm text-brand-primary-900">
                {formatNumber(totalInstallments)}
              </td>
              <td className="px-6 py-4 text-sm text-brand-primary-900">
                {formatCurrency(totalExpected / totalInstallments)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="p-6 bg-brand-offwhite-50 border-t border-brand-offwhite-300">
        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-brand-offwhite-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-secondary-100 flex items-center justify-center">
                <BanknotesIcon className="w-6 h-6 text-brand-secondary-700" />
              </div>
              <div>
                <p className="text-xs text-brand-offwhite-700">إجمالي الإيرادات المتوقعة</p>
                <p className="text-lg font-bold text-brand-primary-900">
                  {formatCurrency(totalExpected)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-brand-offwhite-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-primary-100 flex items-center justify-center">
                <CreditCardIcon className="w-6 h-6 text-brand-primary-700" />
              </div>
              <div>
                <p className="text-xs text-brand-offwhite-700">إجمالي الأقساط المجدولة</p>
                <p className="text-lg font-bold text-brand-primary-900">
                  {formatNumber(totalInstallments)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-brand-offwhite-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-offwhite-200 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-brand-offwhite-700" />
              </div>
              <div>
                <p className="text-xs text-brand-offwhite-700">متوسط الإيرادات الشهرية</p>
                <p className="text-lg font-bold text-brand-primary-900">
                  {formatCurrency(totalExpected / forecastData.length)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueForecastTable;
