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
} from '@mui/icons-material';
import { useInterval } from 'usehooks-ts';

interface RiskManagerProps {
  portfolio: any[];
  onSetStopLoss: (asset: any, price: number) => void;
  onSetTakeProfit: (asset: any, price: number) => void;
  onSetPositionSize: (asset: any, size: number) => void;
  onSetRiskLevel: (level: string) => void;
}

const RISK_LEVELS = {
  'AGGRESSIVE': {
    color: '#f44336',
    icon: <TrendingUpOutlined sx={{ mr: 1 }} />,
    description: 'High risk tolerance. Maximum position size: 5% of portfolio. Stop-loss: 10% below entry. Take-profit: 20% above entry.',
    positionSize: 0.05,
    stopLoss: 0.1,
    takeProfit: 0.2,
  },
  'MODERATE': {
    color: '#ffeb3b',
    icon: <TrendingFlatOutlined sx={{ mr: 1 }} />,
    description: 'Medium risk tolerance. Maximum position size: 3% of portfolio. Stop-loss: 5% below entry. Take-profit: 15% above entry.',
    positionSize: 0.03,
    stopLoss: 0.05,
    takeProfit: 0.15,
  },
  'CONSERVATIVE': {
    color: '#4caf50',
    icon: <TrendingDownOutlined sx={{ mr: 1 }} />,
    description: 'Low risk tolerance. Maximum position size: 1% of portfolio. Stop-loss: 2% below entry. Take-profit: 10% above entry.',
    positionSize: 0.01,
    stopLoss: 0.02,
    takeProfit: 0.1,
  },
};

interface PositionRisk {
  asset: any;
  positionSize: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  maxLoss: number;
  maxGain: number;
  riskLevel: string;
}

