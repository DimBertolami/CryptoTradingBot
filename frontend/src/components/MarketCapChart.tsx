import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  Area,
} from 'recharts';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  ArrowUpward,
  ArrowDownward,
  Sort,
  Refresh,
  Add,
  Remove,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info,
} from '@mui/icons-material';
import { useInterval } from 'usehooks-ts';

// Helper function to explain market cap
const explainMarketCap = (marketCap: number): string => {
  if (marketCap >= 100000000000) {
    return `This is a mega-cap asset (${formatNumber(marketCap)}). These assets are highly stable but have lower growth potential.`;
  } else if (marketCap >= 10000000000) {
    return `This is a large-cap asset (${formatNumber(marketCap)}). These assets offer a good balance of stability and growth potential.`;
  } else if (marketCap >= 1000000000) {
    return `This is a mid-cap asset (${formatNumber(marketCap)}). These assets can offer good growth opportunities with moderate risk.`;
  } else if (marketCap >= 100000000) {
    return `This is a small-cap asset (${formatNumber(marketCap)}). These assets can offer high growth potential but come with higher risk.`;
  } else {
    return `This is a micro-cap asset (${formatNumber(marketCap)}). These assets are highly volatile and speculative.`;
  }
};

// Helper function to explain volume
const explainVolume = (volume: number, marketCap: number): string => {
  const volumeRatio = volume / marketCap;
  if (volumeRatio > 0.01) {
    return `High trading volume (${formatNumber(volume)}). This indicates high liquidity and active trading.`;
  } else if (volumeRatio > 0.001) {
    return `Moderate trading volume (${formatNumber(volume)}). This indicates reasonable liquidity.`;
  } else {
    return `Low trading volume (${formatNumber(volume)}). This indicates lower liquidity and potential price manipulation risks.`;
  }
};

// Helper function to explain order book
const explainOrderBook = (buyDepth: number, sellDepth: number, spread: number): string => {
  const isBuyHeavy = buyDepth > sellDepth;
  const isStrong = Math.abs(buyDepth - sellDepth) > 1000;

  if (isBuyHeavy && isStrong) {
    return `Order book is heavily buy-side weighted. This indicates strong buying interest and potential price increase.`;
  } else if (!isBuyHeavy && isStrong) {
    return `Order book is heavily sell-side weighted. This indicates strong selling pressure and potential price decrease.`;
  } else if (spread < 0.01) {
    return `Very tight spread (${spread.toFixed(4)}). This indicates high liquidity and efficient market.`;
  } else if (spread < 0.1) {
    return `Moderate spread (${spread.toFixed(4)}). This indicates reasonable liquidity.`;
  } else {
    return `Wide spread (${spread.toFixed(4)}). This indicates lower liquidity and potential price manipulation risks.`;
  }
};

// Helper function to explain price change
const explainPriceChange = (change: number): string => {
  if (change > 5) {
    return `Price has increased significantly (${change.toFixed(1)}%). This could be due to positive news or increased demand.`;
  } else if (change > 1) {
    return `Price is trending up (${change.toFixed(1)}%). This might be a good time to buy.`;
  } else if (change < -5) {
    return `Price has dropped significantly (${Math.abs(change).toFixed(1)}%). This could be due to negative news or increased selling pressure.`;
  } else if (change < -1) {
    return `Price is trending down (${Math.abs(change).toFixed(1)}%). Consider holding or selling.`;
  } else {
    return `Price is relatively stable (${change.toFixed(1)}%). No significant movement detected.`;
  }
};

interface MarketCapData {
  id: string;
  name: string;
  symbol: string;
  marketCap: number;
  price: number;
  volume: number;
  change24h: number;
  buyOrders: number;
  sellOrders: number;
  buyVolume: number;
  sellVolume: number;
  orderBook: {
    buy: Array<{ price: number; amount: number }>;
    sell: Array<{ price: number; amount: number }>;
  };
}

interface MarketCapChartProps {
  assets: any[];
}

