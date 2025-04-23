import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface OptimizationStatus {
  isRunning: boolean;
  progress: number;
  currentTrial: number;
  totalTrials: number;
  bestScore: number;
  bestParams: Record<string, any>;
  recentTrials: Array<{
    trialId: number;
    params: Record<string, any>;
    score: number;
    duration: number;
  }>;
  convergencePlot: Array<{
    trial: number;
    score: number;
    bestScore: number;
  }>;
  parameterImportance: Array<{
    parameter: string;
    importance: number;
  }>;
}

const ModelOptimization: React.FC = () => {
  const [status, setStatus] = useState<OptimizationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [optimizationConfig, setOptimizationConfig] = useState({
    modelType: 'price_prediction',
    trials: 100,
    timeout: 3600,
    metric: 'loss',
  });

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/ai/optimization/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching optimization status:', error);
    }
  };

  const startOptimization = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/ai/optimization/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(optimizationConfig),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start optimization');
      }
      
      await fetchStatus();
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const stopOptimization = async () => {
    try {
      await fetch('/api/ai/optimization/stop', { method: 'POST' });
      await fetchStatus();
    } catch (error) {
      console.error('Error stopping optimization:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Model Optimization
      </Typography>

      {/* Configuration */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Optimization Configuration
        </Typography>
        <Grid container spacing={2} component="div">
          <Grid item xs={12} md={3} component="div">
            <FormControl fullWidth>
              <InputLabel>Model Type</InputLabel>
              <Select
                value={optimizationConfig.modelType}
                onChange={(e) =>
                  setOptimizationConfig({
                    ...optimizationConfig,
                    modelType: e.target.value,
                  })
                }
                disabled={status?.isRunning}
              >
                <MenuItem value="price_prediction">Price Prediction</MenuItem>
                <MenuItem value="dqn">DQN Agent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3} component="div">
            <TextField
              fullWidth
              type="number"
              label="Number of Trials"
              value={optimizationConfig.trials}
              onChange={(e) =>
                setOptimizationConfig({
                  ...optimizationConfig,
                  trials: parseInt(e.target.value),
                })
              }
              disabled={status?.isRunning}
            />
          </Grid>
          <Grid item xs={12} md={3} component="div">
            <TextField
              fullWidth
              type="number"
              label="Timeout (seconds)"
              value={optimizationConfig.timeout}
              onChange={(e) =>
                setOptimizationConfig({
                  ...optimizationConfig,
                  timeout: parseInt(e.target.value),
                })
              }
              disabled={status?.isRunning}
            />
          </Grid>
          <Grid item xs={12} md={3} component="div">
            <FormControl fullWidth>
              <InputLabel>Optimization Metric</InputLabel>
              <Select
                value={optimizationConfig.metric}
                onChange={(e) =>
                  setOptimizationConfig({
                    ...optimizationConfig,
                    metric: e.target.value,
                  })
                }
                disabled={status?.isRunning}
              >
                <MenuItem value="loss">Loss</MenuItem>
                <MenuItem value="accuracy">Accuracy</MenuItem>
                <MenuItem value="mae">MAE</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={startOptimization}
            disabled={status?.isRunning || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Start Optimization'}
          </Button>
          <Button
            variant="outlined"
            onClick={stopOptimization}
            disabled={!status?.isRunning}
            color="error"
          >
            Stop Optimization
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Card>

      {status?.isRunning && (
        <Card sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Optimization Progress
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Trial {status.currentTrial} of {status.totalTrials}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(status.currentTrial / status.totalTrials) * 100}
              sx={{ mt: 1 }}
            />
          </Box>
          <Grid container spacing={2} component="div">
            <Grid item xs={12} md={6} component="div">
              <Typography variant="body2" color="textSecondary">
                Best Score
              </Typography>
              <Typography variant="h5">{status.bestScore.toFixed(4)}</Typography>
            </Grid>
            <Grid item xs={12} md={6} component="div">
              <Typography variant="body2" color="textSecondary">
                Best Parameters
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {Object.entries(status.bestParams).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Convergence Plot */}
      {status?.convergencePlot && (
        <Card sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Optimization Convergence
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={status.convergencePlot}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trial" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#8884d8"
                name="Trial Score"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="bestScore"
                stroke="#82ca9d"
                name="Best Score"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Parameter Importance */}
      {status?.parameterImportance && (
        <Grid container spacing={3} component="div">
          <Grid item xs={12} md={6} component="div">
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Parameter Importance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={status.parameterImportance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="parameter" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="importance"
                    name="Importance Score"
                    fill="#8884d8"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} component="div">
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Trials
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {status?.recentTrials.map((trial) => (
                  <Box
                    key={trial.trialId}
                    sx={{
                      p: 1,
                      mb: 1,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle2">
                      Trial {trial.trialId} - Score: {trial.score.toFixed(4)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Duration: {trial.duration.toFixed(2)}s
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {Object.entries(trial.params).map(([key, value]) => (
                        <Chip
                          key={key}
                          label={`${key}: ${value}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ModelOptimization;
