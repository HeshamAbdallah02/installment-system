import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import PersonalInfoCard from '../components/customers/PersonalInfoCard';
import ActiveInstallmentsSummary from '../components/customers/ActiveInstallmentsSummary';
import InstallmentsGrid from '../components/customers/InstallmentsGrid';
import PaymentHistoryTimeline from '../components/customers/PaymentHistoryTimeline';
import EditCustomerModal from '../components/customers/EditCustomerModal';
import CustomerDetailSkeleton from '../components/customers/CustomerDetailSkeleton';
import ToastNotification from '../components/ToastNotification';
import { useCustomerDetail } from '../hooks/useCustomerDetail';
import { useToast } from '../hooks/useToast';
import { queryKeys } from '../lib/queryClient';

/**
 * CustomerDetailPage component
 * Displays comprehensive customer information with lazy loading and caching
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9, 9 (Lazy load customer details)
 */
const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // Use lazy loading hook with caching
  const customerId = id ? parseInt(id) : undefined;
  const { data: customer, isLoading: loading, error } = useCustomerDetail(customerId);

  // Show error toast if query fails
  React.useEffect(() => {
    if (error) {
      showToast(error.message, 'error');
    }
  }, [error, showToast]);

  // Handle edit modal
  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  // Handle customer update success - invalidate cache to refetch
  const handleUpdateSuccess = (message: string) => {
    showToast(message, 'success');
    // Invalidate customer detail cache to trigger refetch
    if (customerId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
    }
  };

  // Handle customer update error
  const handleUpdateError = (message: string) => {
    showToast(message, 'error');
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/customers');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <CustomerDetailSkeleton />
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-brand-offwhite-700 text-lg">لم يتم العثور على العميل</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950"
          >
            العودة إلى قائمة العملاء
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
            <h1 className="text-3xl font-bold text-brand-primary-900">{customer.fullName}</h1>
          </div>
        </div>

        {/* Personal Info Card */}
        <PersonalInfoCard customer={customer} onEdit={handleOpenEditModal} />

        {/* Active Installments Summary */}
        <ActiveInstallmentsSummary
          totalActiveInstallments={customer.totalActiveInstallments}
          totalRemainingBalance={customer.totalRemainingBalance}
        />

        {/* Installments Grid */}
        <InstallmentsGrid installments={customer.installments} customerId={customer.id} />

        {/* Payment History Timeline */}
        <PaymentHistoryTimeline paymentHistory={customer.paymentHistory} />

        {/* Edit Customer Modal */}
        <EditCustomerModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          customer={customer}
          onSuccess={handleUpdateSuccess}
          onError={handleUpdateError}
        />

        {/* Toast Notification */}
        <ToastNotification
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      </div>
    </DashboardLayout>
  );
};

export default CustomerDetail;
