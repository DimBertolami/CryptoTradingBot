import React, { useState, useEffect, useMemo } from 'react';
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

interface BacktestResult {
  strategy: string;
  asset: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  trades: {
    entryTime: string;
    exitTime: string;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    profit: number;
    type: 'BUY' | 'SELL';
  }[];
}

interface BacktesterProps {
  assets: any[];
  strategies: string[];
  onBacktest: (config: any) => Promise<BacktestResult>;
}

const Backtester: React.FC<BacktesterProps> = ({ assets, strategies, onBacktest }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState('TREND_FOLLOWING');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-12-31');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Calculate date range for slider
  const dateRange = useMemo(() => {
    const start = new Date('2020-01-01');
    const end = new Date();
    const dates: string[] = [];
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  // Calculate performance metrics
  const calculateMetrics = (result: BacktestResult) => {
    const { totalReturn, maxDrawdown, sharpeRatio, winRate, averageWin, averageLoss } = result;
    return {
      riskReward: averageWin / Math.abs(averageLoss),
      riskAdjustedReturn: totalReturn / maxDrawdown,
      winLossRatio: winRate / (1 - winRate),
      sortinoRatio: totalReturn / Math.sqrt(result.trades.reduce((a, b) => a + Math.pow(b.profit < 0 ? b.profit : 0, 2), 0)),
    };
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

  // Handle backtest
  const handleBacktest = async () => {
    if (!selectedAsset) return;
    
    setLoading(true);
    try {
      const result = await onBacktest({
        strategy: selectedStrategy,
        asset: selectedAsset,
        startDate,
        endDate,
        initialCapital,
      });
      
      setBacktestResults(prev => [...prev, result]);
      setSelectedResult(result);
      setShowResults(true);
    } catch (error) {
      console.error('Backtest error:', error);
      Alert({
        severity: 'error',
        children: 'Backtest failed. Please check your parameters.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle analysis
  const handleAnalysis = () => {
    if (!selectedResult) return;
    
    const metrics = calculateMetrics(selectedResult);
    setSelectedResult({ ...selectedResult, metrics });
    setShowAnalysis(true);
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
    colors: ['#2ecc71', '#e74c3c'],
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

  // Calculate equity curve data
  const getEquityCurve = (result: BacktestResult) => {
    const data = [result.initialCapital];
    let currentCapital = result.initialCapital;
    
    result.trades.forEach(trade => {
      currentCapital += trade.profit;
      data.push(currentCapital);
    });
    
    return {
      x: result.trades.map(t => t.entryTime),
      y: data,
    };
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Backtest Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Backtest Configuration"
          subheader="Configure your backtest parameters"
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Strategy Selection */}
            <Stack direction="row" spacing={2}>
              <Typography variant="body2">
                Strategy:
              </Typography>
              <Select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value as string)}
                size="small"
              >
                {strategies.map((strategy, index) => (
                  <MenuItem key={index} value={strategy}>
                    {strategy}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            {/* Asset Selection */}
            <Stack direction="row" spacing={2}>
              <Typography variant="body2">
                Asset:
              </Typography>
              <Select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                size="small"
              >
                {assets.map((asset, index) => (
                  <MenuItem key={index} value={asset.symbol}>
                    {asset.name} ({asset.symbol})
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            {/* Date Range */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                sx={{ width: 200 }}
              />
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                sx={{ width: 200 }}
              />
            </Stack>

            {/* Initial Capital */}
            <Stack direction="row" spacing={2}>
              <Typography variant="body2">
                Initial Capital:
              </Typography>
              <TextField
                value={initialCapital}
                onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 10000)}
                type="number"
                size="small"
                sx={{ width: 200 }}
              />
            </Stack>

            {/* Backtest Button */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleBacktest}
              disabled={loading || !selectedAsset}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              Run Backtest
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Backtest Results */}
      {showResults && selectedResult && (
        <Card>
          <CardHeader
            title="Backtest Results"
            subheader={`Strategy: ${selectedStrategy} • Asset: ${selectedAsset}`}
            action={
              <IconButton onClick={handleAnalysis}>
                <Info />
              </IconButton>
            }
          />
          <CardContent>
            <Stack spacing={3}>
              {/* Performance Summary */}
              <Stack direction="row" spacing={2}>
                <Chip
                  label={`Total Return: ${formatPercentage(selectedResult.totalReturn)}`}
                  color={selectedResult.totalReturn >= 0 ? 'success' : 'error'}
                  size="small"
                />
                <Chip
                  label={`Max Drawdown: ${formatPercentage(selectedResult.maxDrawdown)}`}
                  color="error"
                  size="small"
                />
                <Chip
                  label={`Sharpe Ratio: ${selectedResult.sharpeRatio.toFixed(2)}`}
                  color={selectedResult.sharpeRatio >= 1 ? 'success' : 'warning'}
                  size="small"
                />
              </Stack>

              {/* Equity Curve Chart */}
              <Chart
                options={chartOptions}
                series={[
                  {
                    name: 'Equity',
                    data: getEquityCurve(selectedResult),
                  },
                ]}
                type="line"
                height={350}
              />

              {/* Trade Statistics */}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Trade Type</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Average P/L</TableCell>
                      <TableCell align="right">Win Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Winning Trades</TableCell>
                      <TableCell align="right">
                        {selectedResult.trades.filter(t => t.profit > 0).length}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(
                          selectedResult.trades
                            .filter(t => t.profit > 0)
                            .reduce((a, b) => a + b.profit, 0) / 
                            selectedResult.trades.filter(t => t.profit > 0).length
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(selectedResult.winRate)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Losing Trades</TableCell>
                      <TableCell align="right">
                        {selectedResult.trades.filter(t => t.profit <= 0).length}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(
                          selectedResult.trades
                            .filter(t => t.profit <= 0)
                            .reduce((a, b) => a + b.profit, 0) / 
                            selectedResult.trades.filter(t => t.profit <= 0).length
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(1 - selectedResult.winRate)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Analysis Dialog */}
      <Dialog open={showAnalysis} onClose={() => setShowAnalysis(false)} maxWidth="lg">
        <DialogTitle>
          Performance Analysis
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Performance Metrics */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Performance Metrics
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip
                  label={`Risk/Reward Ratio: ${selectedResult.metrics.riskReward.toFixed(2)}`}
                  color={selectedResult.metrics.riskReward >= 2 ? 'success' : 'warning'}
                  size="small"
                />
                <Chip
                  label={`Risk-Adjusted Return: ${selectedResult.metrics.riskAdjustedReturn.toFixed(2)}`}
                  color={selectedResult.metrics.riskAdjustedReturn >= 1 ? 'success' : 'warning'}
                  size="small"
                />
                <Chip
                  label={`Win/Loss Ratio: ${selectedResult.metrics.winLossRatio.toFixed(2)}`}
                  color={selectedResult.metrics.winLossRatio >= 1 ? 'success' : 'warning'}
                  size="small"
                />
                <Chip
                  label={`Sortino Ratio: ${selectedResult.metrics.sortinoRatio.toFixed(2)}`}
                  color={selectedResult.metrics.sortinoRatio >= 1 ? 'success' : 'warning'}
                  size="small"
                />
              </Stack>
            </Box>

            {/* Trade Distribution */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Trade Distribution
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Duration</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Average P/L</TableCell>
                      <TableCell align="right">Win Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { range: '0-1h', count: 0, avgPL: 0, winRate: 0 },
                      { range: '1-6h', count: 0, avgPL: 0, winRate: 0 },
                      { range: '6-24h', count: 0, avgPL: 0, winRate: 0 },
                      { range: '24h+', count: 0, avgPL: 0, winRate: 0 },
                    ].map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.range}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right">{formatNumber(row.avgPL)}</TableCell>
                        <TableCell align="right">{formatPercentage(row.winRate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Risk Analysis */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Risk Analysis
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Drawdown</TableCell>
                      <TableCell align="right">Duration</TableCell>
                      <TableCell align="right">Recovery Time</TableCell>
                      <TableCell align="right">Max Drawdown</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { drawdown: 0, duration: '0h', recovery: '0h', max: 0 },
                      { drawdown: 0, duration: '0h', recovery: '0h', max: 0 },
                      { drawdown: 0, duration: '0h', recovery: '0h', max: 0 },
                    ].map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatPercentage(row.drawdown)}</TableCell>
                        <TableCell align="right">{row.duration}</TableCell>
                        <TableCell align="right">{row.recovery}</TableCell>
                        <TableCell align="right">{formatPercentage(row.max)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalysis(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Backtester;