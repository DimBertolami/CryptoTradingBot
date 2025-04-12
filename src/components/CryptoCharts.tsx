import React, { useState, useEffect } from 'react';
import { TechnicalAnalysisChartWithErrorBoundary } from './TechnicalAnalysisChart';

interface ChartDataPoint {
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

interface CryptoChartsProps {
  symbol?: string;
}

const CryptoCharts: React.FC<CryptoChartsProps> = ({ symbol = 'BTC' }) => {
  const [timeRange, setTimeRange] = useState('day');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Sample data for development
    const generateSampleData = () => {
      const now = new Date();
      const data: ChartDataPoint[] = [];
      const points = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30;
      
      for (let i = 0; i < points; i++) {
        const timestamp = new Date(now.getTime() - (points - i) * 3600000);
        const basePrice = 45000 + Math.random() * 1000;
        const volume = 100000 + Math.random() * 50000;
        
        data.push({
          timestamp: timestamp.toISOString(),
          price: basePrice,
          volume: volume,
          rsi: 30 + Math.random() * 40,
          macd: -10 + Math.random() * 20,
          signal: -5 + Math.random() * 10,
          histogram: -5 + Math.random() * 10,
          upperBand: basePrice * 1.02,
          middleBand: basePrice,
          lowerBand: basePrice * 0.98,
        });
      }
      
      return data;
    };

    setChartData(generateSampleData());
  }, [timeRange, symbol]);

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-100">
          {symbol}/USD Technical Analysis
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 rounded ${timeRange === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            24H
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            7D
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            30D
          </button>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg shadow-lg">
        <TechnicalAnalysisChartWithErrorBoundary
          data={chartData}
          timeRange={timeRange}
        />
      </div>
    </div>
  );
};

export default CryptoCharts;
