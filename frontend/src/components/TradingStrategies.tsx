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

// Trading Strategies with explanations
const TRADING_STRATEGIES = {
  'TREND_FOLLOWING': {
    name: 'Trend Following',
    description: 'This strategy identifies and follows established trends in the market.',
    indicators: [
      'Moving Averages',
      'MACD',
      'RSI',
      'ADX',
    ],
    entrySignals: [
      'Price crossing above 200-day MA',
      'MACD bullish crossover',
      'RSI above 50',
      'ADX above 25',
    ],
    exitSignals: [
      'Price crossing below 200-day MA',
      'MACD bearish crossover',
      'RSI below 50',
      'ADX below 25',
    ],
    riskManagement: {
      stopLoss: '2% below entry',
      takeProfit: '10% above entry',
      positionSize: '3% of portfolio',
    },
    performance: {
      averageWin: '15%',
      averageLoss: '2%',
      winRate: '70%',
    },
  },
  'MEAN_REVERSION': {
    name: 'Mean Reversion',
    description: 'This strategy bets on prices reverting to their mean after extreme moves.',
    indicators: [
      'Bollinger Bands',
      'RSI',
      'Stochastic Oscillator',
      'Williams %R',
    ],
    entrySignals: [
      'Price below lower Bollinger Band',
      'RSI below 30',
      'Stochastic below 20',
      'Williams %R below -80',
    ],
    exitSignals: [
      'Price above middle Bollinger Band',
      'RSI above 70',
      'Stochastic above 80',
      'Williams %R above -20',
    ],
    riskManagement: {
      stopLoss: '1% below entry',
      takeProfit: '5% above entry',
      positionSize: '2% of portfolio',
    },
    performance: {
      averageWin: '4%',
      averageLoss: '1%',
      winRate: '65%',
    },
  },
  'VOLUME_PROFILE': {
    name: 'Volume Profile',
    description: 'This strategy uses volume analysis to identify key price levels and market sentiment.',
    indicators: [
      'Volume Profile',
      'Price Volume Trend',
      'On-Balance Volume',
      'Volume Weighted Average Price',
    ],
    entrySignals: [
      'Price near Value Area High',
      'Positive PVT divergence',
      'OBV confirming price trend',
      'Price above VWAP',
    ],
    exitSignals: [
      'Price near Value Area Low',
      'Negative PVT divergence',
      'OBV diverging from price',
      'Price below VWAP',
    ],
    riskManagement: {
      stopLoss: '1.5% below entry',
      takeProfit: '7% above entry',
      positionSize: '2.5% of portfolio',
    },
    performance: {
      averageWin: '6%',
      averageLoss: '1.5%',
      winRate: '60%',
    },
  },
  'MOMENTUM_TRADING': {
    name: 'Momentum Trading',
    description: 'This strategy capitalizes on strong price momentum and trends.',
    indicators: [
      'RSI',
      'MACD',
      'ADX',
      'ROC',
    ],
    entrySignals: [
      'RSI above 70',
      'MACD bullish crossover',
      'ADX above 40',
      'ROC above 10',
    ],
    exitSignals: [
      'RSI below 70',
      'MACD bearish crossover',
      'ADX below 40',
      'ROC below 10',
    ],
    riskManagement: {
      stopLoss: '3% below entry',
      takeProfit: '15% above entry',
      positionSize: '4% of portfolio',
    },
    performance: {
      averageWin: '12%',
      averageLoss: '3%',
      winRate: '68%',
    },
  },
  'ARBITRAGE': {
    name: 'Arbitrage Trading',
    description: 'This strategy exploits price differences between different exchanges.',
    indicators: [
      'Exchange Price Spread',
      'Volume Weighted Price',
      'Order Book Depth',
      'Market Impact',
    ],
    entrySignals: [
      'Price spread above 1%',
      'Sufficient liquidity on both exchanges',
      'Positive market impact',
      'Low slippage potential',
    ],
    exitSignals: [
      'Price spread below 0.5%',
      'Reduced liquidity',
      'Negative market impact',
      'High slippage potential',
    ],
    riskManagement: {
      stopLoss: '0.5% below entry',
      takeProfit: '1% above entry',
      positionSize: '1% of portfolio',
    },
    performance: {
      averageWin: '0.8%',
      averageLoss: '0.2%',
      winRate: '95%',
    },
  },
};

