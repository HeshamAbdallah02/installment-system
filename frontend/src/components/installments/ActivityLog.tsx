import React from 'react';
import {
  ClockIcon,
  CurrencyDollarIcon,
  BellIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';
import { Activity } from '../../types/installment';

/**
 * Props for ActivityLog component
 */
interface ActivityLogProps {
  activities: Activity[];
  limit?: number;
  onShowMore?: () => void;
}

/**
 * Get icon for activity event type
 */
const getActivityIcon = (eventType: string): React.ReactNode => {
  const iconClass = 'w-5 h-5';

  switch (eventType) {
    case 'INSTALLMENT_CREATED':
      return <DocumentPlusIcon className={`${iconClass} text-brand-secondary-600`} />;
    case 'PAYMENT_RECORDED':
    case 'ADVANCE_PAYMENT_RECORDED':
      return <CurrencyDollarIcon className={`${iconClass} text-brand-secondary-600`} />;
    case 'PAYMENT_REVERSED':
      return <XCircleIcon className={`${iconClass} text-brand-primary-900`} />;
    case 'REMINDER_SENT':
      return <BellIcon className={`${iconClass} text-brand-secondary-600`} />;
    case 'TERMS_MODIFIED':
      return <PencilSquareIcon className={`${iconClass} text-brand-secondary-600`} />;
    case 'EARLY_SETTLEMENT':
      return <CheckCircleIcon className={`${iconClass} text-brand-secondary-600`} />;
    case 'INSTALLMENT_CANCELLED':
      return <XCircleIcon className={`${iconClass} text-brand-primary-900`} />;
    default:
      return <ClockIcon className={`${iconClass} text-brand-offwhite-600`} />;
  }
};

/**
 * Get Arabic label for activity event type
 */
const getActivityLabel = (eventType: string): string => {
  switch (eventType) {
    case 'INSTALLMENT_CREATED':
      return 'إنشاء القسط';
    case 'PAYMENT_RECORDED':
      return 'تسجيل دفعة';
    case 'ADVANCE_PAYMENT_RECORDED':
      return 'تسجيل دفعة مقدمة';
    case 'PAYMENT_REVERSED':
      return 'عكس دفعة';
    case 'REMINDER_SENT':
      return 'إرسال تذكير';
    case 'TERMS_MODIFIED':
      return 'تعديل الشروط';
    case 'EARLY_SETTLEMENT':
      return 'تسوية مبكرة';
    case 'INSTALLMENT_CANCELLED':
      return 'إلغاء القسط';
    default:
      return eventType;
  }
};

/**
 * Format activity details from event data
 */
const formatActivityDetails = (activity: Activity): string => {
  const { eventType, eventData } = activity;

  switch (eventType) {
    case 'PAYMENT_RECORDED':
    case 'ADVANCE_PAYMENT_RECORDED':
      if (eventData.amount) {
        return `المبلغ: ${Number(eventData.amount).toLocaleString('ar-EG')} ج.م`;
      }
      return '';
    case 'PAYMENT_REVERSED':
      if (eventData.reason) {
        return `السبب: ${eventData.reason}`;
      }
      return '';
    case 'REMINDER_SENT':
      if (eventData.method) {
        const methodLabel =
          eventData.method === 'whatsapp'
            ? 'واتساب'
            : eventData.method === 'sms'
              ? 'رسالة نصية'
              : 'كلاهما';
        return `الطريقة: ${methodLabel}`;
      }
      return '';
    case 'TERMS_MODIFIED':
      if (eventData.reason) {
        return `السبب: ${eventData.reason}`;
      }
      return '';
    case 'EARLY_SETTLEMENT':
      if (eventData.settlementAmount) {
        return `مبلغ التسوية: ${Number(eventData.settlementAmount).toLocaleString('ar-EG')} ج.م`;
      }
      return '';
    case 'INSTALLMENT_CANCELLED':
      if (eventData.reason) {
        return `السبب: ${eventData.reason}`;
      }
      return '';
    default:
      return '';
  }
};

/**
 * ActivityLog Component with lazy loading
 * Displays activity log for installment with icons, action types, dates, and details
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 * Performance: Implements lazy loading to show initial set and load more on demand
 */
const ActivityLog: React.FC<ActivityLogProps> = ({ activities, limit = 10, onShowMore }) => {
  const displayedActivities = limit && limit > 0 ? activities.slice(0, limit) : activities;
  const hasMore = limit && limit > 0 && activities.length > limit;

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="w-12 h-12 text-brand-offwhite-400 mx-auto mb-3" />
        <p className="text-brand-offwhite-600">لا توجد أنشطة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity List */}
      <div className="space-y-3">
        {displayedActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex gap-3 p-3 rounded-lg hover:bg-brand-offwhite-50 transition-colors"
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full bg-brand-offwhite-100 flex items-center justify-center">
                {getActivityIcon(activity.eventType)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Action Type */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-semibold text-brand-primary-900">
                  {getActivityLabel(activity.eventType)}
                </h4>
                <span className="text-xs text-brand-offwhite-600 whitespace-nowrap">
                  {activity.relativeTime}
                </span>
              </div>

              {/* User Name */}
              <p className="text-xs text-brand-offwhite-700 mb-1">بواسطة: {activity.userName}</p>

              {/* Details */}
              {formatActivityDetails(activity) && (
                <p className="text-xs text-brand-offwhite-600">{formatActivityDetails(activity)}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {hasMore && onShowMore && (
        <button
          type="button"
          onClick={onShowMore}
          className="w-full py-2 text-sm font-medium text-brand-primary-900 hover:text-brand-primary-950 hover:bg-brand-offwhite-100 rounded-lg transition-colors"
        >
          عرض المزيد
        </button>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(ActivityLog);
