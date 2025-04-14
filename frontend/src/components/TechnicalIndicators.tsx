import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Alert,
  IconButton,
  Tooltip as MuiTooltip,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  Error,
  CheckCircle,
  Info,
  Add,
  Remove,
  Delete,
  Edit,
  SwapHoriz,
  AutoAwesome,
  TrendingUpOutlined,
  TrendingDownOutlined,
  TrendingFlatOutlined,
  WarningOutlined,
  ErrorOutlined,
  CheckCircleOutlined,
  InfoOutlined,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { useInterval } from 'usehooks-ts';
import { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts';

interface TechnicalIndicator {
  name: string;
  description: string;
  category: string;
  parameters: {
    period: number;
    multiplier?: number;
    source?: string;
  };
  calculate: (data: any[], params: any) => any;
}

const TECHNICAL_INDICATORS: Record<string, TechnicalIndicator> = {
  'SMA': {
    name: 'Simple Moving Average',
    description: 'Calculates the average price over a specified period.',
    category: 'Trend',
    parameters: { period: 20 },
    calculate: (data: any[], params: any) => {
      const period = params.period;
      return data.map((_, i) => {
        if (i < period - 1) return null;
        return data.slice(i - period + 1, i + 1)
          .reduce((a, b) => a + b.close, 0) / period;
      });
    },
  },
  'EMA': {
    name: 'Exponential Moving Average',
    description: 'Gives more weight to recent prices.',
    category: 'Trend',
    parameters: { period: 20 },
    calculate: (data: any[], params: any) => {
      const period = params.period;
      const alpha = 2 / (period + 1);
      const sma = data.slice(0, period)
        .reduce((a, b) => a + b.close, 0) / period;
      
      return data.map((_, i) => {
        if (i < period - 1) return null;
        if (i === period - 1) return sma;
        return data[i].close * alpha + data[i - 1].close * (1 - alpha);
      });
    },
  },
  'RSI': {
    name: 'Relative Strength Index',
    description: 'Measures the strength of price action.',
    category: 'Momentum',
    parameters: { period: 14 },
    calculate: (data: any[], params: any) => {
      const period = params.period;
      const gains = [];
      const losses = [];
      
      for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) gains.push(change);
        else losses.push(Math.abs(change));
      }
      
      const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
      
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    },
  },
  'MACD': {
    name: 'Moving Average Convergence Divergence',
    description: 'Shows the relationship between two moving averages.',
    category: 'Momentum',
    parameters: { 
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9 
    },
    calculate: (data: any[], params: any) => {
      const fastEMA = calculateEMA(data, params.fastPeriod);
      const slowEMA = calculateEMA(data, params.slowPeriod);
      const macdLine = fastEMA.map((val, i) => val - slowEMA[i]);
      const signalLine = calculateEMA(macdLine, params.signalPeriod);
      return {
        macd: macdLine,
        signal: signalLine,
        histogram: macdLine.map((val, i) => val - signalLine[i])
      };
    },
  },
  'BB': {
    name: 'Bollinger Bands',
    description: 'Shows volatility and potential overbought/oversold conditions.',
    category: 'Volatility',
    parameters: { 
      period: 20,
      multiplier: 2 
    },
    calculate: (data: any[], params: any) => {
      const period = params.period;
      const multiplier = params.multiplier;
      const sma = calculateSMA(data, period);
      
      const stdDevs = data.map((_, i) => {
        if (i < period - 1) return null;
        const prices = data.slice(i - period + 1, i + 1).map(d => d.close);
        const mean = sma[i];
        const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
        return Math.sqrt(variance);
      });
      
      return {
        upper: sma.map((val, i) => val + stdDevs[i] * multiplier),
        middle: sma,
        lower: sma.map((val, i) => val - stdDevs[i] * multiplier)
      };
    },
  },
  'ADX': {
    name: 'Average Directional Index',
    description: 'Measures trend strength.',
    category: 'Trend',
    parameters: { period: 14 },
    calculate: (data: any[], params: any) => {
      const period = params.period;
      const calculateDM = (data: any[]) => {
        const plusDM = [];
        const minusDM = [];
        
        for (let i = 1; i < data.length; i++) {
          const upMove = data[i].high - data[i - 1].high;
          const downMove = data[i - 1].low - data[i].low;
          
          if (upMove > downMove && upMove > 0) plusDM.push(upMove);
          if (downMove > upMove && downMove > 0) minusDM.push(downMove);
        }
        
        return {
          plusDM: plusDM.reduce((a, b) => a + b, 0) / period,
          minusDM: minusDM.reduce((a, b) => a + b, 0) / period
        };
      };
      
      const { plusDM, minusDM } = calculateDM(data);
      const tr = data.reduce((a, b) => a + Math.max(
        b.high - b.low,
        Math.abs(b.high - data[i - 1].close),
        Math.abs(b.low - data[i - 1].close)
      ), 0) / period;
      
      const plusDI = plusDM / tr * 100;
      const minusDI = minusDM / tr * 100;
      const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
      return dx.reduce((a, b) => a + b, 0) / period;
    },
  },
  'OBV': {
    name: 'On-Balance Volume',
    description: 'Uses volume to predict price changes.',
    category: 'Volume',
    parameters: {},
    calculate: (data: any[]) => {
      let obv = 0;
      return data.map((d, i) => {
        if (i === 0) return d.volume;
        if (d.close > data[i - 1].close) obv += d.volume;
        else if (d.close < data[i - 1].close) obv -= d.volume;
        return obv;
      });
    },
  },
  'VWAP': {
    name: 'Volume Weighted Average Price',
    description: 'Calculates the average price weighted by volume.',
    category: 'Volume',
    parameters: {},
    calculate: (data: any[]) => {
      const totalVolume = data.reduce((a, b) => a + b.volume, 0);
      const totalPriceVolume = data.reduce((a, b) => a + (b.close * b.volume), 0);
      return totalPriceVolume / totalVolume;
    },
  },
  'ATR': {
    name: 'Average True Range',
    description: 'Measures market volatility.',
    category: 'Volatility',
    parameters: { period: 14 },
    calculate: (data: any[], params: any) => {
      const period = params.period;
      const tr = data.map(d => Math.max(
        d.high - d.low,
        Math.abs(d.high - d.close),
        Math.abs(d.low - d.close)
      ));
      return tr.reduce((a, b) => a + b, 0) / period;
    },
  },
  'CCI': {
    name: 'Commodity Channel Index',
    description: 'Identifies cyclical trends.',
    category: 'Momentum',
    parameters: { period: 20 },
    calculate: (data: any[], params: any) => {
      const period = params.period;
      const typicalPrice = data.map(d => (d.high + d.low + d.close) / 3);
      const sma = calculateSMA(typicalPrice, period);
      const meanDeviation = typicalPrice.map((tp, i) => {
        if (i < period - 1) return null;
        return Math.abs(tp - sma[i]);
      });
      const avgDeviation = meanDeviation.reduce((a, b) => a + b, 0) / period;
      return (typicalPrice[typicalPrice.length - 1] - sma[sma.length - 1]) / (0.015 * avgDeviation);
    },
  },
  'STOCH': {
    name: 'Stochastic Oscillator',
    description: 'Compares closing price to price range over time.',
    category: 'Momentum',
    parameters: { 
      period: 14,
      kPeriod: 3,
      dPeriod: 3 
    },
    calculate: (data: any[], params: any) => {
      const period = params.period;
      const kPeriod = params.kPeriod;
      const dPeriod = params.dPeriod;
      
      const k = data.map((_, i) => {
        if (i < period - 1) return null;
        const high = Math.max(...data.slice(i - period + 1, i + 1).map(d => d.high));
        const low = Math.min(...data.slice(i - period + 1, i + 1).map(d => d.low));
        return ((data[i].close - low) / (high - low)) * 100;
      });
      
      const d = calculateSMA(k, dPeriod);
      return { k, d };
    },
  },
  'ROC': {
    name: 'Rate of Change',
    description: 'Measures speed of price change.',
    category: 'Momentum',
    parameters: { period: 12 },
    calculate: (data: any[], params: any) => {
      const period = params.period;
      return data.map((d, i) => {
        if (i < period) return null;
        return ((d.close - data[i - period].close) / data[i - period].close) * 100;
      });
    },
  },
  'MFI': {
    name: 'Money Flow Index',
    description: 'Combines price and volume.',
    category: 'Volume',
    parameters: { period: 14 },
    calculate: (data: any[], params: any) => {
      const period = params.period;
      const typicalPrice = data.map(d => (d.high + d.low + d.close) / 3);
      const moneyFlow = typicalPrice.map((tp, i) => tp * data[i].volume);
      
      const positiveMF = [];
      const negativeMF = [];
      
      for (let i = 1; i < data.length; i++) {
        if (typicalPrice[i] > typicalPrice[i - 1]) positiveMF.push(moneyFlow[i]);
        else negativeMF.push(moneyFlow[i]);
      }
      
      const moneyRatio = positiveMF.reduce((a, b) => a + b, 0) / 
                        negativeMF.reduce((a, b) => a + b, 0);
      return 100 - (100 / (1 + moneyRatio));
    },
  },
};

