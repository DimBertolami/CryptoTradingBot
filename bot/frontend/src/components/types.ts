// Shared types for CryptoTradingBot frontend

export interface PriceData {
  date: string;
  price: number;
  volume: number;
  sma20: number | null;
  sma50: number | null;
  ema12: number | null;
  ema26: number | null;
  upperBand: number | null;
  middleBand: number | null;
  lowerBand: number | null;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
  rsi: number | null;
  andy: number | null;
  buySignal?: boolean;
  sellSignal?: boolean;
  andyMark?: { index: number; up: boolean; percent: number };
}
