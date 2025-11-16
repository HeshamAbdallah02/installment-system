import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { dashboardService } from '../services/dashboardService';
import type {
  DashboardMetrics,
  MonthlyCollection,
  BranchData,
  ProductData,
  Activity,
} from '../store/dashboardSlice';

/**
 * Hook to fetch dashboard metrics with 5-minute cache
 * @returns UseQueryResult with dashboard metrics data
 */
export function useMetrics(): UseQueryResult<DashboardMetrics, Error> {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics,
    queryFn: () => dashboardService.getMetrics(),
    staleTime: 0, // Always consider data stale to force refetch
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Hook to fetch collection trends with 10-minute cache
 * @param months - Number of months to fetch (default: 6)
 * @returns UseQueryResult with monthly collection data
 */
export function useCollectionTrends(
  months: number = 6
): UseQueryResult<MonthlyCollection[], Error> {
  return useQuery({
    queryKey: queryKeys.dashboard.collectionTrends(months),
    queryFn: () => dashboardService.getCollectionTrends(months),
    staleTime: 1 * 60 * 1000, // 1 minute instead of 10
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Hook to fetch branch distribution data
 * @param period - Time period for data (default: 'current_month')
 * @returns UseQueryResult with branch distribution data
 */
export function useBranchDistribution(
  period: string = 'current_month'
): UseQueryResult<BranchData[], Error> {
  return useQuery({
    queryKey: queryKeys.dashboard.branchDistribution(period),
    queryFn: () => dashboardService.getBranchDistribution(period),
    staleTime: 1 * 60 * 1000, // 1 minute instead of 5
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Hook to fetch top products by installment count
 * @returns UseQueryResult with top products data
 */
export function useTopProducts(): UseQueryResult<ProductData[], Error> {
  return useQuery({
    queryKey: queryKeys.dashboard.topProducts,
    queryFn: () => dashboardService.getTopProducts(),
    staleTime: 1 * 60 * 1000, // 1 minute instead of 5
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Hook to fetch recent activities with 30-second auto-refetch
 * @param limit - Maximum number of activities to fetch (default: 10)
 * @returns UseQueryResult with recent activities data
 */
export function useRecentActivities(limit: number = 10): UseQueryResult<Activity[], Error> {
  return useQuery({
    queryKey: queryKeys.dashboard.activities(limit),
    queryFn: () => dashboardService.getRecentActivities(limit),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes garbage collection
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
}
