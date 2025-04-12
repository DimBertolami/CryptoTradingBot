import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  TrendingUpTwoTone as TrendingUpTwoToneIcon,
  TrendingDownTwoTone as TrendingDownTwoToneIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
}));

const SignalCard = styled(motion(Box))(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 8,
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
}));

interface Signal {
  symbol: string;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  timestamp: string;
  indicators: {
    rsi: number;
    macd: number;
    bollinger: number;
  };
}

const TradingSignals: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [signals, setSignals] = useState<Signal[]>([]);

  useEffect(() => {
    // Simulate fetching trading signals
    const fetchSignals = () => {
      const newSignals: Signal[] = [
        {
          symbol: 'BTC',
          signal: 'buy',
          confidence: 0.85,
          timestamp: new Date().toISOString(),
          indicators: {
            rsi: 35,
            macd: 0.2,
            bollinger: -1.5,
          },
        },
        {
          symbol: 'ETH',
          signal: 'sell',
          confidence: 0.75,
          timestamp: new Date().toISOString(),
          indicators: {
            rsi: 75,
            macd: -0.3,
            bollinger: 1.8,
          },
        },
        {
          symbol: 'SOL',
          signal: 'hold',
          confidence: 0.6,
          timestamp: new Date().toISOString(),
          indicators: {
            rsi: 50,
            macd: 0.1,
            bollinger: 0.5,
          },
        },
      ];
      setSignals(newSignals);
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (signal: Signal['signal']) => {
    switch (signal) {
      case 'buy':
        return theme.palette.success.main;
      case 'sell':
        return theme.palette.error.main;
      case 'hold':
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getSignalIcon = (signal: Signal['signal']) => {
    switch (signal) {
      case 'buy':
        return <TrendingUpTwoToneIcon color="success" />;
      case 'sell':
        return <TrendingDownTwoToneIcon color="error" />;
      case 'hold':
        return <TrendingFlat color="warning" />;
      default:
        return null;
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Signal Dashboard */}
      <Grid item xs={12}>
        <StyledPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h5" component="h3" gutterBottom>
            Trading Signals Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last update: {new Date().toLocaleString()}
          </Typography>

          <List>
            {signals.map((signal, index) => (
              <SignalCard
                key={signal.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Grid container alignItems="center">
                      <Grid item>
                        {getSignalIcon(signal.signal)}
                      </Grid>
                      <Grid item>
                        <Typography variant="h6" component="div">
                          {signal.symbol}
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Chip
                          label={signal.signal.toUpperCase()}
                          color={signal.signal === 'buy' ? 'success' : signal.signal === 'sell' ? 'error' : 'warning'}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <Grid container spacing={1}>
                      <Grid item>
                        <Chip
                          label={`RSI: ${signal.indicators.rsi.toFixed(1)}`}
                          color={signal.indicators.rsi < 30 ? 'success' : signal.indicators.rsi > 70 ? 'error' : 'default'}
                          size="small"
                        />
                      </Grid>
                      <Grid item>
                        <Chip
                          label={`MACD: ${signal.indicators.macd.toFixed(2)}`}
                          color={signal.indicators.macd > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </Grid>
                      <Grid item>
                        <Chip
                          label={`BB: ${signal.indicators.bollinger.toFixed(1)}`}
                          color={signal.indicators.bollinger < -2 ? 'success' : signal.indicators.bollinger > 2 ? 'error' : 'default'}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Confidence: {signal.confidence * 100}%
                    </Typography>
                  </Grid>
                </Grid>
              </SignalCard>
            ))}
          </List>
        </StyledPaper>
      </Grid>
    </Grid>
  );
};

export default TradingSignals;
