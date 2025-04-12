import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
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

const RiskCard = styled(motion(Box))(({ theme }) => ({
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

interface RiskMetric {
  name: string;
  value: number;
  warningThreshold: number;
  criticalThreshold: number;
  trend: 'up' | 'down' | 'flat';
  color: string;
}

const RiskManager: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([
    {
      name: 'Portfolio Risk',
      value: 0.65,
      warningThreshold: 0.7,
      criticalThreshold: 0.8,
      trend: 'up',
      color: theme.palette.warning.main,
    },
    {
      name: 'Market Volatility',
      value: 0.45,
      warningThreshold: 0.6,
      criticalThreshold: 0.75,
      trend: 'down',
      color: theme.palette.success.main,
    },
    {
      name: 'Drawdown',
      value: 0.12,
      warningThreshold: 0.15,
      criticalThreshold: 0.2,
      trend: 'flat',
      color: theme.palette.primary.main,
    },
    {
      name: 'Leverage',
      value: 0.3,
      warningThreshold: 0.4,
      criticalThreshold: 0.5,
      trend: 'up',
      color: theme.palette.info.main,
    },
  ]);

  const getTrendIcon = (trend: RiskMetric['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="error" />;
      case 'down':
        return <TrendingDownIcon color="success" />;
      case 'flat':
        return <TrendingFlat color="primary" />;
      default:
        return null;
    }
  };

  const getRiskColor = (metric: RiskMetric) => {
    if (metric.value >= metric.criticalThreshold) {
      return theme.palette.error.main;
    } else if (metric.value >= metric.warningThreshold) {
      return theme.palette.warning.main;
    }
    return theme.palette.success.main;
  };

  return (
    <Grid container spacing={3}>
      {/* Risk Overview */}
      <Grid item xs={12}>
        <StyledPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h5" component="h3" gutterBottom>
            Risk Management Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last update: {new Date().toLocaleString()}
          </Typography>

          <Grid container spacing={3}>
            {riskMetrics.map((metric, index) => (
              <Grid item xs={12} sm={6} key={metric.name}>
                <RiskCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Grid container alignItems="center">
                        <Grid item>
                          <Typography variant="h6" component="div">
                            {metric.name}
                          </Typography>
                        </Grid>
                        <Grid item>
                          {getTrendIcon(metric.trend)}
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={metric.value * 100}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                backgroundColor: getRiskColor(metric),
                              },
                            }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {metric.value * 100}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        {metric.value >= metric.criticalThreshold
                          ? 'Critical Risk Level'
                          : metric.value >= metric.warningThreshold
                          ? 'Warning Level'
                          : 'Safe Level'}
                      </Typography>
                    </Grid>
                  </Grid>
                </RiskCard>
              </Grid>
            ))}
          </Grid>
        </StyledPaper>
      </Grid>

      {/* Risk Controls */}
      <Grid item xs={12}>
        <StyledPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography variant="h6" component="h3" gutterBottom>
            Risk Controls
          </Typography>
          <Grid container spacing={2}>
            {/* Add risk control components here */}
          </Grid>
        </StyledPaper>
      </Grid>
    </Grid>
  );
};

export default RiskManager;
