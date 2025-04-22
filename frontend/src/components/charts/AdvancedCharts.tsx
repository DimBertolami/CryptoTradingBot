import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Chart as ChartJS, ArcElement, LineElement, BarElement, PointElement, BarController, CategoryScale, LinearScale, TimeScale, TimeSeriesScale, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { format } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  CategoryScale,
  LinearScale,
  TimeScale,
  TimeSeriesScale,
  Title,
  Tooltip,
  Legend
);

const StyledPaper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
}));

const ChartCard = styled(Box)(({ theme }) => ({
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

const AdvancedCharts: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [chartData, setChartData] = useState({
    timeSeries: {
      labels: Array.from({ length: 60 }, (_, i) => new Date(Date.now() - (59 - i) * 60000)),
      datasets: [
        {
          label: 'Price',
          data: Array.from({ length: 60 }, () => Math.random() * 10000),
          borderColor: theme.palette.primary.main,
          tension: 0.4,
          fill: true,
          backgroundColor: `rgba(${theme.palette.primary.main.replace(/[^,]+$/, '')}, 0.1)`,
        },
        {
          label: 'Volume',
          data: Array.from({ length: 60 }, () => Math.random() * 1000),
          borderColor: theme.palette.secondary.main,
          tension: 0.4,
          fill: true,
          backgroundColor: `rgba(${theme.palette.secondary.main.replace(/[^,]+$/, '')}, 0.1)`,
          yAxes: 'volume',
        },
      ],
    },
    correlation: {
      labels: ['BTC', 'ETH', 'SOL', 'DOT', 'ADA'],
      datasets: [
        {
          label: 'Correlation',
          data: [0.85, 0.75, 0.65, 0.55, 0.45],
          borderColor: theme.palette.primary.main,
          tension: 0.4,
          fill: true,
          backgroundColor: `rgba(${theme.palette.primary.main.replace(/[^,]+$/, '')}, 0.1)`,
        },
      ],
    },
    riskMetrics: {
      labels: ['Portfolio', 'Market', 'Leverage', 'Drawdown'],
      datasets: [
        {
          label: 'Risk Score',
          data: [0.65, 0.45, 0.35, 0.25],
          borderColor: theme.palette.warning.main,
          tension: 0.4,
          fill: true,
          backgroundColor: `rgba(${theme.palette.warning.main.replace(/[^,]+$/, '')}, 0.1)`,
        },
      ],
    },
  });

  const timeSeriesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'minute' as const,
          displayFormats: {
            minute: 'HH:mm'
          }
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.54)'
        }
      },
      y: {
        ticks: {
          color: 'rgba(0, 0, 0, 0.54)'
        }
      },
      volume: {
        position: 'right' as const,
        ticks: {
          color: 'rgba(0, 0, 0, 0.54)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(0, 0, 0, 0.54)'
        }
      },
      title: {
        display: true,
        text: 'Price and Volume Analysis',
        color: 'rgba(0, 0, 0, 0.54)'
      }
    }
  };

  const correlationOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: 'rgba(0, 0, 0, 0.54)'
        }
      },
      y: {
        ticks: {
          color: 'rgba(0, 0, 0, 0.54)',
          beginAtZero: true,
          stepSize: 0.1
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(0, 0, 0, 0.54)'
        }
      },
      title: {
        display: true,
        text: 'Correlation with BTC',
        color: 'rgba(0, 0, 0, 0.54)'
      }
    }
  };

  const riskMetricsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.54)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(0, 0, 0, 0.54)'
        }
      },
      title: {
        display: true,
        text: 'Risk Metric Radar',
        color: 'rgba(0, 0, 0, 0.54)'
      }
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Time Series Analysis */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Time Series Analysis
        </Typography>
        <Box sx={{ height: 400 }}>
          <Line data={chartData.timeSeries} options={timeSeriesOptions} />
        </Box>
      </Box>

      {/* Correlation Analysis */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Correlation Analysis
        </Typography>
        <Box sx={{ height: 300 }}>
          <Bar data={chartData.correlation} options={correlationOptions} />
        </Box>
      </Box>

      {/* Risk Metrics */}
      <Box>
        <Typography variant="h5" component="h3" gutterBottom>
          Risk Metrics
        </Typography>
        <Box sx={{ height: 300 }}>
          <Radar data={{
            labels: ['Portfolio', 'Market', 'Leverage', 'Drawdown', 'Volatility'],
            datasets: [
              {
                label: 'Risk Score',
                data: [0.65, 0.45, 0.35, 0.25, 0.55],
                borderColor: theme.palette.warning.main,
                backgroundColor: `rgba(${theme.palette.warning.main.replace(/[^,]+$/, '')}, 0.1)`,
              },
            ],
          }} options={riskMetricsOptions} />
        </Box>
      </Box>
    </Container>
  );
};

export default AdvancedCharts;
