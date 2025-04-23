import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

interface ModelMetrics {
  modelName: string;
  accuracy: number;
  loss: number;
  mae: number;
  trainingTime: number;
  inferenceTime: number;
  parameters: number;
  memoryUsage: number;
}

interface ComparisonResult {
  models: ModelMetrics[];
  timestamp: string;
  bestModel: string;
}

const ModelComparison: React.FC = () => {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComparison();
  }, []);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/model-comparison');
      const data = await response.json();
      setComparison(data);
    } catch (error) {
      console.error('Error fetching model comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchComparison();
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!comparison) {
    return null;
  }

  const performanceData = comparison.models.map((model) => ({
    name: model.modelName,
    accuracy: model.accuracy * 100,
    loss: model.loss,
    mae: model.mae,
  }));

  const resourceData = comparison.models.map((model) => ({
    name: model.modelName,
    training: model.trainingTime,
    inference: model.inferenceTime,
    memory: model.memoryUsage,
  }));

  const radarData = comparison.models.map((model) => ({
    modelName: model.modelName,
    Accuracy: model.accuracy * 100,
    'Training Speed': 100 - (model.trainingTime / Math.max(...comparison.models.map(m => m.trainingTime)) * 100),
    'Inference Speed': 100 - (model.inferenceTime / Math.max(...comparison.models.map(m => m.inferenceTime)) * 100),
    'Memory Efficiency': 100 - (model.memoryUsage / Math.max(...comparison.models.map(m => m.memoryUsage)) * 100),
    'Loss Score': 100 - (model.loss / Math.max(...comparison.models.map(m => m.loss)) * 100),
  }));

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Model Comparison</Typography>
        <Button variant="contained" onClick={handleRefresh}>
          Refresh Comparison
        </Button>
      </Box>

      <Grid container spacing={3} component="div">
        {/* Performance Metrics */}
        <Grid item xs={12} md={6} component="div">
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="accuracy" name="Accuracy %" fill="#8884d8" />
                <Bar dataKey="loss" name="Loss" fill="#82ca9d" />
                <Bar dataKey="mae" name="MAE" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Resource Usage */}
        <Grid item xs={12} md={6} component="div">
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resource Usage
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="training" name="Training Time (s)" fill="#8884d8" />
                <Bar dataKey="inference" name="Inference Time (ms)" fill="#82ca9d" />
                <Bar dataKey="memory" name="Memory Usage (MB)" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Radar Chart */}
        <Grid item xs={12} md={6} component="div">
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Model Characteristics
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="modelName" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Model Score" dataKey="Accuracy" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="Training Speed" dataKey="Training Speed" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                <Radar name="Inference Speed" dataKey="Inference Speed" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Detailed Metrics Table */}
        <Grid item xs={12} component="div">
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Detailed Metrics
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model</TableCell>
                  <TableCell align="right">Accuracy</TableCell>
                  <TableCell align="right">Loss</TableCell>
                  <TableCell align="right">MAE</TableCell>
                  <TableCell align="right">Training Time</TableCell>
                  <TableCell align="right">Inference Time</TableCell>
                  <TableCell align="right">Parameters</TableCell>
                  <TableCell align="right">Memory Usage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparison.models.map((model) => (
                  <TableRow
                    key={model.modelName}
                    sx={{
                      backgroundColor:
                        model.modelName === comparison.bestModel
                          ? 'success.light'
                          : 'inherit',
                    }}
                  >
                    <TableCell>{model.modelName}</TableCell>
                    <TableCell align="right">
                      {(model.accuracy * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell align="right">{model.loss.toFixed(4)}</TableCell>
                    <TableCell align="right">{model.mae.toFixed(4)}</TableCell>
                    <TableCell align="right">{model.trainingTime.toFixed(2)}s</TableCell>
                    <TableCell align="right">{model.inferenceTime.toFixed(2)}ms</TableCell>
                    <TableCell align="right">{model.parameters.toLocaleString()}</TableCell>
                    <TableCell align="right">{model.memoryUsage.toFixed(1)} MB</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModelComparison;
