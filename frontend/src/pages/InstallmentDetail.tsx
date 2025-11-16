import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import KeyMetricsCards from '../components/installments/KeyMetricsCards';
import ActionsMenu from '../components/installments/ActionsMenu';
import NextPaymentDueCard from '../components/installments/NextPaymentDueCard';
import PaymentScheduleTable from '../components/installments/PaymentScheduleTable';
import PaymentTimeline from '../components/installments/PaymentTimeline';
import CustomerInfoCard from '../components/installments/CustomerInfoCard';
import ProductInfoCard from '../components/installments/ProductInfoCard';
import InstallmentStatisticsCard from '../components/installments/InstallmentStatisticsCard';
import ActivityLog from '../components/installments/ActivityLog';
import RecordPaymentModal from '../components/installments/RecordPaymentModal';
import EarlySettlementModal from '../components/installments/EarlySettlementModal';
import ModifyTermsModal from '../components/installments/ModifyTermsModal';
import PrintableAgreement from '../components/installments/PrintableAgreement';
import ErrorDisplay from '../components/common/ErrorDisplay';
import { InstallmentStats, Activity } from '../types/installment';
import { prepareAgreementData, triggerPrint } from '../utils/printAgreement';
import { useInstallmentDetail } from '../hooks/useInstallmentDetail';
import type { ScheduleItem } from '../components/installments/NextPaymentDueCard';
import type { PaymentRecord } from '../types/payment';
import type { CustomerInfo } from '../components/installments/CustomerInfoCard';
import type { ProductInfo } from '../components/installments/ProductInfoCard';

/**
 * Status badge component
 */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    ACTIVE: {
      label: 'نشط',
      className: 'bg-brand-secondary-100 text-brand-secondary-900 border-brand-secondary-400',
    },
    COMPLETED: {
      label: 'مكتمل',
      className: 'bg-brand-offwhite-200 text-brand-offwhite-900 border-brand-offwhite-500',
    },
    DEFAULTED: {
      label: 'متعثر',
      className: 'bg-brand-primary-50 text-brand-primary-900 border-brand-primary-900',
    },
    CANCELLED: {
      label: 'ملغي',
      className: 'bg-brand-offwhite-300 text-brand-offwhite-900 border-brand-offwhite-600',
    },
  };

  const config = statusConfig[status] || statusConfig.ACTIVE;

  return (
    <span
      className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
};

/**
 * Loading skeleton component
 */
const InstallmentDetailSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" dir="rtl">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-brand-offwhite-300 rounded-lg" />
        <div className="h-8 w-64 bg-brand-offwhite-300 rounded" />
        <div className="h-8 w-20 bg-brand-offwhite-300 rounded-full" />
      </div>
      <div className="h-10 w-32 bg-brand-offwhite-300 rounded-lg" />
    </div>

    {/* Metrics skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
          <div className="h-4 w-20 bg-brand-offwhite-300 rounded mb-2" />
          <div className="h-8 w-32 bg-brand-offwhite-300 rounded" />
        </div>
      ))}
    </div>

    {/* Content skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6 h-96" />
        <div className="bg-white rounded-lg shadow-md p-6 h-96" />
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6 h-64" />
        <div className="bg-white rounded-lg shadow-md p-6 h-64" />
      </div>
    </div>
  </div>
);

/**
 * InstallmentDetailPage component
 * Main page for viewing and managing installment details
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
 */
const InstallmentDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const installmentId = id ? parseInt(id, 10) : null;

  // Fetch installment data with error handling
  const { data: installment, loading, error, refetch } = useInstallmentDetail(installmentId);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isModifyTermsModalOpen, setIsModifyTermsModalOpen] = useState(false);
  const [preSelectedScheduleId, setPreSelectedScheduleId] = useState<number | undefined>(undefined);
  const [agreementData, setAgreementData] = useState<ReturnType<
    typeof prepareAgreementData
  > | null>(null);

  // Extract data from installment detail
  const nextPayment = installment?.nextDuePayment || null;
  const paymentSchedule: ScheduleItem[] = installment?.schedule || [];
  const paymentHistory: PaymentRecord[] = installment?.payments || [];
  const customerInfo: CustomerInfo | null = installment?.customer || null;
  const productInfo: ProductInfo | null = installment?.product || null;
  const statistics: InstallmentStats | null = installment?.statistics || null;
  const activities: Activity[] = installment?.activities || [];

  // Get pending payments for the modal
  const pendingPayments = paymentSchedule.filter(
    (item) => item.status === 'PENDING' || item.status === 'OVERDUE' || item.status === 'PARTIAL'
  );

  const handleBack = () => {
    navigate('/installments');
  };

  // Action handlers
  const handleRecordPayment = () => {
    setPreSelectedScheduleId(undefined);
    setIsPaymentModalOpen(true);
  };

  const handlePayNow = () => {
    // Open payment modal with next payment pre-selected
    if (nextPayment) {
      setPreSelectedScheduleId(nextPayment.id);
      setIsPaymentModalOpen(true);
    }
  };

  const handlePayScheduleItem = (scheduleId: number) => {
    setPreSelectedScheduleId(scheduleId);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentModalClose = () => {
    setIsPaymentModalOpen(false);
    setPreSelectedScheduleId(undefined);
  };

  const handlePaymentSuccess = () => {
    // Refresh installment data after successful payment
    refetch();
  };

  const handleViewReceipt = (paymentId: number) => {
    console.log('View receipt:', paymentId);
    // TODO: Open receipt modal or navigate to receipt page
  };

  const handleSendReminder = () => {
    console.log('Send reminder');
  };

  const handlePrintAgreement = () => {
    if (!installment) return;

    // TODO: Get actual branch and seller info from context/API
    const branchName = 'الفرع الرئيسي';
    const sellerName = installment.createdBy || 'البائع';

    // Prepare agreement data
    const agreement = prepareAgreementData({
      installment,
      schedule: paymentSchedule,
      branchName,
      branchAddress: undefined,
      branchPhone: undefined,
      sellerName,
    });

    // Set agreement data to render the printable component
    setAgreementData(agreement);

    // Trigger print after component renders
    triggerPrint();
  };

  const handleModifyTerms = () => {
    setIsModifyTermsModalOpen(true);
  };

  const handleModifyTermsModalClose = () => {
    setIsModifyTermsModalOpen(false);
  };

  const handleModifyTermsSuccess = () => {
    // Refresh installment data after successful modification
    refetch();
  };

  const handleEarlySettlement = () => {
    setIsSettlementModalOpen(true);
  };

  const handleSettlementModalClose = () => {
    setIsSettlementModalOpen(false);
  };

  const handleSettlementSuccess = () => {
    // Refresh installment data after successful settlement
    refetch();
  };

  const handleCancelInstallment = () => {
    console.log('Cancel installment');
  };

  const handleExport = () => {
    console.log('Export');
  };

  const [activityLimit, setActivityLimit] = useState(10);

  const handleShowMoreActivities = () => {
    setActivityLimit((prev) => prev + 10);
  };

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout>
        <InstallmentDetailSkeleton />
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12" dir="rtl">
          <ErrorDisplay
            error={error}
            onRetry={refetch}
            onDismiss={() => navigate('/installments')}
            variant="banner"
          />
        </div>
      </DashboardLayout>
    );
  }

  // Show not found state
  if (!installment) {
    return (
      <DashboardLayout>
        <div className="text-center py-12" dir="rtl">
          <p className="text-brand-offwhite-700 text-lg mb-4">القسط غير موجود</p>
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950"
          >
            العودة إلى قائمة الأقساط
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-brand-offwhite-200 rounded-lg transition-colors"
              aria-label="العودة"
            >
              <ArrowRightIcon className="w-6 h-6 text-brand-primary-900" />
            </button>
            <h1 className="text-3xl font-bold text-brand-primary-900">
              قسط #{installment.planId} - {installment.customerName}
            </h1>
            <StatusBadge status={installment.status} />
          </div>
          <ActionsMenu
            onRecordPayment={handleRecordPayment}
            onSendReminder={handleSendReminder}
            onPrintAgreement={handlePrintAgreement}
            onModifyTerms={handleModifyTerms}
            onEarlySettlement={handleEarlySettlement}
            onCancelInstallment={handleCancelInstallment}
            onExport={handleExport}
          />
        </div>

        {/* Key Metrics Row */}
        <KeyMetricsCards
          totalAmount={installment.totalAmount}
          depositAmount={installment.depositAmount}
          remainingBalance={installment.remainingBalance}
          monthlyAmount={installment.monthlyAmount}
          progressPercentage={installment.progressPercentage}
        />

        {/* Next Payment Due Card */}
        <NextPaymentDueCard nextPayment={nextPayment} onPayNow={handlePayNow} />

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Schedule and History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Schedule Section */}
            <PaymentScheduleTable schedule={paymentSchedule} onPayClick={handlePayScheduleItem} />

            {/* Payment History Section */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
              <h2 className="text-xl font-bold text-brand-primary-900 mb-6">سجل الدفعات</h2>
              <PaymentTimeline payments={paymentHistory} onViewReceipt={handleViewReceipt} />
            </div>
          </div>

          {/* Right Column - Info Cards */}
          <div className="space-y-6">
            {/* Customer Info Card */}
            {customerInfo && <CustomerInfoCard customer={customerInfo} />}

            {/* Product Info Card */}
            {productInfo && <ProductInfoCard product={productInfo} />}

            {/* Statistics Card */}
            {statistics && <InstallmentStatisticsCard statistics={statistics} />}

            {/* Activity Log Section */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300">
              <h2 className="text-lg font-bold text-brand-primary-900 mb-4">سجل النشاط</h2>
              <ActivityLog
                activities={activities}
                limit={activityLimit}
                onShowMore={handleShowMoreActivities}
              />
            </div>
          </div>
        </div>

        {/* Record Payment Modal */}
        {installment && (
          <RecordPaymentModal
            isOpen={isPaymentModalOpen}
            onClose={handlePaymentModalClose}
            onSuccess={handlePaymentSuccess}
            installmentId={installment.id}
            pendingPayments={pendingPayments}
            preSelectedScheduleId={preSelectedScheduleId}
          />
        )}

        {/* Early Settlement Modal */}
        {installment && (
          <EarlySettlementModal
            isOpen={isSettlementModalOpen}
            onClose={handleSettlementModalClose}
            onSuccess={handleSettlementSuccess}
            installmentId={installment.id}
            remainingBalance={installment.remainingBalance}
            remainingPrincipal={
              installment.financedAmount - (installment.totalAmount - installment.remainingBalance)
            }
            remainingInterest={installment.totalWithInterest - installment.totalAmount}
          />
        )}

        {/* Modify Terms Modal */}
        {installment && (
          <ModifyTermsModal
            isOpen={isModifyTermsModalOpen}
            onClose={handleModifyTermsModalClose}
            onSuccess={handleModifyTermsSuccess}
            installmentId={installment.id}
            currentTerms={{
              monthlyAmount: installment.monthlyAmount,
              termMonths: installment.termMonths,
              interestRate: installment.interestRate,
            }}
            remainingBalance={installment.remainingBalance}
            completionPercentage={installment.progressPercentage}
          />
        )}

        {/* Printable Agreement (hidden on screen, visible on print) */}
        {agreementData && <PrintableAgreement agreement={agreementData} />}
      </div>
    </DashboardLayout>
  );
};

export default InstallmentDetailPage;
