import React from 'react';
import {
  BanknotesIcon,
  // ReceiptPercentIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  UsersIcon,
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
import type { MonthlyReportData } from '../../types/report';

interface MonthlyReportViewProps {
  data: MonthlyReportData;
  isLoading: boolean;
}

const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({ data, isLoading }) => {
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

        {/* Collection Rate */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">معدل التحصيل</p>
              <p className="text-2xl font-bold text-brand-primary-900">
                {data.collectionRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-secondary-50 rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-brand-secondary-600" />
            </div>
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">المتأخرات</p>
              <p className="text-2xl font-bold text-brand-primary-900">
                {formatCurrency(data.overdueAmount)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Comparison to Previous Month */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">مقارنة بالشهر السابق</p>
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

      {/* Collection Trends Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
        <h3 className="text-lg font-bold text-brand-primary-900 mb-4">اتجاهات التحصيل الشهرية</h3>
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
                formatter={(value: number) => [formatCurrency(value), 'المبلغ']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  direction: 'rtl',
                }}
              />
              <Legend wrapperStyle={{ direction: 'rtl' }} formatter={() => 'المبلغ'} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#560001"
                strokeWidth={2}
                dot={{ fill: '#560001', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-brand-offwhite-700 py-8">لا توجد بيانات لعرضها</p>
        )}
      </div>

      {/* Top 5 Customers Table */}
      <div className="bg-white rounded-lg shadow-md border border-brand-offwhite-300 overflow-hidden">
        <div className="px-6 py-4 bg-brand-primary-900">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white">أفضل 5 عملاء</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          {data.topCustomers.length > 0 ? (
            <table className="w-full">
              <thead className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    الترتيب
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    العميل
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    عدد المدفوعات
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    إجمالي المدفوع
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-offwhite-200">
                {data.topCustomers.map((customer, index) => (
                  <tr key={customer.customerId} className="hover:bg-brand-offwhite-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-secondary-100 text-brand-primary-900 font-bold text-sm">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-brand-primary-900">
                      {customer.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-offwhite-700">
                      {customer.paymentCount}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-brand-primary-900">
                      {formatCurrency(customer.totalPaid)}
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
                  <th className="px-6 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    النسبة من الإجمالي
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-offwhite-200">
                {data.collectorPerformance.map((collector) => {
                  const percentage = (collector.totalCollected / data.totalCollected) * 100;
                  return (
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-brand-offwhite-200 rounded-full h-2 relative overflow-hidden">
                            <div
                              className="bg-brand-primary-900 h-2 rounded-full absolute top-0 right-0"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-brand-offwhite-700 min-w-[3rem]">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-brand-offwhite-700 py-8">لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <p className="text-sm text-brand-offwhite-700 mb-2">عدد المدفوعات</p>
          <p className="text-3xl font-bold text-brand-primary-900">{data.paymentCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <p className="text-sm text-brand-offwhite-700 mb-2">متوسط التحصيل اليومي</p>
          <p className="text-3xl font-bold text-brand-primary-900">
            {formatCurrency(data.averageDaily)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <p className="text-sm text-brand-offwhite-700 mb-2">عدد العملاء النشطين</p>
          <p className="text-3xl font-bold text-brand-primary-900">{data.topCustomers.length}</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReportView;
