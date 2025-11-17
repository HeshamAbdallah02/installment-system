import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DailyReportView from '../components/reports/DailyReportView';
import WeeklyReportView from '../components/reports/WeeklyReportView';
import MonthlyReportView from '../components/reports/MonthlyReportView';
import {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  exportReport,
} from '../services/reportService';
import { useRealtimePayments } from '../hooks/useRealtimePayments';
import type {
  ReportType,
  DailyReportData,
  WeeklyReportData,
  MonthlyReportData,
} from '../types/report';

const CollectionReports: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePreset, setDatePreset] = useState<string>('today');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Enable real-time payment updates for reports
  useRealtimePayments({ enabled: true });

  // Calculate date ranges based on preset
  const dateRange = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    switch (datePreset) {
      case 'today':
        return { start: today, end: today };
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return { start: yesterday, end: yesterday };
      }
      case 'thisWeek':
        return { start: startOfWeek, end: endOfWeek };
      case 'thisMonth':
        return { start: startOfMonth, end: endOfMonth };
      case 'custom':
        return { start: selectedDate, end: selectedDate };
      default:
        return { start: today, end: today };
    }
  }, [datePreset, selectedDate]);

  // Fetch daily report with caching
  const { data: dailyData, isLoading: dailyLoading } = useQuery<DailyReportData>({
    queryKey: ['dailyReport', dateRange.start],
    queryFn: () => getDailyReport(dateRange.start),
    enabled: reportType === 'daily',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });

  // Fetch weekly report with caching
  const { data: weeklyData, isLoading: weeklyLoading } = useQuery<WeeklyReportData>({
    queryKey: ['weeklyReport', dateRange.start, dateRange.end],
    queryFn: () => getWeeklyReport(dateRange.start, dateRange.end),
    enabled: reportType === 'weekly',
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Fetch monthly report with caching
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery<MonthlyReportData>({
    queryKey: ['monthlyReport', dateRange.start.getMonth(), dateRange.start.getFullYear()],
    queryFn: () => getMonthlyReport(dateRange.start.getMonth() + 1, dateRange.start.getFullYear()),
    enabled: reportType === 'monthly',
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    // Adjust date preset based on report type
    if (type === 'weekly' && datePreset === 'today') {
      setDatePreset('thisWeek');
    } else if (type === 'monthly' && (datePreset === 'today' || datePreset === 'thisWeek')) {
      setDatePreset('thisMonth');
    }
  };

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      setSelectedDate(new Date());
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setIsExporting(true);
      setShowExportModal(false);

      const blob = await exportReport(reportType, dateRange.start, dateRange.end, format);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with date
      const dateStr = dateRange.start.toISOString().split('T')[0];
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      link.download = `تقرير-التحصيل-${reportType}-${dateStr}.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      alert(`تم تصدير التقرير بنجاح`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('فشل تصدير التقرير. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <DashboardLayout title="تقارير التحصيل">
      {/* Controls Section */}
      <div className="bg-white rounded-xl shadow-lg border border-brand-offwhite-300 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-brand-primary-900 mb-2">
              نوع التقرير
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleReportTypeChange('daily')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  reportType === 'daily'
                    ? 'bg-brand-primary-900 text-white'
                    : 'bg-brand-offwhite-100 text-brand-primary-900 hover:bg-brand-offwhite-200'
                }`}
              >
                يومي
              </button>
              <button
                type="button"
                onClick={() => handleReportTypeChange('weekly')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  reportType === 'weekly'
                    ? 'bg-brand-primary-900 text-white'
                    : 'bg-brand-offwhite-100 text-brand-primary-900 hover:bg-brand-offwhite-200'
                }`}
              >
                أسبوعي
              </button>
              <button
                type="button"
                onClick={() => handleReportTypeChange('monthly')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  reportType === 'monthly'
                    ? 'bg-brand-primary-900 text-white'
                    : 'bg-brand-offwhite-100 text-brand-primary-900 hover:bg-brand-offwhite-200'
                }`}
              >
                شهري
              </button>
            </div>
          </div>

          {/* Date Range Picker with Presets */}
          <div>
            <label
              htmlFor="date-preset"
              className="block text-sm font-semibold text-brand-primary-900 mb-2"
            >
              الفترة الزمنية
            </label>
            <select
              id="date-preset"
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="w-full px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-sm"
            >
              {reportType === 'daily' && (
                <>
                  <option value="today">اليوم</option>
                  <option value="yesterday">أمس</option>
                </>
              )}
              {reportType === 'weekly' && <option value="thisWeek">هذا الأسبوع</option>}
              {reportType === 'monthly' && <option value="thisMonth">هذا الشهر</option>}
              <option value="custom">تاريخ مخصص</option>
            </select>
          </div>

          {/* Custom Date Picker */}
          {datePreset === 'custom' && (
            <div>
              <label
                htmlFor="custom-date"
                className="block text-sm font-semibold text-brand-primary-900 mb-2"
              >
                <CalendarIcon className="w-4 h-4 inline ml-1" />
                التاريخ
              </label>
              <input
                id="custom-date"
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 text-sm"
              />
            </div>
          )}

          {/* Export Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
              className="w-full px-4 py-2 bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              تصدير التقرير
            </button>
          </div>
        </div>

        {/* Selected Date Range Display */}
        <div className="mt-4 pt-4 border-t border-brand-offwhite-300">
          <div className="flex items-center gap-2 text-sm text-brand-offwhite-700">
            <DocumentTextIcon className="w-5 h-5" />
            <span>
              التقرير{' '}
              {reportType === 'daily' ? 'اليومي' : reportType === 'weekly' ? 'الأسبوعي' : 'الشهري'}
              {' - '}
              {dateRange.start.toDateString() === dateRange.end.toDateString()
                ? formatDate(dateRange.start)
                : `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Report View */}
      <div>
        {reportType === 'daily' && dailyData && (
          <DailyReportView data={dailyData} isLoading={dailyLoading} />
        )}
        {reportType === 'weekly' && weeklyData && (
          <WeeklyReportView data={weeklyData} isLoading={weeklyLoading} />
        )}
        {reportType === 'monthly' && monthlyData && (
          <MonthlyReportView data={monthlyData} isLoading={monthlyLoading} />
        )}

        {/* Loading State */}
        {(dailyLoading || weeklyLoading || monthlyLoading) && (
          <div className="bg-white rounded-xl shadow-lg border border-brand-offwhite-300 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary-900 mb-4"></div>
            <p className="text-brand-offwhite-700">جاري تحميل التقرير...</p>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-brand-offwhite-300">
              <h3 className="text-xl font-bold text-brand-primary-900">تصدير التقرير</h3>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-brand-offwhite-700 hover:text-brand-primary-900 transition-colors"
                aria-label="إغلاق"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-brand-offwhite-700 mb-6">اختر صيغة التصدير المطلوبة:</p>

              <div className="space-y-3">
                {/* Excel Export Button */}
                <button
                  type="button"
                  onClick={() => handleExport('excel')}
                  disabled={isExporting}
                  className="w-full px-6 py-4 bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <ArrowDownTrayIcon className="w-6 h-6" />
                    <div className="text-right">
                      <div className="font-bold">Excel</div>
                      <div className="text-sm font-normal">ملف Excel (.xlsx)</div>
                    </div>
                  </div>
                  <div className="text-sm opacity-70 group-hover:opacity-100">
                    مناسب للتحليل والمعالجة
                  </div>
                </button>

                {/* PDF Export Button */}
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                  className="w-full px-6 py-4 bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-6 h-6" />
                    <div className="text-right">
                      <div className="font-bold">PDF</div>
                      <div className="text-sm font-normal">ملف PDF (.pdf)</div>
                    </div>
                  </div>
                  <div className="text-sm opacity-70 group-hover:opacity-100">
                    مناسب للطباعة والأرشفة
                  </div>
                </button>
              </div>

              {/* Export Info */}
              <div className="mt-6 p-4 bg-brand-offwhite-100 rounded-lg">
                <p className="text-sm text-brand-offwhite-700">
                  <span className="font-semibold text-brand-primary-900">ملاحظة:</span> سيتم تصدير
                  جميع البيانات المعروضة حالياً في التقرير بما في ذلك الملخصات والتفاصيل.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-brand-offwhite-300">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
                className="px-6 py-2 bg-brand-offwhite-200 hover:bg-brand-offwhite-300 text-brand-primary-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exporting Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-brand-primary-900 mb-4"></div>
              <p className="text-brand-primary-900 font-semibold text-lg mb-2">جاري التصدير...</p>
              <p className="text-brand-offwhite-700 text-sm text-center">
                يرجى الانتظار حتى يتم إنشاء الملف
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CollectionReports;
