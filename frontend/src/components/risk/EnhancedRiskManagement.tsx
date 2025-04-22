import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
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

const RiskControlCard = styled(motion(Box))(({ theme }) => ({
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

const EnhancedRiskManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [riskSettings, setRiskSettings] = useState({
    maxDrawdown: 0.1,
    maxLeverage: 3,
    positionSize: 0.05,
    stopLoss: 0.02,
    takeProfit: 0.05,
    volatilityLimit: 0.2,
    autoHedging: false,
    dynamicPositionSizing: false,
    riskAversion: 0.5,
  });

  const handleSliderChange = (name: string) => (event: Event, newValue: number | number[]) => {
    setRiskSettings((prev) => ({
      ...prev,
      [name]: newValue as number,
    }));
  };

  const handleSwitchChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setRiskSettings((prev) => ({
      ...prev,
      [name]: event.target.checked,
    }));
  };

  return (
    <Grid container spacing={3}>
      {/* Risk Parameters */}
      <Grid item xs={12}>
        <StyledPaper>
          <Typography variant="h5" component="h3" gutterBottom>
            Risk Parameters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <RiskControlCard>
                <Typography variant="h6" gutterBottom>
                  Maximum Drawdown
                </Typography>
                <Slider
                  value={riskSettings.maxDrawdown * 100}
                  onChange={handleSliderChange('maxDrawdown')}
                  valueLabelDisplay="auto"
                  min={0}
                  max={50}
                  step={1}
                  marks
                />
              </RiskControlCard>
            </Grid>
            <Grid item xs={12} sm={6}>
              <RiskControlCard>
                <Typography variant="h6" gutterBottom>
                  Maximum Leverage
                </Typography>
                <Slider
                  value={riskSettings.maxLeverage}
                  onChange={handleSliderChange('maxLeverage')}
                  valueLabelDisplay="auto"
                  min={1}
                  max={10}
                  step={1}
                  marks
                />
              </RiskControlCard>
            </Grid>
          </Grid>
        </StyledPaper>
      </Grid>

      {/* Position Sizing */}
      <Grid item xs={12}>
        <StyledPaper>
          <Typography variant="h5" component="h3" gutterBottom>
            Position Sizing
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <RiskControlCard>
                <Typography variant="h6" gutterBottom>
                  Position Size
                </Typography>
                <Slider
                  value={riskSettings.positionSize * 100}
                  onChange={handleSliderChange('positionSize')}
                  valueLabelDisplay="auto"
                  min={0.1}
                  max={20}
                  step={0.1}
                  marks
                />
              </RiskControlCard>
            </Grid>
            <Grid item xs={12} sm={6}>
              <RiskControlCard>
                <Typography variant="h6" gutterBottom>
                  Dynamic Position Sizing
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={riskSettings.dynamicPositionSizing}
                      onChange={handleSwitchChange('dynamicPositionSizing')}
                      color="primary"
                    />
                  }
                  label="Enable"
                />
              </RiskControlCard>
            </Grid>
          </Grid>
        </StyledPaper>
      </Grid>

      {/* Stop Loss & Take Profit */}
      <Grid item xs={12}>
        <StyledPaper>
          <Typography variant="h5" component="h3" gutterBottom>
            Stop Loss & Take Profit
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <RiskControlCard>
                <Typography variant="h6" gutterBottom>
                  Stop Loss
                </Typography>
                <Slider
                  value={riskSettings.stopLoss * 100}
                  onChange={handleSliderChange('stopLoss')}
                  valueLabelDisplay="auto"
                  min={0.1}
                  max={10}
                  step={0.1}
                  marks
                />
              </RiskControlCard>
            </Grid>
            <Grid item xs={12} sm={6}>
              <RiskControlCard>
                <Typography variant="h6" gutterBottom>
                  Take Profit
                </Typography>
                <Slider
                  value={riskSettings.takeProfit * 100}
                  onChange={handleSliderChange('takeProfit')}
                  valueLabelDisplay="auto"
                  min={0.1}
                  max={20}
                  step={0.1}
                  marks
                />
              </RiskControlCard>
            </Grid>
          </Grid>
        </StyledPaper>
      </Grid>

      {/* Advanced Risk Controls */}
      <Grid item xs={12}>
        <StyledPaper>
          <Typography variant="h5" component="h3" gutterBottom>
            Advanced Risk Controls
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <RiskControlCard>
                <Typography variant="h6" gutterBottom>
                  Volatility Limit
                </Typography>
                <Slider
                  value={riskSettings.volatilityLimit * 100}
                  onChange={handleSliderChange('volatilityLimit')}
                  valueLabelDisplay="auto"
                  min={0.1}
                  max={50}
                  step={0.1}
                  marks
                />
              </RiskControlCard>
            </Grid>
            <Grid item xs={12} sm={6}>
              <RiskControlCard>
                <Typography variant="h6" gutterBottom>
                  Risk Aversion
                </Typography>
                <Slider
                  value={riskSettings.riskAversion * 100}
                  onChange={handleSliderChange('riskAversion')}
                  valueLabelDisplay="auto"
                  min={0.1}
                  max={100}
                  step={0.1}
                  marks
                />
              </RiskControlCard>
            </Grid>
            <Grid item xs={12} sm={6}>
              <RiskControlCard>
                <Typography variant="h6" gutterBottom>
                  Auto Hedging
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={riskSettings.autoHedging}
                      onChange={handleSwitchChange('autoHedging')}
                      color="primary"
                    />
                  }
                  label="Enable"
                />
              </RiskControlCard>
            </Grid>
          </Grid>
        </StyledPaper>
      </Grid>
    </Grid>
  );
};

export default EnhancedRiskManagement;
