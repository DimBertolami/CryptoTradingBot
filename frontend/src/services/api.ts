import { ApiResponse } from '../types/api';
import { MarketData, Trade, PortfolioMetrics, RiskMetrics } from '../types/api';
import { cacheService } from './cache';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export class ApiService {
  private static instance: ApiService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds
  private listeners: Set<(message: any) => void> = new Set();

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private createWebSocket(): void {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.createWebSocket();
          this.reconnectAttempts++;
        }, this.reconnectDelay);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.listeners.forEach(listener => listener(data));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
  }

  public subscribeToUpdates(callback: (message: any) => void): void {
    if (!this.ws) {
      this.createWebSocket();
    }
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  private async fetchWithCache<T>(
    url: string,
    cacheType: string,
    params?: any
  ): Promise<ApiResponse<T>> {
    const cached = cacheService.get<ApiResponse<T>>(cacheType, params);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        cacheService.set(cacheType, data, params);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  public async getMarketData(symbol: string): Promise<ApiResponse<MarketData>> {
    return this.fetchWithCache(`${API_BASE_URL}/market/${symbol}`, 'marketData', { symbol });
  }

  public async getTradeHistory(): Promise<ApiResponse<Trade[]>> {
    return this.fetchWithCache(`${API_BASE_URL}/trades`, 'trades');
  }

  public async getPortfolioMetrics(): Promise<ApiResponse<PortfolioMetrics>> {
    return this.fetchWithCache(`${API_BASE_URL}/portfolio`, 'portfolio');
  }

  public async getRiskMetrics(): Promise<ApiResponse<RiskMetrics>> {
    return this.fetchWithCache(`${API_BASE_URL}/risk`, 'risk');
  }

  public async placeOrder(order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price?: number;
  }): Promise<ApiResponse<Trade>> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      const data = await response.json();
      
      if (data.success) {
        // Clear cache since order state might have changed
        cacheService.clear('trades');
        cacheService.clear('portfolio');
      }
      
      return data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  public async cancelOrder(orderId: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        // Clear cache since order state might have changed
        cacheService.clear('trades');
      }
      
      return data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  public clearCache(): void {
    cacheService.clearAll();
  }
}

export const apiService = ApiService.getInstance();
