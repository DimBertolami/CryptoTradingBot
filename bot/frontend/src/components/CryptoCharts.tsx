import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChartData } from '../types/ChartData';
import { Eye } from 'lucide-react';
import TechnicalAnalysisChart from './TechnicalAnalysisChart';

interface CryptoChartsProps {
  refreshInterval?: number; // in milliseconds
  selectedSymbol?: string; // selected crypto symbol
  selectedTimeframe?: string; // selected timeframe (1m, 5m, etc.)
  isLoading?: boolean; // indicates if the chart data is currently being fetched
  onRefresh?: () => void; // callback to refresh chart data from parent component
  cryptoOptions?: { name: string; symbol: string; imageUrl: string }[]; // available crypto options for dropdown
  onSymbolChange?: (symbol: string) => void; // callback when symbol changes
}

interface TimeframeData {
  [timeframe: string]: {
    data: ChartData | null;
    lastUpdated: Date | null;
    nextUpdateDue: Date | null;
  };
}

const CryptoCharts: React.FC<CryptoChartsProps> = ({ 
  refreshInterval = 0, 
  selectedSymbol = 'BTCUSDT',
  selectedTimeframe = '1m',
  isLoading = false,
  onRefresh,
  cryptoOptions = [],
  onSymbolChange
}) => {
  // Main chart data for current selected timeframe
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Use parent loading state if provided
  const chartLoading = isLoading || loading;
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  
  // Cache for prefetched data across all timeframes
  const [timeframeDataCache, setTimeframeDataCache] = useState<TimeframeData>({});
  
  // All supported timeframes
  const allTimeframes = useMemo(() => ['1m', '5m', '10m', '30m', '1h', '1d'], []);
  
  // Track active interval timers
  const intervalTimers = useRef<{[timeframe: string]: NodeJS.Timeout}>({});
  
  // Chart types for carousel
  const chartTypes = ['technical_analysis'];
  const chartTitles = {
    'technical_analysis': `${selectedSymbol} Technical Analysis ${selectedTimeframe}`
  };

  // Helper function to get refresh interval for any timeframe
  const getRefreshIntervalForTimeframe = useCallback((timeframe: string): number => {
    // If a custom refresh interval is provided, use it
    if (refreshInterval > 0) return refreshInterval;
    
    // Otherwise, calculate based on the timeframe
    switch(timeframe.toLowerCase()) {
      case '1m': return 60 * 1000; // 1 minute
      case '5m': return 5 * 60 * 1000; // 5 minutes
      case '10m': return 10 * 60 * 1000; // 10 minutes
      case '30m': return 30 * 60 * 1000; // 30 minutes
      case '1h': return 60 * 60 * 1000; // 1 hour
      case '1d': return 24 * 60 * 60 * 1000; // 1 day
      default: return 5 * 60 * 1000; // Default to 5 minutes
    }
  }, [refreshInterval]);

  // Function to fetch chart data for a specific timeframe
  // We use useCallback with a ref to access the latest timeframeDataCache without creating a dependency cycle
  const timeframeDataCacheRef = useRef(timeframeDataCache);
  
  // Keep the ref up to date
  useEffect(() => {
    timeframeDataCacheRef.current = timeframeDataCache;
  }, [timeframeDataCache]);
  
  const fetchChartDataForTimeframe = useCallback(async (timeframe: string) => {
    try {
      // Check if we already have fresh data for this timeframe using the ref
      const cachedData = timeframeDataCacheRef.current[timeframe];
      const now = new Date();
      
      // Skip if we already have fresh data that doesn't need updating yet
      if (cachedData?.nextUpdateDue && now < cachedData.nextUpdateDue) {
        console.log(`Using cached data for ${timeframe}`);  
        // If this is the selected timeframe and we're using cached data, make sure it's displayed
        if (timeframe === selectedTimeframe && cachedData.data) {
          setChartData(cachedData.data);
          setLastUpdate(cachedData.lastUpdated);
          setError(null);
        }
        return cachedData.data;
      }
      
      if (timeframe === selectedTimeframe) {
        setLoading(true);
      }
      
      // Add timeframe to URL as a query param to simulate different data for different timeframes
      const response = await fetch(`/charts/chart_data.json?timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching chart data: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add missing 3D chart paths to prevent errors
      const enhancedData = {
        ...data,
        chartPaths: {
          ...data.chartPaths,
          price_3d_html: data.chartPaths.price_3d_html || '',
          signals_3d_html: data.chartPaths.signals_3d_html || ''
        }
      };
      
      const nextUpdateTime = new Date(now.getTime() + getRefreshIntervalForTimeframe(timeframe));
      
      // Update cache for this timeframe
      setTimeframeDataCache(prevCache => ({
        ...prevCache,
        [timeframe]: {
          data: enhancedData,
          lastUpdated: now,
          nextUpdateDue: nextUpdateTime
        }
      }));
      
      // If this is the currently selected timeframe, update the main chart data too
      if (timeframe === selectedTimeframe) {
        setChartData(enhancedData);
        setLastUpdate(now);
        setError(null);
      }
      
      return data;
    } catch (err) {
      console.error(`Failed to load chart data for ${timeframe}:`, err);
      if (timeframe === selectedTimeframe) {
        setError('Failed to load cryptocurrency charts');
      }
      return null;
    } finally {
      if (timeframe === selectedTimeframe) {
        setLoading(false);
      }
    }
  }, [selectedTimeframe, getRefreshIntervalForTimeframe]);
  
  // Function to fetch the currently selected timeframe
  const fetchCurrentTimeframeData = useCallback(() => {
    return fetchChartDataForTimeframe(selectedTimeframe);
  }, [fetchChartDataForTimeframe, selectedTimeframe]);
  
  // Function to prefetch all timeframes
  const prefetchAllTimeframes = useCallback(() => {
    // Prefetch data for all timeframes
    allTimeframes.forEach(timeframe => {
      // Start fresh fetch for all timeframes
      // We'll check the cache inside fetchChartDataForTimeframe, so no need to depend on it here
      fetchChartDataForTimeframe(timeframe);
    });
  }, [allTimeframes, fetchChartDataForTimeframe]); // Removed timeframeDataCache to break circular dependency
  
  // This isn't needed anymore since we're using getRefreshIntervalForTimeframe directly

  // Set up refresh intervals for all timeframes - once on component mount
  useEffect(() => {
    // Clear any existing intervals
    Object.values(intervalTimers.current).forEach(timerId => clearInterval(timerId));
    intervalTimers.current = {};
    
    // Initial prefetch of all timeframes
    prefetchAllTimeframes();
    
    // Set up separate intervals for each timeframe
    allTimeframes.forEach(timeframe => {
      const interval = getRefreshIntervalForTimeframe(timeframe);
      intervalTimers.current[timeframe] = setInterval(() => {
        fetchChartDataForTimeframe(timeframe);
      }, interval);
    });
    
    // Cleanup intervals on unmount
    return () => {
      Object.values(intervalTimers.current).forEach(timerId => clearInterval(timerId));
      intervalTimers.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run this effect only once when the component mounts
  
  // When symbol or timeframe changes
  useEffect(() => {
    // Check if we have cached data for the selected timeframe
    const cachedData = timeframeDataCache[selectedTimeframe];
    
    if (cachedData?.data) {
      // Use cached data if available
      setChartData(cachedData.data);
      setLastUpdate(cachedData.lastUpdated);
      setError(null);
    } else {
      // Otherwise fetch new data
      fetchCurrentTimeframeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol, selectedTimeframe]); // Remove the dependencies that cause infinite loops

  if (chartLoading && !chartData) {
    return <div className="loading text-gray-700 dark:text-gray-300">Loading cryptocurrency charts...</div>;
  }

  if (error && !chartData) {
    return <div className="error text-red-600 dark:text-red-300">{error}</div>;
  }

  if (!chartData) {
    return <div className="no-data text-gray-700 dark:text-gray-300">No chart data available</div>;
  }

  const toggleVisibility = () => {
    setIsHidden(!isHidden);
  };

  // If charts are hidden, just show the controls
  if (isHidden) {
    return (
      <div className="crypto-charts hidden-charts">
        <button 
          className="visibility-toggle" 
          onClick={toggleVisibility}
          aria-label="Show charts"
        >
          <Eye size={20} />
          <span className="text-gray-700 dark:text-gray-300">Show Charts</span>
        </button>
      </div>
    );
  }

  return (
    <div className="crypto-charts">
      <div className="charts-header">
        <h2 className="text-gray-900 dark:text-gray-100">Cryptocurrency Analysis</h2>
        <div className="charts-actions">
          {lastUpdate && (
            <p className="update-time text-gray-600 dark:text-gray-300">
              Last updated: {lastUpdate.toLocaleString()}
              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 py-1 px-2 rounded-full">
                Auto-refresh: {selectedTimeframe}
              </span>
            </p>
          )}
        </div>
      </div>
      
      <div className="chart-carousel">
        {/* Chart Display */}
        <div className="carousel-container">
          {chartTypes.map((type, index) => {
            const isActive = index === 0;
            
            // Handle different chart types and their data sources
            let dataType = type;
            let hasHtmlChart = false;
            let htmlSrc = '';
            
            // Map chart types to data structure keys
            if (type === 'indicators_combined') {
              dataType = 'indicators';
              hasHtmlChart = !!chartData?.chartPaths?.indicators_html;
              htmlSrc = chartData?.chartPaths?.indicators_html || '';
            } else if (type === 'price_3d') {
              hasHtmlChart = !!chartData?.chartPaths?.price_3d_html;
              htmlSrc = chartData?.chartPaths?.price_3d_html || '';
            }
            
            // Determine if this is the technical analysis chart
            const isTechnicalAnalysis = type === 'technical_analysis';
            
            // Check if we have a chart path in the data
            const hasChartPath = chartData?.chartPaths?.[dataType as keyof typeof chartData.chartPaths];
            const title = chartTitles[type as keyof typeof chartTitles];
            
            return (
              <div 
                key={type} 
                className={`carousel-slide ${isActive ? 'active' : ''}`}
                style={{ display: isActive ? 'block' : 'none' }}
              >
                {hasHtmlChart ? (
                  // Render the HTML chart in an iframe
                  <div className={`chart-container chart-${type}`}>
                    <h3 className="text-gray-900 dark:text-gray-100">{title}</h3>
                    <iframe
                      src={htmlSrc}
                      title={title}
                      className="chart-iframe"
                      style={{ width: '100%', height: '600px', border: 'none' }}
                      sandbox="allow-same-origin allow-scripts"
                    />
                  </div>
                ) : isTechnicalAnalysis ? (
                  <div className={`chart-container chart-${type}`}>
                    <h3 className="text-gray-900 dark:text-gray-100">{title}</h3>
                    <div className="technical-analysis-wrapper">
                      <TechnicalAnalysisChart 
                        symbol={selectedSymbol}
                        timeframe={selectedTimeframe}
                        cryptoOptions={cryptoOptions}
                        onSymbolChange={onSymbolChange}
                      />
                    </div>
                  </div>
                ) : hasChartPath ? (
                  <div className={`chart-container chart-${type}`}>
                    <h3 className="text-gray-900 dark:text-gray-100">{title}</h3>
                    <img 
                      src={chartData.chartPaths[dataType as keyof typeof chartData.chartPaths] || ''} 
                      alt={title} 
                      className="chart-image"
                    />
                  </div>
                ) : (
                  <div className="no-chart">
                    <p className="text-gray-700 dark:text-gray-300">No {title.toLowerCase()} available</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Navigation Controls */}
      <div className="carousel-controls">
        <div className="carousel-dots">
          {chartTypes.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === 0 ? 'active' : ''}`}
              aria-label={`Go to chart ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      <button 
        className="refresh-button" 
        onClick={onRefresh || fetchCurrentTimeframeData}
        disabled={chartLoading}
      >
        <span className="text-gray-700 dark:text-gray-300">{chartLoading ? 'Refreshing...' : 'Refresh Charts'}</span>
      </button>
      {/* Cache status info */}
      <div className="text-xs text-gray-500 mt-2">
        Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'} | 
        Cached timeframes: {Object.keys(timeframeDataCache).length}/{allTimeframes.length}
        {Object.entries(timeframeDataCache).map(([timeframe, data]) => (
          <span key={timeframe} className={`ml-2 inline-flex items-center ${timeframe === selectedTimeframe ? 'font-semibold' : ''}`}>
            <span className={`w-2 h-2 mr-1 rounded-full ${data.nextUpdateDue && new Date() < data.nextUpdateDue ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            {timeframe}
          </span>
        ))}
      </div>
    </div>
  );
};

export default CryptoCharts;
