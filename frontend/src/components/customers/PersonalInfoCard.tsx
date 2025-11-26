import React from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import { CustomerDetail } from '../../types/customer';

interface PersonalInfoCardProps {
  customer: CustomerDetail;
  onEdit: () => void;
}

/**
 * PersonalInfoCard component
 * Displays customer personal information with edit functionality
 * Requirements: 3.2, 3.3
 */
const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({ customer, onEdit }) => {
  // Format date to Arabic
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-brand-offwhite-400 p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-bold text-brand-primary-900">المعلومات الشخصية</h2>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-brand-secondary-400 text-brand-primary-900 rounded-lg hover:bg-brand-secondary-500 transition-colors font-medium"
        >
          <PencilIcon className="w-5 h-5" />
          <span>تعديل</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-brand-offwhite-700 mb-1">
            الاسم الكامل
          </label>
          <p className="text-brand-primary-900 font-semibold">{customer.fullName}</p>
        </div>

        {/* National ID */}
        <div>
          <label className="block text-sm font-medium text-brand-offwhite-700 mb-1">
            الرقم القومي
          </label>
          <p className="text-brand-primary-900 font-semibold">{customer.nationalId}</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-brand-offwhite-700 mb-1">
            رقم الهاتف
          </label>
          <p className="text-brand-primary-900 font-semibold" dir="ltr">
            {customer.phone}
          </p>
        </div>

        {/* Secondary Phone */}
        {customer.phoneSecondary && (
          <div>
            <label className="block text-sm font-medium text-brand-offwhite-700 mb-1">
              رقم هاتف إضافي
            </label>
            <p className="text-brand-primary-900 font-semibold" dir="ltr">
              {customer.phoneSecondary}
            </p>
          </div>
        )}

        {/* Address */}
        {customer.address && (
          <div>
            <label className="block text-sm font-medium text-brand-offwhite-700 mb-1">
              العنوان
            </label>
            <p className="text-brand-primary-900 font-semibold">{customer.address}</p>
          </div>
        )}

        {/* City */}
        {customer.city && (
          <div>
            <label className="block text-sm font-medium text-brand-offwhite-700 mb-1">
              المدينة
            </label>
            <p className="text-brand-primary-900 font-semibold">{customer.city}</p>
          </div>
        )}

        {/* Registration Date */}
        <div>
          <label className="block text-sm font-medium text-brand-offwhite-700 mb-1">
            تاريخ التسجيل
          </label>
          <p className="text-brand-primary-900 font-semibold">{formatDate(customer.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoCard;
