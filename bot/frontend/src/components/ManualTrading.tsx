import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
  Grid,
  Alert
} from '@mui/material';


interface Asset {
  symbol: string;
  amount: number;
  averagePrice: number;
  currentPrice: number;
  profitLoss: number;
  profitLossPercentage: number;
}

interface Portfolio {
  totalValue: number;
  totalProfitLoss: number;
  profitLossPercentage: number;
  assets: Asset[];
}

interface Trade {
  timestamp: string;
  symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
}

const ManualTrading: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [priceAlert, setPriceAlert] = useState('');

  useEffect(() => {
    fetchPortfolio();
    fetchRecentTrades();
    const interval = setInterval(() => {
      fetchPortfolio();
      fetchRecentTrades();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const fetchRecentTrades = async () => {
    try {
      const response = await fetch('/api/trades/recent');
      const data = await response.json();
      setRecentTrades(data);
    } catch (error) {
      console.error('Error fetching recent trades:', error);
    }
  };

  const handleTrade = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          amount: parseFloat(amount),
          type: tradeType,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Trade failed');
      }
      
      // Refresh portfolio and trades
      await Promise.all([
        fetchPortfolio(),
        fetchRecentTrades(),
      ]);
      
      // Reset form
      setSelectedSymbol('');
      setAmount('');
      setShowConfirmDialog(false);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const setPriceAlertHandler = async () => {
    try {
      const response = await fetch('/api/price-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          price: parseFloat(priceAlert),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set price alert');
      }
      
      setPriceAlert('');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manual Trading & Portfolio
      </Typography>

      {/* Portfolio Summary */}
      <Grid container spacing={3} component="div" sx={{ mb: 3 }}>
        <Grid item xs={12} component="div">
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Portfolio Summary
            </Typography>
            {portfolio && (
              <Grid container spacing={2} component="div">
                <Grid item xs={4} component="div">
                  <Typography variant="body2" color="textSecondary">
                    Total Value
                  </Typography>
                  <Typography variant="h6">
                    ${portfolio.totalValue.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={4} component="div">
                  <Typography variant="body2" color="textSecondary">
                    Total P/L
                  </Typography>
                  <Typography
                    variant="h6"
                    color={portfolio.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                  >
                    ${portfolio.totalProfitLoss.toFixed(2)}
                    ({portfolio.profitLossPercentage.toFixed(2)}%)
                  </Typography>
                </Grid>
                <Grid item xs={4} component="div">
                  <Typography variant="body2" color="textSecondary">
                    Total P/L Percentage
                  </Typography>
                  <Typography
                    variant="h6"
                    color={portfolio.profitLossPercentage >= 0 ? 'success.main' : 'error.main'}
                  >
                    {portfolio.profitLossPercentage.toFixed(2)}%
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Trading Interface */}
      <Grid container spacing={3} component="div">
        <Grid item xs={4} md={6} component="div">
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Place Trade
            </Typography>
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Symbol"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    setTradeType('buy');
                    setShowConfirmDialog(true);
                  }}
                  disabled={!selectedSymbol || !amount || loading}
                >
                  Buy
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    setTradeType('sell');
                    setShowConfirmDialog(true);
                  }}
                  disabled={!selectedSymbol || !amount || loading}
                >
                  Sell
                </Button>
              </Box>
              
              {/* Price Alert */}
              <TextField
                fullWidth
                label="Price Alert"
                type="number"
                value={priceAlert}
                onChange={(e) => setPriceAlert(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        onClick={setPriceAlertHandler}
                        disabled={!selectedSymbol || !priceAlert}
                      >
                        Set Alert
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Asset List */}
        <Grid item xs={4} md={6} component="div">
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Assets
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Current Price</TableCell>
                  <TableCell align="right">P/L</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolio?.assets.map((asset) => (
                  <TableRow key={asset.symbol}>
                    <TableCell>{asset.symbol}</TableCell>
                    <TableCell align="right">{asset.amount.toFixed(8)}</TableCell>
                    <TableCell align="right">${asset.currentPrice.toFixed(2)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: asset.profitLoss >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      ${asset.profitLoss.toFixed(2)}
                      ({asset.profitLossPercentage.toFixed(2)}%)
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Trades */}
      <Card sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Trades
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentTrades.map((trade, index) => (
              <TableRow key={index}>
                <TableCell>
                  {new Date(trade.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell
                  sx={{
                    color: trade.type === 'buy' ? 'success.main' : 'error.main',
                  }}
                >
                  {trade.type.toUpperCase()}
                </TableCell>
                <TableCell align="right">{trade.amount.toFixed(8)}</TableCell>
                <TableCell align="right">${trade.price.toFixed(2)}</TableCell>
                <TableCell align="right">${trade.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Trade</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {tradeType} {amount} {selectedSymbol}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={handleTrade}
            color={tradeType === 'buy' ? 'success' : 'error'}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManualTrading;
