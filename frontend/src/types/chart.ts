export interface CryptoAsset {
  symbol: string;
  name: string;
  balance: number;
  price: number;
}

export interface ChartData {
  timestamp: number;
  price: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  upperBand?: number;
  lowerBand?: number;
}

export interface IndicatorConfig {
  enabled: boolean;
  color: string;
  lineWidth: number;
}

export interface ChartConfig {
  rsi: IndicatorConfig;
  macd: IndicatorConfig;
  bollingerBands: IndicatorConfig;
}

export interface ChartProps {
  selectedAsset: CryptoAsset;
  timeInterval: string;
  onAssetChange: (asset: CryptoAsset) => void;
  onIndicatorToggle: (indicator: keyof ChartConfig) => void;
}