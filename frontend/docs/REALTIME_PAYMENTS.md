# Real-time Payment Updates

## Overview

The real-time payment updates feature provides instant synchronization of payment data across all connected clients using WebSocket technology. This ensures that all users see the latest payment information without manual page refreshes.

## Architecture

### Components

1. **Backend WebSocket Service** (`backend/src/services/websocket.service.ts`)
   - Manages WebSocket connections
   - Handles authentication with JWT tokens
   - Supports channel-based subscriptions
   - Broadcasts payment events to subscribed clients

2. **Frontend WebSocket Service** (`frontend/src/services/websocketService.ts`)
   - Manages client-side WebSocket connection
   - Handles automatic reconnection with exponential backoff
   - Uses reference counting for connection management
   - Provides event subscription API

3. **useRealtimePayments Hook** (`frontend/src/hooks/useRealtimePayments.ts`)
   - Custom React hook for payment-specific real-time updates
   - Handles payment event types (recorded, reversed, multiple, advance)
   - Invalidates React Query caches for data freshness
   - Shows toast notifications for user feedback

## Usage

### Basic Usage

```typescript
import { useRealtimePayments } from '../hooks/useRealtimePayments';

function PaymentCollectionPage() {
  // Enable real-time updates
  const { isConnected } = useRealtimePayments({ enabled: true });

  return (
    <div>
      <p>Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {/* Your component content */}
    </div>
  );
}
```

### With Custom Callbacks

```typescript
import { useRealtimePayments } from '../hooks/useRealtimePayments';

function PaymentCollectionPage() {
  const { isConnected } = useRealtimePayments({
    enabled: true,
    onPaymentRecorded: (event) => {
      console.log('Payment recorded:', event.data);
      // Custom logic here
    },
    onPaymentReversed: (event) => {
      console.log('Payment reversed:', event.data);
      // Custom logic here
    },
  });

  return <div>{/* Your component content */}</div>;
}
```

## Event Types

### PAYMENT_RECORDED

Triggered when a single payment is recorded.

```typescript
{
  type: 'PAYMENT_RECORDED',
  data: {
    payment: {
      id: number;
      paymentNumber: string;
      amount: number;
      paymentMethod: string;
      paymentDate: Date;
    };
    customerId: number;
    customerName: string;
    installmentPlanId: number;
  },
  channel: 'payments',
  timestamp: string;
}
```

### MULTIPLE_PAYMENTS_RECORDED

Triggered when multiple payments are recorded in a batch.

```typescript
{
  type: 'MULTIPLE_PAYMENTS_RECORDED',
  data: {
    payments: Array<{
      id: number;
      paymentNumber: string;
      amount: number;
      scheduleId: number;
      sequenceNumber: number;
    }>;
    customerId: number;
    customerName: string;
    installmentPlanId: number;
    count: number;
    totalAmount: number;
  },
  channel: 'payments',
  timestamp: string;
}
```

### ADVANCE_PAYMENT_RECORDED

Triggered when an advance payment is recorded.

```typescript
{
  type: 'ADVANCE_PAYMENT_RECORDED',
  data: {
    payment: {
      id: number;
      paymentNumber: string;
      amount: number;
      paymentMethod: string;
      paymentDate: Date;
    };
    customerId: number;
    customerName: string;
    installmentPlanId: number;
  },
  channel: 'payments',
  timestamp: string;
}
```

### PAYMENT_REVERSED

Triggered when a payment is reversed.

```typescript
{
  type: 'PAYMENT_REVERSED',
  data: {
    payment: {
      id: number;
      paymentNumber: string;
      amount: number;
      paymentMethod: string;
      paymentDate: Date;
    };
    customerId: number;
    customerName: string;
    installmentPlanId: number;
  },
  channel: 'payments',
  timestamp: string;
}
```

## Query Invalidation

When a payment event is received, the following React Query caches are automatically invalidated:

- `['todaysDues']` - Today's due payments list
- `['overdueDues']` - Overdue payments list
- `['paymentHistory']` - Payment history table
- `['dashboardMetrics']` - Dashboard metrics
- `['collectionTrends']` - Collection trends chart

This ensures that all displayed data is refreshed with the latest information.

## Toast Notifications

The hook automatically shows toast notifications for payment events:

- **Payment Recorded**: "تم تسجيل دفعة بمبلغ X ج.م من [customer name]"
- **Multiple Payments**: "تم تسجيل X دفعات بإجمالي Y ج.م من [customer name]"
- **Advance Payment**: "تم تسجيل دفعة مقدمة بمبلغ X ج.م من [customer name]"
- **Payment Reversed**: "تم عكس دفعة بمبلغ X ج.م لـ [customer name]"
- **Error**: "حدث خطأ أثناء تحديث البيانات"

## Connection Management

### Automatic Reconnection

The WebSocket service automatically attempts to reconnect when the connection is lost:

- Uses exponential backoff strategy
- Maximum 5 reconnection attempts
- Initial delay: 3 seconds
- Delay doubles with each attempt

### Reference Counting

The connection uses reference counting to handle multiple subscribers:

- Connection is established when first subscriber connects
- Connection is maintained while any subscriber is active
- Connection is closed only when all subscribers disconnect
- Prevents unnecessary connection churn during navigation

### Debouncing

Connection and disconnection operations are debounced to handle rapid mount/unmount cycles:

- Connect debounce: 100ms
- Disconnect debounce: 300ms

## Authentication

WebSocket connections are authenticated using JWT tokens:

1. Client connects to WebSocket server
2. Client sends authentication message with JWT token
3. Server validates token and marks connection as authenticated
4. Only authenticated connections receive payment events

```typescript
// Authentication flow
ws.send(
  JSON.stringify({
    type: 'auth',
    token: localStorage.getItem('auth_token'),
  })
);
```

## Channel Subscription

Clients must subscribe to the 'payments' channel to receive payment events:

```typescript
// Subscribe to payments channel
ws.send(
  JSON.stringify({
    type: 'subscribe',
    channel: 'payments',
  })
);

// Unsubscribe from payments channel
ws.send(
  JSON.stringify({
    type: 'unsubscribe',
    channel: 'payments',
  })
);
```

## Integration Points

The real-time payments feature is integrated into the following pages:

1. **Payment Collection Page** (`PaymentCollection.tsx`)
   - Shows connection status indicator
   - Clears selections when payments are recorded by other users
   - Auto-refreshes today's dues and overdue lists

2. **Payment History Page** (`PaymentHistory.tsx`)
   - Auto-refreshes payment history table
   - Updates when new payments are recorded or reversed

3. **Collection Reports Page** (`CollectionReports.tsx`)
   - Auto-refreshes report data
   - Ensures reports show latest payment information

## Error Handling

The hook handles errors gracefully:

- Logs errors to console for debugging
- Shows error toast to user
- Invalidates queries to ensure data consistency
- Continues operation after errors

## Performance Considerations

- **Debounced Operations**: Connection management is debounced to prevent rapid connect/disconnect cycles
- **Selective Invalidation**: Only relevant queries are invalidated, not all queries
- **Reference Counting**: Connection is shared across multiple components
- **Automatic Cleanup**: Connections are properly cleaned up on unmount

## Testing

To test real-time updates:

1. Open the application in two browser windows
2. Log in as different users (or same user)
3. Record a payment in one window
4. Observe the update in the other window
5. Check toast notification appears
6. Verify data is refreshed

## Troubleshooting

### Connection Issues

If WebSocket connection fails:

1. Check backend server is running
2. Verify WebSocket server is initialized in `server.ts`
3. Check JWT token is valid in localStorage
4. Verify CORS settings allow WebSocket connections
5. Check browser console for WebSocket errors

### Events Not Received

If events are not received:

1. Verify client is subscribed to 'payments' channel
2. Check authentication was successful
3. Verify backend is broadcasting events
4. Check event type matches expected format
5. Verify user has permission to receive events

### Data Not Refreshing

If data doesn't refresh after events:

1. Check React Query cache invalidation is working
2. Verify query keys match between hook and components
3. Check network tab for refetch requests
4. Verify backend returns updated data

## Future Enhancements

Potential improvements for the real-time payments feature:

1. **Presence Indicators**: Show which users are currently online
2. **Typing Indicators**: Show when another user is recording a payment
3. **Conflict Resolution**: Handle concurrent payment recording
4. **Offline Support**: Queue events when offline and sync when reconnected
5. **Performance Metrics**: Track WebSocket latency and connection quality
6. **Custom Channels**: Support branch-specific or user-specific channels
7. **Event History**: Store recent events for late-joining clients
8. **Compression**: Compress WebSocket messages for better performance

## Security Considerations

- All WebSocket connections require JWT authentication
- Events are only sent to authenticated users
- Channel subscriptions are validated
- Sensitive data is not included in broadcast events
- Connection attempts are rate-limited
- Invalid tokens result in immediate disconnection

## References

- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [React Query Invalidation](https://tanstack.com/query/latest/docs/react/guides/query-invalidation)
- [JWT Authentication](https://jwt.io/introduction)
