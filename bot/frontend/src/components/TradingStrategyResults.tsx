import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine, Scatter, Brush, ComposedChart, Bar, ReferenceArea } from 'recharts';
import { tradeTracker } from '../services/tradeTracker';
import './TradingStrategyResults.css';

// Define types for our trading signals and data
interface TradingSignal {
  symbol: string;
  currentPrice: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: string;
  priceChange24h: number;
}

interface TradeAction {
  time: string;
  symbol: string;
  action: 'buy' | 'sell';
  price: number;
  confidence: number;
  reason?: string;
  profit?: number; // Optional profit field
}

interface PerformanceData {
  tradeHistory: TradeAction[];
  metrics: {
    totalTrades: number;
    winRate: number;
    avgProfit: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}

interface LiveTradingStatus {
  timestamp: string;
  model_id: string;
  signals: TradingSignal[];
  autoRefresh: boolean;
  thoughts?: string[];
  performance?: PerformanceData;
}

interface TradingStrategyResultsProps {
  selectedPeriod: string;
  autoExecuteEnabled: boolean;
  onExecuteTrade?: (trade: TradeAction) => Promise<boolean>;
}

const TradingStrategyResults: React.FC<TradingStrategyResultsProps> = ({ 
  selectedPeriod,
  autoExecuteEnabled = false,
  onExecuteTrade
}) => {
  // Track which signals have been executed
  const [executedSignals, setExecutedSignals] = useState<Set<string>>(new Set());
  const [tradingStatus, setTradingStatus] = useState<LiveTradingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Calculate refresh interval based on selected period
  const getRefreshIntervalFromPeriod = (period: string): number => {
    const value = parseInt(period.replace(/[^0-9]/g, '')) || 5;
    const unit = period.replace(/[0-9]/g, '');
    
    // Convert to milliseconds
    switch(unit.toLowerCase()) {
      case 'm':
        return value * 60 * 1000; // minutes
      case 'h':
        return value * 60 * 60 * 1000; // hours
      case 'd':
        return value * 24 * 60 * 60 * 1000; // days
      case 'w':
        return value * 7 * 24 * 60 * 60 * 1000; // weeks
      default:
        return 5 * 60 * 1000; // default to 5 minutes
    }
  };
  
  const [refreshInterval, setRefreshInterval] = useState<number>(
    getRefreshIntervalFromPeriod(selectedPeriod)
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<number>(refreshInterval / 1000);

  // Zoom state for the interactive chart
  const [zoomState, setZoomState] = useState({
    left: 'dataMin',
    right: 'dataMax',
    refAreaLeft: '',
    refAreaRight: '',
    top: 'dataMax+5%',
    bottom: 0,
    animation: true,
    zoomLevel: 0
  });

  // Mock data for development/testing
  const mockTradingSignals = useMemo<TradingSignal[]>(() => [
    { 
      symbol: 'BTC/USDT', 
      currentPrice: 52768.34, 
      signal: 'BUY', 
      confidence: 0.87, 
      timestamp: new Date().toISOString(),
      priceChange24h: 2.5
    },
    { 
      symbol: 'ETH/USDT', 
      currentPrice: 3164.56, 
      signal: 'HOLD', 
      confidence: 0.65, 
      timestamp: new Date().toISOString(),
      priceChange24h: -0.8
    },
    { 
      symbol: 'SOL/USDT', 
      currentPrice: 148.92, 
      signal: 'SELL', 
      confidence: 0.78, 
      timestamp: new Date().toISOString(),
      priceChange24h: -2.1
    },
    { 
      symbol: 'ADA/USDT', 
      currentPrice: 0.52, 
      signal: 'BUY', 
      confidence: 0.92, 
      timestamp: new Date().toISOString(),
      priceChange24h: 5.2
    }
  ], []);

  // Auto-execute trades when auto-execution is enabled
  const autoExecuteTrades = useCallback(async (signals: TradingSignal[]) => {
    if (!autoExecuteEnabled || !onExecuteTrade) return;
    
    console.log('Auto-executing trades for signals with high confidence...');
    
    // Filter signals that haven't been executed yet and have high confidence
    const pendingSignals = signals.filter(signal => {
      const signalId = `${signal.symbol}-${signal.timestamp}`;
      return (
        !executedSignals.has(signalId) && 
        signal.signal !== 'HOLD' && 
        signal.confidence > 0.75 // Only auto-execute high confidence signals
      );
    });
    
    if (pendingSignals.length === 0) {
      console.log('No pending signals to auto-execute');
      return;
    }
    
    // Execute each pending signal with a fixed amount of $100
    for (const signal of pendingSignals) {
      const signalId = `${signal.symbol}-${signal.timestamp}`;
      console.log(`Auto-executing trade for ${signal.symbol} with confidence ${signal.confidence}`);
      
      // Format the symbol (remove any / character)
      const formattedSymbol = signal.symbol.replace('/', '');
      
      // Create a trade action from the signal with fixed amount of $100
      const tradeAction: TradeAction = {
        symbol: formattedSymbol,
        action: signal.signal === 'SELL' ? 'sell' : 'buy',
        price: signal.currentPrice,
        time: new Date().toISOString(),
        confidence: signal.confidence,
        reason: `Strategy suggestion: ${signal.signal} ${signal.symbol} at ${signal.currentPrice}`
      };
      
      try {
        // Execute the trade
        const success = await onExecuteTrade(tradeAction);
        
        if (success) {
          // Mark this signal as executed
          const newExecutedSignals = new Set(executedSignals);
          newExecutedSignals.add(signalId);
          setExecutedSignals(newExecutedSignals);
          console.log(`Successfully auto-executed ${signal.signal} trade for ${signal.symbol} at ${signal.currentPrice}`);
        } else {
          console.error(`Failed to auto-execute trade for ${signal.symbol}`);
        }
      } catch (error) {
        console.error('Error auto-executing trade:', error);
      }
    }
  }, [autoExecuteEnabled, executedSignals, onExecuteTrade]);

  // Function to fetch the latest trading signals
  const fetchTradingSignals = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch real data first
      const response = await fetch('/trading_data/live_trading_status.json');
      
      if (response.ok) {
        const data = await response.json();
        setTradingStatus(data);
        console.log('Fetched trading signals:', data);
      } else {
        // Fall back to mock data if the fetch fails
        console.log('Using mock trading data');
        setTradingStatus({
          timestamp: new Date().toISOString(),
          model_id: 'transformer_v1',
          signals: mockTradingSignals,
          autoRefresh: true
        });
      }
      
      setLastUpdated(new Date());
      setCountdown(refreshInterval / 1000);
      setError(null);
    } catch (err) {
      console.error('Error fetching trading signals:', err);
      
      // Use mock data as fallback
      setTradingStatus({
        timestamp: new Date().toISOString(),
        model_id: 'transformer_v1',
        signals: mockTradingSignals,
        autoRefresh: true
      });
      
      setError('Could not fetch live data. Using demo data instead.');
    } finally {
      setLoading(false);
    }
  }, [refreshInterval, mockTradingSignals, setTradingStatus, setLastUpdated, setCountdown, setError, setLoading]);

  // Update refresh interval when selectedPeriod changes
  useEffect(() => {
    const newInterval = getRefreshIntervalFromPeriod(selectedPeriod);
    setRefreshInterval(newInterval);
    setCountdown(newInterval / 1000);
  }, [selectedPeriod]);

  // Setup auto-refresh
  useEffect(() => {
    // Initial data fetch
    fetchTradingSignals();
    
    // Set up refresh interval
    const intervalId = setInterval(fetchTradingSignals, refreshInterval);
    
    // Set up countdown timer
    const countdownId = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return refreshInterval / 1000;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(countdownId);
    };
  }, [refreshInterval, fetchTradingSignals]);

  // Function to toggle auto-refresh
  const toggleRefresh = () => {
    if (refreshInterval) {
      setRefreshInterval(0); // Turn off auto-refresh
    } else {
      setRefreshInterval(5 * 60 * 1000); // Turn on auto-refresh (5 min)
      fetchTradingSignals(); // Fetch immediately
    }
  };

  // Function to manually refresh data
  const handleManualRefresh = () => {
    fetchTradingSignals();
  };
  
  // When autoExecuteEnabled changes, check if we need to auto-execute trades
  useEffect(() => {
    if (autoExecuteEnabled && tradingStatus?.signals && tradingStatus.signals.length > 0) {
      autoExecuteTrades(tradingStatus.signals);
    }
  }, [autoExecuteEnabled, autoExecuteTrades, tradingStatus]);

  const handleExecuteTrade = async (trade: TradeAction) => {
    if (!onExecuteTrade) {
      console.error('onExecuteTrade callback is not provided');
      return false;
    }

    try {
      setLoading(true);

      // Log the trade
      const tradeResult = await tradeTracker.logTrade({
        type: trade.action,
        symbol: trade.symbol,
        amount: 0, // Amount will be determined by the trading bot
        price: trade.price,
        total: 0,
        note: `Strategy suggestion: ${trade.reason || trade.action} ${trade.symbol} at ${trade.price}`
      });

      if (!tradeResult.success) {
        throw new Error(tradeResult.error || 'Failed to log trade');
      }

      // Execute the trade
      const success = await onExecuteTrade(trade);

      // Update trade status
      await tradeTracker.updateTradeStatus(
        tradeResult.data!.id,
        success ? 'completed' : 'failed'
      );

      return success;
    } catch (error) {
      console.error('Error executing trade:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Move the performance data calculation to the top
  const generatePerformanceData = useCallback(() => {
    const performance: PerformanceData = {
      tradeHistory: [],
      metrics: {
        totalTrades: 0,
        winRate: 0,
        avgProfit: 0,
        maxDrawdown: 0,
        sharpeRatio: 0
      }
    };

    // Generate historical data
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const currentDate = new Date(startDate);
    let totalTrades = 0;
    let successfulTrades = 0;
    let totalProfit = 0;

    while (currentDate <= endDate) {
      const timeStr = currentDate.toISOString();
      const symbol = 'BTC/USD';
      
      if (Math.random() > 0.8) { // Generate a trade signal 20% of the time
        const basePrice = 20000 + Math.random() * 20000; // Random price between 20k and 40k
        const action = Math.random() > 0.5 ? 'buy' : 'sell';
        const confidence = 0.5 + (Math.random() * 0.4);
        const profit = Math.random() * 1000 - 500; // Random profit between -500 and 500
        
        totalTrades++;
        if (Math.random() > 0.5) {
          successfulTrades++;
          totalProfit += profit;
        }

        performance.tradeHistory.push({
          time: timeStr,
          symbol,
          action,
          price: basePrice,
          confidence,
          profit,
          reason: `Strategy suggestion: ${action} ${symbol} at ${basePrice}`
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate metrics
    performance.metrics = {
      totalTrades,
      winRate: totalTrades > 0 ? successfulTrades / totalTrades : 0,
      avgProfit: totalTrades > 0 ? totalProfit / totalTrades : 0,
      maxDrawdown: Math.random() * 50, // Random drawdown between 0-50%
      sharpeRatio: Math.random() * 2 + 0.5 // Random sharpe ratio between 0.5-2.5
    };

    return performance;
  }, []);

  // Update the performance data calculation
  const performanceData = useMemo(() => {
    if (!tradingStatus?.performance) {
      return generatePerformanceData();
    }

    const perf = tradingStatus.performance;
    return {
      tradeHistory: perf.tradeHistory || [],
      metrics: perf.metrics || {
        totalTrades: 0,
        winRate: 0,
        avgProfit: 0,
        maxDrawdown: 0,
        sharpeRatio: 0
      }
    };
  }, [tradingStatus, generatePerformanceData]);

  // Helper functions
  const formatPrice = (price: number): string => {
    if (price < 0.1) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 10) return price.toFixed(3);
    if (price < 1000) return price.toFixed(2);
    return price.toFixed(0);
  };

  const formatPriceChange = (change: number): string => {
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(2)}%`;
  };

  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const getSignalColor = (signal: 'BUY' | 'SELL' | 'HOLD'): string => {
    switch (signal) {
      case 'BUY':
        return 'text-green-500';
      case 'SELL':
        return 'text-red-500';
      case 'HOLD':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getSignalBgColor = (signal: 'BUY' | 'SELL' | 'HOLD', confidence: number): string => {
    const isHighConfidence = confidence >= 0.75;
    
    switch (signal) {
      case 'BUY':
        return isHighConfidence 
          ? 'bg-green-200 dark:bg-green-800 shadow-lg shadow-green-500/30' 
          : 'bg-green-100 dark:bg-green-900';
      case 'SELL':
        return isHighConfidence 
          ? 'bg-red-200 dark:bg-red-800 shadow-lg shadow-red-500/30' 
          : 'bg-red-100 dark:bg-red-900';
      case 'HOLD':
        return isHighConfidence 
          ? 'bg-yellow-200 dark:bg-yellow-800 shadow-lg shadow-yellow-500/30' 
          : 'bg-yellow-100 dark:bg-yellow-900';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getHighConfidenceStyles = (confidence: number): string => {
    if (confidence >= 0.85) {
      return 'animate-pulse scale-110 font-extrabold'; // Very high confidence
    } else if (confidence >= 0.75) {
      return 'font-bold scale-105'; // High confidence
    }
    return ''; // Normal confidence
  };

  // Chart data function
  const getChartData = useCallback(() => {
    if (!performanceData?.tradeHistory) return [];
    
    return performanceData.tradeHistory.map(trade => ({
      time: new Date(trade.time).toLocaleTimeString(),
      price: trade.price,
      signal: trade.action === 'buy' ? 'BUY' : 'SELL'
    }));
  }, [performanceData]);

  // Render loading state
  if (loading && !tradingStatus) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="trading-signals-container">
      {/* Header with refresh controls */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Trading Signals
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {tradingStatus?.model_id}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Updated: {lastUpdated.toLocaleTimeString()} 
            {refreshInterval > 0 && (
              <span className="ml-2">
                (Next: {formatCountdown(countdown)} - {selectedPeriod} interval)
              </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={toggleRefresh}
            className={`px-3 py-1 rounded-md text-sm ${
              refreshInterval > 0 
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {refreshInterval > 0 ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </button>
          
          <button 
            onClick={handleManualRefresh}
            className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 
                      dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
          >
            Refresh Now
          </button>
        </div>
      </div>
      
      {/* Error message if any */}
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}
      
      {/* Trading signals cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tradingStatus?.signals.map((signal, index) => (
          <div 
            key={signal.symbol} 
            className={`
              theme-card p-4 rounded-xl transition-all duration-300 
              hover:translate-y-[-2px] hover:shadow-lg
              ${signal.confidence >= 0.85 ? 'very-high-confidence ring-2 ring-offset-2 ' + 
                (signal.signal === 'BUY' ? 'ring-green-500' : 
                 signal.signal === 'SELL' ? 'ring-red-500' : 'ring-yellow-500') : 
                signal.confidence >= 0.75 ? 'high-confidence' : ''}
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{signal.symbol}</h4>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${formatPrice(signal.currentPrice)}
                </p>
              </div>
              <div 
                className={`
                  px-3 py-1 rounded-full text-sm font-bold 
                  transition-all duration-300 transform
                  ${getSignalBgColor(signal.signal, signal.confidence)} 
                  ${getSignalColor(signal.signal)}
                  ${getHighConfidenceStyles(signal.confidence)}
                `}
              >
                {signal.signal}
                {signal.confidence >= 0.75 && 
                  <span className="ml-1 inline-block fire-emoji">🔥</span>
                }
                {signal.confidence >= 0.85 && 
                  <span className="ml-1 inline-block fire-emoji">🔥</span>
                }
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className={`text-sm font-medium ${signal.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPriceChange(signal.priceChange24h)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Confidence: {(signal.confidence * 100).toFixed(0)}%
              </div>
            </div>
            
            {/* Execute trade button */}
            {signal.signal !== 'HOLD' && (
              <div className="mt-2 flex justify-end">
                <button 
                  className={`
                    px-3 py-1 rounded text-sm font-bold 
                    ${executedSignals.has(`${signal.symbol}-${signal.timestamp}`) || autoExecuteEnabled
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                      : signal.signal === 'BUY' 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }
                    transition-all duration-300
                  `}
                  onClick={() => handleExecuteTrade({
                    symbol: signal.symbol,
                    action: signal.signal === 'SELL' ? 'sell' : 'buy',
                    price: signal.currentPrice,
                    time: new Date().toISOString(),
                    confidence: signal.confidence,
                    reason: `Strategy suggestion: ${signal.signal} ${signal.symbol} at ${signal.currentPrice}`
                  })}
                  disabled={executedSignals.has(`${signal.symbol}-${signal.timestamp}`) || autoExecuteEnabled}
                  data-signal-id={`${signal.symbol}-${signal.timestamp}`}
                >
                  {executedSignals.has(`${signal.symbol}-${signal.timestamp}`) 
                    ? 'Executed' 
                    : autoExecuteEnabled 
                      ? 'Auto-Execute Enabled' 
                      : 'Execute Trade'}
                </button>
              </div>
            )}
            
            {/* Mini chart for each asset */}
            <div className="h-24 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={getChartData()[index]?.data || []}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id={`mini-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={signal.priceChange24h >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={signal.priceChange24h >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={signal.priceChange24h >= 0 ? "#10B981" : "#EF4444"} 
                    fill={`url(#mini-gradient-${index})`}
                    strokeWidth={2}
                    isAnimationActive={true}
                    animationDuration={1500}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
      
      {/* Bot Learning & Performance Dashboard */}
      <div className="theme-card p-4 rounded-xl shadow-xl">
        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 flex items-center">
          <span className="mr-2">🤖</span>Bot Learning & Performance Dashboard
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {tradingStatus?.model_id || 'ML Model'}
          </span>
        </h4>
        
        {/* Performance summary metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div 
            className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 p-3 rounded-lg relative group"
            style={{ position: 'relative', zIndex: 10 }}
            onMouseEnter={() => {
              console.log('=== PROFIT TRACKER HOVER DATA ===');
              console.log('Performance Data:', performanceData);
              console.log('Today:', performanceData ? (performanceData.metrics.totalTrades * 0.2).toFixed(2) : '0.00');
              console.log('This Week:', performanceData ? (performanceData.metrics.totalTrades * 0.6).toFixed(2) : '0.00');
              console.log('All Time:', performanceData ? performanceData.metrics.totalTrades.toFixed(2) : '0.00');
              console.log('Return %:', performanceData ? (performanceData.metrics.totalTrades * 100 / 1000).toFixed(2) : '0.00');
              console.log('Timestamp:', tradingStatus?.timestamp);
              console.log('================================');
            }}
          >
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Profit Tracker</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {tradingStatus?.timestamp ? new Date(tradingStatus.timestamp).toLocaleDateString() : 'since start'}
              </div>
            </div>
            
            <div className={`text-lg font-bold ${performanceData && performanceData.metrics.totalTrades >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${performanceData && performanceData.metrics.totalTrades !== undefined ? performanceData.metrics.totalTrades.toFixed(2) : '0.00'}
              {performanceData && performanceData.metrics.totalTrades !== undefined && (
                <span className="text-xs ml-1">
                  {performanceData.metrics.totalTrades >= 0 ? '+' : ''}{(performanceData.metrics.totalTrades * 100 / 1000).toFixed(2)}%
                </span>
              )}
            </div>
            
            {/* Progress indicator */}
            <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
              <div 
                className={`h-full ${performanceData && performanceData.metrics.totalTrades >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{
                  width: `${performanceData ? Math.min(100, Math.max(0, 50 + performanceData.metrics.totalTrades / 10)) : 50}%`,
                  transition: 'width 1s ease-in-out'
                }}
              />
            </div>
            
            {/* Custom tooltip implementation with portal-like behavior */}
            <div 
              id="profitTooltip"
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
              }}
            >
              {/* Solid dark overlay */}
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  zIndex: 10001
                }}
              ></div>
              
              {/* Tooltip content box with solid background */}
              <div 
                style={{
                  position: 'relative',
                  backgroundColor: '#ffffff',
                  color: '#333333',
                  padding: '32px',
                  borderRadius: '16px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  border: '2px solid #c7d2fe',
                  width: '600px',
                  minHeight: '400px',
                  zIndex: 10002,
                  overflow: 'visible'
                }}
                className="dark:bg-gray-800 dark:text-white dark:border-indigo-700"
              >
                <h3 className="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-800 pb-3">Profit Summary</h3>
                <div className="space-y-8 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-medium">Today:</span>
                    <span className={`text-2xl ${performanceData && performanceData.metrics.totalTrades * 0.2 >= 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}`}>
                      ${performanceData ? (performanceData.metrics.totalTrades * 0.2).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-medium">This Week:</span>
                    <span className={`text-2xl ${performanceData && performanceData.metrics.totalTrades * 0.6 >= 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}`}>
                      ${performanceData ? (performanceData.metrics.totalTrades * 0.6).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-medium">All Time:</span>
                    <span className={`text-2xl ${performanceData && performanceData.metrics.totalTrades >= 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}`}>
                      ${performanceData ? performanceData.metrics.totalTrades.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
                <div className="text-base text-center text-gray-500 dark:text-gray-400 italic mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  Trading since {tradingStatus?.timestamp ? new Date(new Date(tradingStatus.timestamp).getTime() - 30*24*60*60*1000).toLocaleDateString() : 'startup'}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 p-3 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">Decision Accuracy</div>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {performanceData ? Math.round(performanceData.metrics.winRate * 100) : 0}%
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-3 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">Learning Progress</div>
            <div className="relative h-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
                style={{ width: `${performanceData ? Math.min(100, Math.round(performanceData.metrics.winRate * 100 + 10)) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="relative h-96"> {/* Taller chart for more details */}
          {/* Zoom controls */}
          {zoomState.zoomLevel > 0 && (
            <div className="absolute top-0 right-0 z-10 flex space-x-2">
              <button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-2 py-1 text-xs font-medium transition-all"
                onClick={() => {
                  setZoomState({
                    ...zoomState,
                    left: 'dataMin',
                    right: 'dataMax',
                    refAreaLeft: '',
                    refAreaRight: '',
                    top: 'dataMax+5%',
                    bottom: 0,
                    zoomLevel: 0,
                    animation: true
                  });
                }}
              >
                <span className="flex items-center"><span className="mr-1">↩</span> Reset Zoom</span>
              </button>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1 text-xs font-medium">
                <span className="text-gray-700 dark:text-gray-300">Zoom Level: {zoomState.zoomLevel}×</span>
              </div>
            </div>
          )}
          
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={performanceData?.tradeHistory || []}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              className="animate-fade-in"
              onMouseDown={(e) => {
                if (!e) return;
                setZoomState({
                  ...zoomState,
                  refAreaLeft: e.activeLabel || '',
                  animation: false
                });
              }}
              onMouseMove={(e) => {
                if (!zoomState.refAreaLeft || !e) return;
                setZoomState({
                  ...zoomState,
                  refAreaRight: e.activeLabel || ''
                });
              }}
              onMouseUp={() => {
                if (!zoomState.refAreaLeft || !zoomState.refAreaRight) {
                  setZoomState({
                    ...zoomState,
                    refAreaLeft: '',
                    refAreaRight: ''
                  });
                  return;
                }
                
                // Time values need to be parsed as dates and compared
                let left = zoomState.refAreaLeft;
                let right = zoomState.refAreaRight;
                
                if (left === right || !right) {
                  setZoomState({
                    ...zoomState,
                    refAreaLeft: '',
                    refAreaRight: ''
                  });
                  return;
                }
                
                // Ensure left is always less than right
                if (new Date(left).getTime() > new Date(right).getTime()) {
                  [left, right] = [right, left];
                }
                
                // Calculate new zoom level
                const newZoomLevel = zoomState.zoomLevel + 1;
                
                setZoomState({
                  ...zoomState,
                  refAreaLeft: '',
                  refAreaRight: '',
                  left,
                  right,
                  zoomLevel: newZoomLevel,
                  animation: true
                });
              }}
            >
              <defs>
                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#888" 
                fontSize={11}
                domain={[zoomState.left, zoomState.right] as [string | number, string | number]}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth()+1}/${date.getDate()}`;
                }}
                tick={{ fill: '#888', fontSize: 10 }}
                axisLine={{ stroke: '#444', strokeWidth: 1 }}
                allowDataOverflow
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                stroke="#888" 
                fontSize={11}
                domain={[0, 1]}
                tick={{ fill: '#888' }}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                width={35}
                allowDataOverflow
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#888"
                fontSize={11}
                domain={[(dataMin: number) => Math.min(0, dataMin * 1.1), (dataMax: number) => dataMax * 1.2]}
                tickFormatter={(value) => `$${value}`}
                width={35}
                allowDataOverflow
              />
              <Tooltip 
                animationDuration={300}
                contentStyle={{ 
                  backgroundColor: 'rgba(23, 25, 35, 0.92)', 
                  borderColor: '#4B5563',
                  borderRadius: '8px',
                  color: 'white',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  padding: '8px 12px',
                  fontSize: '13px',
                }}
                formatter={(value, name) => {
                  if (name === 'accuracy' || name === 'confidence') {
                    return [`${(Number(value) * 100).toFixed(1)}%`, name.charAt(0).toUpperCase() + name.slice(1)];
                  } else if (name === 'profit') {
                    return [`$${Number(value).toFixed(2)}`, 'Cumulative Profit'];
                  } else if (name === 'tradesCount') {
                    return [value, 'Trades Made'];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                }}
              />
              <Legend 
                verticalAlign="top"
                height={30}
                iconSize={10}
                iconType="circle"
                formatter={(value) => {
                  if (value === 'accuracy') return 'Decision Accuracy';
                  if (value === 'profit') return 'Cumulative Profit';
                  if (value === 'confidence') return 'Bot Confidence';
                  if (value === 'tradesCount') return 'Total Trades';
                  return value;
                }}
              />
              <Brush 
                dataKey="time" 
                height={20} 
                stroke="#6366F1"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth()+1}/${date.getDate()}`;
                }}
                startIndex={zoomState.zoomLevel > 0 ? 5 : 0}
                endIndex={zoomState.zoomLevel > 0 ? 15 : 10}
              />
              
              {/* Zoom overlay area */}
              {zoomState.refAreaLeft && zoomState.refAreaRight ? (
                <ReferenceArea
                  yAxisId="left"
                  x1={zoomState.refAreaLeft}
                  x2={zoomState.refAreaRight}
                  strokeOpacity={0.3}
                  fill="#6366F1"
                  fillOpacity={0.3}
                  className="animate-pulse"
                />
              ) : null}
              
              {/* Main accuracy curve */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="accuracy"
                stroke="#6366F1" // Indigo
                fill="url(#colorAccuracy)"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  stroke: 'white',
                  strokeWidth: 1,
                  fill: '#6366F1'
                }}
                animationEasing="ease-out"
                animationDuration={1500}
                isAnimationActive={zoomState.animation}
              />
              
              {/* Profit line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="profit"
                stroke="#10B981" // Green
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 6,
                  stroke: 'white',
                  strokeWidth: 1,
                  fill: '#10B981'
                }}
                animationEasing="ease-out"
                animationDuration={1800}
                animationBegin={300}
                isAnimationActive={zoomState.animation}
              />
              
              {/* Confidence line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="confidence"
                stroke="#F59E0B" // Amber
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                animationEasing="ease-out"
                animationDuration={1800}
                animationBegin={600}
                isAnimationActive={zoomState.animation}
              />
              
              {/* Trades count as bars */}
              <Bar
                yAxisId="left"
                dataKey="tradesCount"
                fill="rgba(147, 197, 253, 0.3)"
                barSize={10}
                animationDuration={1500}
                animationBegin={900}
              />
              
              {/* Reference line for break-even */}
              <ReferenceLine
                yAxisId="right"
                y={0}
                stroke="#6B7280"
                strokeDasharray="3 3"
                label={{
                  value: 'Break-even',
                  position: 'left',
                  fill: '#6B7280',
                  fontSize: 10
                }}
              />
              
              {/* Reference line for 75% accuracy threshold */}
              <ReferenceLine
                yAxisId="left"
                y={0.75}
                stroke="#6366F1"
                strokeDasharray="3 3"
                label={{
                  value: 'Target Accuracy',
                  position: 'left',
                  fill: '#6366F1',
                  fontSize: 10
                }}
              />
              
              {/* Scatter plot for significant trade events */}
              <Scatter
                yAxisId="right"
                name="Significant Trades"
                data={performanceData?.tradeHistory
                  .filter(t => Math.abs(t.profit || 0) > 50)
                  .map(t => ({
                    x: new Date(t.time).getTime(),
                    y: t.profit || 0,
                    profit: t.profit,
                    action: t.action
                  })) || []}
                dataKey="y"
                shape="circle"
                fill="#DC2626"
                fillOpacity={0.6}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TradingStrategyResults;
