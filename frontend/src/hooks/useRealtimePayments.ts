import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import websocketService from '../services/websocketService';

/**
 * Payment update event data structure
 */
interface PaymentUpdateEvent {
  type:
    | 'PAYMENT_RECORDED'
    | 'MULTIPLE_PAYMENTS_RECORDED'
    | 'ADVANCE_PAYMENT_RECORDED'
    | 'PAYMENT_REVERSED';
  data: {
    payment?: {
      id: number;
      paymentNumber: string;
      amount: number;
      paymentMethod: string;
      paymentDate: Date;
    };
    payments?: Array<{
      id: number;
      paymentNumber: string;
      amount: number;
      scheduleId: number;
      sequenceNumber: number;
    }>;
    customerId: number;
    customerName: string;
    installmentPlanId: number;
    count?: number;
    totalAmount?: number;
  };
  channel: string;
  timestamp: string;
}

/**
 * Hook configuration options
 */
interface UseRealtimePaymentsOptions {
  enabled?: boolean;
  onPaymentRecorded?: (event: PaymentUpdateEvent) => void;
  onPaymentReversed?: (event: PaymentUpdateEvent) => void;
}

/**
 * Custom hook for real-time payment updates
 *
 * Manages WebSocket connection for payment events with:
 * - Automatic connection/disconnection
 * - Event subscription and handling
 * - Query invalidation for data freshness
 * - Toast notifications for user feedback
 * - Automatic reconnection on disconnect
 *
 * @param options - Configuration options
 * @returns Connection status and control functions
 */
