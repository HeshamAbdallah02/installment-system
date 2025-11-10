import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CreateCustomerData } from '../../types/customer';
import customerService from '../../services/customerService';
import {
  validateNationalId,
  validatePhone,
  validateRequired,
  getErrorMessage,
  isErrorCode,
  logError,
  SUCCESS_MESSAGES,
  VALIDATION_ERRORS,
} from '../../utils/errorHandling';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface CustomerFormData extends CreateCustomerData {
  // Form-specific fields if needed
}

/**
 * AddCustomerModal component
 * Modal form for creating new customers with validation
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8, 2.9
 */
const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<CustomerFormData>({
    mode: 'onBlur',
  });

  // Handle form submission
  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      await customerService.createCustomer(data);
      onSuccess(SUCCESS_MESSAGES.CUSTOMER_CREATED);
      reset();
      onClose();
    } catch (err) {
      logError(err, 'AddCustomerModal - createCustomer');

      // Handle duplicate national ID error
      if (err && typeof err === 'object' && isErrorCode(err, 'DUPLICATE_NATIONAL_ID')) {
        setError('nationalId', {
          type: 'manual',
          message: VALIDATION_ERRORS.DUPLICATE_NATIONAL_ID,
        });
      } else {
        const errorMessage = getErrorMessage(err);
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-brand-offwhite-400">
            <h2 className="text-2xl font-bold text-brand-primary-900">إضافة عميل جديد</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-brand-offwhite-700 hover:text-brand-primary-900 transition-colors disabled:opacity-50"
              aria-label="إغلاق"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-brand-primary-900 mb-1"
              >
                الاسم الكامل <span className="text-brand-primary-700">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                {...register('fullName', {
                  validate: validateRequired,
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                  errors.fullName ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
                }`}
                placeholder="أدخل الاسم الكامل"
                disabled={isSubmitting}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-brand-primary-700">{errors.fullName.message}</p>
              )}
            </div>

            {/* National ID */}
            <div>
              <label
                htmlFor="nationalId"
                className="block text-sm font-medium text-brand-primary-900 mb-1"
              >
                الرقم القومي <span className="text-brand-primary-700">*</span>
              </label>
              <input
                type="text"
                id="nationalId"
                {...register('nationalId', {
                  validate: validateNationalId,
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                  errors.nationalId ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
                }`}
                placeholder="أدخل الرقم القومي (14 رقماً)"
                maxLength={14}
                disabled={isSubmitting}
              />
              {errors.nationalId && (
                <p className="mt-1 text-sm text-brand-primary-700">{errors.nationalId.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-brand-primary-900 mb-1"
              >
                رقم الهاتف <span className="text-brand-primary-700">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                {...register('phone', {
                  validate: validatePhone,
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900 ${
                  errors.phone ? 'border-brand-primary-700' : 'border-brand-offwhite-400'
                }`}
                placeholder="01xxxxxxxxx"
                maxLength={11}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-brand-primary-700">{errors.phone.message}</p>
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
                {...register('address')}
                className="w-full px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
                placeholder="أدخل العنوان"
                disabled={isSubmitting}
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
                {...register('city')}
                className="w-full px-3 py-2 border border-brand-offwhite-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary-900 focus:border-brand-primary-900"
                placeholder="أدخل المدينة"
                disabled={isSubmitting}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={handleClose}
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

export default AddCustomerModal;
