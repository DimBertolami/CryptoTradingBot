import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TechnicalIndicator {
  timestamp: string;
  price: number;
  volume: number;
  rsi: number;
  macd: number;
  signal: number;
  histogram: number;
  upperBand: number;
  middleBand: number;
  lowerBand: number;
}

interface Props {
  data: TechnicalIndicator[];
  timeRange: string;
}

// Error boundary component
export class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-red-500">
          Chart failed to load. Please try refreshing the page.
        </div>
      );
    }

    return this.props.children;
  }
}

const TechnicalAnalysisChart: React.FC<Props> = ({ data, timeRange }) => {
  // Ensure data is valid
  const validData = data.filter(item => (
    item.price != null &&
    !isNaN(item.price) &&
    item.volume != null &&
    !isNaN(item.volume)
  ));

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (timeRange) {
      case 'day':
        return date.toLocaleTimeString();
      case 'week':
        return date.toLocaleDateString();
      case 'month':
        return `${date.getMonth() + 1}/${date.getDate()}`
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <div className="w-full h-[500px] bg-gray-800 rounded-lg p-4">
      <ResponsiveContainer>
        <ComposedChart data={validData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            stroke="#9CA3AF"
          />
          <YAxis yAxisId="left" stroke="#9CA3AF" />
          <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#F3F4F6',
            }}
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="price"
            fill="#3B82F6"
            stroke="#60A5FA"
            fillOpacity={0.3}
            name="Price"
          />
          <Bar
            yAxisId="right"
            dataKey="volume"
            fill="#6366F1"
            opacity={0.5}
            name="Volume"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="upperBand"
            stroke="#10B981"
            dot={false}
            name="Upper BB"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="middleBand"
            stroke="#6B7280"
            dot={false}
            name="Middle BB"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="lowerBand"
            stroke="#10B981"
            dot={false}
            name="Lower BB"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Wrap the chart with error boundary
export const TechnicalAnalysisChartWithErrorBoundary: React.FC<Props> = (props) => (
  <ChartErrorBoundary>
    <TechnicalAnalysisChart {...props} />
  </ChartErrorBoundary>
);

export default TechnicalAnalysisChartWithErrorBoundary;
