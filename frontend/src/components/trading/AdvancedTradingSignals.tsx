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
  TrendingFlatTwoTone as TrendingFlatTwoToneIcon,
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
    volume: number;
    momentum: number;
    volatility: number;
  };
  mlScore: number;
  riskLevel: number;
}

const AdvancedTradingSignals: React.FC = () => {
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
            volume: 1.2,
            momentum: 0.6,
            volatility: 0.05,
          },
          mlScore: 0.9,
          riskLevel: 0.3,
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
            volume: 0.8,
            momentum: -0.4,
            volatility: 0.08,
          },
          mlScore: 0.85,
          riskLevel: 0.4,
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
            volume: 1.0,
            momentum: 0.2,
            volatility: 0.06,
          },
          mlScore: 0.7,
          riskLevel: 0.2,
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
        return <TrendingFlatTwoToneIcon color="warning" />;
      default:
        return null;
    }
  };

  const formatIndicator = (value: number, type: string) => {
    if (type === 'rsi') return value.toFixed(1);
    if (type === 'macd') return value.toFixed(2);
    if (type === 'bollinger') return value.toFixed(2);
    if (type === 'volume') return value.toFixed(2);
    if (type === 'momentum') return value.toFixed(2);
    if (type === 'volatility') return (value * 100).toFixed(2) + '%';
    return value.toFixed(2);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <StyledPaper>
          <Typography variant="h5" component="h3" gutterBottom>
            Advanced Trading Signals
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last update: {new Date().toLocaleString()}
          </Typography>

          <List>
            {signals.map((signal, index) => (
              <Grid item xs={12} key={signal.symbol}>
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
                      <Grid item>
                        <Chip
                          label={`Risk: ${signal.riskLevel * 100}%`}
                          color={signal.riskLevel >= 0.7 ? 'error' : signal.riskLevel >= 0.4 ? 'warning' : 'success'}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <Grid container spacing={1}>
                      {Object.entries(signal.indicators).map(([indicator, value]) => (
                        <Grid item key={indicator}>
                          <Chip
                            label={`${indicator.toUpperCase()}: ${formatIndicator(value, indicator)}`}
                            color={
                              indicator === 'rsi'
                                ? value < 30
                                  ? 'success'
                                  : value > 70
                                  ? 'error'
                                  : 'default'
                                : indicator === 'macd'
                                ? value > 0
                                  ? 'success'
                                  : 'error'
                                : 'default'
                            }
                            size="small"
                          />
                        </Grid>
                      ))}
                      <Grid item>
                        <Chip
                          label={`ML Score: ${signal.mlScore * 100}%`}
                          color={signal.mlScore >= 0.8 ? 'success' : signal.mlScore >= 0.6 ? 'warning' : 'error'}
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
              </Grid>
            ))}
          </List>
        </StyledPaper>
      </Grid>
    </Grid>
  );
};

export default AdvancedTradingSignals;
