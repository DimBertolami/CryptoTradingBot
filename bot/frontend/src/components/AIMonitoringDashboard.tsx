import React, { useState, useEffect } from 'react';
import { Box, Card, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography, LinearProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Metrics, RecentAction, SystemStatus } from '../types/metrics';

interface LearningProgress {
  timestamp: string;
  accuracy: number;
  loss: number;
  episodes: number;
  reward: number;
}

interface Props {
  metrics: Metrics | null;
  loading: boolean;
}

const AIMonitoringDashboard: React.FC<Props> = ({ metrics, loading }) => {
  const [localMetrics, setLocalMetrics] = useState<Metrics | null>(metrics);
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [status, setStatus] = useState<SystemStatus>({
    backend: { success: false },
    signals: { success: false },
    paperTrading: { success: false },
    database: { success: false }
  });
  const [isLoading, setIsLoading] = useState<boolean>(loading);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [backendStatus, signalsStatus, paperTradingStatus, dbStatus] = await Promise.all([
          fetch('/trading/backend_status'),
          fetch('/trading/signals_status'),
          fetch('/trading/paper_trading_status'),
          fetch('/trading/database_status')
        ]);

        const [backend, signals, paperTrading, database] = await Promise.all([
          backendStatus.json(),
          signalsStatus.json(),
          paperTradingStatus.json(),
          dbStatus.json()
        ]);

        setStatus({
          backend,
          signals,
          paperTrading,
          database
        });
      } catch (error) {
        console.error('Error fetching system status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const interval = setInterval(fetchStatus, 5000);
    fetchStatus();
    return () => clearInterval(interval);
  }, [metrics]);

  useEffect(() => {
    if (metrics) {
      setLocalMetrics(metrics);
    }
    setIsLoading(loading);
  }, [metrics, loading]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [metricsResponse, learningResponse] = await Promise.all([
          fetch('/api/ai/metrics'),
          fetch('/trading/ai/learning_progress')
        ]);
        
        const [metricsData, learningData] = await Promise.all([
          metricsResponse.json(),
          learningResponse.json()
        ]);
        
        setLocalMetrics(metricsData);
        setLearningProgress(learningData);
      } catch (error) {
        console.error('Error fetching AI metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !metrics) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
        <Box gridColumn="span 12">
          <Card>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>System Status</Typography>
              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: status.backend.success ? '#e8f5e9' : '#ffebee' }}>
                  <Typography variant="subtitle1">Backend</Typography>
                  <Typography variant="body2">{status.backend.success ? 'Active' : 'Inactive'}</Typography>
                  {status.backend.message && <Typography variant="caption" color="text.secondary">{status.backend.message}</Typography>}
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: status.signals.success ? '#e8f5e9' : '#ffebee' }}>
                  <Typography variant="subtitle1">Signals</Typography>
                  <Typography variant="body2">{status.signals.success ? 'Active' : 'Inactive'}</Typography>
                  {status.signals.message && <Typography variant="caption" color="text.secondary">{status.signals.message}</Typography>}
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: status.paperTrading.success ? '#e8f5e9' : '#ffebee' }}>
                  <Typography variant="subtitle1">Paper Trading</Typography>
                  <Typography variant="body2">{status.paperTrading.success ? 'Active' : 'Inactive'}</Typography>
                  {status.paperTrading.message && <Typography variant="caption" color="text.secondary">{status.paperTrading.message}</Typography>}
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: status.database.success ? '#e8f5e9' : '#ffebee' }}>
                  <Typography variant="subtitle1">Database</Typography>
                  <Typography variant="body2">{status.database.success ? 'Active' : 'Inactive'}</Typography>
                  {status.database.message && <Typography variant="caption" color="text.secondary">{status.database.message}</Typography>}
                </Paper>
              </Box>
            </Box>
          </Card>
        </Box>
        <Box gridColumn="span 6">
          <Card>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Learning Progress
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={learningProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => {
                      if (!value) return '';
                      const date = new Date(value);
                      return date.toLocaleString(); // Show both date and time
                    }}
                  />
                  <YAxis yAxisId="left" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => {
                      if (!value) return '';
                      const date = new Date(value);
                      return date.toLocaleString();
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#8884d8" />
                  <Line yAxisId="right" type="monotone" dataKey="loss" name="Loss" stroke="#82ca9d" />
                  <Line yAxisId="right" type="monotone" dataKey="reward" name="Reward" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>
        <Box gridColumn="span 6">
          <Card>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Recent Actions
              </Typography>
              <Paper>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Reward</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localMetrics?.dqnModel.recentActions.map((action: RecentAction) => (
                      <TableRow key={action.timestamp}>
                        <TableCell>
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>{action.action}</TableCell>
                        <TableCell>{(action.confidence * 100).toFixed(1)}%</TableCell>
                        <TableCell>{action.reward.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default AIMonitoringDashboard;
