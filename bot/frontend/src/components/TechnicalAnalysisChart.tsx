import React from 'react';
import './TechnicalAnalysisChart.css';
import { XAxis, YAxis, ResponsiveContainer, ComposedChart, Line } from 'recharts';


import { PriceData } from './types';


const requestCache: Record<string, { data: PriceData[], timestamp: number }> = {};

const getCacheDuration = (timeframe: string): number => {
  switch(timeframe.toLowerCase()) {
    case '1m': return 60 * 1000; 
    case '5m': return 5 * 60 * 1000; 
    case '10m': return 10 * 60 * 1000; 
    case '30m': return 30 * 60 * 1000; 
    case '1h': return 60 * 60 * 1000; 
    case '1d': return 24 * 60 * 60 * 1000; 
    default: return 5 * 60 * 1000; 
  }
};



interface TechnicalAnalysisChartProps {
  data?: PriceData[];
  symbol?: string;
  timeframe?: string;
  availableIndicators?: { id: string; name: string }[];
  selectedIndicators?: string[];
}

const TechnicalAnalysisChart: React.FC<TechnicalAnalysisChartProps> = ({
  data = [],
  symbol = 'BTCUSDT',
  timeframe = '1D',
  selectedIndicators = [],
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = React.useState<PriceData[]>(data);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const cacheKey = `${symbol}_${timeframe}`;
        const now = Date.now();
        if (requestCache[cacheKey] && now - requestCache[cacheKey].timestamp < getCacheDuration(timeframe)) {
          setChartData(requestCache[cacheKey].data);
          return;
        }
        const macdVals = {
          macd: data.map((row: PriceData) => row.macd),
          signal: data.map((row: PriceData) => row.signal),
          histogram: data.map((row: PriceData) => row.histogram)
        };
        const rsi = data.map((row: PriceData) => row.rsi);
        const andy = data.map((row: PriceData) => row.andy);
        const mappedData = data.map((row: PriceData, i: number) => ({
          ...row,
          macd: macdVals && Array.isArray(macdVals.macd) && macdVals.macd[i] != null ? macdVals.macd[i] : null,
          signal: macdVals && Array.isArray(macdVals.signal) && macdVals.signal[i] != null ? macdVals.signal[i] : null,
          histogram: macdVals && Array.isArray(macdVals.histogram) && macdVals.histogram[i] != null ? macdVals.histogram[i] : null,
          rsi: Array.isArray(rsi) && rsi[i] != null ? rsi[i] : null,
          andy: Array.isArray(andy) && andy[i] != null ? andy[i] : null,
          buySignal: (() => {
            if (
              macdVals &&
              Array.isArray(macdVals.macd) &&
              Array.isArray(macdVals.signal) &&
              i > 0
            ) {
              const prevMacd = macdVals.macd[i - 1];
              const prevSignal = macdVals.signal[i - 1];
              const currMacd = macdVals.macd[i];
              const currSignal = macdVals.signal[i];
              if (
                prevMacd != null &&
                prevSignal != null &&
                currMacd != null &&
                currSignal != null
              ) {
                return prevMacd < prevSignal && currMacd > currSignal;
              }
            }
            return false;
          })(),
          sellSignal: (() => {
            if (
              macdVals &&
              Array.isArray(macdVals.macd) &&
              Array.isArray(macdVals.signal) &&
              i > 0
            ) {
              const prevMacd = macdVals.macd[i - 1];
              const prevSignal = macdVals.signal[i - 1];
              const currMacd = macdVals.macd[i];
              const currSignal = macdVals.signal[i];
              if (
                prevMacd != null &&
                prevSignal != null &&
                currMacd != null &&
                currSignal != null
              ) {
                return prevMacd > prevSignal && currMacd < currSignal;
              }
            }
            return false;
          })(),
          // Removed unused andyMark
        }));
        requestCache[cacheKey] = {
          data: mappedData,
          timestamp: now
        };
        setChartData(mappedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [data, symbol, timeframe]);

  React.useEffect(() => {
    function handleFullscreenChange() {
      if (document.fullscreenElement !== null) {
        chartRef.current?.classList.add('fullscreen-active');
      } else {
        chartRef.current?.classList.remove('fullscreen-active');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!chartData.length) {
    return (
      <div className="p-4 text-center text-gray-600 dark:text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div>
      <div
        ref={chartRef}
        className="technical-analysis-chart bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-md"
      >
        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {symbol} Technical Analysis
          </h3>
        </div>
        {/* Chart with dynamic indicator lines */}
        {(!chartData || chartData.length === 0) ? (
          <div className="w-full h-96 flex items-center justify-center text-gray-400">
            No data available for this symbol/timeframe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={chartData}
            margin={{ top: 24, right: 24, left: 0, bottom: 24 }}
          >
            <defs>
              <filter id="coloredBlur" height="150%" width="150%" x="-25%" y="-25%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
                <feComponentTransfer>
                  <feFuncR type="linear" slope="0.5" />
                  <feFuncG type="linear" slope="0.5" />
                  <feFuncB type="linear" slope="0.5" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="rainbow-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff0000" />
                <stop offset="16%" stopColor="#ff9900" />
                <stop offset="33%" stopColor="#ffff00" />
                <stop offset="50%" stopColor="#00ff00" />
                <stop offset="66%" stopColor="#00bfff" />
                <stop offset="83%" stopColor="#8a2be2" />
                <stop offset="100%" stopColor="#ff00ff" />
              </linearGradient>
              <linearGradient id="rainbow-buy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff00" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ffff00" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="rainbow-sell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff0000" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff00ff" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="rainbow-marker" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff0000" />
                <stop offset="16%" stopColor="#ff9900" />
                <stop offset="33%" stopColor="#ffff00" />
                <stop offset="50%" stopColor="#00ff00" />
                <stop offset="66%" stopColor="#00bfff" />
                <stop offset="83%" stopColor="#8a2be2" />
                <stop offset="100%" stopColor="#ff00ff" />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              minTickGap={24}
              tickFormatter={date => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            />
            <YAxis
              yAxisId="price"
              domain={['auto', 'auto']}
              allowDataOverflow={true}
              type="number"
              orientation="left"
              tickFormatter={(v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            />
            {/* Render indicator lines based on selection */}
            {/* Example for Price, SMA 20, SMA 50, EMA 12, EMA 26, RSI, MACD, Bollinger Bands, etc. */}
            {selectedIndicators.includes('price') && (
  <Line type="monotone" dataKey="price" stroke="#6b46c1" strokeWidth={2} dot={false} yAxisId="price" />
)}
{selectedIndicators.includes('sma20') && (
  <Line type="monotone" dataKey="sma20" stroke="#e67e22" strokeWidth={2} dot={false} yAxisId="price" />
)}
{selectedIndicators.includes('sma50') && (
  <Line type="monotone" dataKey="sma50" stroke="#f1c40f" strokeWidth={2} dot={false} yAxisId="price" />
)}
{selectedIndicators.includes('ema12') && (
  <Line type="monotone" dataKey="ema12" stroke="#2980b9" strokeWidth={2} dot={false} yAxisId="price" />
)}
{selectedIndicators.includes('ema26') && (
  <Line type="monotone" dataKey="ema26" stroke="#16a085" strokeWidth={2} dot={false} yAxisId="price" />
)}
{selectedIndicators.includes('boll') && (
  <Line type="monotone" dataKey="upperBand" stroke="#00bfff" strokeDasharray="3 3" dot={false} yAxisId="price" />
)}
{selectedIndicators.includes('boll') && (
  <Line type="monotone" dataKey="middleBand" stroke="#00bfff" strokeDasharray="3 3" dot={false} yAxisId="price" />
)}
{selectedIndicators.includes('boll') && (
  <Line type="monotone" dataKey="lowerBand" stroke="#00bfff" strokeDasharray="3 3" dot={false} yAxisId="price" />
)}
            {/* Add more indicator lines as needed based on availableIndicators */}
          </ComposedChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TechnicalAnalysisChart;
