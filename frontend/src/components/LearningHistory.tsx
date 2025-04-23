import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  FormGroup,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  Error,
  CheckCircle,
  Info,
  Add,
  Remove,
  Delete,
  Edit,
  SwapHoriz,
  AutoAwesome,
  TrendingUpOutlined,
  TrendingDownOutlined,
  TrendingFlatOutlined,
  WarningOutlined,
  ErrorOutlined,
  CheckCircleOutlined,
  InfoOutlined,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { useInterval } from 'usehooks-ts';
import { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts';

// Learning History Tabs
const LEARNING_TABS = [
  {
    label: 'Learning Progress',
    value: 'progress',
    icon: <AutoAwesome />,
    description: 'Track learning iterations and progress',
  },
  {
    label: 'Performance Metrics',
    value: 'metrics',
    icon: <TrendingUp />,
    description: 'Analyze performance over time',
  },
  {
    label: 'Trade Analysis',
    value: 'trades',
    icon: <SwapHoriz />,
    description: 'Examine trade history and patterns',
  },
  {
    label: 'Model Evolution',
    value: 'models',
    icon: <Info />,
    description: 'Track model improvements',
  },
  {
    label: 'Risk Profile',
    value: 'risk',
    icon: <Warning />,
    description: 'Monitor risk metrics',
  },
];

// Learning Progress Timeline
const LEARNING_TIMELINE = [
  {
    type: 'iteration',
    label: 'New Learning Iteration',
    color: 'primary',
    icon: <AutoAwesome />,
  },
  {
    type: 'trade',
    label: 'Successful Trade',
    color: 'success',
    icon: <CheckCircle />,
  },
  {
    type: 'trade',
    label: 'Failed Trade',
    color: 'error',
    icon: <Error />,
  },
  {
    type: 'model',
    label: 'Model Update',
    color: 'info',
    icon: <Info />,
  },
  {
    type: 'risk',
    label: 'Risk Alert',
    color: 'warning',
    icon: <Warning />,
  },
];

// Performance Metrics
const PERFORMANCE_METRICS = [
  {
    name: 'Total Return',
    color: '#2ecc71',
    type: 'line',
    yaxis: 'left',
  },
  {
    name: 'Sharpe Ratio',
    color: '#3498db',
    type: 'line',
    yaxis: 'right',
  },
  {
    name: 'Drawdown',
    color: '#e74c3c',
    type: 'area',
    yaxis: 'left',
  },
  {
    name: 'Volatility',
    color: '#f1c40f',
    type: 'line',
    yaxis: 'right',
  },
];

interface LearningHistoryProps {
  learningData: any;
  onFilterChange: (filters: any) => void;
}

const LearningHistory: React.FC<LearningHistoryProps> = ({ learningData, onFilterChange }) => {
  const [activeTab, setActiveTab] = useState('progress');
  const [filters, setFilters] = useState({
    timeRange: 'all',
    algorithm: 'all',
    symbol: 'all',
    riskLevel: 'all',
  });
  const [selectedIteration, setSelectedIteration] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

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
    }).format(num);
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  // Get timeline items
  const getTimelineItems = () => {
    if (!learningData) return [];

    return learningData.iterations.map((iteration) => (
      <TimelineItem key={iteration.id}>
        <TimelineSeparator>
          <TimelineDot color="primary">
            <AutoAwesome />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Stack spacing={1}>
            <Typography variant="h6">
              Iteration #{iteration.iteration_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(iteration.start_time).toLocaleString()} - {new Date(iteration.end_time).toLocaleString()}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`Algorithm: ${iteration.algorithm}`}
                size="small"
                color="primary"
              />
              <Chip
                label={`Strategy: ${iteration.strategy}`}
                size="small"
                color="secondary"
              />
              <Chip
                label={`Duration: ${formatDuration(iteration.training_duration)}`}
                size="small"
                color="default"
              />
            </Stack>
          </Stack>
        </TimelineContent>
      </TimelineItem>
    ));
  };

  // Get performance chart options
  const getPerformanceChartOptions = (): ApexOptions => ({
    chart: {
      type: 'line',
      height: 400,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    colors: ['#2ecc71', '#3498db', '#e74c3c', '#f1c40f'],
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
      },
    },
    yaxis: [
      {
        labels: {
          formatter: function (value) {
            return formatNumber(value);
          },
        },
      },
      {
        opposite: true,
        labels: {
          formatter: function (value) {
            return formatNumber(value);
          },
        },
      },
    ],
    tooltip: {
      y: {
        formatter: function (value) {
          return formatNumber(value);
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
    },
  });

  // Get performance chart series
  const getPerformanceChartSeries = () => {
    if (!learningData) return [];

    return PERFORMANCE_METRICS.map((metric) => ({
      name: metric.name,
      type: metric.type,
      data: learningData.metrics[metric.name].map((d) => ({
        x: new Date(d.timestamp),
        y: d.value,
      })),
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Filter Panel */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Learning History Filters"
          subheader="Filter and analyze learning data"
        />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Time Range"
                value={filters.timeRange}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, timeRange: e.target.value }));
                  onFilterChange({ ...filters, timeRange: e.target.value });
                }}
                size="small"
                sx={{ width: 200 }}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="1d">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </TextField>
              <TextField
                select
                label="Algorithm"
                value={filters.algorithm}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, algorithm: e.target.value }));
                  onFilterChange({ ...filters, algorithm: e.target.value });
                }}
                size="small"
                sx={{ width: 200 }}
              >
                <MenuItem value="all">All Algorithms</MenuItem>
                {Array.from(new Set(learningData?.algorithms || [])).map((alg) => (
                  <MenuItem key={alg} value={alg}>
                    {alg}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Symbol"
                value={filters.symbol}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, symbol: e.target.value }));
                  onFilterChange({ ...filters, symbol: e.target.value });
                }}
                size="small"
                sx={{ width: 200 }}
              >
                <MenuItem value="all">All Symbols</MenuItem>
                {Array.from(new Set(learningData?.symbols || [])).map((sym) => (
                  <MenuItem key={sym} value={sym}>
                    {sym}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Risk Level"
                value={filters.riskLevel}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, riskLevel: e.target.value }));
                  onFilterChange({ ...filters, riskLevel: e.target.value });
                }}
                size="small"
                sx={{ width: 200 }}
              >
                <MenuItem value="all">All Risk Levels</MenuItem>
                <MenuItem value="low">Low Risk</MenuItem>
                <MenuItem value="medium">Medium Risk</MenuItem>
                <MenuItem value="high">High Risk</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Box>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          {LEARNING_TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
        
        {/* Tab Content */}
        {activeTab === 'progress' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Learning Progress Timeline
            </Typography>
            <Timeline sx={{ mb: 3 }}>
              {getTimelineItems()}
            </Timeline>
          </Box>
        )}

        {activeTab === 'metrics' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Performance Metrics
            </Typography>
            <Chart
              options={getPerformanceChartOptions()}
              series={getPerformanceChartSeries()}
              type="line"
              height={400}
            />
          </Box>
        )}

        {activeTab === 'trades' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Trade Analysis
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Profit/Loss</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {learningData?.trades?.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>{new Date(trade.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{trade.symbol}</TableCell>
                      <TableCell>
                        <Chip
                          label={trade.action}
                          color={trade.action === 'BUY' ? 'success' : trade.action === 'SELL' ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatNumber(trade.profit_loss)}
                          color={trade.profit_loss >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDuration(trade.duration)}</TableCell>
                      <TableCell>
                        <Chip
                          label={trade.risk_level}
                          color={trade.risk_level === 'low' ? 'success' : trade.risk_level === 'high' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatPercentage(trade.confidence_score)}
                          color={trade.confidence_score >= 0.8 ? 'success' : trade.confidence_score >= 0.5 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeTab === 'models' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Model Evolution
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Iteration</TableCell>
                    <TableCell>Model Type</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Accuracy</TableCell>
                    <TableCell>Training Time</TableCell>
                    <TableCell>Improvement</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {learningData?.models?.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>#{model.iteration_number}</TableCell>
                      <TableCell>{model.model_type}</TableCell>
                      <TableCell>v{model.model_version}</TableCell>
                      <TableCell>
                        <Chip
                          label={formatPercentage(model.accuracy)}
                          color={model.accuracy >= 0.8 ? 'success' : model.accuracy >= 0.5 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDuration(model.training_duration)}</TableCell>
                      <TableCell>
                        <Chip
                          label={formatPercentage(model.improvement)}
                          color={model.improvement >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeTab === 'risk' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Risk Profile Evolution
            </Typography>
            <Chart
              options={{
                chart: {
                  type: 'radar',
                  height: 400,
                  animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                  },
                },
                colors: ['#2ecc71', '#e74c3c', '#3498db', '#f1c40f'],
                markers: {
                  size: 6,
                  colors: ['#fff'],
                  strokeColors: ['#2ecc71', '#e74c3c', '#3498db', '#f1c40f'],
                  strokeWidth: 2,
                },
                xaxis: {
                  categories: ['Market Risk', 'Liquidity Risk', 'Volatility', 'Drawdown', 'Position Risk'],
                },
                yaxis: {
                  show: true,
                  min: 0,
                  max: 1,
                },
                fill: {
                  opacity: 0.1,
                },
                legend: {
                  position: 'bottom',
                },
              }}
              series={[
                {
                  name: 'Current Risk Profile',
                  data: learningData?.risk?.current,
                },
                {
                  name: 'Historical Average',
                  data: learningData?.risk?.average,
                },
                {
                  name: 'Target Profile',
                  data: learningData?.risk?.target,
                },
              ]}
              type="radar"
              height={400}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LearningHistory;