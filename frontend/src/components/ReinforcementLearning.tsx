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

// Reinforcement Learning Algorithms
const RL_ALGORITHMS = {
  'DQN': {
    name: 'Deep Q-Network',
    description: 'Uses neural networks to learn optimal actions.',
    parameters: {
      learningRate: 0.001,
      discountFactor: 0.99,
      explorationRate: 0.1,
      batchSize: 32,
      memorySize: 10000,
    },
    advantages: [
      'Handles high-dimensional state spaces',
      'Learns from experience',
      'Adapts to changing market conditions',
    ],
    disadvantages: [
      'Requires significant training time',
      'Can be unstable without proper tuning',
      'May overfit to training data',
    ],
  },
  'DDPG': {
    name: 'Deep Deterministic Policy Gradient',
    description: 'Uses actor-critic architecture for continuous action spaces.',
    parameters: {
      actorLearningRate: 0.0001,
      criticLearningRate: 0.001,
      discountFactor: 0.99,
      tau: 0.001,
      noise: 0.1,
    },
    advantages: [
      'Handles continuous action spaces',
      'Stable learning process',
      'Good for complex trading actions',
    ],
    disadvantages: [
      'Requires careful hyperparameter tuning',
      'Can be slow to converge',
      'Sensitive to reward scaling',
    ],
  },
  'PPO': {
    name: 'Proximal Policy Optimization',
    description: 'Improves policy gradient methods with clipping.',
    parameters: {
      learningRate: 0.0003,
      clipRange: 0.2,
      entropyCoefficient: 0.01,
      valueCoefficient: 0.5,
      epochs: 10,
    },
    advantages: [
      'Robust to hyperparameter settings',
      'Good sample efficiency',
      'Handles both discrete and continuous actions',
    ],
    disadvantages: [
      'May require more memory',
      'Can be computationally intensive',
      'May need careful reward shaping',
    ],
  },
  'SAC': {
    name: 'Soft Actor-Critic',
    description: 'Uses entropy regularization for better exploration.',
    parameters: {
      alpha: 0.2,
      learningRate: 0.0003,
      discountFactor: 0.99,
      targetEntropy: -2,
      tau: 0.005,
    },
    advantages: [
      'Better exploration through entropy',
      'Stable learning',
      'Handles uncertainty well',
    ],
    disadvantages: [
      'More complex implementation',
      'Requires careful entropy tuning',
      'May need more computational resources',
    ],
  },
};

// State Features
const STATE_FEATURES = {
  'TECHNICAL': {
    name: 'Technical Indicators',
    features: [
      'SMA', 'EMA', 'RSI', 'MACD', 'BB', 'ADX', 'OBV', 'VWAP',
      'MOMENTUM', 'VOLATILITY', 'VOLUME', 'TREND',
    ],
    description: 'Technical analysis features for state representation',
  },
  'MARKET': {
    name: 'Market Conditions',
    features: [
      'VOLUME', 'PRICE', 'SPREAD', 'LIQUIDITY', 'VOLATILITY',
      'ORDER_BOOK', 'MARKET_IMPACT', 'SLIPPAGE',
    ],
    description: 'Market condition features for state representation',
  },
  'PORTFOLIO': {
    name: 'Portfolio Metrics',
    features: [
      'PNL', 'DRAWDOWN', 'SHARPE', 'SORTINO', 'WIN_RATE',
      'POSITION_SIZE', 'EXPOSURE', 'DIVERSIFICATION',
    ],
    description: 'Portfolio metrics for state representation',
  },
  'SENTIMENT': {
    name: 'Sentiment Analysis',
    features: [
      'TWITTER_SENTIMENT', 'NEWS_SENTIMENT', 'VOLUME_SENTIMENT',
      'COMMUNITY_SENTIMENT', 'EXCHANGE_SENTIMENT',
    ],
    description: 'Sentiment analysis features for state representation',
  },
};

// Reward Functions
const REWARD_FUNCTIONS = {
  'PROFIT': {
    name: 'Profit-Based',
    formula: 'reward = profit * weight',
    description: 'Rewards based on trading profits',
    parameters: {
      profitWeight: 1.0,
      riskWeight: -0.5,
      volatilityWeight: -0.1,
    },
  },
  'RISK_ADJUSTED': {
    name: 'Risk-Adjusted',
    formula: 'reward = (profit / risk) * weight',
    description: 'Rewards based on risk-adjusted returns',
    parameters: {
      sharpeWeight: 1.0,
      drawdownWeight: -1.0,
      volatilityWeight: -0.5,
    },
  },
  'MULTI_OBJECTIVE': {
    name: 'Multi-Objective',
    formula: 'reward = w1 * profit + w2 * risk + w3 * volatility',
    description: 'Combines multiple objectives',
    parameters: {
      profitWeight: 0.6,
      riskWeight: -0.3,
      volatilityWeight: -0.1,
    },
  },
  'SENTIMENT': {
    name: 'Sentiment-Aware',
    formula: 'reward = profit * sentiment_score',
    description: 'Incorporates market sentiment',
    parameters: {
      sentimentWeight: 0.2,
      profitWeight: 0.8,
    },
  },
};

