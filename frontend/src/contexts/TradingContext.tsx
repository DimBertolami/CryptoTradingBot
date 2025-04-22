import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { MarketData, Trade, PortfolioMetrics, RiskMetrics, WebSocketMessage } from '../types/api';
import ErrorBoundary from '../components/ErrorBoundary';

interface TradingContextType {
  marketData: MarketData[];
  trades: Trade[];
  portfolioMetrics: PortfolioMetrics;
  riskMetrics: RiskMetrics;
  loading: boolean;
  error: string | null;
  fetchMarketData: (symbol: string) => Promise<void>;
  fetchTradeHistory: () => Promise<void>;
  fetchPortfolioMetrics: () => Promise<void>;
  fetchRiskMetrics: () => Promise<void>;
  placeOrder: (order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price?: number;
  }) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  clearCache: () => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics>({
    totalValue: 0,
    unrealizedPnl: 0,
    realizedPnl: 0,
    totalTrades: 0,
    winRate: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    volatility: 0,
  });
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    currentRisk: 0,
    maxRisk: 0,
    exposure: 0,
    volatility: 0,
    correlation: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    try {
      switch (message.type) {
        case 'MARKET_DATA':
          setMarketData((prev) => [
            message.data as MarketData,
            ...prev.filter((md) => md.symbol !== (message.data as MarketData).symbol),
          ]);
          break;
        case 'TRADE_UPDATE':
          setTrades((prev) => [
            message.data as Trade,
            ...prev.filter((t) => t.id !== (message.data as Trade).id),
          ]);
          break;
        case 'PORTFOLIO_UPDATE':
          setPortfolioMetrics(message.data as PortfolioMetrics);
          break;
        case 'RISK_UPDATE':
          setRiskMetrics(message.data as RiskMetrics);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error processing WebSocket message:', err);
      setError('Error processing real-time data');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = apiService.subscribeToUpdates(handleWebSocketMessage);

    // Initial data fetch
    Promise.all([
      fetchMarketData('BTC'),
      fetchTradeHistory(),
      fetchPortfolioMetrics(),
      fetchRiskMetrics(),
    ]).catch((err) => {
      console.error('Error fetching initial data:', err);
      setError('Failed to fetch initial data');
    });

    return unsubscribe;
  }, [handleWebSocketMessage]);

  const fetchMarketData = async (symbol: string) => {
    try {
      setLoading(true);
      const response = await apiService.getMarketData(symbol);
      if (response.success) {
        setMarketData((prev) => [
          response.data,
          ...prev.filter((md) => md.symbol !== symbol),
        ]);
      } else {
        setError(response.error || 'Failed to fetch market data');
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Error fetching market data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTradeHistory = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTradeHistory();
      if (response.success) {
        setTrades(response.data);
      } else {
        setError(response.error || 'Failed to fetch trade history');
      }
    } catch (err) {
      console.error('Error fetching trade history:', err);
      setError('Error fetching trade history');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioMetrics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPortfolioMetrics();
      if (response.success) {
        setPortfolioMetrics(response.data);
      } else {
        setError(response.error || 'Failed to fetch portfolio metrics');
      }
    } catch (err) {
      console.error('Error fetching portfolio metrics:', err);
      setError('Error fetching portfolio metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskMetrics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRiskMetrics();
      if (response.success) {
        setRiskMetrics(response.data);
      } else {
        setError(response.error || 'Failed to fetch risk metrics');
      }
    } catch (err) {
      console.error('Error fetching risk metrics:', err);
      setError('Error fetching risk metrics');
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async (order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price?: number;
  }) => {
    try {
      setLoading(true);
      const response = await apiService.placeOrder(order);
      if (!response.success) {
        setError(response.error || 'Failed to place order');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Error placing order');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await apiService.cancelOrder(orderId);
      if (!response.success) {
        setError(response.error || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Error cancelling order');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    apiService.clearCache();
  };

  return (
    <ErrorBoundary>
      <TradingContext.Provider
        value={{
          marketData,
          trades,
          portfolioMetrics,
          riskMetrics,
          loading,
          error,
          fetchMarketData,
          fetchTradeHistory,
          fetchPortfolioMetrics,
          fetchRiskMetrics,
          placeOrder,
          cancelOrder,
          clearCache,
        }}
      >
        {children}
      </TradingContext.Provider>
    </ErrorBoundary>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
