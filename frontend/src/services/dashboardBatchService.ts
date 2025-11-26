import { dashboardService } from './dashboardService';
import type {
  DashboardMetrics,
  MonthlyCollection,
  ProductData,
  Activity,
} from '../store/dashboardSlice';

/**
 * Dashboard Batch Service
 * Handles parallel fetching of multiple dashboard data endpoints
 * Requirement 9.3, 9.6: Implement parallel requests for dashboard data
 */

export interface DashboardBatchData {
  metrics: DashboardMetrics;
  collectionTrends: MonthlyCollection[];
  topProducts: ProductData[];
  activities: Activity[];
}

/**
 * Fetch all dashboard data in parallel for optimal performance
 * Uses Promise.all to execute all API calls simultaneously
 *
 * @param options - Configuration options for data fetching
 * @returns Promise<DashboardBatchData> - All dashboard data
 */
export async function fetchDashboardDataParallel(options?: {
  trendsMonths?: number;
  activitiesLimit?: number;
}): Promise<DashboardBatchData> {
  const {
    trendsMonths = 6,
    activitiesLimit = 50, // Limit to 50 items - Requirement 9.3, 9.6
  } = options || {};

  try {
    // Execute all API calls in parallel - Requirement 9.3, 9.6
    const [metrics, collectionTrends, topProducts, activities] = await Promise.all([
      dashboardService.getMetrics(),
      dashboardService.getCollectionTrends(trendsMonths),
      dashboardService.getTopProducts(),
      dashboardService.getRecentActivities(activitiesLimit),
    ]);

    return {
      metrics,
      collectionTrends,
      topProducts,
      activities,
    };
  } catch (error) {
    console.error('Error fetching dashboard data in parallel:', error);
    throw error;
  }
}

/**
 * Fetch only chart data in parallel (lighter than full dashboard)
 * Useful for refreshing charts without reloading metrics
 *
 * @param options - Configuration options
 * @returns Promise with chart data
 */
export async function fetchChartDataParallel(options?: { trendsMonths?: number }): Promise<{
  collectionTrends: MonthlyCollection[];
  topProducts: ProductData[];
}> {
  const { trendsMonths = 6 } = options || {};

  try {
    const [collectionTrends, topProducts] = await Promise.all([
      dashboardService.getCollectionTrends(trendsMonths),
      dashboardService.getTopProducts(),
    ]);

    return {
      collectionTrends,
      topProducts,
    };
  } catch (error) {
    console.error('Error fetching chart data in parallel:', error);
    throw error;
  }
}
