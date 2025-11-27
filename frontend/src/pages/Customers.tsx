import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import CustomersTable from '../components/customers/CustomersTable';
import SearchAndFilters from '../components/customers/SearchAndFilters';
import AddCustomerModal from '../components/customers/AddCustomerModal';
import ToastNotification from '../components/ToastNotification';
import customerService from '../services/customerService';
import { Customer, CustomerFilters } from '../types/customer';
import { useToast } from '../hooks/useToast';
import { getErrorMessage, logError } from '../utils/errorHandling';

/**
 * CustomersPage component
 * Main page for customer list with search, filters, and pagination
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9
 */
const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: '',
    page: 1,
    limit: 20,
  });

  const { toast, showToast, hideToast } = useToast();

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await customerService.getCustomers(filters);
      setCustomers(response.data);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      logError(err, 'Customers - fetchCustomers');
      const errorMessage = getErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  // Fetch customers on mount and when filters change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle search change
  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  // Handle status filter change
  const handleStatusChange = useCallback((status: string) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // Handle modal open/close
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Handle customer creation success
  const handleCustomerSuccess = useCallback(
    (message: string) => {
      showToast(message, 'success');
      fetchCustomers(); // Refresh customer list
    },
    [showToast, fetchCustomers]
  );

  // Handle customer creation error
  const handleCustomerError = useCallback(
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
          <h1 className="text-3xl font-bold text-brand-primary-900">العملاء</h1>
          <button
            type="button"
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            <span>إضافة عميل جديد</span>
          </button>
        </div>

        {/* Search and Filters */}
        <SearchAndFilters onSearchChange={handleSearchChange} onStatusChange={handleStatusChange} />

        {/* Customers Table */}
        <CustomersTable
          customers={customers}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {/* Add Customer Modal */}
        <AddCustomerModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleCustomerSuccess}
          onError={handleCustomerError}
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

export default Customers;
