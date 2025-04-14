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

// Enhanced RL Algorithms
const ENHANCED_ALGORITHMS = {
  'TD3': {
    name: 'Twin Delayed Deep Deterministic Policy Gradient',
    description: 'Improves DDPG with twin critics and delayed policy updates.',
    parameters: {
      actorLearningRate: 0.0003,
      criticLearningRate: 0.001,
      discountFactor: 0.99,
      tau: 0.005,
      policyNoise: 0.2,
      noiseClip: 0.5,
      policyFreq: 2,
    },
    advantages: [
      'More stable learning',
      'Better exploration',
      'Handles noisy environments well',
    ],
  },
  'TRPO': {
    name: 'Trust Region Policy Optimization',
    description: 'Guarantees monotonic improvement in policy.',
    parameters: {
      learningRate: 0.01,
      maxKl: 0.01,
      damping: 0.1,
      cgIterations: 10,
      backtrackRatio: 0.8,
      backtrackIterations: 10,
    },
    advantages: [
      'Guaranteed improvement',
      'Stable learning',
      'Handles complex environments',
    ],
  },
  'A2C': {
    name: 'Advantage Actor-Critic',
    description: 'Synchronous version of A3C with improved stability.',
    parameters: {
      learningRate: 0.0007,
      entropyCoefficient: 0.01,
      valueCoefficient: 0.5,
      maxGradNorm: 0.5,
      gamma: 0.99,
    },
    advantages: [
      'Simpler implementation',
      'Stable learning',
      'Good for real-time applications',
    ],
  },
  'RAINBOW': {
    name: 'Rainbow DQN',
    description: 'Combines multiple DQN improvements.',
    parameters: {
      learningRate: 0.00025,
      discountFactor: 0.99,
      nSteps: 3,
      atoms: 51,
      vMin: -10,
      vMax: 10,
      priorityExponent: 0.6,
      priorityWeight: 0.4,
    },
    advantages: [
      'State-of-the-art performance',
      'Handles uncertainty well',
      'Fast convergence',
    ],
  },
  'ACER': {
    name: 'Actor-Critic with Experience Replay',
    description: 'Combines actor-critic with experience replay.',
    parameters: {
      learningRate: 0.0007,
      trustRegion: 10,
      replayRatio: 4,
      batch_size: 32,
      n_steps: 10,
    },
    advantages: [
      'Sample efficient',
      'Handles sparse rewards',
      'Good exploration',
    ],
  },
};

// Enhanced State Features
const ENHANCED_FEATURES = {
  'ORDER_BOOK': {
    name: 'Order Book Features',
    features: [
      'ORDER_BOOK_DEPTH',
      'ORDER_BOOK_IMBALANCE',
      'ORDER_BOOK_SPREAD',
      'ORDER_BOOK_LIQUIDITY',
      'ORDER_BOOK_VOLUME',
    ],
    description: 'Advanced order book analysis features',
  },
  'NETWORK': {
    name: 'Network Analysis',
    features: [
      'NETWORK_SENTIMENT',
      'NETWORK_ACTIVITY',
      'NETWORK_GROWTH',
      'NETWORK_DISTRIBUTION',
      'NETWORK_ENERGY',
    ],
    description: 'Blockchain network metrics',
  },
  'FUNDAMENTAL': {
    name: 'Fundamental Analysis',
    features: [
      'MARKET_CAP',
      'VOLUME',
      'SUPPLY',
      'HOLDERS',
      'TRANSACTIONS',
    ],
    description: 'Fundamental project metrics',
  },
  'ONCHAIN': {
    name: 'On-Chain Metrics',
    features: [
      'TRANSACTION_COUNT',
      'ACTIVE_ADDRESSES',
      'LARGE_TRANSACTIONS',
      'HODLING_METRICS',
      'CHAIN_ACTIVITY',
    ],
    description: 'Blockchain activity metrics',
  },
  'OFFCHAIN': {
    name: 'Off-Chain Metrics',
    features: [
      'GITHUB_ACTIVITY',
      'TWITTER_SENTIMENT',
      'GOOGLE_TRENDS',
      'NEWS_SENTIMENT',
      'COMMUNITY_METRICS',
    ],
    description: 'External market sentiment',
  },
};

// Enhanced Reward Functions
const ENHANCED_REWARDS = {
  'COMPOUND': {
    name: 'Compound Interest',
    formula: 'reward = (1 + r)^n - 1',
    description: 'Rewards compound interest growth',
    parameters: {
      baseRate: 0.01,
      timeFactor: 0.1,
      riskAdjustment: -0.5,
    },
  },
  'TIME_WEIGHTED': {
    name: 'Time-Weighted',
    formula: 'reward = r * t',
    description: 'Rewards based on holding time',
    parameters: {
      timeWeight: 0.1,
      profitWeight: 0.8,
      riskWeight: -0.1,
    },
  },
  'DYNAMIC': {
    name: 'Dynamic Risk-Adjusted',
    formula: 'reward = r * (1 + v) / (1 + d)',
    description: 'Adapts to market conditions',
    parameters: {
      volatilityWeight: 0.2,
      drawdownWeight: -0.5,
      profitWeight: 0.8,
    },
  },
  'MULTI_DIMENSIONAL': {
    name: 'Multi-Dimensional',
    formula: 'reward = w1 * p + w2 * r + w3 * v + w4 * s',
    description: 'Combines multiple dimensions',
    parameters: {
      profitWeight: 0.4,
      riskWeight: -0.3,
      volatilityWeight: -0.2,
      sentimentWeight: 0.1,
    },
  },
  'ADAPTIVE': {
    name: 'Adaptive Risk',
    formula: 'reward = r * (1 + α * v)',
    description: 'Adapts to changing market conditions',
    parameters: {
      adaptationRate: 0.1,
      volatilityFactor: 0.2,
      profitFactor: 0.7,
    },
  },
};

// Enhanced Training Visualization
const TRAINING_VISUALIZATION = {
  'ACTION_DISTRIBUTION': {
    name: 'Action Distribution',
    description: 'Visualizes distribution of actions taken',
    metrics: ['BUY', 'SELL', 'HOLD'],
  },
  'STATE_SPACE': {
    name: 'State Space Exploration',
    description: 'Shows exploration of state space',
    metrics: ['Explored', 'Unexplored'],
  },
  'REWARD_PATH': {
    name: 'Reward Path',
    description: 'Tracks reward progression',
    metrics: ['Cumulative', 'Instantaneous'],
  },
  'POLICY_CONVERGENCE': {
    name: 'Policy Convergence',
    description: 'Monitors policy stability',
    metrics: ['Stability', 'Divergence'],
  },
  'RISK_PROFILE': {
    name: 'Risk Profile Evolution',
    description: 'Tracks risk profile changes',
    metrics: ['Risk', 'Reward', 'Sharpe'],
  },
};

interface EnhancedReinforcementLearningProps {
  asset: any;
  onAlgorithmChange: (algorithm: string, params: any) => void;
  onFeatureChange: (features: string[]) => void;
  onRewardChange: (functionName: string, params: any) => void;
  onTrain: (config: any) => Promise<any>;
}

