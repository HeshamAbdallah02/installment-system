import { QueryClient } from '@tanstack/react-query';

// Configure React Query with appropriate cache times for dashboard data
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default cache time: 5 minutes
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000, // Previously cacheTime, now gcTime in v5
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys for dashboard data
export const queryKeys = {
  dashboard: {
    metrics: ['dashboard', 'metrics'] as const,
    collectionTrends: (months: number) => ['dashboard', 'collection-trends', months] as const,
    topProducts: ['dashboard', 'top-products'] as const,
    activities: (limit: number) => ['dashboard', 'activities', limit] as const,
  },
  analytics: {
    branchPerformance: (startDate: string, endDate: string) =>
      ['analytics', 'branch-performance', startDate, endDate] as const,
    paymentDistribution: (filters: Record<string, unknown>) =>
      ['analytics', 'payment-distribution', filters] as const,
    customerPatterns: ['analytics', 'customer-patterns'] as const,
    revenueForecast: (months: number) => ['analytics', 'revenue-forecast', months] as const,
  },
  customers: {
    list: (filters: Record<string, unknown>) => ['customers', 'list', filters] as const,
    detail: (id: number) => ['customers', 'detail', id] as const,
  },
  products: {
    list: ['products', 'list'] as const,
  },
  installments: {
    list: (filters: Record<string, unknown>) => ['installments', 'list', filters] as const,
    ratios: ['installments', 'ratios'] as const,
  },
};
