import React, { useEffect, useState, useMemo } from 'react';
import { Activity } from '../../store/dashboardSlice';
import ActivityItem from './ActivityItem';
import { ActivityItemSkeleton } from './SkeletonLoaders';
import { ErrorState } from './ErrorStates';
import { ActivitiesEmptyState } from './EmptyStates';

interface ActivitiesFeedProps {
  activities: Activity[];
  loading?: boolean;
  error?: string;
  autoRefresh?: boolean;
  onRefresh?: () => void;
  itemsPerPage?: number; // Number of items to show per page - Requirement 9.3
  maxItems?: number; // Maximum total items to keep in memory - Requirement 9.3, 9.6
}

const ActivitiesFeed: React.FC<ActivitiesFeedProps> = ({
  activities,
  loading = false,
  error,
  autoRefresh = false,
  onRefresh,
  itemsPerPage = 10,
  maxItems = 50, // Limit to 50 items - Requirement 9.3, 9.6
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Limit activities to maxItems and paginate - Requirement 9.3, 9.6
  const paginatedActivities = useMemo(() => {
    const limitedActivities = activities.slice(0, maxItems);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return limitedActivities.slice(startIndex, endIndex);
  }, [activities, currentPage, itemsPerPage, maxItems]);

  const totalPages = useMemo(() => {
    const limitedCount = Math.min(activities.length, maxItems);
    return Math.ceil(limitedCount / itemsPerPage);
  }, [activities.length, itemsPerPage, maxItems]);

  // Reset to page 1 when activities change
  useEffect(() => {
    setCurrentPage(1);
  }, [activities]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(() => {
        onRefresh();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, onRefresh]);

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300">
        <h3 className="text-lg font-bold text-brand-primary-900 text-right mb-4">
          الأنشطة الأخيرة
        </h3>
        <ErrorState message={error} onRetry={onRefresh} showRetry={!!onRefresh} />
      </div>
    );
  }

  // Empty state
  if (!loading && activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300">
        <h3 className="text-lg font-bold text-brand-primary-900 text-right mb-4">
          الأنشطة الأخيرة
        </h3>
        <ActivitiesEmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-brand-offwhite-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-brand-primary-900 text-right">الأنشطة الأخيرة</h3>
        {totalPages > 1 && (
          <span className="text-sm text-brand-offwhite-700">
            صفحة {currentPage} من {totalPages}
          </span>
        )}
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[400px]">
        {loading ? (
          // Show skeleton loaders
          <>
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
          </>
        ) : (
          // Show paginated activities - Requirement 9.3
          paginatedActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>

      {/* Pagination controls - Requirement 9.3 */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-brand-offwhite-300">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-semibold text-brand-primary-900 bg-brand-offwhite-100 rounded-lg hover:bg-brand-offwhite-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            السابق
          </button>
          <span className="text-sm text-brand-offwhite-700">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm font-semibold text-brand-primary-900 bg-brand-offwhite-100 rounded-lg hover:bg-brand-offwhite-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivitiesFeed;
