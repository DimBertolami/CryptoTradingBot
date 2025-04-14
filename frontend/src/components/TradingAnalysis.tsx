import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  Button,
  IconButton,
  Tooltip as MuiTooltip,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ArrowUpward,
  ArrowDownward,
  Info,
  Warning,
  CheckCircle,
  Error,
  TrendingUpOutlined,
  TrendingDownOutlined,
  TrendingFlatOutlined,
  ArrowUpwardOutlined,
  ArrowDownwardOutlined,
  InfoOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
} from '@mui/icons-material';
import { useInterval } from 'usehooks-ts';

// Trading signals with explanations
const SIGNALS = {
  'STRONG_BUY': {
    color: '#4caf50',
    icon: <TrendingUpOutlined sx={{ mr: 1 }} />,
    explanation: 'Strong upward momentum detected. This is a high-confidence buy signal based on multiple converging indicators.',
    confidence: 'High',
    risk: 'Low',
    recommendation: 'Buy now with a tight stop-loss. Target price: +10% from current.',
  },
  'BUY': {
    color: '#8bc34a',
    icon: <ArrowUpwardOutlined sx={{ mr: 1 }} />,
    explanation: 'Positive momentum detected. This is a moderate buy signal based on technical indicators.',
    confidence: 'Medium',
    risk: 'Medium',
    recommendation: 'Consider buying with moderate risk management.',
  },
  'HOLD': {
    color: '#ffeb3b',
    icon: <TrendingFlatOutlined sx={{ mr: 1 }} />,
    explanation: 'Market is consolidating. No clear trend direction at this time.',
    confidence: 'Low',
    risk: 'Medium',
    recommendation: 'Hold current positions. Watch for breakout signals.',
  },
  'SELL': {
    color: '#f44336',
    icon: <ArrowDownwardOutlined sx={{ mr: 1 }} />,
    explanation: 'Negative momentum detected. This is a moderate sell signal based on technical indicators.',
    confidence: 'Medium',
    risk: 'Medium',
    recommendation: 'Consider selling with moderate risk management.',
  },
  'STRONG_SELL': {
    color: '#e53935',
    icon: <TrendingDownOutlined sx={{ mr: 1 }} />,
    explanation: 'Strong downward momentum detected. This is a high-confidence sell signal based on multiple converging indicators.',
    confidence: 'High',
    risk: 'Low',
    recommendation: 'Sell now with a tight stop-loss. Target price: -10% from current.',
  },
  'NEUTRAL': {
    color: '#9e9e9e',
    icon: <InfoOutlined sx={{ mr: 1 }} />,
    explanation: 'No clear trading signal at this time. Market is in a neutral state.',
    confidence: 'Low',
    risk: 'High',
    recommendation: 'Wait for clearer signals before making any trades.',
  },
};

// Market conditions with explanations
const MARKET_CONDITIONS = {
  'BULLISH': {
    color: '#4caf50',
    icon: <TrendingUp sx={{ mr: 1 }} />,
    explanation: 'Market is in a strong upward trend. Multiple indicators confirm positive momentum.',
    indicators: [
      'RSI above 50',
      'MACD bullish crossover',
      'Price above moving averages',
      'Volume increasing',
    ],
  },
  'BULLISH_PULLBACK': {
    color: '#8bc34a',
    icon: <ArrowUpward sx={{ mr: 1 }} />,
    explanation: 'Market is pulling back in an overall bullish trend. This could be a buying opportunity.',
    indicators: [
      'RSI below 30',
      'MACD negative divergence',
      'Price near support',
      'Volume decreasing',
    ],
  },
  'NEUTRAL': {
    color: '#ffeb3b',
    icon: <TrendingFlat sx={{ mr: 1 }} />,
    explanation: 'Market is in a consolidation phase. No clear trend direction.',
    indicators: [
      'RSI around 50',
      'MACD near zero',
      'Price in trading range',
      'Volume normal',
    ],
  },
  'BEARISH_PULLBACK': {
    color: '#f44336',
    icon: <ArrowDownward sx={{ mr: 1 }} />,
    explanation: 'Market is pulling back in an overall bearish trend. This could be a shorting opportunity.',
    indicators: [
      'RSI above 70',
      'MACD positive divergence',
      'Price near resistance',
      'Volume decreasing',
    ],
  },
  'BEARISH': {
    color: '#e53935',
    icon: <TrendingDown sx={{ mr: 1 }} />,
    explanation: 'Market is in a strong downward trend. Multiple indicators confirm negative momentum.',
    indicators: [
      'RSI below 50',
      'MACD bearish crossover',
      'Price below moving averages',
      'Volume increasing',
    ],
  },
};

