import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  Scatter
} from 'recharts';
import { format } from 'date-fns';

interface PortfolioMetric {
  timestamp: string;
  totalValue: number;
  returns: number;
  volatility: number;
  sharpeRatio: number;
  drawdown: number;
  allocation: Record<string, number>;
  riskMetrics: {
    var: number;
    cvar: number;
    tailRisk: number;
    downsideDeviation: number;
  };
  diversificationMetrics: {
    herfindahl: number;
    gini: number;
    effectiveN: number;
  };
}

interface Props {
  metrics: PortfolioMetric[];
  timeRange: 'day' | 'week' | 'month' | 'year';
}

const PortfolioMetrics: React.FC<Props> = ({ metrics, timeRange }) => {
  const formatDate = (timestamp: string) => {
    switch (timeRange) {
      case 'day':
        return format(new Date(timestamp), 'HH:mm');
      case 'week':
        return format(new Date(timestamp), 'EEE');
      case 'month':
        return format(new Date(timestamp), 'MMM d');
      case 'year':
        return format(new Date(timestamp), 'MMM yyyy');
      default:
        return timestamp;
    }
  };

  const renderPerformanceChart = () => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={metrics}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            interval="preserveStartEnd"
          />
          <YAxis yAxisId="value" />
          <YAxis yAxisId="return" orientation="right" />
          <Tooltip
            formatter={(value: number, name: string) =>
              [value.toFixed(2), name]}
            labelFormatter={(label) => formatDate(label.toString())}
          />
          <Legend />
          <Area
            yAxisId="value"
            type="monotone"
            dataKey="totalValue"
            name="Portfolio Value"
            fill="#8884d8"
            stroke="#8884d8"
            fillOpacity={0.3}
          />
          <Line
            yAxisId="return"
            type="monotone"
            dataKey="returns"
            name="Returns"
            stroke="#82ca9d"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  const renderRiskMetricsChart = () => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">Risk Metrics</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={metrics}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            interval="preserveStartEnd"
          />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) =>
              [value.toFixed(4), name]}
            labelFormatter={(label) => formatDate(label.toString())}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="volatility"
            name="Volatility"
            stroke="#ff7300"
          />
          <Line
            type="monotone"
            dataKey="riskMetrics.var"
            name="VaR"
            stroke="#ff0000"
          />
          <Line
            type="monotone"
            dataKey="riskMetrics.tailRisk"
            name="Tail Risk"
            stroke="#8b0000"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  const renderDiversificationChart = () => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">Diversification Metrics</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={metrics}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            interval="preserveStartEnd"
          />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) =>
              [value.toFixed(4), name]}
            labelFormatter={(label) => formatDate(label.toString())}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="diversificationMetrics.herfindahl"
            name="Herfindahl Index"
            stroke="#2196f3"
          />
          <Line
            type="monotone"
            dataKey="diversificationMetrics.gini"
            name="Gini Coefficient"
            stroke="#4caf50"
          />
          <Bar
            dataKey="diversificationMetrics.effectiveN"
            name="Effective N"
            fill="#ff9800"
            opacity={0.5}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  const renderAllocationChart = () => {
    const assets = Object.keys(metrics[0]?.allocation || {});
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) =>
                [`${(value * 100).toFixed(2)}%`, name]}
              labelFormatter={(label) => formatDate(label.toString())}
            />
            <Legend />
            {assets.map((asset, index) => (
              <Area
                key={asset}
                type="monotone"
                dataKey={`allocation.${asset}`}
                name={asset}
                stackId="1"
                fill={`hsl(${(index * 360) / assets.length}, 70%, 50%)`}
                stroke={`hsl(${(index * 360) / assets.length}, 70%, 40%)`}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Portfolio Analytics</h2>
      {renderPerformanceChart()}
      {renderRiskMetricsChart()}
      {renderDiversificationChart()}
      {renderAllocationChart()}
    </div>
  );
};

export default PortfolioMetrics;
