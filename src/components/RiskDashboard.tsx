import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { Grid } from '@mui/material';


interface RiskMetrics {
  riskLevel: number;
  volatility: number;
  drawdown: number;
  confidence: number;
  cumulativeProfit: number;
  botConfidence: number;
  learningProgress: {
    accuracyScore: number;
    trainingEpochs: number;
    lastUpdated: string;
  };
  strategyPerformance: {
    [key: string]: {
      exposure: number;
      returns: number;
      risk: number;
    };
  };
  portfolioMetrics: {
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    volatility: number;
  };
}

const RiskDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to get risk metrics
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // For development, use sample data
      // In production, this would be: await fetch('/trading/risk/metrics');
      const sampleData: RiskMetrics = {
        riskLevel: 0.65,
        volatility: 0.25,
        drawdown: -0.15,
        confidence: 0.85,
        cumulativeProfit: 2850.75,
        botConfidence: 0.82,
        learningProgress: {
          accuracyScore: 0.78,
          trainingEpochs: 150,
          lastUpdated: new Date().toISOString()
        },
        strategyPerformance: {
          'Mean Reversion': { exposure: 0.3, returns: 0.12, risk: 0.4 },
          'Trend Following': { exposure: 0.4, returns: 0.15, risk: 0.6 },
          'Breakout': { exposure: 0.2, returns: 0.08, risk: 0.3 },
          'ML-Based': { exposure: 0.1, returns: 0.18, risk: 0.7 }
        },
        portfolioMetrics: {
          sharpeRatio: 1.8,
          sortinoRatio: 2.1,
          maxDrawdown: 0.25,
          volatility: 0.2
        }
      };
      setMetrics(sampleData);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!metrics) {
    return <div>Error loading metrics</div>;
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      {/* Risk Level Card */}
      <Grid {...{ item: true, xs: 12, md: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Risk Level
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" height={150}>
              <Typography variant="h2" color={metrics.riskLevel > 0.7 ? 'error' : metrics.riskLevel > 0.5 ? 'warning' : 'success'}>
                {formatPercentage(metrics.riskLevel)}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Confidence: {formatPercentage(metrics.confidence)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Bot Learning Metrics Card */}
      <Grid {...{ item: true, xs: 12, md: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Bot Learning & Performance
            </Typography>
            <Grid container spacing={2}>
              <Grid {...{ item: true, xs: 6 }}>
                <Typography variant="body1" color="primary">
                  Cumulative Profit: ${metrics.cumulativeProfit.toFixed(2)}
                </Typography>
              </Grid>
              <Grid {...{ item: true, xs: 6 }}>
                <Typography variant="body1" color="primary">
                  Bot Confidence: {formatPercentage(metrics.botConfidence)}
                </Typography>
              </Grid>
              <Grid {...{ item: true, xs: 6 }}>
                <Typography variant="body1">
                  Accuracy Score: {formatPercentage(metrics.learningProgress.accuracyScore)}
                </Typography>
              </Grid>
              <Grid {...{ item: true, xs: 6 }}>
                <Typography variant="body1">
                  Training Epochs: {metrics.learningProgress.trainingEpochs}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Portfolio Metrics Card */}
      <Grid {...{ item: true, xs: 12, md: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Portfolio Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid {...{ item: true, xs: 6 }}>
                <Typography variant="body1">
                  Sharpe Ratio: {metrics.portfolioMetrics.sharpeRatio.toFixed(2)}
                </Typography>
              </Grid>
              <Grid {...{ item: true, xs: 6 }}>
                <Typography variant="body1">
                  Sortino Ratio: {metrics.portfolioMetrics.sortinoRatio.toFixed(2)}
                </Typography>
              </Grid>
              <Grid {...{ item: true, xs: 6 }}>
                <Typography variant="body1">
                  Max Drawdown: {formatPercentage(metrics.portfolioMetrics.maxDrawdown)}
                </Typography>
              </Grid>
              <Grid {...{ item: true, xs: 6 }}>
                <Typography variant="body1">
                  Volatility: {formatPercentage(metrics.portfolioMetrics.volatility)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Strategy Performance Chart */}
      <Grid {...{ item: true, xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Strategy Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Object.entries(metrics.strategyPerformance).map(
                ([strategy, data]) => ({
                  strategy,
                  exposure: data.exposure,
                  returns: data.returns,
                  risk: data.risk,
                })
              )}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="strategy" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="exposure" name="Exposure" stroke="#8884d8" />
                <Line type="monotone" dataKey="returns" name="Returns" stroke="#82ca9d" />
                <Line type="monotone" dataKey="risk" name="Risk" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Risk Heatmap */}
      <Grid {...{ item: true, xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risk Heatmap
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(metrics.strategyPerformance).map(([strategy, data]) => (
                <Grid {...{ item: true, xs: 6, md: 3, key: strategy }}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: `rgba(255, 0, 0, ${data.risk})`,
                      borderRadius: 2,
                      height: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="h6" color="white">
                      {strategy}
                    </Typography>
                    <Typography variant="body2" color="white">
                      Risk: {formatPercentage(data.risk)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default RiskDashboard;