const RiskManager: React.FC<RiskManagerProps> = ({
  portfolio,
  onSetStopLoss,
  onSetTakeProfit,
  onSetPositionSize,
  onSetRiskLevel,
}) => {
  const [positions, setPositions] = useState<PositionRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [riskLevel, setRiskLevel] = useState<string>('MODERATE');
  const [positionSize, setPositionSize] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);

  // Calculate position risks
  useEffect(() => {
    const calculatePositionRisks = () => {
      return portfolio.map(asset => {
        const positionSize = asset.quantity * asset.currentPrice;
        const stopLoss = asset.averagePrice * (1 - RISK_LEVELS[riskLevel].stopLoss);
        const takeProfit = asset.averagePrice * (1 + RISK_LEVELS[riskLevel].takeProfit);
        const riskRewardRatio = (takeProfit - asset.averagePrice) / (asset.averagePrice - stopLoss);
        const maxLoss = (asset.averagePrice - stopLoss) * asset.quantity;
        const maxGain = (takeProfit - asset.averagePrice) * asset.quantity;

        return {
          asset,
          positionSize,
          stopLoss,
          takeProfit,
          riskRewardRatio,
          maxLoss,
          maxGain,
          riskLevel,
        };
      });
    };

    setPositions(calculatePositionRisks());
    setLoading(false);
  }, [portfolio, riskLevel]);

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

  // Handle risk level change
  const handleRiskLevelChange = (newLevel: string) => {
    setRiskLevel(newLevel);
    onSetRiskLevel(newLevel);
  };

  // Handle position size change
  const handlePositionSizeChange = (asset: any, newSize: number) => {
    onSetPositionSize(asset, newSize);
    setPositions(prev => prev.map(p =>
      p.asset.id === asset.id ? {
        ...p,
        positionSize: newSize * asset.currentPrice,
        maxLoss: (asset.averagePrice - p.stopLoss) * newSize,
        maxGain: (p.takeProfit - asset.averagePrice) * newSize,
      } : p
    ));
  };

  // Handle stop loss change
  const handleStopLossChange = (asset: any, newStopLoss: number) => {
    onSetStopLoss(asset, newStopLoss);
    setPositions(prev => prev.map(p =>
      p.asset.id === asset.id ? {
        ...p,
        stopLoss: newStopLoss,
        maxLoss: (asset.averagePrice - newStopLoss) * asset.quantity,
        riskRewardRatio: (p.takeProfit - asset.averagePrice) / (asset.averagePrice - newStopLoss),
      } : p
    ));
  };

  // Handle take profit change
  const handleTakeProfitChange = (asset: any, newTakeProfit: number) => {
    onSetTakeProfit(asset, newTakeProfit);
    setPositions(prev => prev.map(p =>
      p.asset.id === asset.id ? {
        ...p,
        takeProfit: newTakeProfit,
        maxGain: (newTakeProfit - asset.averagePrice) * asset.quantity,
        riskRewardRatio: (newTakeProfit - asset.averagePrice) / (asset.averagePrice - p.stopLoss),
      } : p
    ));
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Risk Level Selection */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Risk Management Settings"
          subheader="Set your risk tolerance level"
        />
        <CardContent>
          <Stack spacing={2}>
            {Object.entries(RISK_LEVELS).map(([level, config]) => (
              <Button
                key={level}
                fullWidth
                variant={riskLevel === level ? 'contained' : 'outlined'}
                color={riskLevel === level ? 'primary' : 'default'}
                startIcon={config.icon}
                onClick={() => handleRiskLevelChange(level)}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">
                    {level.replace('_', ' ')}
                  </Typography>
                  <Chip
                    label={formatPercentage(config.positionSize)}
                    color={config.color}
                    size="small"
                  />
                </Stack>
              </Button>
            ))}
            <Typography variant="caption" color="text.secondary">
              {RISK_LEVELS[riskLevel].description}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Position Risk Table */}
      <Card>
        <CardHeader
          title="Position Risk Analysis"
          subheader="Real-time risk assessment of your positions"
        />
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <CircularProgress />
            </Box>
          ) : positions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No positions in portfolio
            </Typography>
          ) : (
            <Stack spacing={2}>
              {positions.map((position, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardHeader
                    title={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">
                          {position.asset.name} ({position.asset.symbol})
                        </Typography>
                        <Chip
                          label={formatNumber(position.positionSize)}
                          color={RISK_LEVELS[riskLevel].color}
                          size="small"
                        />
                      </Stack>
                    }
                    action={
                      <IconButton
                        onClick={() => {
                          setSelectedPosition(position);
                          setPositionSize(position.positionSize);
                          setStopLoss(position.stopLoss);
                          setTakeProfit(position.takeProfit);
                          setShowRiskDialog(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          Current Price: ${position.asset.currentPrice.toFixed(2)}
                        </Typography>
                        <Chip
                          label={`RR: ${position.riskRewardRatio.toFixed(1)}`}
                          color={position.riskRewardRatio >= 2 ? 'success' : position.riskRewardRatio >= 1 ? 'warning' : 'error'}
                          size="small"
                        />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          Stop Loss: ${position.stopLoss.toFixed(2)}
                        </Typography>
                        <Chip
                          label={`Max Loss: $${formatNumber(position.maxLoss)}`}
                          color="error"
                          size="small"
                        />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          Take Profit: ${position.takeProfit.toFixed(2)}
                        </Typography>
                        <Chip
                          label={`Max Gain: $${formatNumber(position.maxGain)}`}
                          color="success"
                          size="small"
                        />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Risk Management Dialog */}
      <Dialog open={showRiskDialog} onClose={() => setShowRiskDialog(false)} maxWidth="md">
        <DialogTitle>
          Manage Risk for {selectedPosition?.asset.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="h6">
              Position Size
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Current Position Size"
                value={positionSize}
                onChange={(e) => setPositionSize(parseFloat(e.target.value) || 0)}
                type="number"
                fullWidth
                disabled
              />
              <Alert severity="info">
                Position size is automatically calculated based on your risk level and portfolio value.
              </Alert>
            </Stack>

            <Typography variant="h6">
              Stop Loss
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Stop Loss Price"
                value={stopLoss}
                onChange={(e) => handleStopLossChange(selectedPosition?.asset, parseFloat(e.target.value) || 0)}
                type="number"
                fullWidth
              />
              <Alert severity="warning">
                Stop loss will be triggered when price falls below this level.
              </Alert>
            </Stack>

            <Typography variant="h6">
              Take Profit
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Take Profit Price"
                value={takeProfit}
                onChange={(e) => handleTakeProfitChange(selectedPosition?.asset, parseFloat(e.target.value) || 0)}
                type="number"
                fullWidth
              />
              <Alert severity="success">
                Take profit will be triggered when price reaches this level.
              </Alert>
            </Stack>

            <Typography variant="h6">
              Risk Assessment
            </Typography>
            <Stack spacing={1}>
              <Chip
                label={`Risk/Reward Ratio: ${selectedPosition?.riskRewardRatio?.toFixed(1)}`}
                color={selectedPosition?.riskRewardRatio >= 2 ? 'success' : selectedPosition?.riskRewardRatio >= 1 ? 'warning' : 'error'}
                size="small"
              />
              <Chip
                label={`Max Loss: $${formatNumber(selectedPosition?.maxLoss)}`}
                color="error"
                size="small"
              />
              <Chip
                label={`Max Gain: $${formatNumber(selectedPosition?.maxGain)}`}
                color="success"
                size="small"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRiskDialog(false)}>Cancel</Button>
          <Button onClick={() => setShowRiskDialog(false)} color="primary" variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiskManager;