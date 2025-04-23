import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip as MuiTooltip,
  Stack,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Alert,
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Refresh,
  Settings,
  Info,
  Help,
  Speed,
  Timer,
} from '@mui/icons-material';
import PriceChart from './PriceChart';
import MarketCapChart from './MarketCapChart';
import TradingAnalysis from './TradingAnalysis';
import { useInterval } from 'usehooks-ts';

interface ChartCarouselProps {
  assets: any[];
  onAssetChange: (asset: any) => void;
}

const ChartCarousel: React.FC<ChartCarouselProps> = ({ assets, onAssetChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [loading, setLoading] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(5000); // 5 seconds default
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [tradingSignal, setTradingSignal] = useState<string>('NEUTRAL');
  const [marketCondition, setMarketCondition] = useState<string>('NEUTRAL');
  const [riskLevel, setRiskLevel] = useState<string>('MODERATE');

  // Update selected asset when it changes from parent
  useEffect(() => {
    if (assets.length > 0 && selectedAsset !== assets[0]) {
      setSelectedAsset(assets[0]);
    }
  }, [assets]);

  // Real-time updates
  useInterval(() => {
    setLoading(true);
    // Simulate data fetch
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, updateInterval);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAssetChange = (asset: any) => {
    setSelectedAsset(asset);
    onAssetChange(asset);
  };

  const renderChart = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box>
            <PriceChart
              assets={assets}
              onAssetChange={handleAssetChange}
            />
            <TradingAnalysis
              asset={selectedAsset}
              priceData={selectedAsset.priceData}
              orderBook={selectedAsset.orderBook}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <MarketCapChart
              assets={assets}
            />
            <TradingAnalysis
              asset={selectedAsset}
              priceData={selectedAsset.priceData}
              orderBook={selectedAsset.orderBook}
            />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="chart tabs"
        >
          <Tab
            icon={<TrendingUp sx={{ mr: 1 }} />}
            label="Price Analysis"
          />
          <Tab
            icon={<TrendingFlat sx={{ mr: 1 }} />}
            label="Market Cap & Orders"
          />
        </Tabs>
      </Box>

      {/* Trading Signal Banner */}
      <Box sx={{ p: 2 }}>
        <Chip
          label={tradingSignal.replace('_', ' ')}
          color={tradingSignal === 'STRONG_BUY' || tradingSignal === 'BUY' ? 'success' :
                 tradingSignal === 'STRONG_SELL' || tradingSignal === 'SELL' ? 'error' :
                 'warning'}
          sx={{
            position: 'fixed',
            top: 64,
            right: 16,
            zIndex: 1000,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            padding: '8px 16px',
          }}
        />
      </Box>

      {/* Chart Content */}
      <Box sx={{ p: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress />
          </Box>
        )}
        {renderChart()}
      </Box>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
        <Stack direction="row" spacing={2}>
          <MuiTooltip title="Previous Chart">
            <IconButton
              onClick={() => setActiveTab((prev) => (prev === 0 ? 1 : 0))}
              size="small"
            >
              <ArrowLeft />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title="Next Chart">
            <IconButton
              onClick={() => setActiveTab((prev) => (prev === 1 ? 0 : 1))}
              size="small"
            >
              <ArrowRight />
            </IconButton>
          </MuiTooltip>
        </Stack>

        <Stack direction="row" spacing={2}>
          <MuiTooltip title="Refresh Data">
            <IconButton
              onClick={() => {
                setLoading(true);
                // Simulate data refresh
                setTimeout(() => setLoading(false), 1000);
              }}
              size="small"
            >
              <Refresh />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title="Show Analysis">
            <IconButton
              onClick={() => setShowAnalysis(!showAnalysis)}
              size="small"
            >
              <Info />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title="Settings">
            <IconButton
              onClick={() => setShowSettings(true)}
              size="small"
            >
              <Settings />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title="Help">
            <IconButton
              onClick={() => setShowHelp(true)}
              size="small"
            >
              <Help />
            </IconButton>
          </MuiTooltip>
        </Stack>
      </Box>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)}>
        <DialogTitle>Chart Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="subtitle1">
              Update Interval
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography>
                {Math.round(updateInterval / 1000)} seconds
              </Typography>
              <Slider
                value={updateInterval}
                min={1000}
                max={60000}
                step={1000}
                onChange={(_, value) => setUpdateInterval(value as number)}
                marks={[
                  { value: 1000, label: '1s' },
                  { value: 5000, label: '5s' },
                  { value: 10000, label: '10s' },
                  { value: 30000, label: '30s' },
                  { value: 60000, label: '1m' },
                ]}
                valueLabelDisplay="auto"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelp} onClose={() => setShowHelp(false)} maxWidth="md">
        <DialogTitle>Trading Analysis Guide</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="h6">Trading Signals</Typography>
            <Stack spacing={2}>
              <Alert severity="success">
                <strong>STRONG_BUY:</strong> High-confidence buy signal based on multiple converging indicators.
              </Alert>
              <Alert severity="info">
                <strong>BUY:</strong> Moderate buy signal based on technical indicators.
              </Alert>
              <Alert severity="warning">
                <strong>HOLD:</strong> Market is consolidating. No clear trend direction.
              </Alert>
              <Alert severity="error">
                <strong>SELL:</strong> Moderate sell signal based on technical indicators.
              </Alert>
              <Alert severity="error">
                <strong>STRONG_SELL:</strong> High-confidence sell signal based on multiple converging indicators.
              </Alert>
            </Stack>

            <Typography variant="h6">Market Conditions</Typography>
            <Stack spacing={2}>
              <Alert severity="success">
                <strong>BULLISH:</strong> Strong upward trend with positive momentum.
              </Alert>
              <Alert severity="info">
                <strong>BULLISH_PULLBACK:</strong> Pullback in an overall bullish trend (buying opportunity).
              </Alert>
              <Alert severity="warning">
                <strong>NEUTRAL:</strong> Market consolidation with no clear direction.
              </Alert>
              <Alert severity="error">
                <strong>BEARISH_PULLBACK:</strong> Pullback in an overall bearish trend (shorting opportunity).
              </Alert>
              <Alert severity="error">
                <strong>BEARISH:</strong> Strong downward trend with negative momentum.
              </Alert>
            </Stack>

            <Typography variant="h6">Risk Levels</Typography>
            <Stack spacing={2}>
              <Alert severity="success">
                <strong>LOW RISK:</strong> Multiple safety measures in place. Good entry points available.
              </Alert>
              <Alert severity="warning">
                <strong>MODERATE RISK:</strong> Some caution advised. Standard risk management required.
              </Alert>
              <Alert severity="error">
                <strong>HIGH RISK:</strong> Extra caution required. Wide stop-losses needed.
              </Alert>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelp(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Analysis Dialog */}
      <Dialog open={showAnalysis} onClose={() => setShowAnalysis(false)} maxWidth="md">
        <DialogTitle>Trading Analysis</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="h6">Current Market Status</Typography>
            <Stack spacing={2}>
              <Chip
                label={tradingSignal.replace('_', ' ')}
                color={tradingSignal === 'STRONG_BUY' || tradingSignal === 'BUY' ? 'success' :
                       tradingSignal === 'STRONG_SELL' || tradingSignal === 'SELL' ? 'error' :
                       'warning'}
                variant="outlined"
              />
              <Chip
                label={marketCondition.replace('_', ' ')}
                color={marketCondition === 'BULLISH' ? 'success' :
                       marketCondition === 'BEARISH' ? 'error' :
                       marketCondition === 'BULLISH_PULLBACK' ? 'info' :
                       marketCondition === 'BEARISH_PULLBACK' ? 'warning' :
                       'warning'}
                variant="outlined"
              />
              <Chip
                label={riskLevel.replace('_', ' ')}
                color={riskLevel === 'LOW' ? 'success' :
                       riskLevel === 'MODERATE' ? 'warning' :
                       'error'}
                variant="outlined"
              />
            </Stack>

            <Typography variant="h6">Recommendations</Typography>
            <Stack spacing={2}>
              <Alert severity={tradingSignal === 'STRONG_BUY' || tradingSignal === 'BUY' ? 'success' :
                        tradingSignal === 'STRONG_SELL' || tradingSignal === 'SELL' ? 'error' :
                        'warning'}>
                Based on current market conditions, it is recommended to:
                <ul>
                  <li style={{ marginBottom: '0.5em' }}>
                    {tradingSignal === 'STRONG_BUY' || tradingSignal === 'BUY' ? 'Consider buying with a tight stop-loss.' :
                     tradingSignal === 'STRONG_SELL' || tradingSignal === 'SELL' ? 'Consider selling with a tight stop-loss.' :
                     'Hold current positions and wait for clearer signals.'}
                  </li>
                  <li>
                    Target price: {tradingSignal === 'STRONG_BUY' || tradingSignal === 'BUY' ? '+10%' :
                                  tradingSignal === 'STRONG_SELL' || tradingSignal === 'SELL' ? '-10%' :
                                  'Current price'}
                  </li>
                </ul>
              </Alert>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalysis(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChartCarousel;