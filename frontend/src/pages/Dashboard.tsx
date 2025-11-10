import React, { useState, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCardIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PlusCircleIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import MetricCard from '../components/dashboard/MetricCard';
import QuickActionButton from '../components/dashboard/QuickActionButton';
import ActivitiesFeed from '../components/dashboard/ActivitiesFeed';
import AlertBanner from '../components/dashboard/AlertBanner';
import AlertSettingsPanel from '../components/dashboard/AlertSettingsPanel';
import ToastNotification from '../components/ToastNotification';
// Lazy load chart components for code splitting - Requirement 9.6
import {
  CollectionTrendsChart,
  BranchDistributionChart,
  TopProductsChart,
  ChartLoader,
} from '../components/dashboard/LazyCharts';
import {
  useMetrics,
  useCollectionTrends,
  useBranchDistribution,
  useTopProducts,
  useRecentActivities,
} from '../hooks/useDashboard';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { useAlerts } from '../hooks/useAlerts';
import type { Activity } from '../store/dashboardSlice';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  // Requirement 8.2: Hide activities feed on tablet, show via button
  const [showActivitiesOnTablet, setShowActivitiesOnTablet] = useState(false);

  // Fetch all dashboard data using React Query hooks with parallel requests - Requirement 9.3, 9.6
  // React Query automatically handles parallel requests when hooks are called together
  const { data: metrics, isLoading: metricsLoading } = useMetrics();
  const {
    data: collectionTrends,
    isLoading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends,
  } = useCollectionTrends(6);
  const {
    data: branchDistribution,
    isLoading: branchLoading,
    error: branchError,
    refetch: refetchBranch,
  } = useBranchDistribution('current_month');
  const {
    data: topProducts,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useTopProducts();
  // Limit activities to 50 items for performance - Requirement 9.3, 9.6
  const {
    data: activities,
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useRecentActivities(50);

  // Set up real-time WebSocket updates
  const { toast, closeToast } = useRealtimeUpdates();

  // Set up alert system - Requirement 10.1-10.4
  const { alerts, dismissAlert, criticalAlerts, settings, updateSettings, resetSettings } =
    useAlerts(metrics ?? null, activities ?? []);

  // Merge high-priority alerts into activities feed - Requirement 10.2
  // Memoize to avoid recalculation on every render - Requirement 9.6
  const activitiesWithAlerts = useMemo(() => {
    if (!activities) return [];

    // Convert critical alerts to activity format for the feed
    const alertActivities: Activity[] = criticalAlerts.map((alert) => ({
      id: alert.id,
      type: 'overdue' as const,
      title: alert.title,
      description: alert.message,
      timestamp: alert.timestamp.toISOString(),
      userId: 0,
      userName: 'النظام',
      metadata: alert.metadata,
    }));

    // Combine and sort by timestamp (newest first)
    // Limit to 50 items for performance - Requirement 9.3, 9.6
    return [...alertActivities, ...activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);
  }, [activities, criticalAlerts]);

  // Quick action handlers
  const handleAddInstallment = async () => {
    setLoadingAction('add-installment');
    // TODO: Navigate to installment wizard when implemented
    setTimeout(() => {
      navigate('/installments');
      setLoadingAction(null);
    }, 500);
  };

  const handleRecordPayment = async () => {
    setLoadingAction('record-payment');
    // TODO: Open payment modal when implemented
    setTimeout(() => {
      alert('فتح نافذة تسجيل الدفعة - قريباً');
      setLoadingAction(null);
    }, 500);
  };

  const handleViewTodaysDues = async () => {
    setLoadingAction('view-dues');
    // TODO: Navigate to filtered payment list when implemented
    setTimeout(() => {
      alert('عرض المستحقات اليوم - قريباً');
      setLoadingAction(null);
    }, 500);
  };

  const handleSendReminders = async () => {
    setLoadingAction('send-reminders');
    // TODO: Open reminders modal when implemented
    setTimeout(() => {
      alert('فتح نافذة إرسال التذكيرات - قريباً');
      setLoadingAction(null);
    }, 500);
  };

  const handleBranchClick = (branchId: number) => {
    // TODO: Navigate to branch-specific view when implemented
    console.log('Branch clicked:', branchId);
  };

  const handleProductClick = (productId: number) => {
    // TODO: Navigate to product-specific installments view when implemented
    console.log('Product clicked:', productId);
  };

  return (
    <DashboardLayout title="لوحة التحكم">
      {/* Toast Notification for real-time updates */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />

      {/* Alert Settings Panel - Requirement 10.3: Settings panel in dashboard header */}
      <div className="flex justify-start mb-4">
        <AlertSettingsPanel
          settings={settings}
          onUpdateSettings={updateSettings}
          onResetSettings={resetSettings}
        />
      </div>

      {/* Alert Banner - Requirement 10.2: Display alerts at top of dashboard */}
      <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

      {/* Metrics Section - 4 MetricCards */}
      {/* Requirement 8.2: 2-column grid on tablet, Requirement 8.3: 4-column grid on desktop */}
      <section className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-4 tablet:gap-6 mb-6 tablet:mb-8">
        <MetricCard
          title="إجمالي الأقساط النشطة"
          value={metrics?.activeInstallments.count ?? 0}
          trend={
            metrics?.activeInstallments.trend
              ? {
                  value: metrics.activeInstallments.trend,
                  direction: metrics.activeInstallments.trend >= 0 ? 'up' : 'down',
                }
              : undefined
          }
          icon={<CreditCardIcon className="w-6 h-6" />}
          format="number"
          loading={metricsLoading}
        />

        <MetricCard
          title="المدفوعات المستحقة"
          value={metrics?.pendingPayments.amount ?? 0}
          trend={
            metrics?.pendingPayments.trend
              ? {
                  value: metrics.pendingPayments.trend,
                  direction: metrics.pendingPayments.trend >= 0 ? 'up' : 'down',
                }
              : undefined
          }
          icon={<BanknotesIcon className="w-6 h-6" />}
          format="currency"
          loading={metricsLoading}
        />

        <MetricCard
          title="المبالغ المتأخرة"
          value={metrics?.overdueAmounts.amount ?? 0}
          trend={
            metrics?.overdueAmounts.trend
              ? {
                  value: metrics.overdueAmounts.trend,
                  direction: metrics.overdueAmounts.trend >= 0 ? 'up' : 'down',
                }
              : undefined
          }
          icon={<ExclamationTriangleIcon className="w-6 h-6" />}
          format="currency"
          alert={metrics?.overdueAmounts.alert ?? false}
          loading={metricsLoading}
        />

        <MetricCard
          title="معدل التحصيل"
          value={metrics?.collectionRate.percentage ?? 0}
          trend={
            metrics?.collectionRate.trend
              ? {
                  value: metrics.collectionRate.trend,
                  direction: metrics.collectionRate.trend >= 0 ? 'up' : 'down',
                }
              : undefined
          }
          icon={<ChartBarIcon className="w-6 h-6" />}
          format="percentage"
          alert={metrics?.collectionRate.alert ?? false}
          loading={metricsLoading}
        />
      </section>

      {/* Charts Section - 3 charts in grid with lazy loading */}
      {/* Requirement 8.2: Stack vertically on tablet, Requirement 8.4: 2-column grid on desktop */}
      <section className="grid grid-cols-1 desktop:grid-cols-2 gap-4 tablet:gap-6 mb-6 tablet:mb-8">
        <div className="desktop:col-span-2">
          <Suspense fallback={<ChartLoader />}>
            <CollectionTrendsChart
              data={collectionTrends ?? []}
              loading={trendsLoading}
              error={trendsError ? 'فشل تحميل اتجاه التحصيل. يرجى المحاولة مرة أخرى' : undefined}
              onRetry={() => refetchTrends()}
              onAddPayment={handleRecordPayment}
            />
          </Suspense>
        </div>

        <div>
          <Suspense fallback={<ChartLoader />}>
            <BranchDistributionChart
              data={branchDistribution ?? []}
              loading={branchLoading}
              error={branchError ? 'فشل تحميل توزيع الفروع. يرجى المحاولة مرة أخرى' : undefined}
              onRetry={() => refetchBranch()}
              onBranchClick={handleBranchClick}
            />
          </Suspense>
        </div>

        <div>
          <Suspense fallback={<ChartLoader />}>
            <TopProductsChart
              data={topProducts ?? []}
              loading={productsLoading}
              error={productsError ? 'فشل تحميل أفضل المنتجات. يرجى المحاولة مرة أخرى' : undefined}
              onRetry={() => refetchProducts()}
              onProductClick={handleProductClick}
              onAddInstallment={handleAddInstallment}
            />
          </Suspense>
        </div>
      </section>

      {/* Quick Actions Section */}
      {/* Requirement 8.2: Show quick actions prominently on tablet */}
      <section className="mb-6 tablet:mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300">
          <h3 className="text-lg font-bold text-brand-primary-900 text-right mb-4">
            إجراءات سريعة
          </h3>
          <div className="grid grid-cols-2 tablet:grid-cols-4 desktop:grid-cols-4 gap-3">
            <QuickActionButton
              label="إضافة قسط جديد"
              icon={<PlusCircleIcon className="w-8 h-8 tablet:w-10 tablet:h-10" />}
              onClick={handleAddInstallment}
              loading={loadingAction === 'add-installment'}
            />

            <QuickActionButton
              label="تسجيل دفعة"
              icon={<CurrencyDollarIcon className="w-8 h-8 tablet:w-10 tablet:h-10" />}
              onClick={handleRecordPayment}
              loading={loadingAction === 'record-payment'}
            />

            <QuickActionButton
              label="عرض المستحقات اليوم"
              icon={<CalendarDaysIcon className="w-8 h-8 tablet:w-10 tablet:h-10" />}
              onClick={handleViewTodaysDues}
              loading={loadingAction === 'view-dues'}
            />

            <QuickActionButton
              label="إرسال تذكيرات"
              icon={<BellAlertIcon className="w-8 h-8 tablet:w-10 tablet:h-10" />}
              onClick={handleSendReminders}
              loading={loadingAction === 'send-reminders'}
            />
          </div>
        </div>
      </section>

      {/* Activities Feed Section */}
      {/* Requirement 8.2: Hide on tablet (show via button), Requirement 8.7: Show in sidebar on desktop */}
      <section>
        {/* Button to toggle activities on tablet - Requirement 8.2 */}
        <div className="tablet:block desktop:hidden mb-4">
          <button
            type="button"
            onClick={() => setShowActivitiesOnTablet(!showActivitiesOnTablet)}
            className="w-full px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg shadow-lg transition-colors duration-300 flex items-center justify-center gap-2"
            style={{ minHeight: '44px' }} // Requirement 8.6: 44px minimum touch target
          >
            <BellAlertIcon className="w-6 h-6" />
            <span>{showActivitiesOnTablet ? 'إخفاء الأنشطة الأخيرة' : 'عرض الأنشطة الأخيرة'}</span>
          </button>
        </div>

        {/* Activities Feed - Hidden on tablet unless toggled, always visible on desktop */}
        <div
          className={`${showActivitiesOnTablet ? 'block' : 'hidden'} tablet:${showActivitiesOnTablet ? 'block' : 'hidden'} desktop:block`}
        >
          <ActivitiesFeed
            activities={activitiesWithAlerts}
            loading={activitiesLoading}
            autoRefresh={true}
            onRefresh={refetchActivities}
          />
        </div>
      </section>
    </DashboardLayout>
  );
};

export default Dashboard;
