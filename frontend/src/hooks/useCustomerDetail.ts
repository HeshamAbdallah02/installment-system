import { useQuery } from '@tanstack/react-query';
import customerService from '../services/customerService';
import { queryKeys } from '../lib/queryClient';
import { CustomerDetail } from '../types/customer';

/**
 * Hook to fetch and cache customer details with lazy loading
 * Implements lazy loading for customer details
 * Requirement: 9 - Lazy load customer details
 */
export function useCustomerDetail(customerId: number | undefined) {
  return useQuery<CustomerDetail, Error>({
    queryKey: queryKeys.customers.detail(customerId!),
    queryFn: () => customerService.getCustomerById(customerId!),
    enabled: !!customerId, // Only fetch when customerId is available
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
