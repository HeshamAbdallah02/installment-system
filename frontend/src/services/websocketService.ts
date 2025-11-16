/**
 * WebSocket Service
 * Manages real-time WebSocket connection for dashboard updates
 * Handles payment and installment events with automatic reconnection
 */

type WebSocketEventType = 'payment' | 'installment' | 'overdue' | 'completed';

interface WebSocketEventData {
  [key: string]: unknown;
}

interface WebSocketEvent {
  type: WebSocketEventType;
  data: WebSocketEventData;
  timestamp: string;
}

type EventCallback = (event: WebSocketEvent) => void;
type ConnectionStatusCallback = (isConnected: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<WebSocketEventType, Set<EventCallback>> = new Map();
  private connectionStatusListeners: Set<ConnectionStatusCallback> = new Set();
  private isIntentionallyClosed = false;
  private isConnecting = false;
  private connectionRefCount = 0; // Track number of active subscribers
  private connectDebounceTimer: NodeJS.Timeout | null = null;
  private disconnectDebounceTimer: NodeJS.Timeout | null = null;
  private pendingClose = false;

  /**
   * Connect to WebSocket server
   * Automatically called on dashboard mount
   * Uses reference counting to handle multiple subscribers
   */
  connect(): void {
    // Clear any pending disconnect
    if (this.disconnectDebounceTimer) {
      clearTimeout(this.disconnectDebounceTimer);
      this.disconnectDebounceTimer = null;
      this.pendingClose = false;
    }

    // Increment reference count
    this.connectionRefCount++;

    // Only log if this is the first connection request
    if (this.connectionRefCount === 1) {
      console.log('WebSocket connection requested');
    }

    // If already connected or connecting, just increment the ref count
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // Prevent concurrent connection attempts
    if (this.isConnecting) {
      return;
    }

    // Debounce rapid connection attempts
    if (this.connectDebounceTimer) {
      clearTimeout(this.connectDebounceTimer);
    }

    this.connectDebounceTimer = setTimeout(() => {
      this.connectDebounceTimer = null;
      this.performConnect();
    }, 100);
  }

  /**
   * Perform the actual WebSocket connection
   */
  private performConnect(): void {
    // Check if still needed (ref count > 0)
    if (this.connectionRefCount <= 0 || this.pendingClose) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.isConnecting = true;

    try {
      // Get WebSocket URL from environment or construct from API URL
      const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
      const wsUrl = apiUrl.replace(/^http/, 'ws');

      console.log('Connecting to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket connection opened
   */
  private handleOpen(): void {
    console.log('WebSocket connected successfully');
    this.reconnectAttempts = 0;
    this.isConnecting = false;

    // Notify connection status listeners
    this.notifyConnectionStatus(true);

    // Send authentication token if available
    const token = localStorage.getItem('auth_token');
    if (token && this.ws) {
      this.ws.send(JSON.stringify({ type: 'auth', token }));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      // Handle authentication response
      if (message.type === 'auth') {
        if (message.success === false) {
          console.error('WebSocket authentication failed:', message.message);
          // Clear expired token and disconnect
          localStorage.removeItem('auth_token');
          this.performDisconnect();
          return;
        } else {
          console.log('WebSocket authenticated successfully');
          return;
        }
      }

      // Only log non-subscription messages
      if (message.type !== 'subscribe' && message.type !== 'unsubscribe') {
        console.log('WebSocket message received:', message.type);
      }

      // For other event types, notify listeners
      const listeners = this.eventListeners.get(message.type as WebSocketEventType);
      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(message as WebSocketEvent);
          } catch (error) {
            console.error('Error in WebSocket event listener:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.isConnecting = false;
  }

  /**
   * Handle WebSocket connection closed
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code);
    this.ws = null;
    this.isConnecting = false;

    // Notify connection status listeners
    this.notifyConnectionStatus(false);

    // Only attempt reconnection if not intentionally closed and still have subscribers
    if (!this.isIntentionallyClosed && this.connectionRefCount > 0) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule automatic reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    // Check if still have subscribers
    if (this.connectionRefCount <= 0 || this.pendingClose) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Giving up.');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.connectionRefCount > 0 && !this.pendingClose) {
        this.performConnect();
      }
    }, delay);
  }

  /**
   * Subscribe to WebSocket events
   * @param eventType - Type of event to listen for
   * @param callback - Function to call when event is received
   * @returns Unsubscribe function
   */
  on(eventType: WebSocketEventType, callback: EventCallback): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    const listeners = this.eventListeners.get(eventType)!;
    listeners.add(callback);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventType);
      }
    };
  }

  /**
   * Subscribe to connection status changes
   * @param callback - Function to call when connection status changes
   * @returns Unsubscribe function
   */
  onConnectionStatusChange(callback: ConnectionStatusCallback): () => void {
    this.connectionStatusListeners.add(callback);

    // Immediately notify of current status
    callback(this.isConnected());

    // Return unsubscribe function
    return () => {
      this.connectionStatusListeners.delete(callback);
    };
  }

  /**
   * Notify all connection status listeners
   */
  private notifyConnectionStatus(isConnected: boolean): void {
    this.connectionStatusListeners.forEach((callback) => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  /**
   * Disconnect WebSocket connection
   * Called on dashboard unmount
   * Uses reference counting - only disconnects when all subscribers are gone
   */
  disconnect(): void {
    // Clear any pending connect
    if (this.connectDebounceTimer) {
      clearTimeout(this.connectDebounceTimer);
      this.connectDebounceTimer = null;
    }

    // Decrement reference count
    this.connectionRefCount = Math.max(0, this.connectionRefCount - 1);

    // Only actually disconnect if no more subscribers
    if (this.connectionRefCount > 0) {
      return;
    }

    // Mark as pending close
    this.pendingClose = true;

    // Clear any existing disconnect timer
    if (this.disconnectDebounceTimer) {
      clearTimeout(this.disconnectDebounceTimer);
    }

    // Debounce the actual disconnect to handle rapid mount/unmount cycles
    this.disconnectDebounceTimer = setTimeout(() => {
      this.disconnectDebounceTimer = null;

      // Double-check that we still want to disconnect
      if (this.connectionRefCount > 0) {
        this.pendingClose = false;
        return;
      }

      this.performDisconnect();
    }, 300); // 300ms debounce
  }

  /**
   * Perform the actual WebSocket disconnection
   */
  private performDisconnect(): void {
    this.isIntentionallyClosed = true;
    this.isConnecting = false;
    this.pendingClose = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        // Only close if the WebSocket is actually open
        // Don't try to close if it's still connecting or already closing/closed
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.close(1000, 'Client disconnecting');
        } else if (this.ws.readyState === WebSocket.CONNECTING) {
          // If still connecting, wait for connection then close
          const wsToClose = this.ws;
          wsToClose.addEventListener('open', () => {
            wsToClose.close(1000, 'Client disconnecting');
          });
        }
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Check if WebSocket is currently connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message through WebSocket
   * @param message - Message to send
   */
  send(message: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Cannot send message.');
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
