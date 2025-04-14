import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Chip,
  Button,
  Tabs,
  Tab,
  FormGroup,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useAppDispatch } from '../app/hooks';
import { setIndicator } from '../app/tradingSlice';
import Chart from 'react-apexcharts';

interface AdvancedTradingFeaturesProps {
  asset: {
    priceData: Array<{
      high: number;
      low: number;
      close: number;
      volume: number;
      period?: string;
      multiplier?: string;
    }>;
  };
}

interface IndicatorResult {
  upper?: number[];
  lower?: number[];
  kst?: number[];
  signal?: number[];
}

interface IndicatorConfig {
  name: string;
  description: string;
  category: string;
  parameters: {
    period: number;
    multiplier?: number;
  };
  calculate: (data: any[], params: any) => IndicatorResult;
}

const ADVANCED_INDICATORS: Record<string, IndicatorConfig> = {
  DONCHIAN: {
    name: 'Donchian Channels',
    description: 'Shows volatility and potential breakout points.',
    category: 'Volatility',
    parameters: { period: 20, multiplier: 2 },
    calculate: (data: any[], { period, multiplier }: any): IndicatorResult => {
      const upper: number[] = [];
      const lower: number[] = [];
      for (let i = period; i < data.length; i++) {
        const slice = data.slice(i - period, i);
        const high = Math.max(...slice.map((d: any) => d.high));
        const low = Math.min(...slice.map((d: any) => d.low));
        upper.push(high * multiplier);
        lower.push(low * multiplier);
      }
      return { upper, lower };
    },
  },
  KST: {
    name: 'Know SureThing',
    description: 'Multi-period momentum oscillator.',
    category: 'Momentum',
    parameters: { period: 10 },
    calculate: (data: any[], { period }: any): IndicatorResult => {
      const kst: number[] = [];
      const signal: number[] = [];

      // Calculate KST using multiple periods
      for (let i = period; i < data.length; i++) {
        const slice = data.slice(i - period, i);
        const closePrices = slice.map((d: any) => d.close);
        const avg = closePrices.reduce((a, b) => a + b, 0) / closePrices.length;
        kst.push(avg);

        // Calculate signal line
        if (i >= period * 2) {
          const signalSlice = kst.slice(i - period, i);
          const signalAvg = signalSlice.reduce((a, b) => a + b, 0) / signalSlice.length;
          signal.push(signalAvg);
        }
      }
      return { kst, signal };
    },
  },
  CHAIKIN: {
    name: 'Chaikin Money Flow',
    description: 'Combines volume and price to identify accumulation/distribution.',
    category: 'Volume',
    parameters: { period: 20 },
    calculate: (data: any[], { period }: any): IndicatorResult => {
      const kst: number[] = [];
      const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);

      for (let i = period; i < data.length; i++) {
        const slice = data.slice(i - period, i);
        const volumeRatio = slice.reduce((sum, d) => sum + d.volume, 0) / totalVolume;
        const priceChange = (slice[slice.length - 1].close - slice[0].close) / slice[0].close;
        kst.push(priceChange * volumeRatio * 100);
      }
      return { kst };
    },
  },
  VWAPM: {
    name: 'Volume Weighted Average Price Momentum',
    description: 'Measures momentum based on volume-weighted price.',
    category: 'Momentum',
    parameters: { period: 14 },
    calculate: (data: any[], { period }: any): IndicatorResult => {
      const kst: number[] = [];

      for (let i = period; i < data.length; i++) {
        const slice = data.slice(i - period, i);
        const volumeWeightedPrice = slice.reduce((sum, d) => sum + (d.close * d.volume), 0) / 
          slice.reduce((sum, d) => sum + d.volume, 0);

        const priceChange = (volumeWeightedPrice - slice[0].close) / slice[0].close;
        kst.push(priceChange * 100);
      }
      return { kst };
    },
  },
  HMA: {
    name: 'Hull Moving Average',
    description: 'Smoothed moving average with reduced lag.',
    category: 'Trend',
    parameters: { period: 20 },
    calculate: (data: any[], { period }: any): IndicatorResult => {
      const kst: number[] = [];

      for (let i = period; i < data.length; i++) {
        const slice = data.slice(i - period, i);
        const closePrices = slice.map((d: any) => d.close);

        // Calculate weighted moving average
        const weights = Array.from({ length: period }, (_, i) => i + 1);
        const weightedSum = closePrices.reduce((sum, price, idx) => 
          sum + (price * weights[idx]), 0);
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        const hma = weightedSum / totalWeight;

        kst.push(hma);
      }
      return { kst };
    },
  },
};

const AdvancedTradingFeatures: React.FC<AdvancedTradingFeaturesProps> = ({ asset }) => {
  const dispatch = useAppDispatch();
  const [selectedIndicator, setSelectedIndicator] = useState('DONCHIAN');
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const handleIndicatorChange = (indicator: keyof typeof ADVANCED_INDICATORS) => {
    setSelectedIndicator(indicator);
    dispatch(setIndicator({
      indicator,
      params: ADVANCED_INDICATORS[indicator].parameters
    }));
  };

  useEffect(() => {
    if (showChart && asset.priceData) {
      const params = ADVANCED_INDICATORS[selectedIndicator].parameters;
      const result = ADVANCED_INDICATORS[selectedIndicator].calculate(asset.priceData, params);

      const series = [];
      if (result.upper) series.push({ name: 'Upper Band', data: result.upper });
      if (result.lower) series.push({ name: 'Lower Band', data: result.lower });
      if (result.kst) series.push({ name: 'KST', data: result.kst });
      if (result.signal) series.push({ name: 'Signal', data: result.signal });

      setChartData(series);
    }
  }, [selectedIndicator, showChart, asset.priceData]);

  return (
    <Box>
      <Card>
        <CardHeader title="Advanced Trading Features" />
        <CardContent>
          <Stack spacing={2}>
            <Tabs
              value={selectedIndicator}
              onChange={(_, newValue) => handleIndicatorChange(newValue as keyof typeof ADVANCED_INDICATORS)}
            >
              {Object.entries(ADVANCED_INDICATORS).map(([key, config]) => (
                <Tab key={key} label={config.name} value={key} />
              ))}
            </Tabs>
            
            <Card>
              <CardHeader title={ADVANCED_INDICATORS[selectedIndicator].name} />
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="subtitle1">
                    {ADVANCED_INDICATORS[selectedIndicator].description}
                  </Typography>
                  <Chip
                    label={ADVANCED_INDICATORS[selectedIndicator].category}
                    color="primary"
                  />
                  <Button variant="contained" onClick={() => setShowChart(!showChart)}>
                    {showChart ? 'Hide Chart' : 'Show Chart'}
                  </Button>
                  {showChart && (
                    <Chart
                      options={{
                        chart: {
                          type: 'line',
                          height: 350,
                        },
                        xaxis: {
                          type: 'datetime',
                        },
                      }}
                      series={chartData}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Risk Management" />
              <CardContent>
                <Stack spacing={2}>
                  <FormGroup>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable Position Sizing"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable Stop Loss"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable Take Profit"
                    />
                  </FormGroup>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdvancedTradingFeatures;