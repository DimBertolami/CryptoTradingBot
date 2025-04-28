import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Grid, Card, CardActionArea, Avatar, Tooltip, Typography, CircularProgress, Fade } from '@mui/material';

interface Coin {
  symbol: string;
  name: string;
  logo: string;
  price: number;
  change24h: number;
  volume24h: number;
}

const fetchAllCoins = async (): Promise<Coin[]> => {
  // Use CoinGecko public API for initial view
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch coins');
  const data = await res.json();
  // Map CoinGecko fields to our Coin type
  return data.map((item: Record<string, unknown>) => ({
    symbol: typeof item.symbol === 'string' ? item.symbol.toUpperCase() : '',
    name: typeof item.name === 'string' ? item.name : '',
    logo: typeof item.image === 'string' ? item.image : '',
    price: typeof item.current_price === 'number' ? item.current_price : 0,
    change24h: typeof item.price_change_percentage_24h === 'number' ? item.price_change_percentage_24h : 0,
    volume24h: typeof item.total_volume === 'number' ? item.total_volume : 0,
  }));
};

const CoinOverview: React.FC = () => {
  const theme = useTheme();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllCoins()
      .then(setCoins)
      .catch(() => setError('Could not load coin data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={220}><CircularProgress /></Box>;
  if (error) return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight={260}>
      <Avatar sx={{ width: 64, height: 64, mb: 2, bgcolor: 'primary.light' }}>
        <span role="img" aria-label="market">📉</span>
      </Avatar>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        No market data available yet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Waiting for coin feed or backend connection...
      </Typography>
      <Box>
        <button
          style={{
            backgroundColor: theme.palette.background.default,
            backgroundImage: 'linear-gradient(90deg, #00e0ff 0%, #1976d2 100%)',
            color: theme.palette.text.primary,
            border: 'none',
            borderRadius: 22,
            padding: '8px 32px',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(25, 118, 210, 0.14)',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
          onClick={() => { setError(null); setLoading(true); fetchAllCoins().then(setCoins).catch(() => setError('Could not load coin data.')).finally(() => setLoading(false)); }}
        >
          Retry
        </button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={0.5} columns={{ xs: 2, sm: 4, md: 6, lg: 8 }} justifyContent="center">
        {coins.map((coin) => (
          <Grid key={coin.symbol} sx={{ gridColumn: { xs: 'span 1', sm: 'span 1', md: 'span 1', lg: 'span 1' } }}>
            <Fade in timeout={600}>
              <Card
                sx={theme => ({
                  borderRadius: 0, // Changed to straight corners
                  boxShadow: theme.palette.mode === 'dark' ? 6 : 2,
                  background: theme.palette.mode === 'dark'
                    ? theme.palette.background.paper // Use solid dark background in dark mode
                    : 'linear-gradient(135deg, #f6f8fc 60%, #e0e7ef 100%)', // Keep gradient in light mode
                  border: theme.palette.mode === 'dark' ? 'none' : '1px solid #e0e7ef',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  '&:hover': {
                    transform: 'scale(1.045)',
                    boxShadow: theme.palette.mode === 'dark' ? 12 : 4,
                  },
                  p: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 68,
                })}
              >
                <Tooltip
                  title={
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{coin.name} ({coin.symbol})</Typography>
                      <Typography variant="body2">Price: ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</Typography>
                      <Typography
                        variant="body2"
                        sx={theme => ({ color: coin.change24h >= 0 ? (theme.palette.mode === 'dark' ? '#FFD700' : '#B8860B') : theme.palette.error.main, fontWeight: 600 })}
                      >
                        24h Change: {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                      </Typography>
                      <Typography variant="body2">24h Vol: ${coin.volume24h.toLocaleString()}</Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <CardActionArea
                    sx={theme => ({
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: theme.palette.mode === 'dark' ? 'none' : '3px solid #192a56', // dark blue
                      width: '100%',
                      borderRadius: 0, // Changed to straight corners
                    })}
                  >
                    <Avatar src={coin.logo} alt={coin.symbol} sx={theme => ({ width: 44, height: 44, mb: 0, bgcolor: theme.palette.mode === 'dark' ? '#232946' : 'white', boxShadow: 1 })} />
                  </CardActionArea>
                </Tooltip>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CoinOverview;
