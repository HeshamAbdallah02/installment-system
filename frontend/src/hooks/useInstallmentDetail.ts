import { useState, useEffect, useCallback, useRef } from 'react';
import installmentDetailService from '../services/installmentDetailService';
import type { ApiError } from '../constants/errors';
import type { InstallmentDetail, InstallmentStats, Activity } from '../types/installment';
import type { ScheduleItem } from '../components/installments/NextPaymentDueCard';
import type { PaymentRecord } from '../types/payment';
import type { CustomerInfo } from '../components/installments/CustomerInfoCard';
import type { ProductInfo } from '../components/installments/ProductInfoCard';

export interface InstallmentDetailData extends InstallmentDetail {
  nextDuePayment: ScheduleItem | null;
  schedule: ScheduleItem[];
  payments: PaymentRecord[];
  customer: CustomerInfo | null;
  product: ProductInfo | null;
  statistics: InstallmentStats | null;
  activities: Activity[];
}

interface UseInstallmentDetailResult {
  data: InstallmentDetailData | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = new Map<number, { data: InstallmentDetailData; timestamp: number }>();

/**
 * Custom hook for fetching and managing installment detail data with caching
 * Requirements: 1.1, 1.8, 1.9
 * Performance: Caches data for 5 minutes to reduce API calls
 */
export function useInstallmentDetail(installmentId: number | null): UseInstallmentDetailResult {
  const [data, setData] = useState<InstallmentDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(
    async (skipCache = false) => {
      if (!installmentId) {
        return;
      }

      // Check cache first (unless explicitly skipping)
      if (!skipCache) {
        const cached = cache.get(installmentId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const result = await installmentDetailService.getInstallmentDetail(installmentId);

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setData(result as unknown as InstallmentDetailData);

          // Update cache
          cache.set(installmentId, {
            data: result as unknown as InstallmentDetailData,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err as ApiError);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [installmentId]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refetch = useCallback(async () => {
    // Skip cache on manual refetch
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    clearError,
  };
}

/**
 * Custom hook for handling installment detail actions with error handling
 */
export function useInstallmentDetailActions(installmentId: number, onSuccess?: () => void) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const recordPayment = useCallback(
    async (
      scheduleId: number,
      amount: number,
      paymentMethod: string,
      paymentDate: Date,
      notes?: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        await installmentDetailService.recordPayment(
          installmentId,
          scheduleId,
          amount,
          paymentMethod,
          paymentDate,
          notes
        );
        onSuccess?.();
      } catch (err) {
        setError(err as ApiError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [installmentId, onSuccess]
  );

  const sendReminder = useCallback(
    async (method: 'whatsapp' | 'sms' | 'both', scheduleId?: number) => {
      setLoading(true);
      setError(null);

      try {
        await installmentDetailService.sendReminder(installmentId, method, scheduleId);
        onSuccess?.();
      } catch (err) {
        setError(err as ApiError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [installmentId, onSuccess]
  );

  const processEarlySettlement = useCallback(
    async (
      discountPercentage: number,
      paymentMethod: string,
      paymentDate: Date,
      approvedBy?: number
    ) => {
      setLoading(true);
      setError(null);

      try {
        await installmentDetailService.processEarlySettlement(
          installmentId,
          discountPercentage,
          paymentMethod,
          paymentDate,
          approvedBy
        );
        onSuccess?.();
      } catch (err) {
        setError(err as ApiError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [installmentId, onSuccess]
  );

  const modifyTerms = useCallback(
    async (
      monthlyAmount: number | undefined,
      termMonths: number | undefined,
      interestRate: number | undefined,
      reason: string,
      approvedBy: number
    ) => {
      setLoading(true);
      setError(null);

      try {
        await installmentDetailService.modifyTerms(
          installmentId,
          monthlyAmount,
          termMonths,
          interestRate,
          reason,
          approvedBy
        );
        onSuccess?.();
      } catch (err) {
        setError(err as ApiError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [installmentId, onSuccess]
  );

  const cancelInstallment = useCallback(
    async (reason: string) => {
      setLoading(true);
      setError(null);

      try {
        await installmentDetailService.cancelInstallment(installmentId, reason);
        onSuccess?.();
      } catch (err) {
        setError(err as ApiError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [installmentId, onSuccess]
  );

  const exportDetail = useCallback(
    async (
      format: 'pdf' | 'excel',
      options: {
        includeSchedule?: boolean;
        includePayments?: boolean;
        includeCustomer?: boolean;
        includeActivities?: boolean;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await installmentDetailService.exportInstallmentDetail(
          installmentId,
          format,
          options
        );
        return result;
      } catch (err) {
        setError(err as ApiError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [installmentId]
  );

  return {
    loading,
    error,
    clearError,
    recordPayment,
    sendReminder,
    processEarlySettlement,
    modifyTerms,
    cancelInstallment,
    exportDetail,
  };
}
