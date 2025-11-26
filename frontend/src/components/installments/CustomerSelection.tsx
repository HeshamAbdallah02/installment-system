import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { WizardState } from '../../types/installment';
import { Customer } from '../../types/customer';
import customerService from '../../services/customerService';
import AddCustomerModal from '../customers/AddCustomerModal';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage, logError } from '../../utils/errorHandling';

interface CustomerSelectionProps {
  wizardState: WizardState;
  updateWizardState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  preSelectedCustomerId?: number | null;
}

/**
 * CustomerSelection component - Step 1 of installment wizard
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
const CustomerSelection: React.FC<CustomerSelectionProps> = ({
  wizardState,
  updateWizardState,
  onNext,
  preSelectedCustomerId = null,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { showToast } = useToast();

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await customerService.getCustomers({
          limit: 1000, // Get all customers for dropdown
        });
        setCustomers(response.data);
        setFilteredCustomers(response.data);

        // Auto-select pre-selected customer if provided
        if (preSelectedCustomerId) {
          const preSelected = response.data.find((c) => c.id === preSelectedCustomerId);
          if (preSelected) {
            setSelectedCustomer(preSelected);
            updateWizardState({
              customerId: preSelected.id,
              customerOutstanding: preSelected.totalOutstanding || 0,
            });
          }
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        showToast(errorMessage, 'error');
        logError(err, 'CustomerSelection - fetchCustomers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [showToast, preSelectedCustomerId, updateWizardState]);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = customers.filter(
      (customer) =>
        customer.fullName.toLowerCase().includes(term) ||
        customer.nationalId.includes(term) ||
        customer.phone.includes(term)
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  // Handle customer selection
  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(customer);
      updateWizardState({
        customerId: customer.id,
        customerName: customer.fullName,
        customerOutstanding: customer.totalOutstanding || 0,
      });
    },
    [updateWizardState]
  );

  // Handle add customer modal
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleCustomerSuccess = useCallback(
    async (message: string) => {
      showToast(message, 'success');
      // Refresh customer list
      try {
        const response = await customerService.getCustomers({
          limit: 1000,
        });
        setCustomers(response.data);
        setFilteredCustomers(response.data);

        // Auto-select the newly added customer (last in the list)
        if (response.data.length > 0) {
          const newCustomer = response.data[0]; // Assuming newest is first
          handleSelectCustomer(newCustomer);
        }
      } catch (error) {
        console.error('Error refreshing customers:', error);
      }
    },
    [showToast, handleSelectCustomer]
  );

  const handleCustomerError = useCallback(
    (message: string) => {
      showToast(message, 'error');
    },
    [showToast]
  );

  // Handle next button - with validation
  const handleNext = useCallback(() => {
    if (!wizardState.customerId) {
      showToast('يرجى اختيار عميل أولاً', 'error');
      return;
    }
    onNext();
  }, [wizardState.customerId, onNext, showToast]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-brand-primary-900 mb-2">اختر العميل</h3>
        <p className="text-brand-offwhite-700">ابحث عن العميل أو أضف عميل جديد</p>
      </div>

      {/* Add Customer Button */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brand-primary-900 text-brand-primary-900 rounded-lg hover:bg-brand-secondary-50 transition-colors font-medium"
      >
        <PlusIcon className="w-5 h-5" />
        <span>إضافة عميل جديد</span>
      </button>

      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-offwhite-700" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث بالاسم أو الرقم القومي أو الهاتف..."
          className="w-full pr-10 pl-4 py-3 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
        />
      </div>

      {/* Customer List */}
      <div className="border border-brand-offwhite-400 rounded-lg max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-brand-primary-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-brand-primary-900 font-semibold">جاري تحميل العملاء...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-brand-primary-700 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-brand-offwhite-700">
            {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء'}
          </div>
        ) : (
          <div className="divide-y divide-brand-offwhite-400">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelectCustomer(customer)}
                className={`w-full p-4 text-right hover:bg-brand-secondary-50 transition-colors ${
                  selectedCustomer?.id === customer.id
                    ? 'bg-brand-secondary-100 border-r-4 border-brand-primary-900'
                    : ''
                }`}
              >
                <div className="font-medium text-brand-primary-900">
                  {customer.fullName} - {customer.nationalId}
                </div>
                <div className="text-sm text-brand-offwhite-700 mt-1">{customer.phone}</div>
                {customer.activeInstallmentsCount > 0 && (
                  <div className="text-sm text-brand-secondary-700 mt-1">
                    {customer.activeInstallmentsCount} أقساط نشطة • رصيد مستحق:{' '}
                    {(customer.totalOutstanding || 0).toFixed(2)} ج.م
                  </div>
                )}
                {(customer.totalOutstanding || 0) >= 5000 && (
                  <div className="text-xs text-brand-primary-900 font-bold mt-1 bg-brand-primary-50 px-2 py-1 rounded inline-block">
                    ⚠️ قريب من الحد الائتماني (6000 ج.م)
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Customer Summary */}
      {selectedCustomer && (
        <div className="bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg p-4">
          <h4 className="font-bold text-brand-primary-900 mb-2">العميل المختار</h4>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-brand-offwhite-700">الاسم: </span>
              <span className="text-brand-primary-900 font-medium">
                {selectedCustomer.fullName}
              </span>
            </div>
            <div>
              <span className="text-brand-offwhite-700">الرقم القومي: </span>
              <span className="text-brand-primary-900 font-medium">
                {selectedCustomer.nationalId}
              </span>
            </div>
            <div>
              <span className="text-brand-offwhite-700">الهاتف: </span>
              <span className="text-brand-primary-900 font-medium">{selectedCustomer.phone}</span>
            </div>
            {selectedCustomer.activeInstallmentsCount > 0 && (
              <>
                <div>
                  <span className="text-brand-offwhite-700">الأقساط النشطة: </span>
                  <span className="text-brand-primary-900 font-medium">
                    {selectedCustomer.activeInstallmentsCount}
                  </span>
                </div>
                <div>
                  <span className="text-brand-offwhite-700">الرصيد المستحق: </span>
                  <span className="text-brand-primary-900 font-medium">
                    {(selectedCustomer.totalOutstanding || 0).toFixed(2)} ج.م
                  </span>
                </div>
                <div>
                  <span className="text-brand-offwhite-700">الرصيد المتاح: </span>
                  <span
                    className={`font-medium ${6000 - (selectedCustomer.totalOutstanding || 0) < 1000 ? 'text-brand-primary-900' : 'text-brand-secondary-900'}`}
                  >
                    {(6000 - (selectedCustomer.totalOutstanding || 0)).toFixed(2)} ج.م من 6000 ج.م
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={handleNext}
          disabled={!wizardState.customerId}
          className="px-6 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          التالي
        </button>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleCustomerSuccess}
        onError={handleCustomerError}
      />
    </div>
  );
};

export default CustomerSelection;
