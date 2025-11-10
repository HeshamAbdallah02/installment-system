import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import InstallmentWizard from '../components/installments/InstallmentWizard';
import InstallmentsGrid from '../components/installments/InstallmentsGrid';
import InstallmentsFilters from '../components/installments/InstallmentsFilters';
import ToastNotification from '../components/ToastNotification';
import installmentService from '../services/installmentService';
import { InstallmentListItem, InstallmentFilters } from '../types/installment';
import { useToast } from '../hooks/useToast';
import { getErrorMessage, logError } from '../utils/errorHandling';

/**
 * InstallmentsPage component
 * Main page for installments management with wizard, filters, and grid
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9
 */
const Installments: React.FC = () => {
  const [installments, setInstallments] = useState<InstallmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [filters, setFilters] = useState<InstallmentFilters>({
    search: '',
    branch: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
  });

  const { toast, showToast, hideToast } = useToast();

  // Fetch installments
  const fetchInstallments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await installmentService.getInstallments(filters);
      setInstallments(response.data);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      logError(err, 'Installments - fetchInstallments');
      const errorMessage = getErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  // Fetch installments on mount and when filters change
  useEffect(() => {
    fetchInstallments();
  }, [fetchInstallments]);

  // Handle search change
  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  // Handle branch filter change
  const handleBranchChange = useCallback((branch: string) => {
    setFilters((prev) => ({ ...prev, branch, page: 1 }));
  }, []);

  // Handle status filter change
  const handleStatusChange = useCallback((status: string) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  // Handle date range change
  const handleDateRangeChange = useCallback((startDate: string, endDate: string) => {
    setFilters((prev) => ({ ...prev, startDate, endDate, page: 1 }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // Handle wizard open/close
  const handleOpenWizard = useCallback(() => {
    setIsWizardOpen(true);
  }, []);

  const handleCloseWizard = useCallback(() => {
    setIsWizardOpen(false);
  }, []);

  // Handle wizard success
  const handleWizardSuccess = useCallback(
    (message: string) => {
      showToast(message, 'success');
      fetchInstallments(); // Refresh installments list
    },
    [showToast, fetchInstallments]
  );

  // Handle wizard error
  const handleWizardError = useCallback(
    (message: string) => {
      showToast(message, 'error');
    },
    [showToast]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-brand-primary-900">الأقساط النشطة</h1>
          <button
            type="button"
            onClick={handleOpenWizard}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            <span>إنشاء قسط جديد</span>
          </button>
        </div>

        {/* Filters */}
        <InstallmentsFilters
          onSearchChange={handleSearchChange}
          onBranchChange={handleBranchChange}
          onStatusChange={handleStatusChange}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Installments Grid */}
        <InstallmentsGrid
          installments={installments}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {/* Installment Wizard */}
        <InstallmentWizard
          isOpen={isWizardOpen}
          onClose={handleCloseWizard}
          onSuccess={handleWizardSuccess}
          onError={handleWizardError}
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

export default Installments;
