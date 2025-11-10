# Real-time Updates Implementation

## Overview

The dashboard now supports real-time updates via WebSocket connections. When payments are recorded or installments are created anywhere in the system, the dashboard automatically updates to reflect these changes.

## Architecture

### WebSocket Service (`websocketService.ts`)

The WebSocket service manages the connection lifecycle:

- **Automatic Connection**: Connects when the dashboard mounts
- **Reconnection Logic**: Automatically reconnects with exponential backoff (up to 5 attempts)
- **Event Subscription**: Allows components to subscribe to specific event types
- **Clean Disconnection**: Properly closes connection on unmount

### Real-time Updates Hook (`useRealtimeUpdates.ts`)

The custom hook handles WebSocket events and updates the dashboard:

- **Payment Events**: Updates metrics optimistically and adds activity to feed
- **Installment Events**: Updates active installments count and adds activity
- **Toast Notifications**: Shows success messages for real-time updates
- **Data Refetch**: Invalidates React Query cache to fetch accurate data
- **Error Handling**: Refetches data on error to maintain consistency

## Event Types

### Payment Event

```typescript
{
  type: 'payment',
  data: {
    paymentId: number,
    installmentId: number,
    customerId: number,
    customerName: string,
    amount: number,
    productName?: string,
    timestamp: string
  }
}
```

**Actions:**

- Adds payment activity to feed
- Decreases pending payments amount (optimistic)
- Shows success toast
- Refetches metrics, collection trends, and branch distribution

### Installment Event

```typescript
{
  type: 'installment',
  data: {
    installmentId: number,
    customerId: number,
    customerName: string,
    productName: string,
    totalAmount: number,
    timestamp: string
  }
}
```

**Actions:**

- Adds installment activity to feed
- Increases active installments count (optimistic)
- Shows success toast
- Refetches metrics and top products

## Usage in Dashboard

The Dashboard page automatically sets up real-time updates:

```typescript
// Set up real-time WebSocket updates
const { toast, closeToast } = useRealtimeUpdates();
```

The hook:

1. Connects to WebSocket on mount
2. Subscribes to payment and installment events
3. Updates Redux store optimistically
4. Invalidates React Query cache for accurate data
5. Displays toast notifications
6. Disconnects on unmount

## Configuration

WebSocket URL is derived from the API URL:

```env
VITE_API_URL=http://localhost:4000
# WebSocket URL: ws://localhost:4000
```

## Error Handling

- **Connection Errors**: Automatic reconnection with exponential backoff
- **Event Processing Errors**: Logs error and refetches data
- **Network Issues**: Shows error toast and maintains last known state

## Testing

To test real-time updates:

1. Open dashboard in one browser tab
2. Record a payment or create an installment in another tab
3. Observe automatic updates in the first tab:
   - Metrics update
   - New activity appears in feed
   - Toast notification shows
   - Charts refresh

## Backend Requirements

The backend must implement WebSocket support:

1. Accept WebSocket connections at the same URL as HTTP API
2. Handle authentication via token in initial message
3. Broadcast events to connected clients:
   - `payment` events when payments are recorded
   - `installment` events when installments are created

Example backend event broadcast:

```typescript
// When payment is recorded
websocket.broadcast({
  type: 'payment',
  data: {
    paymentId: 123,
    installmentId: 456,
    customerId: 789,
    customerName: 'محمد أحمد',
    amount: 5000,
    productName: 'تلفزيون سامسونج',
    timestamp: new Date().toISOString(),
  },
});
```

## Performance Considerations

- **Optimistic Updates**: UI updates immediately before server confirmation
- **Debounced Refetch**: Prevents excessive API calls
- **Selective Invalidation**: Only refetches affected queries
- **Connection Pooling**: Single WebSocket connection for entire dashboard
- **Automatic Cleanup**: Properly closes connection on unmount

## Brand Colors

All toast notifications use brand colors:

- Success: Gold (`brand-secondary-400`)
- Error: Burgundy (`brand-primary-900`)
- Info: Off-white (`brand-offwhite-100`)