export function useRealtimePayments(options: UseRealtimePaymentsOptions = {}) {
  const { enabled = true, onPaymentRecorded, onPaymentReversed } = options;
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void)[]>([]);
  const hasShownDisconnectToast = useRef(false);

  /**
   * Handle payment recorded events
   * Updates relevant queries and shows success notification
   */
  const handlePaymentRecorded = useCallback(
    async (event: PaymentUpdateEvent) => {
      try {
        // Invalidate relevant queries to refresh data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['todaysDues'] }),
          queryClient.invalidateQueries({ queryKey: ['overdueDues'] }),
          queryClient.invalidateQueries({ queryKey: ['paymentHistory'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] }),
          queryClient.invalidateQueries({ queryKey: ['collectionTrends'] }),
        ]);

        // Call custom callback if provided
        if (onPaymentRecorded) {
          onPaymentRecorded(event);
        }
      } catch (error) {
        console.error('Error handling payment recorded event:', error);
      }
    },
    [queryClient, onPaymentRecorded]
  );

  /**
   * Handle multiple payments recorded events
   * Updates relevant queries and shows success notification with count
   */
  const handleMultiplePaymentsRecorded = useCallback(
    async (event: PaymentUpdateEvent) => {
      try {
        // Invalidate relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['todaysDues'] }),
          queryClient.invalidateQueries({ queryKey: ['overdueDues'] }),
          queryClient.invalidateQueries({ queryKey: ['paymentHistory'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] }),
          queryClient.invalidateQueries({ queryKey: ['collectionTrends'] }),
        ]);

        // Call custom callback if provided
        if (onPaymentRecorded) {
          onPaymentRecorded(event);
        }
      } catch (error) {
        console.error('Error handling multiple payments recorded event:', error);
      }
    },
    [queryClient, onPaymentRecorded]
  );

  /**
   * Handle advance payment recorded events
   * Updates relevant queries and shows success notification
   */
  const handleAdvancePaymentRecorded = useCallback(
    async (event: PaymentUpdateEvent) => {
      try {
        // Invalidate relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['todaysDues'] }),
          queryClient.invalidateQueries({ queryKey: ['overdueDues'] }),
          queryClient.invalidateQueries({ queryKey: ['paymentHistory'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] }),
        ]);

        // Call custom callback if provided
        if (onPaymentRecorded) {
          onPaymentRecorded(event);
        }
      } catch (error) {
        console.error('Error handling advance payment recorded event:', error);
      }
    },
    [queryClient, onPaymentRecorded]
  );

  /**
   * Handle payment reversed events
   * Updates relevant queries and shows info notification
   */
  const handlePaymentReversed = useCallback(
    async (event: PaymentUpdateEvent) => {
      try {
        // Invalidate relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['todaysDues'] }),
          queryClient.invalidateQueries({ queryKey: ['overdueDues'] }),
          queryClient.invalidateQueries({ queryKey: ['paymentHistory'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] }),
          queryClient.invalidateQueries({ queryKey: ['collectionTrends'] }),
        ]);

        // Call custom callback if provided
        if (onPaymentReversed) {
          onPaymentReversed(event);
        }
      } catch (error) {
        console.error('Error handling payment reversed event:', error);
      }
    },
    [queryClient, onPaymentReversed]
  );

  /**
   * Handle connection status changes
   * Logs connection status without showing toasts to avoid infinite loops
   */
  const handleConnectionStatusChange = useCallback((isConnected: boolean) => {
    if (!isConnected && !hasShownDisconnectToast.current) {
      console.log('WebSocket disconnected. Reconnecting...');
      hasShownDisconnectToast.current = true;
    } else if (isConnected && hasShownDisconnectToast.current) {
      console.log('WebSocket reconnected successfully');
      hasShownDisconnectToast.current = false;
    }
  }, []);

  /**
   * Set up WebSocket connection and event listeners
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isSubscribed = false;
    let subscribeTimer: NodeJS.Timeout | null = null;

    // Connect to WebSocket server
    websocketService.connect();

    // Wait for connection before subscribing
    const checkConnectionAndSubscribe = () => {
      if (websocketService.isConnected() && !isSubscribed) {
        websocketService.send({ type: 'subscribe', channel: 'payments' });
        isSubscribed = true;
      } else if (!isSubscribed) {
        // Retry after a short delay
        subscribeTimer = setTimeout(checkConnectionAndSubscribe, 200);
      }
    };

    // Start checking for connection
    subscribeTimer = setTimeout(checkConnectionAndSubscribe, 200);

    // Set up event listeners
    const unsubscribePayment = websocketService.on('payment', (event) => {
      const paymentEvent = event as unknown as PaymentUpdateEvent;

      switch (paymentEvent.type) {
        case 'PAYMENT_RECORDED':
          handlePaymentRecorded(paymentEvent);
          break;
        case 'MULTIPLE_PAYMENTS_RECORDED':
          handleMultiplePaymentsRecorded(paymentEvent);
          break;
        case 'ADVANCE_PAYMENT_RECORDED':
          handleAdvancePaymentRecorded(paymentEvent);
          break;
        case 'PAYMENT_REVERSED':
          handlePaymentReversed(paymentEvent);
          break;
        default:
          console.log('Unknown payment event type:', paymentEvent.type);
      }
    });

    // Subscribe to connection status changes
    const unsubscribeConnectionStatus = websocketService.onConnectionStatusChange(
      handleConnectionStatusChange
    );

    // Store unsubscribe functions
    unsubscribeRef.current = [unsubscribePayment, unsubscribeConnectionStatus];

    // Cleanup on unmount
    return () => {
      // Clear subscribe timer
      if (subscribeTimer) {
        clearTimeout(subscribeTimer);
      }

      // Unsubscribe from events
      unsubscribeRef.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRef.current = [];

      // Unsubscribe from channel only if we were subscribed
      if (isSubscribed && websocketService.isConnected()) {
        websocketService.send({ type: 'unsubscribe', channel: 'payments' });
      }

      // Disconnect from WebSocket
      websocketService.disconnect();

      // Reset disconnect toast flag
      hasShownDisconnectToast.current = false;
    };
  }, [
    enabled,
    handlePaymentRecorded,
    handleMultiplePaymentsRecorded,
    handleAdvancePaymentRecorded,
    handlePaymentReversed,
    handleConnectionStatusChange,
  ]);

  return {
    isConnected: websocketService.isConnected(),
  };
}
