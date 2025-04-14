interface PriceData {
  timestamp: number;
  price: number;
}

export interface TechnicalIndicatorData {
  timestamp: number;
  price: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  upperBand?: number;
  lowerBand?: number;
}

export const calculateIndicators = async (params: {
  prices: PriceData[];
  market_caps?: number[];
  total_volumes?: number[];
}): Promise<TechnicalIndicatorData[]> => {
  const { prices } = params;
  
  // Calculate RSI
  const rsi = calculateRSI(prices.map(p => p.price));
  
  // Calculate MACD
  const macd = calculateMACD(prices.map(p => p.price));
  
  // Calculate Bollinger Bands
  const bands = calculateBollingerBands(prices.map(p => p.price));
  
  return prices.map((priceData, i) => ({
    timestamp: priceData.timestamp,
    price: priceData.price,
    rsi: rsi[i] ?? undefined,
    macd: macd.macd[i] ?? undefined,
    macdSignal: macd.signal[i] ?? undefined,
    upperBand: bands.upper[i] ?? undefined,
    lowerBand: bands.lower[i] ?? undefined
  }));
};

const calculateRSI = (prices: number[], period: number = 14): (number | undefined)[] => {
  const rsi: (number | undefined)[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rsi.push(undefined);
      continue;
    }

    const gains = prices.slice(i - period, i)
      .filter((p, j) => j > 0 && p > prices[i - period + j - 1])
      .map(p => p - prices[i - period + prices.slice(i - period, i).indexOf(p)]);

    const losses = prices.slice(i - period, i)
      .filter((p, j) => j > 0 && p < prices[i - period + j - 1])
      .map(p => prices[i - period + prices.slice(i - period, i).indexOf(p)] - p);

    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b) / gains.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b) / losses.length : 0;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    rsi.push(rsiValue);
  }
  
  return rsi;
};

const calculateMACD = (prices: number[]): { macd: (number | undefined)[], signal: (number | undefined)[] } => {
  const calculateEMA = (prices: (number | undefined)[], period: number): (number | undefined)[] => {
    const alpha = 2 / (period + 1);
    const emas: (number | undefined)[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        emas.push(prices[i]);
        continue;
      }
      
      const prevEMA = emas[i - 1];
      const currentPrice = prices[i];
      
      if (prevEMA === undefined || currentPrice === undefined) {
        emas.push(undefined);
      } else {
        emas.push(alpha * currentPrice + (1 - alpha) * prevEMA);
      }
    }
    
    return emas.map((ema, i) => i < period - 1 ? undefined : ema);
  };

  const fastEMA = calculateEMA(prices.map(p => p), 12);
  const slowEMA = calculateEMA(prices.map(p => p), 26);
  const macdLine = fastEMA.map((ema, i) => {
    if (ema === undefined || slowEMA[i] === undefined) return undefined;
    return ema - slowEMA[i];
  });
  const signalLine = calculateEMA(macdLine, 9);

  return { macd: macdLine, signal: signalLine };
};

const calculateBollingerBands = (prices: number[]): { upper: (number | undefined)[], lower: (number | undefined)[] } => {
  const upper: (number | undefined)[] = [];
  const lower: (number | undefined)[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < 20) {
      upper.push(undefined);
      lower.push(undefined);
      continue;
    }

    const pricesSlice = prices.slice(i - 20, i);
    const avg = pricesSlice.reduce((a, b) => a + b) / pricesSlice.length;
    const stdDev = Math.sqrt(
      pricesSlice.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / pricesSlice.length
    );

    upper.push(avg + 2 * stdDev);
    lower.push(avg - 2 * stdDev);
  }

  return { upper, lower };
};