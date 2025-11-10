import apiClient from './api';
import type {
  DashboardMetrics,
  MonthlyCollection,
  BranchData,
  ProductData,
  Activity,
} from '../store/dashboardSlice';

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface CollectionTrendsData {
  months: MonthlyCollection[];
  totalCollected: number;
  averageMonthly: number;
}

interface BranchDistributionData {
  branches: BranchData[];
  totalCollections: number;
}

interface TopProductsData {
  products: ProductData[];
  totalInstallments: number;
}

interface RecentActivitiesData {
  activities: Activity[];
  lastUpdated: string;
}

/**
 * Dashboard Service
 * Handles all API calls for dashboard data including metrics, charts, and activities
 */
class DashboardService {
  /**
   * Fetch dashboard metrics (active installments, pending payments, overdue amounts, collection rate)
   * @returns Promise<DashboardMetrics>
   * @throws Error with Arabic message if fetch fails
   */
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardMetrics>>('/api/dashboard/metrics');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('فشل تحميل المقاييس');
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw new Error('فشل تحميل المقاييس. يرجى المحاولة مرة أخرى');
    }
  }

  /**
   * Fetch monthly collection trends for the specified number of months
   * @param months - Number of months to fetch (default: 6)
   * @returns Promise<MonthlyCollection[]>
   * @throws Error with Arabic message if fetch fails
   */
  async getCollectionTrends(months: number = 6): Promise<MonthlyCollection[]> {
    try {
      const response = await apiClient.get<ApiResponse<CollectionTrendsData>>(
        '/api/dashboard/collection-trends',
        {
          params: { months },
        }
      );

      if (response.data.success && response.data.data?.months) {
        return response.data.data.months;
      }

      throw new Error('فشل تحميل اتجاه التحصيل');
    } catch (error) {
      console.error('Error fetching collection trends:', error);
      throw new Error('فشل تحميل اتجاه التحصيل. يرجى المحاولة مرة أخرى');
    }
  }

  /**
   * Fetch branch distribution data for the specified period
   * @param period - Time period (e.g., 'current_month', 'last_month', 'current_year')
   * @returns Promise<BranchData[]>
   * @throws Error with Arabic message if fetch fails
   */
  async getBranchDistribution(period: string = 'current_month'): Promise<BranchData[]> {
    try {
      const response = await apiClient.get<ApiResponse<BranchDistributionData>>(
        '/api/dashboard/branch-distribution',
        {
          params: { period },
        }
      );

      if (response.data.success && response.data.data?.branches) {
        return response.data.data.branches;
      }

      throw new Error('فشل تحميل توزيع الفروع');
    } catch (error) {
      console.error('Error fetching branch distribution:', error);
      throw new Error('فشل تحميل توزيع الفروع. يرجى المحاولة مرة أخرى');
    }
  }

  /**
   * Fetch top products by number of active installments
   * @returns Promise<ProductData[]>
   * @throws Error with Arabic message if fetch fails
   */
  async getTopProducts(): Promise<ProductData[]> {
    try {
      const response = await apiClient.get<ApiResponse<TopProductsData>>(
        '/api/dashboard/top-products'
      );

      if (response.data.success && response.data.data?.products) {
        return response.data.data.products;
      }

      throw new Error('فشل تحميل أفضل المنتجات');
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw new Error('فشل تحميل أفضل المنتجات. يرجى المحاولة مرة أخرى');
    }
  }

  /**
   * Fetch recent activities feed
   * @param limit - Maximum number of activities to fetch (default: 10)
   * @returns Promise<Activity[]>
   * @throws Error with Arabic message if fetch fails
   */
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    try {
      const response = await apiClient.get<ApiResponse<RecentActivitiesData>>(
        '/api/dashboard/activities',
        {
          params: { limit },
        }
      );

      if (response.data.success && response.data.data?.activities) {
        return response.data.data.activities;
      }

      throw new Error('فشل تحميل الأنشطة الأخيرة');
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw new Error('فشل تحميل الأنشطة الأخيرة. يرجى المحاولة مرة أخرى');
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;
