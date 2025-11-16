import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CustomerDetail, CreateCustomerData } from '../../types/customer';
import customerService from '../../services/customerService';
import {
  validateNationalId,
  validatePhone,
  validateRequired,
  getErrorMessage,
  logError,
  SUCCESS_MESSAGES,
} from '../../utils/errorHandling';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerDetail;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * EditCustomerModal component
 * Modal for updating customer information
 * Requirements: 3.2, 3.3
 */
const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState<CreateCustomerData>({
    fullName: '',
    nationalId: '',
    phone: '',
    phoneSecondary: '',
    address: '',
    city: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCustomerData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        fullName: customer.fullName,
        nationalId: customer.nationalId,
        phone: customer.phone,
        phoneSecondary: customer.phoneSecondary || '',
        address: customer.address || '',
        city: customer.city || '',
      });
    }
  }, [customer]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateCustomerData, string>> = {};

    // Full name validation
    const fullNameValidation = validateRequired(formData.fullName);
    if (fullNameValidation !== true) {
      newErrors.fullName = fullNameValidation || undefined;
    }

    // National ID validation (14 digits)
    const nationalIdValidation = validateNationalId(formData.nationalId);
    if (nationalIdValidation !== true) {
      newErrors.nationalId = nationalIdValidation || undefined;
    }

    // Phone validation (Egyptian mobile: 11 digits starting with 01)
    const phoneValidation = validatePhone(formData.phone);
    if (phoneValidation !== true) {
      newErrors.phone = phoneValidation || undefined;
    }

    // Secondary phone validation (optional)
    if (formData.phoneSecondary) {
      const phoneSecondaryValidation = validatePhone(formData.phoneSecondary);
      if (phoneSecondaryValidation !== true) {
        newErrors.phoneSecondary = phoneSecondaryValidation || undefined;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof CreateCustomerData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await customerService.updateCustomer(customer.id, formData);
      onSuccess(SUCCESS_MESSAGES.CUSTOMER_UPDATED);
      onClose();
    } catch (err) {
      logError(err, 'EditCustomerModal - updateCustomer');
      const errorMessage = getErrorMessage(err);
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-brand-primary-900 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-brand-secondary-50 px-6 py-4 border-b border-brand-offwhite-400">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-brand-primary-900">تعديل بيانات العميل</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-brand-offwhite-700 hover:text-brand-primary-900 transition-colors"
                aria-label="إغلاق"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-brand-primary-900 mb-1"
                >
                  الاسم الكامل <span className="text-brand-primary-900">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 ${
                    errors.fullName ? 'border-brand-primary-900' : 'border-brand-offwhite-400'
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-brand-primary-900">{errors.fullName}</p>
                )}
              </div>

              {/* National ID (read-only) */}
              <div>
                <label
                  htmlFor="nationalId"
                  className="block text-sm font-medium text-brand-primary-900 mb-1"
                >
                  الرقم القومي
                </label>
                <input
                  type="text"
                  id="nationalId"
                  name="nationalId"
                  value={formData.nationalId}
                  readOnly
                  className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg bg-brand-offwhite-100 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-brand-offwhite-700">لا يمكن تعديل الرقم القومي</p>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-brand-primary-900 mb-1"
                >
                  رقم الهاتف <span className="text-brand-primary-900">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  dir="ltr"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 ${
                    errors.phone ? 'border-brand-primary-900' : 'border-brand-offwhite-400'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-brand-primary-900">{errors.phone}</p>
                )}
              </div>

              {/* Secondary Phone */}
              <div>
                <label
                  htmlFor="phoneSecondary"
                  className="block text-sm font-medium text-brand-primary-900 mb-1"
                >
                  رقم هاتف إضافي
                </label>
                <input
                  type="tel"
                  id="phoneSecondary"
                  name="phoneSecondary"
                  value={formData.phoneSecondary}
                  onChange={handleChange}
                  dir="ltr"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 ${
                    errors.phoneSecondary ? 'border-brand-primary-900' : 'border-brand-offwhite-400'
                  }`}
                />
                {errors.phoneSecondary && (
                  <p className="mt-1 text-sm text-brand-primary-900">{errors.phoneSecondary}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-brand-primary-900 mb-1"
                >
                  العنوان
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900"
                />
              </div>

              {/* City */}
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-brand-primary-900 mb-1"
                >
                  المدينة
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  'حفظ التعديلات'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-brand-offwhite-200 text-brand-primary-900 rounded-lg hover:bg-brand-offwhite-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCustomerModal;
