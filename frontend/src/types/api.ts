export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
}

export interface PortfolioMetrics {
  totalValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
}

export interface RiskMetrics {
  currentRisk: number;
  maxRisk: number;
  exposure: number;
  volatility: number;
  correlation: number;
}

export interface WebSocketMessage {
  type: 'MARKET_DATA' | 'TRADE_UPDATE' | 'PORTFOLIO_UPDATE' | 'RISK_UPDATE';
  data: MarketData | Trade | PortfolioMetrics | RiskMetrics;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: number;
}
