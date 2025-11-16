import { useQuery } from '@tanstack/react-query';
import productService from '../services/productService';
import type { ProductFilters, PaginatedProducts, PopularProduct } from '../types/product';

/**
 * Hook to fetch paginated products with filters
 * Performance: 5 minute cache to reduce API calls
 */
export function useProductCatalog(filters: ProductFilters) {
  return useQuery<PaginatedProducts, Error>({
    queryKey: ['products', 'catalog', filters],
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes cache - Requirement: Cache product catalog (5 minutes)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
  });
}

/**
 * Hook to fetch popular products
 * Performance: Preload popular products, cache for 5 minutes, auto-refresh every minute
 */
export function usePopularProducts(limit: number = 5) {
  return useQuery<PopularProduct[], Error>({
    queryKey: ['products', 'popular', limit],
    queryFn: () => productService.getPopularProducts(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    // Update in real-time - Requirement 5.7
    refetchInterval: 60 * 1000, // Refetch every minute for real-time updates
  });
}

/**
 * Hook to get unique categories from products
 * This is a placeholder - in production, this should come from the backend
 */
export function useProductCategories() {
  return useQuery<string[], Error>({
    queryKey: ['products', 'categories'],
    queryFn: async () => {
      // For now, return hardcoded categories
      // TODO: Implement backend endpoint for categories
      return [
        'إلكترونيات',
        'أجهزة منزلية',
        'أثاث',
        'هواتف ذكية',
        'أجهزة كمبيوتر',
        'تلفزيونات',
        'مكيفات',
      ];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
  });
}
