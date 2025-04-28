// Utility functions for calculating technical indicators
// All calculations assume input is an array of { price: number, ... }

export function calculateSMA(prices: number[], window: number): (number|null)[] {
  const sma: (number|null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < window - 1) {
      sma.push(null);
    } else {
      const sum = prices.slice(i - window + 1, i + 1).reduce((acc, price) => acc + price, 0);
      sma.push(sum / window);
    }
  }
  return sma;
}

export function calculateEMA(prices: number[], window: number): (number|null)[] {
  const ema: (number|null)[] = [];
  const multiplier = 2 / (window + 1);
  for (let i = 0; i < prices.length; i++) {
    if (i < window - 1) {
      ema.push(null);
    } else if (i === window - 1) {
      // First EMA is SMA(window)
      const sma = prices.slice(i - window + 1, i + 1).reduce((acc, price) => acc + price, 0) / window;
      ema.push(sma);
    } else {
      ema.push((prices[i] - (ema[i - 1] ?? prices[i])) * multiplier + (ema[i - 1] ?? prices[i]));
    }
  }
  return ema;
}

export function calculateBollingerBands(prices: number[], window: number = 20, numStdDev: number = 2): { upper: (number|null)[], middle: (number|null)[], lower: (number|null)[] } {
  const middle = calculateSMA(prices, window);
  const upper: (number|null)[] = [];
  const lower: (number|null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < window - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = prices.slice(i - window + 1, i + 1);
      const mean = middle[i] as number;
      const std = Math.sqrt(slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / window);
      upper.push(mean + numStdDev * std);
      lower.push(mean - numStdDev * std);
    }
  }
  return { upper, middle, lower };
}

export function calculateMACD(prices: number[], fast: number = 12, slow: number = 26, signal: number = 9): { macd: (number|null)[], signal: (number|null)[], histogram: (number|null)[] } {
  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);
  const macd: (number|null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (emaFast[i] == null || emaSlow[i] == null) {
      macd.push(null);
    } else {
      macd.push((emaFast[i] as number) - (emaSlow[i] as number));
    }
  }
  const signalLine = calculateEMA(macd.map(v => v ?? 0), signal); // fallback for nulls for EMA
  const histogram = macd.map((val, i) => (val != null && signalLine[i] != null) ? val - (signalLine[i] as number) : null);
  return { macd, signal: signalLine, histogram };
}

export function calculateRSI(prices: number[], window: number = 14): (number|null)[] {
  const rsi: (number|null)[] = [];
  let gainSum = 0, lossSum = 0;
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (i <= window) {
      if (change > 0) gainSum += change;
      else lossSum -= change;
      rsi.push(null);
    } else {
      if (change > 0) {
        gainSum = (gainSum * (window - 1) + change) / window;
        lossSum = (lossSum * (window - 1)) / window;
      } else {
        gainSum = (gainSum * (window - 1)) / window;
        lossSum = (lossSum * (window - 1) - change) / window;
      }
      const rs = lossSum === 0 ? 100 : gainSum / lossSum;
      rsi.push(100 - 100 / (1 + rs));
    }
  }
  // Pad initial values
  for (let i = 0; i <= window; i++) rsi[i] = null;
  return rsi;
}

// Placeholder for "Andy-cator" (custom indicator)
export function calculateAndy(prices: number[], window: number = 14): (number|null)[] {
  // TODO: Replace with actual formula if available
  // For now, use a dummy oscillator: difference between price and SMA(window)
  const sma = calculateSMA(prices, window);
  return prices.map((price, i) => (sma[i] != null ? price - sma[i]! : null));
}
