import React from 'react';
import {
  BanknotesIcon,
  ReceiptPercentIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { DailyReportData } from '../../types/report';

interface DailyReportViewProps {
  data: DailyReportData;
  isLoading: boolean;
}

const DailyReportView: React.FC<DailyReportViewProps> = ({ data, isLoading }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  // Return loading state if data is not ready
  if (isLoading || !data || !data.paymentMethodBreakdown) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-900"></div>
        <p className="mt-2 text-brand-offwhite-700">جاري التحميل...</p>
      </div>
    );
  }

  // Prepare pie chart data
  const pieChartData = [
    { name: 'نقدي', value: data.paymentMethodBreakdown.cash, color: '#560001' },
    { name: 'تحويل بنكي', value: data.paymentMethodBreakdown.bankTransfer, color: '#eacb95' },
    { name: 'بطاقة', value: data.paymentMethodBreakdown.card, color: '#7f0002' },
    { name: 'شيك', value: data.paymentMethodBreakdown.check, color: '#d4a574' },
  ].filter((item) => item.value > 0);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <BanknotesIcon className="w-5 h-5" />;
      case 'BANK_TRANSFER':
        return <BuildingLibraryIcon className="w-5 h-5" />;
      case 'CARD':
        return <CreditCardIcon className="w-5 h-5" />;
      case 'CHECK':
        return <CheckIcon className="w-5 h-5" />;
      default:
        return <ReceiptPercentIcon className="w-5 h-5" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'نقدي';
      case 'BANK_TRANSFER':
        return 'تحويل بنكي';
      case 'CARD':
        return 'بطاقة';
      case 'CHECK':
        return 'شيك';
      default:
        return method;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary-900"></div>
        <p className="mt-4 text-brand-offwhite-700">جاري تحميل التقرير...</p>
      </div>
    );
  }

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

        {/* Cash Amount */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">نقدي</p>
              <p className="text-2xl font-bold text-brand-primary-900">
                {formatCurrency(data.paymentMethodBreakdown.cash)}
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-primary-50 rounded-full flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6 text-brand-primary-900" />
            </div>
          </div>
        </div>

        {/* Bank Transfer Amount */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-offwhite-700 mb-1">تحويل بنكي</p>
              <p className="text-2xl font-bold text-brand-primary-900">
                {formatCurrency(data.paymentMethodBreakdown.bankTransfer)}
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-secondary-50 rounded-full flex items-center justify-center">
              <BuildingLibraryIcon className="w-6 h-6 text-brand-secondary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown Pie Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
        <h3 className="text-lg font-bold text-brand-primary-900 mb-4">توزيع طرق الدفع</h3>
        {pieChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  direction: 'rtl',
                }}
              />
              <Legend
                wrapperStyle={{ direction: 'rtl' }}
                formatter={(value) => <span className="text-brand-primary-900">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-brand-offwhite-700 py-8">لا توجد بيانات لعرضها</p>
        )}
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

      {/* Detailed Payments List */}
      <div className="bg-white rounded-lg shadow-md border border-brand-offwhite-300 overflow-hidden">
        <div className="px-6 py-4 bg-brand-primary-900">
          <h3 className="text-lg font-bold text-white">تفاصيل المدفوعات</h3>
        </div>
        <div className="overflow-x-auto">
          {data.payments.length > 0 ? (
            <table className="w-full">
              <thead className="bg-brand-offwhite-100 border-b border-brand-offwhite-300">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    رقم الإيصال
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    التاريخ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    العميل
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    المبلغ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    طريقة الدفع
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-brand-primary-900">
                    المحصل
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-offwhite-200">
                {data.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-brand-offwhite-50">
                    <td className="px-4 py-4 text-sm font-medium text-brand-primary-900">
                      {payment.paymentNumber}
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-offwhite-700">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-offwhite-700">
                      {payment.customerName}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-brand-primary-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-brand-offwhite-700">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                        <span>{getPaymentMethodLabel(payment.paymentMethod)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-offwhite-700">
                      {payment.collectorName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-brand-offwhite-700 py-8">لا توجد مدفوعات</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReportView;
