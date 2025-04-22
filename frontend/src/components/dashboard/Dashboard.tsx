import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  ThemeProvider,
  createTheme,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { styled } from '@mui/material/styles';
import { useSpring, animated } from 'react-spring';
import { useGesture } from '@use-gesture/react';
import { motion } from 'framer-motion';
import { useTheme as useMUITheme } from '@mui/material/styles';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

const AnimatedPaper = styled(motion(Paper))(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
}));

const Dashboard: React.FC = () => {
  const [portfolioValue, setPortfolioValue] = useState(10000);
  const [tradingMetrics, setTradingMetrics] = useState({
    winRate: 0.75,
    sharpeRatio: 2.3,
    maxDrawdown: 0.12,
    volatility: 0.18,
  });
  const [tradeHistory, setTradeHistory] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState({
    currentRisk: 0.05,
    maxRisk: 0.1,
    exposure: 0.3,
  });

  const theme = useMUITheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Animated spring values
  const springValue = useSpring({
    value: portfolioValue,
    from: { value: 0 },
    config: { duration: 1000 },
  });

  // Chart data
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [10000, 10500, 11000, 11500, 12000, 12500],
        borderColor: '#3b82f6',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
    ],
  };

  const barChartData = {
    labels: ['BTC', 'ETH', 'SOL', 'DOT', 'ADA'],
    datasets: [
      {
        label: 'Holdings',
        data: [30, 20, 15, 10, 25],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#db2777'],
        borderRadius: 4,
      },
    ],
  };

  // Custom chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Portfolio Performance',
        color: '#fff',
      },
    },
    scales: {
      y: {
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: '#334155',
        },
      },
      x: {
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: '#334155',
        },
      },
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#0f172a' }}>
        <Grid container spacing={3}>
          {/* Portfolio Overview */}
          <Grid item xs={12}>
            <AnimatedPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h4" component="h1" gutterBottom>
                Portfolio Overview
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h3" component="h2" color="primary">
                  ${portfolioValue.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" color="success.main">
                    +2.5%
                  </Typography>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      ml: 1,
                    }}
                  />
                </Box>
              </Box>
              <Line data={lineChartData} options={chartOptions} />
            </AnimatedPaper>
          </Grid>

          {/* Trading Metrics */}
          <Grid item xs={12} md={6}>
            <AnimatedPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Typography variant="h5" component="h3" gutterBottom>
                Trading Metrics
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(tradingMetrics).map(([metric, value]) => (
                  <Grid item xs={6} key={metric}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {value.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {metric.replace(/([A-Z])/g, ' $1').trim()}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </AnimatedPaper>
          </Grid>

          {/* Risk Metrics */}
          <Grid item xs={12} md={6}>
            <AnimatedPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Typography variant="h5" component="h3" gutterBottom>
                Risk Metrics
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" color="primary">
                  Current Risk: {riskMetrics.currentRisk * 100}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Max Risk: {riskMetrics.maxRisk * 100}%
                </Typography>
              </Box>
              <Box sx={{ height: 200 }}>
                <Bar data={barChartData} options={chartOptions} />
              </Box>
            </AnimatedPaper>
          </Grid>

          {/* Trade History */}
          <Grid item xs={12}>
            <AnimatedPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Typography variant="h5" component="h3" gutterBottom>
                Trade History
              </Typography>
              <Box sx={{ overflow: 'auto', maxHeight: 400 }}>
                {/* Implement trade history table here */}
              </Box>
            </AnimatedPaper>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;
