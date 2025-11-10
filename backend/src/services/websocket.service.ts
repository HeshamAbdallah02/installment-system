import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAuthenticated?: boolean;
}

interface WebSocketMessage {
  type: string;
  token?: string;
  data?: unknown;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: AuthenticatedWebSocket) => {
      console.log('New WebSocket connection');

      ws.on('message', (message: string) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        this.handleClose(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(ws: AuthenticatedWebSocket, message: string): void {
    try {
      const parsedMessage: WebSocketMessage = JSON.parse(message.toString());

      switch (parsedMessage.type) {
        case 'auth':
          this.handleAuth(ws, parsedMessage.token);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          console.log('Unknown message type:', parsedMessage.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle authentication
   */
  private handleAuth(ws: AuthenticatedWebSocket, token?: string): void {
    if (!token) {
      ws.send(JSON.stringify({ type: 'auth', success: false, message: 'No token provided' }));
      return;
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };

      ws.userId = decoded.userId;
      ws.isAuthenticated = true;

      // Store authenticated client
      this.clients.set(decoded.userId, ws);

      ws.send(JSON.stringify({ type: 'auth', success: true, message: 'Authenticated' }));
      console.log(`WebSocket authenticated for user: ${decoded.userId}`);
    } catch (error) {
      ws.send(JSON.stringify({ type: 'auth', success: false, message: 'Invalid token' }));
      console.error('WebSocket authentication failed:', error);
    }
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(ws: AuthenticatedWebSocket): void {
    if (ws.userId) {
      this.clients.delete(ws.userId);
      console.log(`WebSocket disconnected for user: ${ws.userId}`);
    } else {
      console.log('WebSocket disconnected (unauthenticated)');
    }
  }

  /**
   * Broadcast event to all authenticated clients
   */
  broadcast(event: { type: string; data: unknown }): void {
    const message = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.isAuthenticated && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Send event to specific user
   */
  sendToUser(userId: string, event: { type: string; data: unknown }): void {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  /**
   * Get number of connected clients
   */
  getConnectedCount(): number {
    return this.clients.size;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
