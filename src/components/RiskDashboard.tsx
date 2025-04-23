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
  };
  portfolioMetrics: {
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    volatility: number;
  };
  strategyPerformance: {
    [key: string]: {
      returns: number;
      risk: number;
      trades: number;
    };
  };
}

const RiskDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Simulated API call with sample data
      const sampleData: RiskMetrics = {
        riskLevel: 0.65,
        volatility: 0.25,
        drawdown: -0.15,
        confidence: 0.85,
        cumulativeProfit: 15000,
        botConfidence: 0.78,
        learningProgress: {
          accuracyScore: 0.82,
          trainingEpochs: 1000,
        },
        portfolioMetrics: {
          sharpeRatio: 1.8,
          sortinoRatio: 2.1,
          maxDrawdown: -0.12,
          volatility: 0.22,
        },
        strategyPerformance: {
          'Moving Average': { returns: 0.15, risk: 0.08, trades: 150 },
          'RSI': { returns: 0.12, risk: 0.06, trades: 120 },
          'MACD': { returns: 0.18, risk: 0.09, trades: 180 },
          'Bollinger Bands': { returns: 0.14, risk: 0.07, trades: 130 },
        },
      };
      setMetrics(sampleData);
    } catch (error) {
      console.error('Error fetching risk metrics:', error);
    }
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (!metrics) {
    return <CircularProgress />;
  }

  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      {/* Risk Level Card */}
      <Grid {...{ item: true, xs: 12, md: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risk Level
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress variant="determinate" value={metrics.riskLevel * 100} />
              <Typography variant="h4">
                {formatPercentage(metrics.riskLevel)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Bot Learning Metrics Card */}
      <Grid {...{ item: true, xs: 12, md: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Bot Learning Metrics
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
              <LineChart
                data={Object.entries(metrics.strategyPerformance).map(([strategy, data]) => ({
                  name: strategy,
                  returns: data.returns * 100,
                  risk: data.risk * 100,
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="returns" stroke="#8884d8" name="Returns (%)" />
                <Line type="monotone" dataKey="risk" stroke="#82ca9d" name="Risk (%)" />
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
              Strategy Risk Heatmap
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(metrics.strategyPerformance).map(([strategy, data]) => (
                <Grid {...{ item: true, xs: 6, md: 3, key: strategy }}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: `rgba(255, ${Math.round(
                        255 * (1 - data.risk)
                      )}, 0, 0.2)`,
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle2">{strategy}</Typography>
                    <Typography>Risk: {formatPercentage(data.risk)}</Typography>
                    <Typography>Trades: {data.trades}</Typography>
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