interface TechnicalIndicatorsProps {
  asset: any;
  onIndicatorChange: (indicator: string, params: any) => void;
}

const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({ asset, onIndicatorChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedIndicator, setSelectedIndicator] = useState('SMA');
  const [indicatorParams, setIndicatorParams] = useState({ period: 20 });
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showChart, setShowChart] = useState(false);

  // Calculate simple moving average
  const calculateSMA = (data: any[], period: number) => {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      return data.slice(i - period + 1, i + 1)
        .reduce((a, b) => a + b.close, 0) / period;
    });
  };

  // Calculate exponential moving average
  const calculateEMA = (data: any[], period: number) => {
    const alpha = 2 / (period + 1);
    const sma = data.slice(0, period)
      .reduce((a, b) => a + b.close, 0) / period;
    
    return data.map((_, i) => {
      if (i < period - 1) return null;
      if (i === period - 1) return sma;
      return data[i].close * alpha + data[i - 1].close * (1 - alpha);
    });
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Format percentage
  const formatPercentage = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Handle indicator change
  const handleIndicatorChange = (indicator: string) => {
    setSelectedIndicator(indicator);
    setIndicatorParams(TECHNICAL_INDICATORS[indicator].parameters);
    onIndicatorChange(indicator, TECHNICAL_INDICATORS[indicator].parameters);
  };

  // Chart configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    colors: ['#2ecc71', '#e74c3c', '#3498db', '#9b59b6'],
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    xaxis: {
      type: 'datetime',
    },
    yaxis: {
      labels: {
        formatter: function (value) {
          return formatNumber(value);
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (value) {
          return formatNumber(value);
        },
      },
    },
  };

  // Calculate indicator data
  const calculateIndicatorData = () => {
    if (!asset.priceData) return null;
    
    const indicator = TECHNICAL_INDICATORS[selectedIndicator];
    const result = indicator.calculate(asset.priceData, indicatorParams);
    
    return result;
  };

  // Get indicator category
  const getIndicatorCategory = (indicator: string) => {
    return TECHNICAL_INDICATORS[indicator].category;
  };

  // Get indicator description
  const getIndicatorDescription = (indicator: string) => {
    return TECHNICAL_INDICATORS[indicator].description;
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Indicator Selection */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Technical Indicators"
          subheader="Select and configure technical indicators"
        />
        <CardContent>
          <Stack spacing={2}>
            {/* Category Tabs */}
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab label="Trend" />
              <Tab label="Momentum" />
              <Tab label="Volatility" />
              <Tab label="Volume" />
            </Tabs>

            {/* Indicator List */}
            {Object.entries(TECHNICAL_INDICATORS).filter(([_, indicator]) => 
              getIndicatorCategory(_).toLowerCase() === ['trend', 'momentum', 'volatility', 'volume'][activeTab]
            ).map(([indicator, config]) => (
              <Button
                key={indicator}
                fullWidth
                variant={selectedIndicator === indicator ? 'contained' : 'outlined'}
                color={selectedIndicator === indicator ? 'primary' : 'default'}
                onClick={() => handleIndicatorChange(indicator)}
                sx={{ mb: 1 }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2">
                    {config.name}
                  </Typography>
                  <Chip
                    label={config.category}
                    color="primary"
                    size="small"
                  />
                </Stack>
              </Button>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Selected Indicator Details */}
      {selectedIndicator && (
        <Card>
          <CardHeader
            title={TECHNICAL_INDICATORS[selectedIndicator].name}
            subheader={TECHNICAL_INDICATORS[selectedIndicator].description}
            action={
              <IconButton onClick={() => setShowExplanation(true)}>
                <Info />
              </IconButton>
            }
          />
          <CardContent>
            <Stack spacing={3}>
              {/* Parameter Configuration */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Configuration
                </Typography>
                <Stack direction="column" spacing={2}>
                  {Object.entries(TECHNICAL_INDICATORS[selectedIndicator].parameters).map(([param, value]) => (
                    <Stack key={param} direction="row" spacing={2} alignItems="center">
                      <Typography variant="body2">
                        {param.charAt(0).toUpperCase() + param.slice(1)}:
                      </Typography>
                      <TextField
                        type="number"
                        value={indicatorParams[param as keyof typeof indicatorParams]}
                        onChange={(e) => {
                          setIndicatorParams(prev => ({
                            ...prev,
                            [param]: parseFloat(e.target.value) || value,
                          }));
                          onIndicatorChange(selectedIndicator, {
                            ...indicatorParams,
                            [param]: parseFloat(e.target.value) || value,
                          });
                        }}
                        size="small"
                        sx={{ width: 120 }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Box>

              {/* Indicator Chart */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Indicator Chart
                </Typography>
                <Chart
                  options={chartOptions}
                  series={[
                    {
                      name: 'Price',
                      data: asset.priceData.map(d => ({ x: d.timestamp, y: d.close }))
                    },
                    ...(calculateIndicatorData() ? [
                      {
                        name: TECHNICAL_INDICATORS[selectedIndicator].name,
                        data: asset.priceData.map((d, i) => ({
                          x: d.timestamp,
                          y: calculateIndicatorData()[i]
                        }))
                      }
                    ] : [])
                  ]}
                  type="line"
                  height={350}
                />
              </Box>

              {/* Signal Analysis */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Signal Analysis
                </Typography>
                <Stack direction="column" spacing={1}>
                  <Chip
                    label={`Current Value: ${formatNumber(calculateIndicatorData()?.[asset.priceData.length - 1] || 0)}`}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={`Signal Strength: ${calculateSignalStrength(calculateIndicatorData())}`}
                    color={getSignalColor(calculateIndicatorData())}
                    size="small"
                  />
                  <Chip
                    label={`Trend Direction: ${getTrendDirection(calculateIndicatorData())}`}
                    color={getTrendColor(calculateIndicatorData())}
                    size="small"
                  />
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Indicator Explanation Dialog */}
      <Dialog open={showExplanation} onClose={() => setShowExplanation(false)} maxWidth="md">
        <DialogTitle>
          {TECHNICAL_INDICATORS[selectedIndicator].name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="body2">
              {TECHNICAL_INDICATORS[selectedIndicator].description}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2 }}>
              How to Use
            </Typography>
            <Typography variant="body2">
              {getUsageInstructions(selectedIndicator)}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Signals
            </Typography>
            <Typography variant="body2">
              {getSignalDescription(selectedIndicator)}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExplanation(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper functions for signal analysis
const calculateSignalStrength = (data: any[] | null) => {
  if (!data) return 'Neutral';
  const lastValue = data[data.length - 1];
  const previousValue = data[data.length - 2];
  
  if (lastValue > previousValue) return 'Strong';
  if (lastValue < previousValue) return 'Weak';
  return 'Neutral';
};

const getSignalColor = (data: any[] | null) => {
  if (!data) return 'default';
  const lastValue = data[data.length - 1];
  const previousValue = data[data.length - 2];
  
  if (lastValue > previousValue) return 'success';
  if (lastValue < previousValue) return 'error';
  return 'warning';
};

const getTrendDirection = (data: any[] | null) => {
  if (!data) return 'Flat';
  const lastValue = data[data.length - 1];
  const previousValue = data[data.length - 2];
  
  if (lastValue > previousValue) return 'Up';
  if (lastValue < previousValue) return 'Down';
  return 'Flat';
};

const getTrendColor = (data: any[] | null) => {
  if (!data) return 'default';
  const lastValue = data[data.length - 1];
  const previousValue = data[data.length - 2];
  
  if (lastValue > previousValue) return 'success';
  if (lastValue < previousValue) return 'error';
  return 'warning';
};

const getUsageInstructions = (indicator: string) => {
  switch (indicator) {
    case 'SMA':
      return 'Use to identify trend direction. When price crosses above SMA, it may indicate a bullish trend.';
    case 'EMA':
      return 'Similar to SMA but gives more weight to recent prices. Useful for faster trend identification.';
    case 'RSI':
      return 'Values above 70 indicate overbought conditions, while below 30 indicate oversold conditions.';
    case 'MACD':
      return 'When MACD line crosses above signal line, it may indicate a buying opportunity.';
    default:
      return 'Please consult the documentation for specific usage instructions.';
  }
};

const getSignalDescription = (indicator: string) => {
  switch (indicator) {
    case 'SMA':
      return '• Bullish signal when price crosses above SMA\n• Bearish signal when price crosses below SMA';
    case 'EMA':
      return '• Bullish signal when EMA shows upward trend\n• Bearish signal when EMA shows downward trend';
    case 'RSI':
      return '• Overbought when RSI > 70\n• Oversold when RSI < 30\n• Divergence signals potential trend reversal';
    case 'MACD':
      return '• Bullish when MACD crosses above signal line\n• Bearish when MACD crosses below signal line\n• Histogram expansion indicates strong trend';
    default:
      return 'Please consult the documentation for specific signal descriptions.';
  }
};

export default TechnicalIndicators;