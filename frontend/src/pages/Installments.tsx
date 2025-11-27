import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import InstallmentWizard from '../components/installments/InstallmentWizard';
import InstallmentsGrid from '../components/installments/InstallmentsGrid';
import InstallmentsFilters from '../components/installments/InstallmentsFilters';
import BulkActionsToolbar from '../components/installments/BulkActionsToolbar';
import BulkRemindersModal from '../components/installments/BulkRemindersModal';
import BulkExportModal from '../components/installments/BulkExportModal';
import ToastNotification from '../components/ToastNotification';
import installmentService from '../services/installmentService';
import { InstallmentListItem, InstallmentFilters } from '../types/installment';
import { useToast } from '../hooks/useToast';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { getErrorMessage, logError } from '../utils/errorHandling';

/**
 * InstallmentsPage component
 * Main page for installments management with wizard, filters, grid, and bulk actions
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9
 */
const Installments: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [installments, setInstallments] = useState<InstallmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [preSelectedCustomerId, setPreSelectedCustomerId] = useState<number | null>(null);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [filters, setFilters] = useState<InstallmentFilters>({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
  });

  const { toast, showToast, hideToast } = useToast();
  const {
    selectedIds,
    selectedIdsArray,
    selectionCount,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
  } = useBulkSelection();

  // Fetch installments
  const fetchInstallments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await installmentService.getInstallments(filters);
      setInstallments(response.data);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total || response.data.length);
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

  // Check for pre-selected customer from URL query parameter
  useEffect(() => {
    const customerIdParam = searchParams.get('customerId');
    if (customerIdParam) {
      const customerId = parseInt(customerIdParam);
      if (!isNaN(customerId)) {
        setPreSelectedCustomerId(customerId);
        setIsWizardOpen(true);
        // Remove the query parameter from URL
        searchParams.delete('customerId');
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, setSearchParams]);

  // Handle search change
  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
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

  // Handle bulk actions
  const handleSendReminders = useCallback(() => {
    setIsRemindersModalOpen(true);
  }, []);

  const handleConfirmReminders = useCallback(
    async (method: 'whatsapp' | 'sms' | 'both') => {
      try {
        // Use cached array instead of converting Set each time
        const result = await installmentService.sendBulkReminders(selectedIdsArray, method);

        // Show success message
        if (result.data.successCount > 0) {
          if (result.data.failedCount > 0) {
            // Partial success
            showToast(
              `تم إرسال ${result.data.successCount} تذكير بنجاح. فشل إرسال ${result.data.failedCount} تذكير`,
              'info'
            );
          } else {
            // Full success
            showToast(result.message, 'success');
          }
        } else {
          // All failed
          showToast('فشل إرسال جميع التذكيرات', 'error');
        }

        // Clear selection after successful sending
        if (result.data.successCount > 0) {
          clearSelection();
        }

        setIsRemindersModalOpen(false);
      } catch (err) {
        logError(err, 'Installments - handleConfirmReminders');
        const errorMessage = getErrorMessage(err);
        showToast(errorMessage, 'error');
      }
    },
    [selectedIdsArray, showToast, clearSelection]
  );

  const handleExport = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const handleConfirmExport = useCallback(
    async (format: 'excel' | 'pdf') => {
      try {
        // Use cached array instead of converting Set each time
        const installmentIds = selectedIdsArray;

        // Show loading toast
        showToast('جاري تصدير البيانات...', 'info');

        // Call export API
        const blob = await installmentService.bulkExport(installmentIds, format);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `installments_${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

        // Create download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Show success message
        showToast(`تم تصدير ${installmentIds.length} سجل بنجاح`, 'success');

        // Keep selection after export (as per requirements)
        setIsExportModalOpen(false);
      } catch (err) {
        logError(err, 'Installments - handleConfirmExport');
        const errorMessage = getErrorMessage(err);
        showToast(errorMessage, 'error');
      }
    },
    [selectedIdsArray, showToast]
  );

  const handleClearSelection = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Check if all current page items are selected
  const currentPageIds = installments.map((inst) => inst.id);
  const isCurrentPageAllSelected = isAllSelected(currentPageIds);

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
          onStatusChange={handleStatusChange}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          selectedCount={selectionCount}
          totalCount={totalCount}
          onSendReminders={handleSendReminders}
          onExport={handleExport}
          onClearSelection={handleClearSelection}
        />

        {/* Installments Grid */}
        <InstallmentsGrid
          installments={installments}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleSelectAll={toggleSelectAll}
          isAllSelected={isCurrentPageAllSelected}
        />

        {/* Installment Wizard */}
        <InstallmentWizard
          isOpen={isWizardOpen}
          onClose={handleCloseWizard}
          onSuccess={handleWizardSuccess}
          onError={handleWizardError}
          preSelectedCustomerId={preSelectedCustomerId}
        />

        {/* Bulk Reminders Modal */}
        <BulkRemindersModal
          isOpen={isRemindersModalOpen}
          selectedInstallments={installments.filter((inst) => selectedIds.has(inst.id))}
          onClose={() => setIsRemindersModalOpen(false)}
          onConfirm={handleConfirmReminders}
        />

        {/* Export Modal */}
        <BulkExportModal
          isOpen={isExportModalOpen}
          selectedCount={selectionCount}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleConfirmExport}
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