interface TradingStrategiesProps {
  assets: any[];
  onStrategyChange: (strategy: string) => void;
  onTrade: (asset: any, quantity: number, isBuy: boolean) => void;
}

const TradingStrategies: React.FC<TradingStrategiesProps> = ({ assets, onStrategyChange, onTrade }) => {
  const [activeStrategy, setActiveStrategy] = useState<string>('TREND_FOLLOWING');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [tradeQuantity, setTradeQuantity] = useState(0);
  const [isBuy, setIsBuy] = useState(true);
  const [loading, setLoading] = useState(true);

  // Calculate strategy signals
  const calculateStrategySignals = (asset: any, strategy: string) => {
    const signals = TRADING_STRATEGIES[strategy];
    const priceData = asset.priceData;
    
    // Calculate technical indicators
    const rsi = calculateRSI(priceData);
    const macd = calculateMACD(priceData);
    const bollinger = calculateBollingerBands(priceData);
    const adx = calculateADX(priceData);
    
    // Determine signal strength
    let signalStrength = 0;
    let signalType = 'NEUTRAL';
    
    // Check entry signals
    if (signals.entrySignals.some(signal => {
      switch (signal) {
        case 'Price crossing above 200-day MA':
          return priceData[priceData.length - 1].price > calculateSMA(priceData, 200);
        case 'MACD bullish crossover':
          return macd.histogram > 0;
        case 'RSI above 50':
          return rsi > 50;
        case 'ADX above 25':
          return adx > 25;
        default:
          return false;
      }
    })) {
      signalStrength++;
      signalType = 'BUY';
    }

    // Check exit signals
    if (signals.exitSignals.some(signal => {
      switch (signal) {
        case 'Price crossing below 200-day MA':
          return priceData[priceData.length - 1].price < calculateSMA(priceData, 200);
        case 'MACD bearish crossover':
          return macd.histogram < 0;
        case 'RSI below 50':
          return rsi < 50;
        case 'ADX below 25':
          return adx < 25;
        default:
          return false;
      }
    })) {
      signalStrength++;
      signalType = 'SELL';
    }

    return {
      signalType,
      signalStrength,
      indicators: {
        rsi,
        macd,
        bollinger,
        adx,
      },
    };
  };

  // Calculate simple moving average
  const calculateSMA = (data: any[], period: number) => {
    const prices = data.map(d => d.price);
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  };

  // Calculate RSI
  const calculateRSI = (data: any[]) => {
    const gains = data.map((d, i) => i > 0 ? (d.price - data[i-1].price) : 0);
    const avgGain = gains.filter(g => g > 0).reduce((a, b) => a + b, 0) / gains.length;
    const avgLoss = Math.abs(gains.filter(g => g < 0).reduce((a, b) => a + b, 0) / gains.length);
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  // Calculate MACD
  const calculateMACD = (data: any[]) => {
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

  // Calculate Bollinger Bands
  const calculateBollingerBands = (data: any[]) => {
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

  // Calculate ADX
  const calculateADX = (data: any[]) => {
    // Simplified ADX calculation
    const period = 14;
    const prices = data.map(d => d.price);
    const range = prices.slice(-period).reduce((a, b) => Math.abs(a - b), 0);
    return (range / period) * 100;
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

  // Handle strategy change
  const handleStrategyChange = (newStrategy: string) => {
    setActiveStrategy(newStrategy);
    onStrategyChange(newStrategy);
  };

  // Handle trade
  const handleTrade = () => {
    if (!selectedAsset || tradeQuantity <= 0) return;
    onTrade(selectedAsset, tradeQuantity, isBuy);
    setShowTradeDialog(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Strategy Selection */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Trading Strategies"
          subheader="Select your trading strategy"
        />
        <CardContent>
          <Stack spacing={2}>
            {Object.entries(TRADING_STRATEGIES).map(([strategy, config]) => (
              <Button
                key={strategy}
                fullWidth
                variant={activeStrategy === strategy ? 'contained' : 'outlined'}
                color={activeStrategy === strategy ? 'primary' : 'default'}
                onClick={() => handleStrategyChange(strategy)}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2">
                    {config.name}
                  </Typography>
                  <Chip
                    label={`Win Rate: ${formatPercentage(config.performance.winRate)}`}
                    color={config.performance.winRate >= 0.7 ? 'success' :
                           config.performance.winRate >= 0.6 ? 'warning' :
                           'error'}
                    size="small"
                  />
                  <Chip
                    label={`Avg Return: ${formatPercentage(config.performance.averageWin)}`}
                    color={config.performance.averageWin >= 0.1 ? 'success' :
                           config.performance.averageWin >= 0.05 ? 'warning' :
                           'error'}
                    size="small"
                  />
                </Stack>
              </Button>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Strategy Details */}
      <Card>
        <CardHeader
          title={TRADING_STRATEGIES[activeStrategy].name}
          subheader={TRADING_STRATEGIES[activeStrategy].description}
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Indicators */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Key Indicators
              </Typography>
              <Stack direction="row" spacing={2}>
                {TRADING_STRATEGIES[activeStrategy].indicators.map((indicator: string, index: number) => (
                  <Chip
                    key={index}
                    label={indicator}
                    color="primary"
                    size="small"
                  />
                ))}
              </Stack>
            </Box>

            {/* Entry Signals */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Entry Signals
              </Typography>
              <Stack direction="column" spacing={1}>
                {TRADING_STRATEGIES[activeStrategy].entrySignals.map((signal: string, index: number) => (
                  <Typography key={index} variant="body2" color="success.main">
                    • {signal}
                  </Typography>
                ))}
              </Stack>
            </Box>

            {/* Exit Signals */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Exit Signals
              </Typography>
              <Stack direction="column" spacing={1}>
                {TRADING_STRATEGIES[activeStrategy].exitSignals.map((signal: string, index: number) => (
                  <Typography key={index} variant="body2" color="error.main">
                    • {signal}
                  </Typography>
                ))}
              </Stack>
            </Box>

            {/* Risk Management */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Risk Management
              </Typography>
              <Stack direction="column" spacing={1}>
                <Typography variant="body2">
                  Position Size: {formatPercentage(TRADING_STRATEGIES[activeStrategy].riskManagement.positionSize)}
                </Typography>
                <Typography variant="body2">
                  Stop Loss: {formatPercentage(TRADING_STRATEGIES[activeStrategy].riskManagement.stopLoss)}
                </Typography>
                <Typography variant="body2">
                  Take Profit: {formatPercentage(TRADING_STRATEGIES[activeStrategy].riskManagement.takeProfit)}
                </Typography>
              </Stack>
            </Box>

            {/* Performance Metrics */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Performance Metrics
              </Typography>
              <Stack direction="column" spacing={1}>
                <Typography variant="body2">
                  Average Win: {formatPercentage(TRADING_STRATEGIES[activeStrategy].performance.averageWin)}
                </Typography>
                <Typography variant="body2">
                  Average Loss: {formatPercentage(TRADING_STRATEGIES[activeStrategy].performance.averageLoss)}
                </Typography>
                <Typography variant="body2">
                  Win Rate: {formatPercentage(TRADING_STRATEGIES[activeStrategy].performance.winRate)}
                </Typography>
              </Stack>
            </Box>

            {/* Strategy Signals Table */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Current Signals
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell align="right">Signal</TableCell>
                      <TableCell align="right">Strength</TableCell>
                      <TableCell align="right">Indicators</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assets.map((asset, index) => {
                      const signals = calculateStrategySignals(asset, activeStrategy);
                      const signalColor = signals.signalType === 'BUY' ? 'success' :
                                         signals.signalType === 'SELL' ? 'error' :
                                         'warning';
                      const signalIcon = signals.signalType === 'BUY' ? <TrendingUpIcon /> :
                                        signals.signalType === 'SELL' ? <TrendingDownIcon /> :
                                        <TrendingFlatIcon />;

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {asset.name} ({asset.symbol})
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={signals.signalType}
                              color={signalColor}
                              size="small"
                            />
                            {signalIcon}
                          </TableCell>
                          <TableCell align="right">
                            {signals.signalStrength}/5
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="column" spacing={0.5}>
                              {Object.entries(signals.indicators).map(([indicator, value]) => (
                                <Typography key={indicator} variant="caption" color="text.secondary">
                                  {indicator}: {value.toFixed(2)}
                                </Typography>
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1}>
                              <MuiTooltip title="Buy">
                                <IconButton
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setTradeQuantity(0);
                                    setIsBuy(true);
                                    setShowTradeDialog(true);
                                  }}
                                  color="primary"
                                >
                                  <Add />
                                </IconButton>
                              </MuiTooltip>
                              <MuiTooltip title="Sell">
                                <IconButton
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setTradeQuantity(0);
                                    setIsBuy(false);
                                    setShowTradeDialog(true);
                                  }}
                                  color="error"
                                >
                                  <Remove />
                                </IconButton>
                              </MuiTooltip>
                              <MuiTooltip title="View Strategy Details">
                                <IconButton
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setShowStrategyDialog(true);
                                  }}
                                >
                                  <Info />
                                </IconButton>
                              </MuiTooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Trade Dialog */}
      <Dialog open={showTradeDialog} onClose={() => setShowTradeDialog(false)} maxWidth="sm">
        <DialogTitle>
          {isBuy ? 'Buy' : 'Sell'} {selectedAsset?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography>
              Current Price: ${selectedAsset?.currentPrice?.toFixed(2)}
            </Typography>
            <TextField
              label="Quantity"
              type="number"
              value={tradeQuantity}
              onChange={(e) => setTradeQuantity(parseFloat(e.target.value) || 0)}
              fullWidth
            />
            <Typography>
              Estimated Value: ${formatNumber(tradeQuantity * (selectedAsset?.currentPrice || 0))}
            </Typography>
            <Alert severity={isBuy ? "info" : "warning"}>
              {isBuy ? "This will increase your position in this asset." : "This will decrease your position in this asset."}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTradeDialog(false)}>Cancel</Button>
          <Button onClick={handleTrade} color={isBuy ? "primary" : "error"} variant="contained">
            {isBuy ? "Buy" : "Sell"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Strategy Details Dialog */}
      <Dialog open={showStrategyDialog} onClose={() => setShowStrategyDialog(false)} maxWidth="md">
        <DialogTitle>
          Strategy Details for {selectedAsset?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="h6">
              Current Signal Analysis
            </Typography>
            <Stack spacing={2}>
              <Typography variant="body2">
                Signal Type: {calculateStrategySignals(selectedAsset, activeStrategy).signalType}
              </Typography>
              <Typography variant="body2">
                Signal Strength: {calculateStrategySignals(selectedAsset, activeStrategy).signalStrength}/5
              </Typography>
              <Typography variant="body2">
                Technical Indicators:
                <ul>
                  {Object.entries(calculateStrategySignals(selectedAsset, activeStrategy).indicators)
                    .map(([indicator, value]) => (
                      <li key={indicator}>
                        {indicator}: {value.toFixed(2)}
                      </li>
                    ))}
                </ul>
              </Typography>
            </Stack>
            <Typography variant="h6">
              Risk Assessment
            </Typography>
            <Stack spacing={1}>
              <Chip
                label={`Position Size: ${formatPercentage(
                  TRADING_STRATEGIES[activeStrategy].riskManagement.positionSize
                )}`}
                color="primary"
                size="small"
              />
              <Chip
                label={`Stop Loss: ${formatPercentage(
                  TRADING_STRATEGIES[activeStrategy].riskManagement.stopLoss
                )}`}
                color="error"
                size="small"
              />
              <Chip
                label={`Take Profit: ${formatPercentage(
                  TRADING_STRATEGIES[activeStrategy].riskManagement.takeProfit
                )}`}
                color="success"
                size="small"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStrategyDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradingStrategies;