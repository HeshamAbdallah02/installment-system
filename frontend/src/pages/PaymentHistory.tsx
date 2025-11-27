import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import PaymentHistoryTable from '../components/payments/PaymentHistoryTable';
import PaymentDetailsModal from '../components/payments/PaymentDetailsModal';
import ReversePaymentModal from '../components/payments/ReversePaymentModal';
import ReceiptTemplate from '../components/payments/ReceiptTemplate';
import { getPaymentHistory, getReceiptData } from '../services/paymentService';
import { useDebounce } from '../hooks/useDebounce';
import { useRealtimePayments } from '../hooks/useRealtimePayments';
import type {
  PaymentHistoryFilters,
  PaymentRecord,
  PaymentHistoryResponse,
  ReceiptData,
} from '../types/payment';

const PaymentHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptPaymentId, setReceiptPaymentId] = useState<number | null>(null);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [paymentToReverse, setPaymentToReverse] = useState<PaymentRecord | null>(null);

  // Enable real-time payment updates
  useRealtimePayments({ enabled: true });

  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Combine filters with debounced search
  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch]
  );

  // Fetch payment history with caching and stale time
  const { data: historyData, isLoading } = useQuery<PaymentHistoryResponse>({
    queryKey: ['paymentHistory', queryFilters],
    queryFn: () => getPaymentHistory(queryFilters),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Reset to page 1 when searching
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleDateRangeChange = (startDate?: Date, endDate?: Date) => {
    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate,
      page: 1,
    }));
  };

  const handlePaymentMethodChange = (method: string) => {
    setFilters((prev) => ({
      ...prev,
      paymentMethod: method || undefined,
      page: 1,
    }));
  };

  // Fetch receipt data when showing receipt (lazy loaded)
  const { data: receiptData } = useQuery<ReceiptData>({
    queryKey: ['receipt', receiptPaymentId],
    queryFn: () => getReceiptData(receiptPaymentId!),
    enabled: !!receiptPaymentId && showReceipt,
    staleTime: 10 * 60 * 1000, // Cache receipts for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const handleViewDetails = (paymentId: number) => {
    setSelectedPaymentId(paymentId);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPaymentId(null);
  };

  const handlePrintReceipt = (paymentId: number) => {
    setReceiptPaymentId(paymentId);
    setShowReceipt(true);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceiptPaymentId(null);
  };

  const handleReversePayment = (paymentId: number) => {
    // Find the payment in the current data
    const payment = historyData?.payments.find((p) => p.id === paymentId);
    if (payment) {
      setPaymentToReverse(payment);
      setShowReverseModal(true);
    }
  };

  const handleCloseReverseModal = () => {
    setShowReverseModal(false);
    setPaymentToReverse(null);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export payment history');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      page: 1,
      limit: 20,
    });
  };

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm ||
      filters.startDate ||
      filters.endDate ||
      filters.paymentMethod ||
      filters.collector
    );
  }, [searchTerm, filters]);

  return (
    <DashboardLayout title="سجل المدفوعات">
      {/* Page Header with Export Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-brand-offwhite-700 text-sm">عرض وإدارة جميع المدفوعات المسجلة</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 font-medium rounded-lg transition-colors"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>تصدير</span>
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-lg border border-brand-offwhite-300 overflow-hidden">
        {/* Filters Bar */}
        <div className="px-6 py-4 border-b border-brand-offwhite-300 bg-brand-offwhite-50">
          <div className="flex flex-col gap-4">
            {/* Search and Filter Toggle */}
            <div className="flex gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-offwhite-600" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="بحث بالاسم أو رقم الإيصال..."
                  className="w-full pr-10 pl-4 py-2 min-h-[44px] border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
                />
              </div>

              {/* Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg font-medium transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-brand-primary-900 text-white'
                    : 'bg-white border border-brand-offwhite-400 text-brand-offwhite-700 hover:bg-brand-offwhite-50'
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
                <span>فلترة</span>
                {hasActiveFilters && !showFilters && (
                  <span className="w-2 h-2 bg-brand-secondary-400 rounded-full"></span>
                )}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-brand-offwhite-300">
                {/* Date Range */}
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-brand-primary-900 mb-2"
                  >
                    من تاريخ
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      handleDateRangeChange(
                        e.target.value ? new Date(e.target.value) : undefined,
                        filters.endDate
                      )
                    }
                    className="w-full px-3 py-2 min-h-[44px] border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-brand-primary-900 mb-2"
                  >
                    إلى تاريخ
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      handleDateRangeChange(
                        filters.startDate,
                        e.target.value ? new Date(e.target.value) : undefined
                      )
                    }
                    className="w-full px-3 py-2 min-h-[44px] border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label
                    htmlFor="paymentMethod"
                    className="block text-sm font-medium text-brand-primary-900 mb-2"
                  >
                    طريقة الدفع
                  </label>
                  <select
                    id="paymentMethod"
                    value={filters.paymentMethod || ''}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="w-full px-3 py-2 min-h-[44px] border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
                  >
                    <option value="">الكل</option>
                    <option value="CASH">نقدي</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CARD">بطاقة</option>
                    <option value="CHECK">شيك</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-4 py-2 min-h-[44px] text-sm text-brand-primary-900 hover:bg-brand-offwhite-100 rounded-lg transition-colors"
                    >
                      مسح الفلاتر
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Total Summary */}
        {historyData && historyData.payments.length > 0 && (
          <div className="px-6 py-4 bg-brand-secondary-50 border-b border-brand-offwhite-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-offwhite-700">عدد المدفوعات</p>
                <p className="text-2xl font-bold text-brand-primary-900">
                  {historyData.pagination.total}
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm text-brand-offwhite-700">الإجمالي</p>
                <p className="text-2xl font-bold text-brand-primary-900">
                  {formatCurrency(historyData.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment History Table */}
        <PaymentHistoryTable
          payments={historyData?.payments || []}
          loading={isLoading}
          onViewDetails={handleViewDetails}
          onPrintReceipt={handlePrintReceipt}
          onReversePayment={handleReversePayment}
          currentPage={historyData?.pagination.page || 1}
          totalPages={historyData?.pagination.totalPages || 1}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        isOpen={showDetailsModal}
        paymentId={selectedPaymentId}
        onClose={handleCloseDetailsModal}
        onPrint={handlePrintReceipt}
      />

      {/* Reverse Payment Modal */}
      <ReversePaymentModal
        isOpen={showReverseModal}
        payment={paymentToReverse}
        onClose={handleCloseReverseModal}
      />

      {/* Receipt Template */}
      {showReceipt && receiptData && (
        <ReceiptTemplate receipt={receiptData} onClose={handleCloseReceipt} />
      )}
    </DashboardLayout>
  );
};

export default PaymentHistory;
