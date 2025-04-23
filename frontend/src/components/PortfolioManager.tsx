import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  Edit,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Money,
  SwapHoriz,
  AutoAwesome,
  Error,
  CheckCircle,
} from '@mui/icons-material';
import { useInterval } from 'usehooks-ts';

interface PortfolioAsset {
  id: string;
  name: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  allocation: number;
  targetAllocation: number;
}

interface PortfolioManagerProps {
  assets: any[];
  onTrade: (asset: any, quantity: number, isBuy: boolean) => void;
  onRebalance: () => void;
}

const PortfolioManager: React.FC<PortfolioManagerProps> = ({ assets, onTrade, onRebalance }) => {
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [tradeQuantity, setTradeQuantity] = useState(0);
  const [isBuy, setIsBuy] = useState(true);
  const [showRebalanceDialog, setShowRebalanceDialog] = useState(false);

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = () => {
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.totalValue, 0);
    const totalPnl = portfolio.reduce((sum, asset) => sum + asset.unrealizedPnl, 0);
    const totalPnlPercent = (totalPnl / (totalValue - totalPnl)) * 100;

    return {
      totalValue,
      totalPnl,
      totalPnlPercent,
    };
  };

  // Calculate rebalancing trades
  const calculateRebalanceTrades = () => {
    const metrics = calculatePortfolioMetrics();
    const targetValue = metrics.totalValue / 100;
    const trades: { asset: PortfolioAsset; quantity: number; isBuy: boolean }[] = [];

    portfolio.forEach(asset => {
      const targetQuantity = (asset.targetAllocation / 100) * targetValue / asset.currentPrice;
      const quantityDiff = targetQuantity - asset.quantity;

      if (Math.abs(quantityDiff) > 0.01) { // Only trade if difference is significant
        trades.push({
          asset,
          quantity: Math.abs(quantityDiff),
          isBuy: quantityDiff > 0,
        });
      }
    });

    return trades;
  };

  // Real-time updates
  useInterval(() => {
    setLoading(true);
    // Simulate portfolio update
    setTimeout(() => {
      setPortfolio(prev => prev.map(asset => ({
        ...asset,
        currentPrice: asset.currentPrice * (1 + Math.random() * 0.005 - 0.0025), // ±0.5% random change
        totalValue: asset.quantity * asset.currentPrice,
        unrealizedPnl: (asset.currentPrice - asset.averagePrice) * asset.quantity,
        unrealizedPnlPercent: ((asset.currentPrice - asset.averagePrice) / asset.averagePrice) * 100,
      })));
      setLoading(false);
    }, 5000);
  }, 5000);

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
    }).format(num / 100);
  };

  // Handle trade
  const handleTrade = () => {
    if (!selectedAsset || tradeQuantity <= 0) return;
    onTrade(selectedAsset, tradeQuantity, isBuy);
    setShowTradeDialog(false);
  };

  // Handle rebalance
  const handleRebalance = () => {
    const trades = calculateRebalanceTrades();
    trades.forEach(trade => {
      onTrade(trade.asset, trade.quantity, trade.isBuy);
    });
    setShowRebalanceDialog(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Portfolio Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Portfolio Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {portfolio.length > 0 && (
            <Chip
              label={`Total Value: $${formatNumber(calculatePortfolioMetrics().totalValue)}`}
              color="primary"
              variant="outlined"
            />
          )}
          <Chip
            label={`Assets: ${portfolio.length}`}
            color="default"
            variant="outlined"
          />
          <Chip
            label={`Diversification: ${formatPercentage(
              portfolio.reduce((sum, asset) => sum + Math.abs(asset.targetAllocation - asset.allocation), 0)
            )}`}
            color="warning"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Portfolio Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Coin</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Avg Price</TableCell>
              <TableCell align="right">Current Price</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell align="right">PnL</TableCell>
              <TableCell align="right">PnL %</TableCell>
              <TableCell align="right">Allocation</TableCell>
              <TableCell align="right">Target</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : portfolio.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No assets in portfolio
                </TableCell>
              </TableRow>
            ) : (
              portfolio.map((asset, index) => {
                const pnlColor = asset.unrealizedPnl >= 0 ? 'success' : 'error';
                const pnlIcon = asset.unrealizedPnl >= 0 ? <TrendingUp /> : <TrendingDown />;
                const pnlPercentColor = asset.unrealizedPnlPercent >= 0 ? 'success' : 'error';
                const pnlPercentIcon = asset.unrealizedPnlPercent >= 0 ? <TrendingUp /> : <TrendingDown />;
                const allocationDiff = Math.abs(asset.targetAllocation - asset.allocation);
                const allocationColor = allocationDiff > 5 ? 'warning' : 'success';

                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Stack direction="column" spacing={0.5}>
                        <Typography variant="body2">
                          {asset.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {asset.symbol}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      {asset.quantity.toFixed(4)}
                    </TableCell>
                    <TableCell align="right">
                      ${asset.averagePrice.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      ${asset.currentPrice.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      ${formatNumber(asset.totalValue)}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Chip
                          label={formatNumber(Math.abs(asset.unrealizedPnl))}
                          color={pnlColor}
                          size="small"
                        />
                        {pnlIcon}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Chip
                          label={formatPercentage(asset.unrealizedPnlPercent)}
                          color={pnlPercentColor}
                          size="small"
                        />
                        {pnlPercentIcon}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatPercentage(asset.allocation)}
                        color={allocationColor}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatPercentage(asset.targetAllocation)}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
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
                        <MuiTooltip title="Edit Target Allocation">
                          <IconButton
                            onClick={() => {
                              // TODO: Implement allocation editing
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </MuiTooltip>
                        <MuiTooltip title="Remove from Portfolio">
                          <IconButton
                            onClick={() => {
                              // TODO: Implement removal
                            }}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </MuiTooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

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

      {/* Rebalance Dialog */}
      <Dialog open={showRebalanceDialog} onClose={() => setShowRebalanceDialog(false)} maxWidth="md">
        <DialogTitle>Portfolio Rebalancing</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="h6">
              Current Portfolio Status
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell align="right">Current Allocation</TableCell>
                    <TableCell align="right">Target Allocation</TableCell>
                    <TableCell align="right">Difference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolio.map((asset, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {asset.name} ({asset.symbol})
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(asset.allocation)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(asset.targetAllocation)}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatPercentage(
                            asset.targetAllocation - asset.allocation
                          )}
                          color={asset.targetAllocation > asset.allocation ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Alert severity="warning">
              This will execute trades to bring your portfolio allocations to their target percentages. Are you sure you want to proceed?
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRebalanceDialog(false)}>Cancel</Button>
          <Button onClick={handleRebalance} color="primary" variant="contained">
            Rebalance Portfolio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rebalance Button */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AutoAwesome />}
          onClick={() => setShowRebalanceDialog(true)}
        >
          Rebalance Portfolio
        </Button>
      </Box>
    </Box>
  );
};

export default PortfolioManager;