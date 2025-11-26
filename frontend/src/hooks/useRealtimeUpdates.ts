import { useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import websocketService from '../services/websocketService';
import {
  addActivity,
  updateMetricsOptimistic,
  type Activity,
  type DashboardMetrics,
} from '../store/dashboardSlice';

interface PaymentEventData {
  paymentId: number;
  installmentId: number;
  customerId: number;
  customerName: string;
  amount: number;
  productName?: string;
  timestamp: string;
}

interface InstallmentEventData {
  installmentId: number;
  customerId: number;
  customerName: string;
  productName: string;
  totalAmount: number;
  timestamp: string;
}

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

/**
 * Custom hook for handling real-time WebSocket updates in the dashboard
 * Manages payment and installment events with optimistic updates
 */
export function useRealtimeUpdates() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<ToastMessage>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  /**
   * Show toast notification
   */
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      message,
      type,
      isVisible: true,
    });
  }, []);

  /**
   * Close toast notification
   */
  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  /**
   * Handle payment recorded events
   * Updates metrics optimistically and adds activity to feed
   */
  const handlePaymentEvent = useCallback(
    async (
      event:
        | { data: PaymentEventData }
        | { type: string; data: Record<string, unknown>; timestamp: string }
    ) => {
      if (!('paymentId' in event.data)) return;
      try {
        const data = event.data as PaymentEventData;

        // Create activity for the feed
        const activity: Activity = {
          id: `payment_${data.paymentId}_${Date.now()}`,
          type: 'payment',
          title: 'دفعة جديدة',
          description: `تم تسجيل دفعة بمبلغ ${data.amount.toLocaleString('ar-EG')} ج.م من ${data.customerName}`,
          timestamp: data.timestamp,
          userId: 0, // Will be set by backend
          userName: '', // Will be set by backend
          metadata: {
            customerId: data.customerId,
            customerName: data.customerName,
            amount: data.amount,
            productName: data.productName,
            installmentId: data.installmentId,
          },
        };

        // Add activity to feed
        dispatch(addActivity(activity));

        // Optimistically update metrics
        // Note: These are rough estimates, actual values will come from refetch
        const currentMetrics = queryClient.getQueryData<DashboardMetrics>(['metrics']);
        if (currentMetrics) {
          const updatedMetrics: Partial<DashboardMetrics> = {
            pendingPayments: {
              amount: Math.max(0, currentMetrics.pendingPayments.amount - data.amount),
              trend: currentMetrics.pendingPayments.trend,
            },
          };
          dispatch(updateMetricsOptimistic(updatedMetrics));
        }

        // Show success toast
        showToast(`تم تسجيل دفعة بمبلغ ${data.amount.toLocaleString('ar-EG')} ج.م`, 'success');

        // Refetch dashboard data to get accurate values
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['metrics'] }),
          queryClient.invalidateQueries({ queryKey: ['collectionTrends'] }),
        ]);
      } catch (error) {
        console.error('Error handling payment event:', error);

        // Refetch data on error to ensure consistency
        await queryClient.invalidateQueries({ queryKey: ['metrics'] });

        showToast('حدث خطأ أثناء تحديث البيانات', 'error');
      }
    },
    [dispatch, queryClient, showToast]
  );

  /**
   * Handle installment created events
   * Updates active installments count and adds activity to feed
   */
  const handleInstallmentEvent = useCallback(
    async (
      event:
        | { data: InstallmentEventData }
        | { type: string; data: Record<string, unknown>; timestamp: string }
    ) => {
      try {
        if (!('installmentId' in event.data)) return;
        const data: InstallmentEventData = event.data as InstallmentEventData;

        // Create activity for the feed
        const activity: Activity = {
          id: `installment_${data.installmentId}_${Date.now()}`,
          type: 'installment',
          title: 'قسط جديد',
          description: `تم إنشاء قسط جديد لـ ${data.customerName} - ${data.productName}`,
          timestamp: data.timestamp,
          userId: 0,
          userName: '',
          metadata: {
            customerId: data.customerId,
            customerName: data.customerName,
            productName: data.productName,
            installmentId: data.installmentId,
            amount: data.totalAmount,
          },
        };

        // Add activity to feed
        dispatch(addActivity(activity));

        // Optimistically update active installments count
        const currentMetrics = queryClient.getQueryData<DashboardMetrics>(['metrics']);
        if (currentMetrics) {
          const updatedMetrics: Partial<DashboardMetrics> = {
            activeInstallments: {
              count: currentMetrics.activeInstallments.count + 1,
              trend: currentMetrics.activeInstallments.trend,
            },
          };
          dispatch(updateMetricsOptimistic(updatedMetrics));
        }

        // Show success toast
        showToast('تم إنشاء قسط جديد بنجاح', 'success');

        // Refetch dashboard data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['metrics'] }),
          queryClient.invalidateQueries({ queryKey: ['topProducts'] }),
        ]);
      } catch (error) {
        console.error('Error handling installment event:', error);

        // Refetch data on error
        await queryClient.invalidateQueries({ queryKey: ['metrics'] });

        showToast('حدث خطأ أثناء تحديث البيانات', 'error');
      }
    },
    [dispatch, queryClient, showToast]
  );

  /**
   * Connect to WebSocket and set up event listeners
   */
  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Subscribe to payment events
    const unsubscribePayment = websocketService.on('payment', handlePaymentEvent);

    // Subscribe to installment events
    const unsubscribeInstallment = websocketService.on('installment', handleInstallmentEvent);

    // Cleanup on unmount
    return () => {
      unsubscribePayment();
      unsubscribeInstallment();
      websocketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - connect once on mount, disconnect on unmount

  return {
    toast,
    closeToast,
    isConnected: websocketService.isConnected(),
  };
}
