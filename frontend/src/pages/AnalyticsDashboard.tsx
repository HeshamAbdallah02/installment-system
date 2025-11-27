import React, { useState } from 'react';
import { ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import PaymentDistributionPieChart from '../components/analytics/PaymentDistributionPieChart';
import CustomerPaymentPatternsScatter from '../components/analytics/CustomerPaymentPatternsScatter';
import RevenueForecastTable from '../components/analytics/RevenueForecastTable';

const AnalyticsDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Set default date range to last 30 days
  React.useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // TODO: Implement actual export functionality
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('تصدير البيانات - قريباً');
    } catch (error) {
      console.error('Export failed:', error);
      alert('فشل تصدير البيانات');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout title="التحليلات التفصيلية">
      {/* Filters and Export Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300 mb-6">
        <div className="flex flex-col tablet:flex-row tablet:items-center tablet:justify-between gap-4">
          {/* Date Range Filter */}
          <div className="flex flex-col tablet:flex-row items-start tablet:items-center gap-4">
            <label className="text-sm font-semibold text-brand-primary-900">الفترة الزمنية:</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-2 pr-10 border border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-sm"
                  dir="rtl"
                  aria-label="تاريخ البداية"
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-offwhite-600 pointer-events-none" />
              </div>
              <span className="text-brand-offwhite-700">إلى</span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-2 pr-10 border border-brand-offwhite-400 rounded-lg focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-sm"
                  dir="rtl"
                  aria-label="تاريخ النهاية"
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-offwhite-600 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 font-semibold rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-brand-primary-900 border-t-transparent rounded-full animate-spin"></div>
                <span>جاري التصدير...</span>
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>تصدير إلى Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analytics Components Grid */}
      <div className="space-y-6">
        {/* Charts Row */}
        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
          <PaymentDistributionPieChart startDate={startDate} endDate={endDate} />
          <CustomerPaymentPatternsScatter startDate={startDate} endDate={endDate} />
        </div>

        {/* Revenue Forecast */}
        <RevenueForecastTable />
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsDashboard;
