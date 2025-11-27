import React from 'react';
import {
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

/**
 * Generic empty state component
 * Shows icon, message, and optional action button
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-brand-offwhite-200 rounded-full flex items-center justify-center mb-4">
        {icon || <ClipboardDocumentListIcon className="w-8 h-8 text-brand-offwhite-500" />}
      </div>
      <p className="text-brand-primary-900 font-semibold text-center mb-2">{title}</p>
      <p className="text-brand-offwhite-600 text-center mb-4 max-w-md text-sm">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

/**
 * Empty state for activities feed
 * Shows when no recent activities exist
 */
export const ActivitiesEmptyState: React.FC = () => {
  return (
    <EmptyState
      icon={<ClipboardDocumentListIcon className="w-8 h-8 text-brand-offwhite-500" />}
      title="لا توجد أنشطة حديثة"
      message="سيتم عرض الأنشطة الجديدة هنا عند تسجيل دفعات أو إضافة أقساط جديدة"
    />
  );
};

/**
 * Empty state for collection trends chart
 * Shows when no collection data exists
 */
export const CollectionTrendsEmptyState: React.FC<{ onAddPayment?: () => void }> = ({
  onAddPayment,
}) => {
  return (
    <EmptyState
      icon={<ChartBarIcon className="w-8 h-8 text-brand-offwhite-500" />}
      title="لا توجد بيانات تحصيل"
      message="ابدأ بتسجيل دفعات لرؤية اتجاهات التحصيل الشهرية"
      actionText={onAddPayment ? 'تسجيل دفعة جديدة' : undefined}
      onAction={onAddPayment}
    />
  );
};

/**
 * Empty state for top products chart
 * Shows when no products have active installments
 */
export const TopProductsEmptyState: React.FC<{ onAddInstallment?: () => void }> = ({
  onAddInstallment,
}) => {
  return (
    <EmptyState
      icon={<ShoppingBagIcon className="w-8 h-8 text-brand-offwhite-500" />}
      title="لا توجد منتجات بأقساط نشطة"
      message="ابدأ بإضافة أقساط جديدة لرؤية أفضل المنتجات"
      actionText={onAddInstallment ? 'إضافة قسط جديد' : undefined}
      onAction={onAddInstallment}
    />
  );
};

/**
 * Empty state for dashboard when no data at all
 * Shows on first use or after data reset
 */
export const DashboardEmptyState: React.FC<{ onGetStarted?: () => void }> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-24 h-24 bg-brand-secondary-100 rounded-full flex items-center justify-center mb-6">
        <ChartBarIcon className="w-12 h-12 text-brand-secondary-600" />
      </div>
      <h2 className="text-2xl font-bold text-brand-primary-900 text-center mb-3">
        مرحباً بك في لوحة التحكم
      </h2>
      <p className="text-brand-offwhite-700 text-center mb-6 max-w-lg">
        ابدأ بإضافة أقساط وتسجيل دفعات لرؤية المقاييس والتحليلات هنا
      </p>
      {onGetStarted && (
        <button
          onClick={onGetStarted}
          className="bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          البدء الآن
        </button>
      )}
    </div>
  );
};

/**
 * Empty state for analytics page
 * Shows when no analytics data is available
 */
export const AnalyticsEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-24 h-24 bg-brand-offwhite-200 rounded-full flex items-center justify-center mb-6">
        <ChartBarIcon className="w-12 h-12 text-brand-offwhite-500" />
      </div>
      <h2 className="text-2xl font-bold text-brand-primary-900 text-center mb-3">
        لا توجد بيانات تحليلية
      </h2>
      <p className="text-brand-offwhite-700 text-center mb-6 max-w-lg">
        قم بتسجيل المزيد من الدفعات والأقساط لرؤية التحليلات التفصيلية
      </p>
    </div>
  );
};
