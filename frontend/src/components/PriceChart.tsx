import React, { useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { coingeckoService } from '../services/coingecko';
import { calculateIndicators } from '../utils/technicalIndicators';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ResponsiveContainer,
} from 'recharts';
import {
  Box,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';

interface TechnicalIndicatorData {
  timestamp: number;
  price: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  upperBand?: number;
  lowerBand?: number;
}

interface PriceChartProps {
  assets: Array<{ id: string; name: string; symbol: string }>;
  onAssetChange: (asset: { id: string; name: string; symbol: string }) => void;
}

interface ChartConfig {
  indicators: {
    rsi: boolean;
    macd: boolean;
    bollinger: boolean;
  };
}

const PriceChart: React.FC<PriceChartProps> = ({ assets, onAssetChange }) => {
  const dispatch = useAppDispatch();
  const selectedAsset = useAppSelector((state) => state.trading.selectedAsset);
  const timeInterval = useAppSelector((state) => state.trading.timeInterval);
  const chartConfig = useAppSelector((state) => state.trading.chartConfig) as ChartConfig;
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<TechnicalIndicatorData[]>([]);

  // Helper function to update chart config
  const updateChartConfig = (indicator: keyof ChartConfig['indicators'], value: boolean) => {
    dispatch({
      type: 'trading/setChartConfig',
      payload: {
        indicators: {
          ...chartConfig.indicators,
          [indicator]: value
        }
      }
    });
  };

  const handleBrushDomainChange = useCallback((domain: any) => {
    setChartData((prevData) => {
      if (Array.isArray(domain)) {
        return prevData.filter((d) => d.timestamp >= domain[0] && d.timestamp <= domain[1]);
      }
      return prevData;
    });
  }, []);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true);
        const days = 30; // Default days
        const data = await coingeckoService.getHistoricalData(
          selectedAsset.id,
          days,
          timeInterval
        );
        
        const processedData = data.prices.map(([timestamp, price]) => ({
          timestamp,
          price,
        }));

        const dataWithIndicators = await calculateIndicators({
          prices: processedData,
          market_caps: [],
          total_volumes: [],
        });
        setChartData(dataWithIndicators);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedAsset && timeInterval) {
      fetchChartData();
    }
  }, [selectedAsset, timeInterval]);

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ width: '100%', height: 600 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Select
          value={selectedAsset.id}
          onChange={(e: SelectChangeEvent<string>) => {
            const selectedId = e.target.value;
            const selectedAsset = assets.find((asset) => asset.id === selectedId);
            if (selectedAsset) {
              dispatch({
                type: 'trading/setSelectedAsset',
                payload: selectedAsset
              });
              onAssetChange(selectedAsset);
            }
          }}
        >
          {assets.map((asset) => (
            <MenuItem key={asset.id} value={asset.id}>
              {asset.name} ({asset.symbol})
            </MenuItem>
          ))}
        </Select>
        <FormControlLabel
          control={
            <Checkbox
              checked={chartConfig.indicators.rsi}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateChartConfig('rsi', e.target.checked);
              }}
            />
          }
          label="Show RSI"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={chartConfig.indicators.macd}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateChartConfig('macd', e.target.checked);
              }}
            />
          }
          label="Show MACD"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={chartConfig.indicators.bollinger}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateChartConfig('bollinger', e.target.checked);
              }}
            />
          }
          label="Show Bollinger Bands"
        />
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 50,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2196f3"
            name="Price"
          />
          {chartConfig.indicators.rsi && (
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#f44336"
              name="RSI"
            />
          )}
          {chartConfig.indicators.macd && (
            <>
              <Line
                type="monotone"
                dataKey="macd"
                stroke="#4caf50"
                name="MACD"
              />
              <Line
                type="monotone"
                dataKey="macdSignal"
                stroke="#9c27b0"
                name="MACD Signal"
              />
            </>
          )}
          {chartConfig.indicators.bollinger && (
            <>
              <Line
                type="monotone"
                dataKey="upperBand"
                stroke="#ff9800"
                name="Upper Band"
              />
              <Line
                type="monotone"
                dataKey="lowerBand"
                stroke="#ff9800"
                name="Lower Band"
              />
            </>
          )}
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#8884d8"
            onChange={handleBrushDomainChange}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PriceChart;