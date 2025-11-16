import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  IdentificationIcon,
  PhoneIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

/**
 * Customer information interface for installment detail
 */
export interface CustomerInfo {
  id: number;
  fullName: string;
  nationalId: string;
  phone: string;
  address?: string;
  city?: string;
  otherActiveInstallmentsCount: number;
  totalDebtAcrossAll: number;
}

/**
 * Props for CustomerInfoCard component
 */
interface CustomerInfoCardProps {
  customer: CustomerInfo;
}

/**
 * CustomerInfoCard Component
 * Displays customer information on the installment detail page
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({ customer }) => {
  const navigate = useNavigate();

  /**
   * Format phone number in Egyptian format (+20-XXX-XXX-XXXX)
   * Requirement: 4.7
   */
  const formatPhoneNumber = (phone: string): string => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Handle Egyptian phone numbers (starts with 20 or 0)
    let formatted = cleaned;

    if (cleaned.startsWith('20')) {
      // Format: +20-XXX-XXX-XXXX
      formatted = `+20-${cleaned.slice(2, 5)}-${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
    } else if (cleaned.startsWith('0')) {
      // Format: +20-XXX-XXX-XXXX
      formatted = `+20-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      // Assume it's Egyptian without country code
      formatted = `+20-${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return formatted;
  };

  /**
   * Format currency in Egyptian format
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Handle phone call click
   * Requirement: 4.2
   */
  const handlePhoneClick = () => {
    const cleanPhone = customer.phone.replace(/\D/g, '');
    window.location.href = `tel:+${cleanPhone.startsWith('20') ? cleanPhone : '20' + cleanPhone.replace(/^0/, '')}`;
  };

  /**
   * Handle WhatsApp click
   * Requirement: 4.6
   */
  const handleWhatsAppClick = () => {
    const cleanPhone = customer.phone.replace(/\D/g, '');
    const whatsappNumber = cleanPhone.startsWith('20')
      ? cleanPhone
      : '20' + cleanPhone.replace(/^0/, '');
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  /**
   * Handle view customer profile click
   * Requirement: 4.3
   */
  const handleViewProfile = () => {
    navigate(`/customers/${customer.id}`);
  };

  // Format full address
  const fullAddress = [customer.address, customer.city].filter(Boolean).join('، ');

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-brand-offwhite-300" dir="rtl">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-brand-primary-900">معلومات العميل</h2>
        <div className="p-2 bg-brand-offwhite-100 rounded-lg">
          <UserIcon className="w-5 h-5 text-brand-primary-900" />
        </div>
      </div>

      {/* Customer Information */}
      <div className="space-y-4">
        {/* Full Name - Requirement: 4.1 */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-brand-offwhite-100 rounded-lg mt-0.5">
            <UserIcon className="w-4 h-4 text-brand-offwhite-700" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-brand-offwhite-700 mb-1">الاسم الكامل</p>
            <p className="text-sm font-bold text-brand-primary-900">{customer.fullName}</p>
          </div>
        </div>

        {/* National ID - Requirement: 4.1 */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-brand-offwhite-100 rounded-lg mt-0.5">
            <IdentificationIcon className="w-4 h-4 text-brand-offwhite-700" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-brand-offwhite-700 mb-1">الرقم القومي</p>
            <p className="text-sm font-medium text-brand-primary-900 font-mono" dir="ltr">
              {customer.nationalId}
            </p>
          </div>
        </div>

        {/* Phone Number - Requirement: 4.1, 4.2, 4.7 */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-brand-offwhite-100 rounded-lg mt-0.5">
            <PhoneIcon className="w-4 h-4 text-brand-offwhite-700" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-brand-offwhite-700 mb-1">رقم الهاتف</p>
            <button
              type="button"
              onClick={handlePhoneClick}
              className="text-sm font-medium text-brand-secondary-700 hover:text-brand-secondary-900 underline transition-colors font-mono"
              dir="ltr"
            >
              {formatPhoneNumber(customer.phone)}
            </button>
          </div>
        </div>

        {/* Address - Requirement: 4.1 */}
        {fullAddress && (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-offwhite-100 rounded-lg mt-0.5">
              <MapPinIcon className="w-4 h-4 text-brand-offwhite-700" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-brand-offwhite-700 mb-1">العنوان</p>
              <p className="text-sm text-brand-primary-900">{fullAddress}</p>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-brand-offwhite-300" />

      {/* Other Installments Info - Requirements: 4.4, 4.5 */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-brand-offwhite-50 rounded-lg">
          <span className="text-sm text-brand-offwhite-700">أقساط أخرى نشطة</span>
          <span className="text-sm font-bold text-brand-primary-900">
            {customer.otherActiveInstallmentsCount}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-brand-offwhite-50 rounded-lg">
          <span className="text-sm text-brand-offwhite-700">إجمالي الديون</span>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-brand-primary-900">
              {formatCurrency(customer.totalDebtAcrossAll)}
            </span>
            <span className="text-xs text-brand-offwhite-700">ج.م</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* View Profile Button - Requirement: 4.3 */}
        <button
          type="button"
          onClick={handleViewProfile}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary-900 text-white rounded-lg hover:bg-brand-primary-950 transition-colors font-medium"
        >
          <UserIcon className="w-5 h-5" />
          <span>عرض ملف العميل</span>
        </button>

        {/* Send WhatsApp Button - Requirement: 4.6 */}
        <button
          type="button"
          onClick={handleWhatsAppClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-secondary-400 text-brand-primary-900 rounded-lg hover:bg-brand-secondary-500 transition-colors font-medium"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          <span>إرسال رسالة واتساب</span>
        </button>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(CustomerInfoCard);