// Risk analysis with explanations
const RISK_ANALYSIS = {
  'LOW': {
    color: '#4caf50',
    icon: <CheckCircle sx={{ mr: 1 }} />,
    explanation: 'Low risk trading conditions. Multiple safety measures in place.',
    factors: [
      'Strong support/resistance levels',
      'High liquidity',
      'Positive market sentiment',
      'Tight stop-loss opportunities',
    ],
  },
  'MODERATE': {
    color: '#ffeb3b',
    icon: <Warning sx={{ mr: 1 }} />,
    explanation: 'Moderate risk trading conditions. Some caution advised.',
    factors: [
      'Unclear support/resistance',
      'Normal liquidity',
      'Mixed market sentiment',
      'Standard stop-loss opportunities',
    ],
  },
  'HIGH': {
    color: '#f44336',
    icon: <Error sx={{ mr: 1 }} />,
    explanation: 'High risk trading conditions. Extra caution required.',
    factors: [
      'Weak support/resistance',
      'Low liquidity',
      'Negative market sentiment',
      'Wide stop-loss requirements',
    ],
  },
};

interface TradingAnalysisProps {
  asset: any;
  priceData: any[];
  orderBook: any;
}

export const TradingAnalysis: React.FC<TradingAnalysisProps> = ({ asset, priceData, orderBook }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signal, setSignal] = useState<string>('NEUTRAL');
  const [marketCondition, setMarketCondition] = useState<string>('NEUTRAL');
  const [riskLevel, setRiskLevel] = useState<string>('MODERATE');

  // Calculate analysis every 5 seconds
  useInterval(() => {
    const newAnalysis = calculateTradingAnalysis(asset, priceData, orderBook);
    setAnalysis(newAnalysis);
    setSignal(newAnalysis.signal);
    setMarketCondition(newAnalysis.marketCondition);
    setRiskLevel(newAnalysis.riskLevel);
    setLoading(false);
  }, 5000);

  // Calculate trading analysis
  const calculateTradingAnalysis = (asset: any, priceData: any[], orderBook: any) => {
    // Calculate technical indicators
    const rsi = calculateRSI(priceData);
    const macd = calculateMACD(priceData);
    const bollinger = calculateBollingerBands(priceData);
    
    // Calculate market sentiment
    const sentiment = calculateSentiment(orderBook);
    
    // Calculate risk factors
    const riskFactors = calculateRiskFactors(asset, priceData);
    
    // Determine trading signal
    const signal = determineSignal(rsi, macd, bollinger, sentiment);
    
    // Determine market condition
    const marketCondition = determineMarketCondition(
      rsi,
      macd,
      bollinger,
      priceData[priceData.length - 1].volume
    );
    
    // Determine risk level
    const riskLevel = determineRiskLevel(riskFactors);
    
    return {
      signal,
      marketCondition,
      riskLevel,
      indicators: {
        rsi,
        macd,
        bollinger,
        sentiment,
        riskFactors,
      },
    };
  };

  // Helper functions for calculations
  const calculateRSI = (data: any[]) => {
    // Calculate RSI
    const gains = data.map((d, i) => i > 0 ? (d.price - data[i-1].price) : 0);
    const avgGain = gains.filter(g => g > 0).reduce((a, b) => a + b, 0) / gains.length;
    const avgLoss = Math.abs(gains.filter(g => g < 0).reduce((a, b) => a + b, 0) / gains.length);
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const calculateMACD = (data: any[]) => {
    // Calculate MACD
    const shortEMA = calculateEMA(data, 12);
    const longEMA = calculateEMA(data, 26);
    const macdLine = shortEMA - longEMA;
    const signalLine = calculateEMA(data.map(d => macdLine), 9);
    return {
      line: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine,
    };
  };

  const calculateBollingerBands = (data: any[]) => {
    // Calculate Bollinger Bands
    const prices = data.map(d => d.price);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = Math.sqrt(
      prices.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / prices.length
    );
    return {
      upper: avg + (2 * stdDev),
      lower: avg - (2 * stdDev),
      current: data[data.length - 1].price,
    };
  };

  const calculateSentiment = (orderBook: any) => {
    // Calculate order book sentiment
    const buyDepth = orderBook.buy.reduce((sum, order) => sum + order.amount, 0);
    const sellDepth = orderBook.sell.reduce((sum, order) => sum + order.amount, 0);
    const spread = orderBook.sell[0].price - orderBook.buy[0].price;
    return {
      buyDepth,
      sellDepth,
      spread,
      sentimentScore: buyDepth > sellDepth ? 1 : -1,
    };
  };

  const calculateRiskFactors = (asset: any, priceData: any[]) => {
    // Calculate risk factors
    const volatility = calculateVolatility(priceData);
    const liquidity = calculateLiquidity(asset);
    const marketImpact = calculateMarketImpact(asset);
    return {
      volatility,
      liquidity,
      marketImpact,
    };
  };

  // Signal determination
  const determineSignal = (rsi: number, macd: any, bollinger: any, sentiment: any) => {
    if (rsi < 30 && macd.histogram > 0 && bollinger.current <= bollinger.lower) {
      return 'STRONG_BUY';
    } else if (rsi > 70 && macd.histogram < 0 && bollinger.current >= bollinger.upper) {
      return 'STRONG_SELL';
    } else if (rsi < 50 && macd.histogram > 0 && sentiment.sentimentScore > 0) {
      return 'BUY';
    } else if (rsi > 50 && macd.histogram < 0 && sentiment.sentimentScore < 0) {
      return 'SELL';
    } else {
      return 'NEUTRAL';
    }
  };

  // Market condition determination
  const determineMarketCondition = (
    rsi: number,
    macd: any,
    bollinger: any,
    volume: number
  ) => {
    if (rsi > 70 && macd.histogram < 0 && volume > 1.5 * calculateAverageVolume(priceData)) {
      return 'BEARISH';
    } else if (rsi < 30 && macd.histogram > 0 && volume > 1.5 * calculateAverageVolume(priceData)) {
      return 'BULLISH';
    } else if (rsi > 50 && macd.histogram < 0 && volume < 0.5 * calculateAverageVolume(priceData)) {
      return 'BEARISH_PULLBACK';
    } else if (rsi < 50 && macd.histogram > 0 && volume < 0.5 * calculateAverageVolume(priceData)) {
      return 'BULLISH_PULLBACK';
    } else {
      return 'NEUTRAL';
    }
  };

  // Risk level determination
  const determineRiskLevel = (riskFactors: any) => {
    const riskScore = (
      riskFactors.volatility * 0.4 +
      riskFactors.liquidity * 0.3 +
      riskFactors.marketImpact * 0.3
    ) / 3;
    
    if (riskScore < 0.3) return 'LOW';
    if (riskScore < 0.7) return 'MODERATE';
    return 'HIGH';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Trading Signal */}
      <Card sx={{ mb: 2 }}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              {SIGNALS[signal].icon}
              <Typography variant="h6" color={SIGNALS[signal].color}>
                {signal.replace('_', ' ')}
              </Typography>
            </Stack>
          }
          subheader={SIGNALS[signal].explanation}
        />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body2" color={SIGNALS[signal].color}>
              {SIGNALS[signal].recommendation}
            </Typography>
            <Divider />
            <Stack direction="row" spacing={2}>
              <Chip
                label={`Confidence: ${SIGNALS[signal].confidence}`}
                color={SIGNALS[signal].confidence === 'High' ? 'success' : SIGNALS[signal].confidence === 'Medium' ? 'warning' : 'error'}
              />
              <Chip
                label={`Risk: ${SIGNALS[signal].risk}`}
                color={SIGNALS[signal].risk === 'Low' ? 'success' : SIGNALS[signal].risk === 'Medium' ? 'warning' : 'error'}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Market Condition */}
      <Card sx={{ mb: 2 }}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              {MARKET_CONDITIONS[marketCondition].icon}
              <Typography variant="h6" color={MARKET_CONDITIONS[marketCondition].color}>
                {marketCondition.replace('_', ' ')}
              </Typography>
            </Stack>
          }
          subheader={MARKET_CONDITIONS[marketCondition].explanation}
        />
        <CardContent>
          <Stack spacing={1}>
            {MARKET_CONDITIONS[marketCondition].indicators.map((indicator: string, index: number) => (
              <Typography key={index} variant="body2" color="text.secondary">
                • {indicator}
              </Typography>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              {RISK_ANALYSIS[riskLevel].icon}
              <Typography variant="h6" color={RISK_ANALYSIS[riskLevel].color}>
                {riskLevel.replace('_', ' ')} Risk
              </Typography>
            </Stack>
          }
          subheader={RISK_ANALYSIS[riskLevel].explanation}
        />
        <CardContent>
          <Stack spacing={1}>
            {RISK_ANALYSIS[riskLevel].factors.map((factor: string, index: number) => (
              <Typography key={index} variant="body2" color="text.secondary">
                • {factor}
              </Typography>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TradingAnalysis;