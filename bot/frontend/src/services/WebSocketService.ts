import { EventEmitter } from './EventEmitter';

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  subprotocol?: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly subprotocol: string | undefined;
  private readonly reconnectDelay: number;
  private readonly maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private isConnecting: boolean = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig) {
    super();
    this.url = config.url;
    this.subprotocol = config.subprotocol || 'market-data';
    this.reconnectDelay = config.reconnectInterval || 2000;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
  }

  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.reconnectAttempts = 0;
    this.isConnecting = true;
    this.clearTimeouts();

    try {
      // Create WebSocket with subprotocol
      const ws = new WebSocket(this.url, this.subprotocol);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('open');
        this.setupPingPong();
        
        // Send initial subscription message
        const subscriptionMessage = {
          type: 'subscribe',
          data: {
            symbol: 'BTC/USDT',
            timeframe: '1m'
          }
        };
        ws.send(JSON.stringify(subscriptionMessage));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.emit('message', message);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
        this.reconnect();
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.emit('close');
        this.reconnect();
      };

      this.ws = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.emit('error', error);
      this.reconnect();
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    this.connectionTimeout = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  private setupPingPong(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        
        // Set pong timeout
        this.pongTimeout = setTimeout(() => {
          console.log('Pong timeout - closing connection');
          this.ws?.close(4000, 'Pong timeout');
        }, 5000);
      }
    }, 10000); // Ping every 10 seconds
  }

  public send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
      this.emit('error', new Error('WebSocket not connected'));
    }
  }

  public close(): void {
    this.isConnecting = false;
    this.clearTimeouts();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private clearTimeouts(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
}

export default WebSocketService;
