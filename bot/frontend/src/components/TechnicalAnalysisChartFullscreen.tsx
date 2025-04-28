import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, ReferenceLine, Label, Brush, Scatter
} from 'recharts';

import { PriceData } from './types';

import CryptoDropdown from './CryptoDropdown';
import IndicatorDropdown from './IndicatorDropdown';

interface TechnicalAnalysisChartFullscreenProps {
  data: PriceData[];
  selectedIndicators: string[];
  setSelectedIndicators: (ids: string[]) => void;
  symbol: string;
  timeframe: string;
  onClose: () => void;
  availableIndicators: { id: string; name: string; color: string; dashed?: boolean }[];
  showMACD: boolean;
  showRSI: boolean;
  cryptoOptions: { symbol: string; name: string; imageUrl?: string }[];
  onSymbolChange: (symbol: string) => void;
  indicatorMenuOpen: boolean;
  onIndicatorMenuToggle: () => void;
}

const PERIODS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

const TechnicalAnalysisChartFullscreen: React.FC<TechnicalAnalysisChartFullscreenProps> = ({
  data,
  selectedIndicators,
  setSelectedIndicators,
  symbol,
  timeframe,
  onClose,
  availableIndicators,
  showMACD,
  showRSI,
  cryptoOptions,
  onSymbolChange,
  indicatorMenuOpen,
  onIndicatorMenuToggle,
}) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>(timeframe || '1m');

  React.useEffect(() => {
    setSelectedPeriod(timeframe);
  }, [timeframe]);

  // Optionally: callback to parent if you want to fetch new data on period change
  // For now, just update the local state and display the new period

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 dark:bg-gray-900 p-6 overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex flex-row items-center gap-4">
          {cryptoOptions && cryptoOptions.length > 0 && (
            <CryptoDropdown
              options={cryptoOptions}
              value={symbol}
              onChange={onSymbolChange}
            />
          )}
          <IndicatorDropdown
            indicators={availableIndicators}
            selected={selectedIndicators}
            onChange={setSelectedIndicators}
            menuOpen={indicatorMenuOpen}
            onMenuToggle={onIndicatorMenuToggle}
          />
        </div>
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-2xl font-semibold text-white">
            {symbol} Technical Analysis <span className="text-purple-400 font-bold">{selectedPeriod}</span> (Fullscreen)
          </h3>
          <button
            onClick={onClose}
            className="theme-button-secondary px-4 py-2 rounded-lg"
          >
            Close Fullscreen
          </button>
        </div>
      </div>
      {/* Time Interval Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PERIODS.map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1 rounded-lg border transition-colors font-semibold text-sm ${
              selectedPeriod === period
                ? 'bg-blue-600 text-white border-blue-700 shadow'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-900'
            }`}
          >
            {period.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="chart-container bg-gray-800 p-4 rounded-lg shadow-inner">
        <div className="chart-description mb-4 text-sm text-gray-300">
          Select indicators from the dropdown to customize your view. Price data is always shown in <span className="text-purple-400 font-bold">dark purple</span>.  
        </div>
        {/* Main price chart with selected indicators */}
        <ResponsiveContainer width="100%" height={600}>
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#ccc' }}
              tickFormatter={(value) => value.split('T')[0]}
            />
            <YAxis 
              yAxisId="price"
              domain={['auto', 'auto']}
              tick={{ fill: '#ccc' }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(23, 23, 23, 0.9)', 
                border: '1px solid #666',
                borderRadius: '4px',
                color: '#fff',
                padding: '8px 12px'
              }}
              labelStyle={{
                color: '#fff'
              }}
              cursor={{
                stroke: '#666',
                strokeWidth: 1
              }}
              content={(props) => {
                const { active, payload, label } = props;
                if (!active || !payload) return null;
                return (
                  <div>
                    <p>{label}</p>
                    {payload.map((item, idx) => {
  if (typeof item === 'object' && item !== null && 'name' in item && 'value' in item && typeof item.name === 'string') {
    return <p key={item.name + idx}>{item.name}: {item.value}</p>;
  }
  return null;
})}
                  </div>
                );
              }}
            />
            <Legend 
              verticalAlign="top"
              height={36}
              formatter={(value: string) => {
                const indicator = availableIndicators.find(ind => ind.id === value);
                return indicator?.name || value;
              }}
            />
            <Brush dataKey="date" height={30} stroke="#8884d8" />
            
            {/* Price line - always show if selected */}
            {selectedIndicators.includes('price') && (
              <Line
                type="monotone"
                dataKey="price"
                stroke="#6b46c1"
                strokeWidth={3}
                dot={false}
                yAxisId="price"
                name="Price"
              />
            )}
            
            {/* Enhanced Trading Signals */}
            {selectedIndicators.includes('tradingSignals') && (
              <>
                {/* Buy Signals */}
                <Scatter
                  name="Buy Signals"
                  dataKey="price"
                  data={data.filter(d => d.buySignal)}
                  fill="#22c55e"
                  shape="square"
                  stroke="#22c55e"
                  strokeWidth={2}
                  yAxisId="price"
                >
                  {data.filter(d => d.buySignal).map((_, index) => (
                    <circle key={index} r={4} />
                  ))}
                </Scatter>

                {/* Sell Signals */}
                <Scatter
                  name="Sell Signals"
                  dataKey="price"
                  data={data.filter(d => d.sellSignal)}
                  fill="#ef4444"
                  shape="square"
                  stroke="#ef4444"
                  strokeWidth={2}
                  yAxisId="price"
                >
                  {data.filter(d => d.sellSignal).map((_, index) => (
                    <circle key={index} r={4} />
                  ))}
                </Scatter>

                {/* Enhanced Signal Labels */}
                {data.map((entry, index) => (
                  entry.buySignal && (
                    <Label
                      key={`buy-label-${index}`}
                      value="BUY"
                      position="insideBottom"
                      x={index}
                      y={entry.price}
                      fill="#22c55e"
                      fontSize={12}
                      fontWeight="bold"
                      offset={10}
                    />
                  )
                ))}
                {data.map((entry, index) => (
                  entry.sellSignal && (
                    <Label
                      key={`sell-label-${index}`}
                      value="SELL"
                      position="insideBottom"
                      x={index}
                      y={entry.price}
                      fill="#ef4444"
                      fontSize={12}
                      fontWeight="bold"
                      offset={10}
                    />
                  )
                ))}
              </>
            )}
            
            {/* SMA lines */}
            {selectedIndicators.includes('sma20') && (
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="#a3d9a5"
                strokeDasharray="4 2"
                strokeWidth={1.5}
                dot={false}
                yAxisId="price"
                name="SMA (20)"
                connectNulls={false}
              />
            )}
            
            {selectedIndicators.includes('sma50') && (
              <Line
                type="monotone"
                dataKey="sma50"
                stroke="#ffe599"
                strokeDasharray="4 2"
                strokeWidth={1.5}
                dot={false}
                yAxisId="price"
                name="SMA (50)"
                connectNulls={false}
              />
            )}
            
            {/* EMA lines */}
            {selectedIndicators.includes('ema12') && (
              <Line
                type="monotone"
                dataKey="ema12"
                stroke="#ffb07f"
                strokeDasharray="4 2"
                strokeWidth={1.5}
                dot={false}
                yAxisId="price"
                name="EMA (12)"
                connectNulls={false}
              />
            )}
            
            {selectedIndicators.includes('ema26') && (
              <Line
                type="monotone"
                dataKey="ema26"
                stroke="#90bfff"
                strokeDasharray="4 2"
                strokeWidth={1.5}
                dot={false}
                yAxisId="price"
                name="EMA (26)"
                connectNulls={false}
              />
            )}
            
            {/* Bollinger Bands */}
            {selectedIndicators.includes('upperBand') && (
              <Line
                type="monotone"
                dataKey="upperBand"
                stroke="#ff9999"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                dot={false}
                yAxisId="price"
                name="Bollinger Upper"
                connectNulls={false}
              />
            )}
            
            {selectedIndicators.includes('middleBand') && (
              <Line
                type="monotone"
                dataKey="middleBand"
                stroke="#99ff99"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                dot={false}
                yAxisId="price"
                name="Bollinger Middle"
                connectNulls={false}
              />
            )}
            
            {selectedIndicators.includes('lowerBand') && (
              <Line
                type="monotone"
                dataKey="lowerBand"
                stroke="#9999ff"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                dot={false}
                yAxisId="price"
                name="Bollinger Lower"
                connectNulls={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* MACD Chart */}
        {showMACD && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">MACD Indicator</h4>
          <ResponsiveContainer width="100%" height={150}>
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#ccc' }}
                tickFormatter={(value) => value.split('T')[0]}
              />
              <YAxis 
                yAxisId="macd"
                domain={['auto', 'auto']}
                tick={{ fill: '#ccc' }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(23, 23, 23, 0.9)', 
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px'
                }}
                labelStyle={{ color: '#aaa', marginBottom: '5px' }}
              />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" yAxisId="macd" />
              
              {selectedIndicators.includes('macd') && (
                <Line
                  type="monotone"
                  dataKey="macd"
                  stroke="#ff00ff"
                  dot={false}
                  yAxisId="macd"
                  name="MACD Line"
                />
              )}
              
              {selectedIndicators.includes('signal') && (
                <Line
                  type="monotone"
                  dataKey="signal"
                  stroke="#00ffff"
                  dot={false}
                  yAxisId="macd"
                  name="Signal Line"
                />
              )}
              
              {/* Simplified histogram rendering to prevent browser crashes */}
              {selectedIndicators.includes('histogram') && (
                <Line
                  type="monotone"
                  dataKey="histogram"
                  stroke="transparent"
                  yAxisId="macd"
                  name="Histogram"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        )}
        
        {/* RSI Chart */}
        {showRSI && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Relative Strength Index (RSI)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#ccc' }}
                tickFormatter={(value) => value.split('T')[0]}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fill: '#ccc' }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(23, 23, 23, 0.9)', 
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px'
                }}
                labelStyle={{ color: '#aaa', marginBottom: '5px' }}
              />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={70} stroke="#ff0000" strokeDasharray="3 3">
                <Label value="Overbought" position="right" fill="#ff0000" />
              </ReferenceLine>
              <ReferenceLine y={30} stroke="#00ff00" strokeDasharray="3 3">
                <Label value="Oversold" position="right" fill="#00ff00" />
              </ReferenceLine>
              
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="#ffff00"
                dot={false}
                name="RSI"
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicalAnalysisChartFullscreen;