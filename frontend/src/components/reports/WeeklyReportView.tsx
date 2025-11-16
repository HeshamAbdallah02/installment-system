import React from 'react';
import {
  BanknotesIcon,
  ReceiptPercentIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { WeeklyReportData } from '../../types/report';

interface WeeklyReportViewProps {
  data: WeeklyReportData;
  isLoading: boolean;
}

const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({ data, isLoading }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  if (isLoading || !data || !data.dailyTotals) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary-900"></div>
        <p className="mt-4 text-brand-offwhite-700">جاري تحميل التقرير...</p>
      </div>
    );
  }

  // Prepare line chart data
  const chartData = data.dailyTotals.map((day) => ({
    date: formatDate(day.date),
    amount: day.amount,
    count: day.count,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">إجمالي التحصيل</p>
              <p className="text-2xl font-bold text-brand-primary-900">
                {formatCurrency(data.totalCollected)}
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-primary-50 rounded-full flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6 text-brand-primary-900" />
            </div>
          </div>
        </div>

        {/* Payment Count */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">عدد المدفوعات</p>
              <p className="text-2xl font-bold text-brand-primary-900">{data.paymentCount}</p>
            </div>
            <div className="w-12 h-12 bg-brand-secondary-50 rounded-full flex items-center justify-center">
              <ReceiptPercentIcon className="w-6 h-6 text-brand-secondary-600" />
            </div>
          </div>
        </div>

        {/* Average Daily Collection */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">متوسط التحصيل اليومي</p>
              <p className="text-2xl font-bold text-brand-primary-900">
                {formatCurrency(data.averageDaily)}
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-primary-50 rounded-full flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6 text-brand-primary-900" />
            </div>
          </div>
        </div>

        {/* Comparison to Previous Week */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">مقارنة بالأسبوع السابق</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-brand-primary-900">
                  {Math.abs(data.comparisonToPrevious).toFixed(1)}%
                </p>
                {data.comparisonToPrevious >= 0 ? (
                  <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                data.comparisonToPrevious >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              {data.comparisonToPrevious >= 0 ? (
                <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collection Trends Line Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
        <h3 className="text-lg font-bold text-brand-primary-900 mb-4">اتجاهات التحصيل الأسبوعية</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px', direction: 'rtl' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'amount') return [formatCurrency(value), 'المبلغ'];
                  return [value, 'العدد'];
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  direction: 'rtl',
                }}
              />
              <Legend
                wrapperStyle={{ direction: 'rtl' }}
                formatter={(value) => {
                  if (value === 'amount') return 'المبلغ';
                  if (value === 'count') return 'العدد';
                  return value;
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#560001"
                strokeWidth={2}
                dot={{ fill: '#560001', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-brand-offwhite-700 py-8">لا توجد بيانات لعرضها</p>
        )}
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white rounded-lg shadow-md border border-brand-offwhite-300 overflow-hidden">
        <div className="px-6 py-4 bg-brand-primary-900">
          <h3 className="text-lg font-bold text-white">التفصيل اليومي</h3>
        </div>
        <div className="overflow-x-auto">
          {data.dailyTotals.length > 0 ? (
            <table className="w-full">
              <thead className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    عدد المدفوعات
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    إجمالي المبلغ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-offwhite-200">
                {data.dailyTotals.map((day, index) => (
                  <tr key={index} className="hover:bg-brand-offwhite-50">
                    <td className="px-6 py-4 text-sm font-medium text-brand-primary-900">
                      {new Intl.DateTimeFormat('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }).format(new Date(day.date))}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-offwhite-700">{day.count}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-brand-primary-900">
                      {formatCurrency(day.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-brand-offwhite-100 border-t-2 border-brand-primary-900">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-brand-primary-900">الإجمالي</td>
                  <td className="px-6 py-4 text-sm font-bold text-brand-primary-900">
                    {data.paymentCount}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-brand-primary-900">
                    {formatCurrency(data.totalCollected)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-center text-brand-offwhite-700 py-8">لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* Collector Performance Table */}
      <div className="bg-white rounded-lg shadow-md border border-brand-offwhite-300 overflow-hidden">
        <div className="px-6 py-4 bg-brand-primary-900">
          <h3 className="text-lg font-bold text-white">أداء المحصلين</h3>
        </div>
        <div className="overflow-x-auto">
          {data.collectorPerformance.length > 0 ? (
            <table className="w-full">
              <thead className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    المحصل
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    عدد المدفوعات
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    إجمالي التحصيل
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-offwhite-200">
                {data.collectorPerformance.map((collector) => (
                  <tr key={collector.collectorId} className="hover:bg-brand-offwhite-50">
                    <td className="px-6 py-4 text-sm font-medium text-brand-primary-900">
                      {collector.collectorName}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-offwhite-700">
                      {collector.paymentCount}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-brand-primary-900">
                      {formatCurrency(collector.totalCollected)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-brand-offwhite-700 py-8">لا توجد بيانات</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyReportView;