const MarketCapChart: React.FC<MarketCapChartProps> = ({ assets }) => {
  const [sortedData, setSortedData] = useState<MarketCapData[]>([]);
  const [sortField, setSortField] = useState<'marketCap' | 'volume' | 'change24h' | 'buyVolume' | 'sellVolume'>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedAsset, setSelectedAsset] = useState<MarketCapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [investmentThreshold, setInvestmentThreshold] = useState(1000);
  const [orderBookDialogOpen, setOrderBookDialogOpen] = useState(false);
  const [hoveredAsset, setHoveredAsset] = useState<MarketCapData | null>(null);

  // Sort data based on selected field
  useEffect(() => {
    const sorted = [...assets].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
    setSortedData(sorted);
  }, [assets, sortField, sortDirection]);

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Calculate investment thresholds based on market cap
  const getInvestmentThreshold = (marketCap: number) => {
    if (marketCap >= 100000000000) { // $100B+
      return {
        min: 100000,
        max: 500000,
        label: '≥ $100,000',
        color: '#1976d2',
        explanation: 'For maximum gains, invest at least $100,000 in mega-cap assets. These assets are highly stable but have lower growth potential.',
      };
    } else if (marketCap >= 10000000000) { // $10B - $100B
      return {
        min: 50000,
        max: 250000,
        label: '≥ $50,000',
        color: '#4caf50',
        explanation: 'For maximum gains, invest at least $50,000 in large-cap assets. These assets offer a good balance of stability and growth potential.',
      };
    } else if (marketCap >= 1000000000) { // $1B - $10B
      return {
        min: 10000,
        max: 50000,
        label: '≥ $10,000',
        color: '#ff9800',
        explanation: 'For maximum gains, invest at least $10,000 in mid-cap assets. These assets can offer good growth opportunities with moderate risk.',
      };
    } else if (marketCap >= 100000000) { // $100M - $1B
      return {
        min: 5000,
        max: 25000,
        label: '≥ $5,000',
        color: '#f44336',
        explanation: 'For maximum gains, invest at least $5,000 in small-cap assets. These assets can offer high growth potential but come with higher risk.',
      };
    } else if (marketCap >= 10000000) { // $10M - $100M
      return {
        min: 1000,
        max: 5000,
        label: '≥ $1,000',
        color: '#9c27b0',
        explanation: 'For maximum gains, invest at least $1,000 in micro-cap assets. These assets are highly volatile and speculative.',
      };
    } else {
      return {
        min: 500,
        max: 2500,
        label: '≥ $500',
        color: '#607d8b',
        explanation: 'For maximum gains, invest at least $500 in nano-cap assets. These assets are extremely volatile and speculative.',
      };
    }
  };

  // Calculate order book depth
  const getOrderBookDepth = (asset: MarketCapData) => {
    const buyDepth = asset.orderBook.buy.reduce((sum, order) => sum + order.amount, 0);
    const sellDepth = asset.orderBook.sell.reduce((sum, order) => sum + order.amount, 0);
    const spread = asset.orderBook.sell[0].price - asset.orderBook.buy[0].price;
    return {
      buy: buyDepth,
      sell: sellDepth,
      spread,
      explanation: explainOrderBook(buyDepth, sellDepth, spread),
    };
  };

  // Real-time updates
  useInterval(() => {
    // Simulate real-time updates
    setSortedData(prev => prev.map(asset => ({
      ...asset,
      price: asset.price * (1 + Math.random() * 0.005 - 0.0025), // ±0.5% random change
      change24h: Math.random() * 10 - 5, // -5% to +5% random change
      volume: asset.volume * (1 + Math.random() * 0.01 - 0.005), // ±1% random change
    })));
  }, 5000); // Update every 5 seconds

  // Custom tooltip with explanations
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, marketCap, price, volume, change24h } = payload[0].payload;
      
      return (
        <Paper elevation={3} sx={{ p: 2, maxWidth: 400 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2">
              {name}
            </Typography>
            
            {/* Market Cap Explanation */}
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Market Cap:</strong> ${formatNumber(marketCap)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {explainMarketCap(marketCap)}
              </Typography>
            </Stack>

            {/* Price Explanation */}
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Price:</strong> ${price.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {explainPriceChange(change24h)}
              </Typography>
            </Stack>

            {/* Volume Explanation */}
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>24h Volume:</strong> ${formatNumber(volume)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {explainVolume(volume, marketCap)}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Market Cap Distribution Chart */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Market Capitalization Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedData.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="marketCap"
              fill="#1976d2"
              name="Market Cap"
            >
              {sortedData.slice(0, 10).map((entry, index) => (
                <Cell
                  key={`bar-${index}`}
                  fill={getInvestmentThreshold(entry.marketCap).color}
                />
              ))}
            </Bar>
            <Bar
              dataKey="volume"
              fill="#4caf50"
              name="24h Volume"
            >
              {sortedData.slice(0, 10).map((entry, index) => (
                <Cell
                  key={`bar-${index}`}
                  fill="#4caf50"
                />
              ))}
            </Bar>
            <Line
              dataKey="price"
              stroke="#f44336"
              strokeWidth={2}
              name="Price"
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Buy/Sell Orders Table */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Buy/Sell Orders
        </Typography>
        
        {/* Sort Controls */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant={sortField === 'marketCap' ? 'contained' : 'outlined'}
            onClick={() => setSortField('marketCap')}
          >
            Market Cap
          </Button>
          <Button
            variant={sortField === 'volume' ? 'contained' : 'outlined'}
            onClick={() => setSortField('volume')}
          >
            Volume
          </Button>
          <Button
            variant={sortField === 'change24h' ? 'contained' : 'outlined'}
            onClick={() => setSortField('change24h')}
          >
            24h Change
          </Button>
          <Button
            variant={sortField === 'buyVolume' ? 'contained' : 'outlined'}
            onClick={() => setSortField('buyVolume')}
          >
            Buy Volume
          </Button>
          <Button
            variant={sortField === 'sellVolume' ? 'contained' : 'outlined'}
            onClick={() => setSortField('sellVolume')}
          >
            Sell Volume
          </Button>
          <IconButton
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
          </IconButton>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Coin</TableCell>
                <TableCell align="right">Market Cap</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">24h Change</TableCell>
                <TableCell align="right">24h Volume</TableCell>
                <TableCell align="right">Buy Orders</TableCell>
                <TableCell align="right">Sell Orders</TableCell>
                <TableCell align="right">Min Investment</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((asset, index) => {
                const threshold = getInvestmentThreshold(asset.marketCap);
                const { buy, sell, spread, explanation: orderBookExplanation } = getOrderBookDepth(asset);

                return (
                  <TableRow
                    key={index}
                    onMouseEnter={() => setHoveredAsset(asset)}
                    onMouseLeave={() => setHoveredAsset(null)}
                  >
                    <TableCell>
                      <Stack direction="column" spacing={1}>
                        <Typography>{asset.name}</Typography>
                        {hoveredAsset?.id === asset.id && (
                          <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                            {explainMarketCap(asset.marketCap)}
                          </Alert>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="column" spacing={1}>
                        <Typography>${formatNumber(asset.marketCap)}</Typography>
                        {hoveredAsset?.id === asset.id && (
                          <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                            {threshold.explanation}
                          </Alert>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="column" spacing={1}>
                        <Typography>${asset.price.toFixed(2)}</Typography>
                        {hoveredAsset?.id === asset.id && (
                          <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                            {explainPriceChange(asset.change24h)}
                          </Alert>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="column" spacing={1}>
                        <Typography
                          sx={{
                            color: asset.change24h >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          {asset.change24h.toFixed(2)}%
                          {asset.change24h >= 0 ? <TrendingUp /> : <TrendingDown />}
                        </Typography>
                        {hoveredAsset?.id === asset.id && (
                          <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                            {explainPriceChange(asset.change24h)}
                          </Alert>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="column" spacing={1}>
                        <Typography>${formatNumber(asset.volume)}</Typography>
                        {hoveredAsset?.id === asset.id && (
                          <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                            {explainVolume(asset.volume, asset.marketCap)}
                          </Alert>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip
                          label={asset.buyOrders.toLocaleString()}
                          color="success"
                          size="small"
                        />
                        <Typography variant="caption" color="success.main">
                          Depth: {formatNumber(buy)} BTC
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip
                          label={asset.sellOrders.toLocaleString()}
                          color="error"
                          size="small"
                        />
                        <Typography variant="caption" color="error.main">
                          Depth: {formatNumber(sell)} BTC
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={threshold.label}
                        color={threshold.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1}>
                        <MuiTooltip title={orderBookExplanation}>
                          <IconButton
                            onClick={() => {
                              setSelectedAsset(asset);
                              setOrderBookDialogOpen(true);
                            }}
                          >
                            <TrendingFlat />
                          </IconButton>
                        </MuiTooltip>
                        <IconButton
                          onClick={() => {
                            // TODO: Implement investment calculator
                          }}
                        >
                          <Add />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            // TODO: Implement investment calculator
                          }}
                        >
                          <Remove />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Order Book Dialog */}
      {selectedAsset && (
        <Dialog open={orderBookDialogOpen} onClose={() => setOrderBookDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h6">
                {selectedAsset.name} Order Book
              </Typography>
              <Chip
                label={getOrderBookDepth(selectedAsset).explanation}
                color="info"
                size="small"
              />
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3}>
              {/* Buy Orders */}
              <Box>
                <Typography variant="subtitle1" color="success.main">
                  Buy Orders (Depth: {formatNumber(getOrderBookDepth(selectedAsset).buy)} BTC)
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={selectedAsset.orderBook.buy}>
                    <XAxis dataKey="price" />
                    <YAxis />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      fill="#4caf50"
                      stroke="#4caf50"
                      name="Buy Orders"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>

              {/* Sell Orders */}
              <Box>
                <Typography variant="subtitle1" color="error.main">
                  Sell Orders (Depth: {formatNumber(getOrderBookDepth(selectedAsset).sell)} BTC)
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={selectedAsset.orderBook.sell}>
                    <XAxis dataKey="price" />
                    <YAxis />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      fill="#f44336"
                      stroke="#f44336"
                      name="Sell Orders"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOrderBookDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default MarketCapChart;