interface ReinforcementLearningProps {
  asset: any;
  onAlgorithmChange: (algorithm: string, params: any) => void;
  onFeatureChange: (features: string[]) => void;
  onRewardChange: (functionName: string, params: any) => void;
  onTrain: (config: any) => Promise<any>;
}

const ReinforcementLearning: React.FC<ReinforcementLearningProps> = ({
  asset,
  onAlgorithmChange,
  onFeatureChange,
  onRewardChange,
  onTrain,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('DQN');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedReward, setSelectedReward] = useState('PROFIT');
  const [algorithmParams, setAlgorithmParams] = useState({ learningRate: 0.001 });
  const [rewardParams, setRewardParams] = useState({ profitWeight: 1.0 });
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [showTraining, setShowTraining] = useState(false);
  const [trainingResults, setTrainingResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

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

  // Handle algorithm change
  const handleAlgorithmChange = (algorithm: string) => {
    setSelectedAlgorithm(algorithm);
    setAlgorithmParams(RL_ALGORITHMS[algorithm].parameters);
    onAlgorithmChange(algorithm, RL_ALGORITHMS[algorithm].parameters);
  };

  // Handle feature toggle
  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(feature)) {
        return prev.filter(f => f !== feature);
      }
      return [...prev, feature];
    });
    onFeatureChange(selectedFeatures);
  };

  // Handle reward change
  const handleRewardChange = (reward: string) => {
    setSelectedReward(reward);
    setRewardParams(REWARD_FUNCTIONS[reward].parameters);
    onRewardChange(reward, REWARD_FUNCTIONS[reward].parameters);
  };

  // Handle training
  const handleTrain = async () => {
    setShowTraining(true);
    try {
      const config = {
        algorithm: selectedAlgorithm,
        algorithmParams,
        features: selectedFeatures,
        rewardFunction: selectedReward,
        rewardParams,
      };
      
      const results = await onTrain(config);
      setTrainingResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Training error:', error);
      Alert({
        severity: 'error',
        children: 'Training failed. Please check your configuration.',
      });
    } finally {
      setShowTraining(false);
    }
  };

  // Chart configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    colors: ['#2ecc71', '#e74c3c', '#3498db', '#9b59b6'],
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    xaxis: {
      type: 'datetime',
    },
    yaxis: {
      labels: {
        formatter: function (value) {
          return formatNumber(value);
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (value) {
          return formatNumber(value);
        },
      },
    },
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Reinforcement Learning Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Reinforcement Learning Configuration"
          subheader="Configure your RL agent"
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Algorithm Selection */}
            <Stack direction="row" spacing={2}>
              <Typography variant="body2">
                Algorithm:
              </Typography>
              <Select
                value={selectedAlgorithm}
                onChange={(e) => handleAlgorithmChange(e.target.value as string)}
                size="small"
                sx={{ width: 200 }}
              >
                {Object.entries(RL_ALGORITHMS).map(([algorithm, config]) => (
                  <MenuItem key={algorithm} value={algorithm}>
                    {config.name}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            {/* Selected Algorithm Parameters */}
            {Object.entries(algorithmParams).map(([param, value]) => (
              <Stack key={param} direction="row" spacing={2} alignItems="center">
                <Typography variant="body2">
                  {param.charAt(0).toUpperCase() + param.slice(1)}:
                </Typography>
                <TextField
                  type="number"
                  value={value}
                  onChange={(e) => {
                    setAlgorithmParams(prev => ({
                      ...prev,
                      [param]: parseFloat(e.target.value) || value,
                    }));
                    onAlgorithmChange(selectedAlgorithm, {
                      ...algorithmParams,
                      [param]: parseFloat(e.target.value) || value,
                    });
                  }}
                  size="small"
                  sx={{ width: 120 }}
                />
              </Stack>
            ))}

            {/* Feature Selection */}
            <Stack direction="column" spacing={2}>
              <Typography variant="h6">
                State Features
              </Typography>
              {Object.entries(STATE_FEATURES).map(([category, config]) => (
                <Card key={category} sx={{ mb: 2 }}>
                  <CardHeader
                    title={config.name}
                    subheader={config.description}
                  />
                  <CardContent>
                    <FormGroup>
                      {config.features.map((feature) => (
                        <FormControlLabel
                          key={feature}
                          control={
                            <Switch
                              checked={selectedFeatures.includes(feature)}
                              onChange={() => handleFeatureToggle(feature)}
                            />
                          }
                          label={feature}
                        />
                      ))}
                    </FormGroup>
                  </CardContent>
                </Card>
              ))}
            </Stack>

            {/* Reward Function Selection */}
            <Stack direction="row" spacing={2}>
              <Typography variant="body2">
                Reward Function:
              </Typography>
              <Select
                value={selectedReward}
                onChange={(e) => handleRewardChange(e.target.value as string)}
                size="small"
                sx={{ width: 200 }}
              >
                {Object.entries(REWARD_FUNCTIONS).map(([reward, config]) => (
                  <MenuItem key={reward} value={reward}>
                    {config.name}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            {/* Selected Reward Parameters */}
            {Object.entries(rewardParams).map(([param, value]) => (
              <Stack key={param} direction="row" spacing={2} alignItems="center">
                <Typography variant="body2">
                  {param.charAt(0).toUpperCase() + param.slice(1)}:
                </Typography>
                <TextField
                  type="number"
                  value={value}
                  onChange={(e) => {
                    setRewardParams(prev => ({
                      ...prev,
                      [param]: parseFloat(e.target.value) || value,
                    }));
                    onRewardChange(selectedReward, {
                      ...rewardParams,
                      [param]: parseFloat(e.target.value) || value,
                    });
                  }}
                  size="small"
                  sx={{ width: 120 }}
                />
              </Stack>
            ))}

            {/* Train Button */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleTrain}
              disabled={trainingProgress > 0}
              startIcon={trainingProgress > 0 ? <CircularProgress size={20} /> : undefined}
            >
              {trainingProgress > 0 ? `Training... ${Math.round(trainingProgress * 100)}%` : 'Start Training'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Training Results */}
      {showResults && trainingResults && (
        <Card>
          <CardHeader
            title="Training Results"
            subheader={`Algorithm: ${selectedAlgorithm} • Reward: ${selectedReward}`}
          />
          <CardContent>
            <Stack spacing={3}>
              {/* Performance Metrics */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Performance Metrics
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Chip
                    label={`Total Return: ${formatPercentage(trainingResults.totalReturn)}`}
                    color={trainingResults.totalReturn >= 0 ? 'success' : 'error'}
                    size="small"
                  />
                  <Chip
                    label={`Sharpe Ratio: ${trainingResults.sharpeRatio.toFixed(2)}`}
                    color={trainingResults.sharpeRatio >= 1 ? 'success' : 'warning'}
                    size="small"
                  />
                  <Chip
                    label={`Win Rate: ${formatPercentage(trainingResults.winRate)}`}
                    color={trainingResults.winRate >= 0.5 ? 'success' : 'warning'}
                    size="small"
                  />
                </Stack>
              </Box>

              {/* Training Progress Chart */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Training Progress
                </Typography>
                <Chart
                  options={chartOptions}
                  series={[
                    {
                      name: 'Return',
                      data: trainingResults.progress.map(p => ({ x: p.timestamp, y: p.return }))
                    },
                    {
                      name: 'Sharpe',
                      data: trainingResults.progress.map(p => ({ x: p.timestamp, y: p.sharpe }))
                    },
                    {
                      name: 'Win Rate',
                      data: trainingResults.progress.map(p => ({ x: p.timestamp, y: p.winRate }))
                    },
                  ]}
                  type="line"
                  height={350}
                />
              </Box>

              {/* Action Distribution */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Action Distribution
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(trainingResults.actionDistribution).map(([action, count]) => (
                        <TableRow key={action}>
                          <TableCell>{action}</TableCell>
                          <TableCell align="right">{count}</TableCell>
                          <TableCell align="right">
                            {formatPercentage(count / trainingResults.totalActions)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Feature Importance */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Feature Importance
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Feature</TableCell>
                        <TableCell align="right">Importance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(trainingResults.featureImportance).sort((a, b) => b[1] - a[1]).map(([feature, importance]) => (
                        <TableRow key={feature}>
                          <TableCell>{feature}</TableCell>
                          <TableCell align="right">
                            {formatNumber(importance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ReinforcementLearning;