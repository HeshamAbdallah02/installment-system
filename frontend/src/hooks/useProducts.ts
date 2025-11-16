import { useQuery } from '@tanstack/react-query';
import installmentService from '../services/installmentService';
import { queryKeys } from '../lib/queryClient';
import { Product } from '../types/product';

/**
 * Hook to fetch and cache products list
 * Implements product caching for performance optimization
 * Requirement: 9 - Cache product list
 */
export function useProducts() {
  return useQuery<Product[], Error>({
    queryKey: queryKeys.products.list,
    queryFn: () => installmentService.getProducts(),
    staleTime: 10 * 60 * 1000, // 10 minutes - products don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}
