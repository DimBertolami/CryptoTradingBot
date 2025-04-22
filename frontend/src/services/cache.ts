import { MarketData, Trade, PortfolioMetrics, RiskMetrics } from '../types/api';
import { v4 as uuidv4 } from 'uuid';

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  marketData: number;  // in milliseconds
  trades: number;
  portfolio: number;
  risk: number;
}

const defaultCacheConfig: CacheConfig = {
  marketData: 5000,  // 5 seconds
  trades: 30000,     // 30 seconds
  portfolio: 10000,  // 10 seconds
  risk: 10000,       // 10 seconds
};

class CacheService {
  private cache: Map<string, CacheItem> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultCacheConfig, ...config };
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private generateKey(type: string, params?: any): string {
    return `${type}_${JSON.stringify(params)}_${uuidv4()}`;
  }

  public get<T>(type: string, params?: any): T | null {
    const key = this.generateKey(type, params);
    const item = this.cache.get(key);

    if (item && !this.isExpired(item)) {
      return item.data as T;
    }

    return null;
  }

  public set<T>(type: string, data: T, params?: any): void {
    const key = this.generateKey(type, params);
    const ttl = this.config[type as keyof CacheConfig] || 30000;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  public clear(type: string, params?: any): void {
    const key = this.generateKey(type, params);
    this.cache.delete(key);
  }

  public clearAll(): void {
    this.cache.clear();
  }
}

export const cacheService = new CacheService();