const EnhancedReinforcementLearning: React.FC<EnhancedReinforcementLearningProps> = ({
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
  const [visualization, setVisualization] = useState('ACTION_DISTRIBUTION');

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
    setAlgorithmParams(ENHANCED_ALGORITHMS[algorithm].parameters);
    onAlgorithmChange(algorithm, ENHANCED_ALGORITHMS[algorithm].parameters);
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
    setRewardParams(ENHANCED_REWARDS[reward].parameters);
    onRewardChange(reward, ENHANCED_REWARDS[reward].parameters);
  };

  // Handle visualization change
  const handleVisualizationChange = (vis: string) => {
    setVisualization(vis);
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
        visualization,
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
    colors: ['#2ecc71', '#e74c3c', '#3498db', '#9b59b6', '#f1c40f', '#e67e22'],
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

  // Get visualization data
  const getVisualizationData = (results: any) => {
    switch (visualization) {
      case 'ACTION_DISTRIBUTION':
        return [
          {
            name: 'BUY',
            data: results.actionDistribution.buy.map(d => ({ x: d.timestamp, y: d.count }))
          },
          {
            name: 'SELL',
            data: results.actionDistribution.sell.map(d => ({ x: d.timestamp, y: d.count }))
          },
          {
            name: 'HOLD',
            data: results.actionDistribution.hold.map(d => ({ x: d.timestamp, y: d.count }))
          },
        ];
      case 'STATE_SPACE':
        return [
          {
            name: 'Explored',
            data: results.stateSpace.explored.map(d => ({ x: d.timestamp, y: d.percentage }))
          },
          {
            name: 'Unexplored',
            data: results.stateSpace.unexplored.map(d => ({ x: d.timestamp, y: d.percentage }))
          },
        ];
      case 'REWARD_PATH':
        return [
          {
            name: 'Cumulative',
            data: results.rewardPath.cumulative.map(d => ({ x: d.timestamp, y: d.value }))
          },
          {
            name: 'Instantaneous',
            data: results.rewardPath.instantaneous.map(d => ({ x: d.timestamp, y: d.value }))
          },
        ];
      case 'POLICY_CONVERGENCE':
        return [
          {
            name: 'Stability',
            data: results.policy.stability.map(d => ({ x: d.timestamp, y: d.score }))
          },
          {
            name: 'Divergence',
            data: results.policy.divergence.map(d => ({ x: d.timestamp, y: d.score }))
          },
        ];
      case 'RISK_PROFILE':
        return [
          {
            name: 'Risk',
            data: results.riskProfile.risk.map(d => ({ x: d.timestamp, y: d.score }))
          },
          {
            name: 'Reward',
            data: results.riskProfile.reward.map(d => ({ x: d.timestamp, y: d.score }))
          },
          {
            name: 'Sharpe',
            data: results.riskProfile.sharpe.map(d => ({ x: d.timestamp, y: d.score }))
          },
        ];
      default:
        return [];
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Enhanced RL Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Enhanced Reinforcement Learning Configuration"
          subheader="Configure advanced RL agent with multiple algorithms and features"
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
                {Object.entries(ENHANCED_ALGORITHMS).map(([algorithm, config]) => (
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
                Enhanced State Features
              </Typography>
              {Object.entries(ENHANCED_FEATURES).map(([category, config]) => (
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
                {Object.entries(ENHANCED_REWARDS).map(([reward, config]) => (
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

            {/* Visualization Selection */}
            <Stack direction="row" spacing={2}>
              <Typography variant="body2">
                Visualization:
              </Typography>
              <Select
                value={visualization}
                onChange={(e) => handleVisualizationChange(e.target.value as string)}
                size="small"
                sx={{ width: 200 }}
              >
                {Object.entries(TRAINING_VISUALIZATION).map(([vis, config]) => (
                  <MenuItem key={vis} value={vis}>
                    {config.name}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

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
            subheader={`Algorithm: ${selectedAlgorithm} • Reward: ${selectedReward} • Visualization: ${visualization}`}
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
                  <Chip
                    label={`Policy Stability: ${formatPercentage(trainingResults.policy.stability)}`}
                    color={trainingResults.policy.stability >= 0.9 ? 'success' : 'warning'}
                    size="small"
                  />
                  <Chip
                    label={`Risk Score: ${formatPercentage(trainingResults.riskProfile.risk)}`}
                    color={trainingResults.riskProfile.risk <= 0.1 ? 'success' : 'error'}
                    size="small"
                  />
                </Stack>
              </Box>

              {/* Training Visualization */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {TRAINING_VISUALIZATION[visualization].name}
                </Typography>
                <Chart
                  options={chartOptions}
                  series={getVisualizationData(trainingResults)}
                  type="line"
                  height={400}
                />
              </Box>

              {/* Advanced Analysis */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Advanced Analysis
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell align="right">Change</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(trainingResults.advancedMetrics).map(([metric, value]) => (
                        <TableRow key={metric}>
                          <TableCell>{metric}</TableCell>
                          <TableCell align="right">
                            {formatNumber(value.current)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercentage(value.change)}
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
                  Feature Importance Analysis
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Feature</TableCell>
                        <TableCell align="right">Importance</TableCell>
                        <TableCell align="right">Impact</TableCell>
                        <TableCell align="right">Correlation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(trainingResults.featureAnalysis).sort((a, b) => b[1].importance - a[1].importance).map(([feature, analysis]) => (
                        <TableRow key={feature}>
                          <TableCell>{feature}</TableCell>
                          <TableCell align="right">
                            {formatNumber(analysis.importance)}
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(analysis.impact)}
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(analysis.correlation)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Risk Assessment */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Risk Assessment
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Risk Type</TableCell>
                        <TableCell align="right">Score</TableCell>
                        <TableCell align="right">Impact</TableCell>
                        <TableCell align="right">Mitigation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(trainingResults.riskAnalysis).map(([risk, analysis]) => (
                        <TableRow key={risk}>
                          <TableCell>{risk}</TableCell>
                          <TableCell align="right">
                            {formatNumber(analysis.score)}
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(analysis.impact)}
                          </TableCell>
                          <TableCell align="right">
                            {analysis.mitigation}
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

export default EnhancedReinforcementLearning;