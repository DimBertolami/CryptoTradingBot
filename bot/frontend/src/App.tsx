import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, DollarSign, BarChart3, Brain, Settings, Menu, Sun, Moon, Briefcase } from 'lucide-react';

import axios from 'axios';
import TradingStrategyResults from './components/TradingStrategyResults';
import PaperTradingDashboard from './components/PaperTradingDashboard';
import MLInsights from './components/MLInsights';
import BackendStatusDashboard from './components/BackendStatusDashboard';
import CryptoCharts from './components/CryptoCharts';
import AssetManagement from './components/AssetManagement';

// Interface for coin data from CoinGecko API
interface CoinGeckoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
  image: string;
}

// Interface for our crypto data
interface CryptoData {
  name: string;
  symbol: string;
  icon: React.ReactNode;
  amount: string;
  value: string;
  profit: string;
  prediction: string;
  imageUrl: string;
  price: number;
  price_change_24h_percentage: number;
}

interface TradeAction {
  action: string;
  symbol: string;
  price: number;
  reason?: string;
}

const initialCryptoData: CryptoData[] = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" alt="BTC" className="w-5 h-5" />,
    amount: '0',
    value: '$0.00',
    profit: '+0.0%',
    prediction: 'Neutral',
    imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    price: 0,
    price_change_24h_percentage: 0
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="w-5 h-5" />,
    amount: '0',
    value: '$0.00',
    profit: '+0.0%',
    prediction: 'Neutral',
    imageUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    price: 0,
    price_change_24h_percentage: 0
  },
  {
    name: 'Gemini',
    symbol: 'GEM',
    icon: <img src="https://cryptologos.cc/logos/gemini-gem-logo.png" alt="GEM" className="w-5 h-5" />,
    amount: '0',
    value: '$0.00',
    profit: '+0.0%',
    prediction: 'Neutral',
    imageUrl: 'https://cryptologos.cc/logos/gemini-gem-logo.png',
    price: 0,
    price_change_24h_percentage: 0
  }
];

function App() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>(initialCryptoData);
  const [botThought, setBotThought] = useState({
    isVisible: false,
    message: ''
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1h');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAssetsExpanded, setIsAssetsExpanded] = useState(true);
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<{
    technicalAnalysis?: Record<string, unknown>;
    price_html?: string;
    signals_html?: string;
    price_3d_html?: string;
    signals_3d_html?: string;
    lastUpdated?: string;
  }>({});
  const slotRef = useRef<HTMLDivElement>(null);

  // Track last crypto switch time for rate limiting
  const lastSwitchTimeRef = useRef(Date.now());
  // Minimum time between crypto switches in milliseconds (5 seconds)
  const RATE_LIMIT_MS = 5000;

  // Cache for technical analysis data to avoid repeated API failures
  const [technicalAnalysisCache, setTechnicalAnalysisCache] = useState<Record<string, TechnicalAnalysisData>>({});
  
  // Define type for technical analysis data
  interface TechnicalAnalysisData {
    technicalAnalysis: {
      symbol: string;
      timeframe: string;
      last_updated: string;
      indicators: {
        rsi: { value: number; signal: string };
        macd: { value: number; signal: string };
        ema: { value: number; signal: string };
        bbands: { upper: number; middle: number; lower: number; signal: string };
        volume: { value: number; signal: string };
      };
      price: {
        current: number;
        high_24h: number;
        low_24h: number;
        change_24h_percent: number;
      };
      prediction: string;
    };
    price_html: string;
    signals_html: string;
    lastUpdated: string;
  }
  
  // Function to fetch fresh technical analysis data for a symbol
  const fetchTechnicalAnalysisData = async (symbol: string, timeframe: string = '1h') => {
    try {
      // Show loading state
      setIsLoading(true);
      showBotThought(`Fetching technical analysis data for ${symbol}...`);
      
      // Create a cache key
      const cacheKey = `${symbol}-${timeframe}`;
      
      // Check if we have cached data for this symbol/timeframe
      if (technicalAnalysisCache[cacheKey]) {
        console.log(`Using cached data for ${cacheKey}`);
        
        // Use cached data
        setChartData(prevData => ({
          ...prevData,
          technicalAnalysis: technicalAnalysisCache[cacheKey].technicalAnalysis || prevData.technicalAnalysis,
          price_html: technicalAnalysisCache[cacheKey].price_html || prevData.price_html,
          signals_html: technicalAnalysisCache[cacheKey].signals_html || prevData.signals_html,
          lastUpdated: technicalAnalysisCache[cacheKey].lastUpdated || new Date().toISOString()
        }));
        
        // Update chart title
        updateChartTitle(symbol, timeframe);
        showBotThought(`${symbol} technical analysis loaded from cache`);
        setIsLoading(false);
        return;
      }
      
      // Construct API endpoint URL - the backend expects symbol without the USDT suffix for many endpoints
      const cleanSymbol = symbol.replace('USDT', '');
      const apiUrl = `/api/technical-analysis?symbol=${cleanSymbol}&timeframe=${timeframe}`;
      
      // Use a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        // Fetch fresh data with timeout
        const response = await fetch(apiUrl, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // Clear timeout if fetch completes
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        // Parse the response text first to handle invalid JSON safely
        const responseText = await response.text();
        let freshData;
        
        try {
          freshData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          throw new Error('Invalid JSON response from server');
        }
        
        // Create cached data entry
        const cachedData = {
          technicalAnalysis: freshData.technicalAnalysis || generateFallbackData(symbol),
          price_html: freshData.price_html || '',
          signals_html: freshData.signals_html || '',
          lastUpdated: new Date().toISOString()
        };
        
        // Cache the data
        setTechnicalAnalysisCache(prev => ({
          ...prev,
          [cacheKey]: cachedData
        }));
        
        // Update chart data
        setChartData(prevData => ({
          ...prevData,
          ...cachedData
        }));
        
        // Update chart title
        updateChartTitle(symbol, timeframe);
        showBotThought(`${symbol} technical analysis updated with latest data`);
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        // Use fallback data
        const fallbackData = {
          technicalAnalysis: generateFallbackData(symbol),
          price_html: '',
          signals_html: '',
          lastUpdated: new Date().toISOString()
        };
        
        // Cache the fallback data
        setTechnicalAnalysisCache(prev => ({
          ...prev,
          [cacheKey]: fallbackData
        }));
        
        // Update chart data with fallback
        setChartData(prevData => ({
          ...prevData,
          ...fallbackData
        }));
        
        updateChartTitle(symbol, timeframe);
        showBotThought(`Using simulation data for ${symbol} due to connection issues`);
      }
    } catch (error) {
      console.error('Error in technical analysis flow:', error);
      
      // Ensure we're not stuck in loading state
      setIsLoading(false);
    }
  };
  
  // Helper function to update chart title
  const updateChartTitle = (symbol: string, timeframe: string) => {
    const chartTitle = document.querySelector('.crypto-charts-wrapper .text-gray-900.dark\\:text-gray-100');
    if (chartTitle) {
      chartTitle.textContent = `${symbol} Technical Analysis ${timeframe}`;
    }
  };
  
  // Generate fallback data when API fails
  const generateFallbackData = (symbol: string) => {
    // Basic template for technical indicators
    return {
      symbol: symbol,
      timeframe: '1h',
      last_updated: new Date().toISOString(),
      indicators: {
        rsi: { value: 55, signal: 'neutral' },
        macd: { value: 0.2, signal: 'neutral' },
        ema: { value: 50, signal: 'neutral' },
        bbands: { upper: 55, middle: 50, lower: 45, signal: 'neutral' },
        volume: { value: 10000000, signal: 'neutral' }
      },
      price: {
        current: 50000,
        high_24h: 52000,
        low_24h: 49000,
        change_24h_percent: 1.5
      },
      prediction: "neutral"
    };
  };

  // Function to switch to a specific crypto's technical analysis with rate limiting
  const switchToTechnicalAnalysis = (symbol: string) => {
    // Find the crypto in our data
    const cryptoIndex = cryptoData.findIndex(crypto => crypto.symbol === symbol);
    if (cryptoIndex === -1) return;
    
    const now = Date.now();
    const timeSinceLastSwitch = now - lastSwitchTimeRef.current;
    
    // Update the current index to show the selected crypto
    setCurrentIndex(cryptoIndex);
    
    // Switch to dashboard if not already there
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
    
    // Check rate limiting
    if (timeSinceLastSwitch < RATE_LIMIT_MS) {
      showBotThought(`Selected ${symbol}. Technical analysis will update in ${Math.ceil((RATE_LIMIT_MS - timeSinceLastSwitch) / 1000)} seconds due to rate limiting...`);
      return;
    }
    
    // Update timestamp for rate limiting
    lastSwitchTimeRef.current = now;
    
    // Fetch fresh data for the selected crypto
    fetchTechnicalAnalysisData(symbol);
  };

  // Function to update the trading configuration file
  const updateTradingConfig = async (period: string) => {
    try {
      const response = await fetch('/api/update-trading-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period }),
      });

      if (!response.ok) {
        throw new Error('Failed to update trading config');
      }

      const result = await response.json();
      console.log('Trading config updated:', result);
    } catch (error) {
      console.error('Error updating trading config:', error);
    }
  };

  // Fetch real cryptocurrency data
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
            sparkline: false,
          },
        });

        const formattedData = response.data.map((coin: CoinGeckoData) => ({
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          icon: <img src={coin.image} alt={coin.symbol} className="w-5 h-5" />,
          amount: '0',
          value: `$0.00`,
          profit: '+0.0%',
          prediction: 'Neutral',
          imageUrl: coin.image,
          price: coin.current_price,
          price_change_24h_percentage: coin.price_change_percentage_24h,
        }));

        setCryptoData(formattedData);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
      }
    };

    fetchCryptoData();
  }, []);

  const showBotThought = (message: string) => {
    setBotThought({
      isVisible: true,
      message,
    });
    setTimeout(() => {
      setBotThought(prev => ({
        ...prev,
        isVisible: false,
      }));
    }, 5000);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setOffsetY(e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isSpinning) return;
    setOffsetY(prev => prev + e.deltaY);
  };

  const spinSlot = () => {
    // Store the initial index before spinning
    const initialIndex = currentIndex;
    
    // Start spinning
    setIsSpinning(true);
    
    // Create a more chaotic spinning effect (sometimes going forward, sometimes backward)
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        // Randomly decide whether to move forward or backward
        const direction = Math.random() > 0.3 ? 1 : -1;
        // Calculate new index with wrapping
        const newIndex = (prev + direction + cryptoData.length) % cryptoData.length;
        return newIndex;
      });
    }, 100);

    // After 3 seconds, stop at a random position
    setTimeout(() => {
      clearInterval(interval);
      
      // Select a random cryptocurrency as the final result
      // Make sure it's different from the starting position for better UX
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * cryptoData.length);
      } while(randomIndex === initialIndex && cryptoData.length > 1);
      
      setCurrentIndex(randomIndex);
      setIsSpinning(false);
    }, 3000);
  };

  const stopSpinning = () => {
    // When manually stopping, also pick a random cryptocurrency
    const randomIndex = Math.floor(Math.random() * cryptoData.length);
    setCurrentIndex(randomIndex);
    setIsSpinning(false);
  };

  const handleExecuteTrade = async (trade: TradeAction): Promise<boolean> => {
    try {
      // Execute the trade through paper trading service
      const tradeResult = await fetch('/trading/paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'trade',
          side: trade.action.toUpperCase(),
          symbol: trade.symbol,
          price: trade.price,
        })
      });

      if (!tradeResult.ok) {
        throw new Error(`Server responded with ${tradeResult.status}: ${tradeResult.statusText}`);
      }

      const result = await tradeResult.json();
      
      if (result.success) {
        // Dispatch a custom event to notify the PaperTradingDashboard to refresh
        const event = new CustomEvent('paper-trading-update');
        window.dispatchEvent(event);

        showBotThought(`Executed trade: ${trade.action} ${trade.symbol} at ${trade.price}`);
        return true;
      } else {
        throw new Error(result.message || 'Failed to execute trade');
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      showBotThought(`Failed to execute trade: ${error}`);
      return false;
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-48 md:w-52 lg:w-56 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dimbot</h1>
        </div>
        <nav className="p-4 space-y-1">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex w-full items-center justify-between px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <div className={`w-10 h-5 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'} relative transition-colors duration-300`}>
              <div className={`absolute top-0.5 left-0.5 bg-white rounded-full w-4 h-4 transform transition-transform duration-300 ${isDarkMode ? 'translate-x-5' : ''}`}></div>
            </div>
          </button>
          <div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-blue-500 text-white' : ''
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
              activeTab === 'assets' ? 'bg-blue-500 text-white' : ''
            }`}
          >
            <Briefcase className="h-5 w-5" />
            <span>My Assets</span>
          </button>
          <button
            onClick={() => setActiveTab('trading')}
            className={`flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
              activeTab === 'trading' ? 'bg-blue-500 text-white' : ''
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span>Trading Strategy</span>
          </button>
          <button
            onClick={() => setActiveTab('paper')}
            className={`flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
              activeTab === 'paper' ? 'bg-blue-500 text-white' : ''
            }`}
          >
            <DollarSign className="h-5 w-5" />
            <span>Paper Trading</span>
          </button>
          <button
            onClick={() => setActiveTab('ml-insights')}
            className={`flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
              activeTab === 'ml-insights' ? 'bg-blue-500 text-white' : ''
            }`}
          >
            <Brain className="h-5 w-5" />
            <span>Internals</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-blue-500 text-white' : ''
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-48 md:ml-52 lg:ml-56 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'assets' && 'My Assets'}
            {activeTab === 'trading' && 'Trading Strategy'}
            {activeTab === 'paper' && 'Paper Trading'}
            {activeTab === 'ml-insights' && 'Internals'}
            {activeTab === 'settings' && 'Settings'}
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'assets' && (
          <AssetManagement 
            portfolioAssets={cryptoData}
            onAddAsset={(asset) => {
              // Handle adding new asset to the portfolio
              setCryptoData(prevData => {
                // Check if the asset already exists in the portfolio
                const existingIndex = prevData.findIndex(crypto => crypto.symbol === asset.symbol);
                if (existingIndex > -1) {
                  // Update existing asset
                  const newData = [...prevData];
                  newData[existingIndex] = asset;
                  return newData;
                } else {
                  // Add new asset
                  return [...prevData, asset];
                }
              });
              
              // Log addition to console for tracking
              console.log('Portfolio updated:', asset.symbol, 'added/updated');
              console.log('Current portfolio:', cryptoData.length + (cryptoData.findIndex(c => c.symbol === asset.symbol) === -1 ? 1 : 0), 'assets');
            }}
            isDarkMode={isDarkMode}
            onDarkModeChange={setIsDarkMode}
            onSelectCrypto={switchToTechnicalAnalysis}
          />
        )}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Crypto Roller */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="slot-machine-container">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Crypto Roller</h3>
                  <div className="space-x-2">
                    {isSpinning && (
                      <button 
                        onClick={stopSpinning}
                        className="theme-button-secondary px-4 py-2 rounded-lg"
                      >
                        Stop
                      </button>
                    )}
                    <button 
                      onClick={spinSlot}
                      disabled={isDragging}
                      className="theme-button px-4 py-2 rounded-lg"
                    >
                      {isSpinning ? 'Spinning...' : 'Auto Spin'}
                    </button>
                  </div>
                </div>
                <div 
                  ref={slotRef}
                  className={`slot-window bg-gray-800 dark:bg-gray-700 rounded-lg p-4 mb-4 cursor-ns-resize
                            ${isDragging ? 'dragging' : ''}`}
                  onMouseDown={handleMouseDown}
                  onWheel={handleWheel}
                  onClick={isSpinning ? stopSpinning : undefined}
                >
                  <div 
                    className={`slot-item ${isSpinning ? 'spinning' : ''}`}
                    style={{
                      transform: isDragging ? `translateY(${offsetY}px)` : 'none'
                    }}
                  >
                    <div className="flex items-center gap-4 p-4 bg-gray-700 dark:bg-gray-600 rounded-lg">
                      <img 
                        src={cryptoData[currentIndex].imageUrl} 
                        alt={cryptoData[currentIndex].name}
                        className="w-12 h-12 object-contain"
                        draggable="false"
                      />
                      <div>
                        <div className="text-xl font-bold text-white">
                          {cryptoData[currentIndex].name}
                        </div>
                        <div className="text-gray-400">
                          {cryptoData[currentIndex].symbol}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="crypto-details bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Amount</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {cryptoData[currentIndex].amount} {cryptoData[currentIndex].symbol}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Current Price</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {cryptoData[currentIndex].value}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">24h Change</div>
                      <div className={`text-lg font-bold ${
                        cryptoData[currentIndex].profit.startsWith('+') 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {cryptoData[currentIndex].profit}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Market Sentiment</div>
                      <div className={`text-lg font-bold ${
                        cryptoData[currentIndex].prediction.includes('Bull') 
                          ? 'text-green-600 dark:text-green-400' 
                          : cryptoData[currentIndex].prediction.includes('Bear')
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {cryptoData[currentIndex].prediction}
                      </div>
                    </div>
                    <div className="col-span-2 pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Portfolio Value</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        ${((parseFloat(cryptoData[currentIndex].amount.replace(/,/g, '')) * 
                           cryptoData[currentIndex].price) || 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="theme-card rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">24h Change</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">$1,248.90</div>
                  <div className="text-xl font-semibold text-green-500">+1.2%</div>
                </div>
              </div>
              <div className="theme-card rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Profit</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">All Time</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">$12,483.45</div>
                  <div className="text-xl font-semibold text-green-500">+24.8%</div>
                </div>
              </div>
              <div className="theme-card rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Holdings</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Value</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">$45,678.90</div>
                  <div className="text-xl font-semibold text-gray-500">12 Assets</div>
                </div>
              </div>
            </div>

            {/* Crypto Charts */}
            <div className="theme-card rounded-xl p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Crypto Analysis
                  </h2>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 theme-scroll">
                  {['1m','5m','10m','30m','1h','1D','1W','1M','1Y'].map((period) => (
                    <button 
                      key={period}
                      onClick={() => {
                        setSelectedPeriod(period);
                        updateTradingConfig(period);
                      }}
                      className={`
                        px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap
                        ${period === selectedPeriod ? 'theme-button' : 'theme-button-secondary'}
                      `}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Integrated CryptoCharts Component */}
              <div className="crypto-charts-wrapper">
                <BackendStatusDashboard />
                <div className="mb-4 text-sm">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Cryptocurrency Analysis</div>
                  <div className="text-gray-600 dark:text-gray-300">
                    Last updated: {chartData.lastUpdated ? new Date(chartData.lastUpdated).toLocaleString() : new Date().toLocaleString()}
                  </div>
                  <div className="mt-2 text-gray-900 dark:text-gray-100">
                    {cryptoData[currentIndex].symbol} Technical Analysis {selectedPeriod}
                  </div>
                  {isLoading && <div className="text-blue-500 dark:text-blue-400 text-sm">Refreshing chart data...</div>}
                </div>
                <CryptoCharts 
                  refreshInterval={300000} 
                  selectedSymbol={cryptoData[currentIndex].symbol}
                  selectedTimeframe={selectedPeriod}
                  isLoading={isLoading}
                  onRefresh={() => fetchTechnicalAnalysisData(cryptoData[currentIndex].symbol, selectedPeriod)}
                  cryptoOptions={cryptoData.map(crypto => ({
                    name: crypto.name,
                    symbol: crypto.symbol,
                    imageUrl: crypto.imageUrl
                  }))}
                  onSymbolChange={(symbol) => {
                    const cryptoIndex = cryptoData.findIndex(crypto => crypto.symbol === symbol);
                    if (cryptoIndex !== -1) {
                      setCurrentIndex(cryptoIndex);
                      fetchTechnicalAnalysisData(symbol, selectedPeriod);
                    }
                  }}
                />
              </div>
            </div>

            {/* Bot Performance Metrics moved to Trading Strategy section */}

            {/* Assets Table */}
            <div className="theme-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Assets
                </h2>
                <button 
                  onClick={() => setIsAssetsExpanded(!isAssetsExpanded)}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label={isAssetsExpanded ? 'Collapse' : 'Expand'}
                >
                  {isAssetsExpanded ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  )}
                </button>
              </div>
              {isAssetsExpanded && (
                <div className="overflow-x-auto theme-scroll">
                  <table className="w-full theme-table">
                    <thead>
                      <tr>
                        <th className="text-left p-4 rounded-tl-lg text-gray-600 dark:text-gray-300">Asset</th>
                        <th className="text-left p-4 text-gray-600 dark:text-gray-300">Price</th>
                        <th className="text-left p-4 text-gray-600 dark:text-gray-300">Holdings</th>
                        <th className="text-left p-4 text-gray-600 dark:text-gray-300">Value</th>
                        <th className="text-left p-4 rounded-tr-lg text-gray-600 dark:text-gray-300">24h Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cryptoData.map((crypto) => (
                        <tr 
                          key={crypto.symbol}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <td className="p-4 text-gray-900 dark:text-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                                <img 
                                  src={crypto.imageUrl} 
                                  alt={crypto.symbol}
                                  className="w-6 h-6"
                                />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">{crypto.name}</div>
                                <div className="text-gray-500 dark:text-gray-300 text-sm">{crypto.symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-gray-900 dark:text-gray-100">{crypto.value}</td>
                          <td className="p-4 text-gray-900 dark:text-gray-100">{crypto.amount} {crypto.symbol}</td>
                          <td className="p-4 text-gray-900 dark:text-gray-100">{crypto.value}</td>
                          <td className={`p-4 ${
                            crypto.profit.startsWith('+') ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300'
                          }`}>
                            {crypto.profit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'trading' && (
          <TradingStrategyResults 
            selectedPeriod={selectedPeriod}
            autoExecuteEnabled={autoExecuteEnabled}
            onExecuteTrade={handleExecuteTrade}
          />
        )}
        {activeTab === 'paper' && (
          <PaperTradingDashboard 
            autoExecuteEnabled={autoExecuteEnabled}
            onAutoExecuteChange={setAutoExecuteEnabled}
          />
        )}
        {activeTab === 'ml-insights' && (
          <MLInsights />
        )}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Settings content */}
          </div>
        )}
      </main>

      {/* Bot Thought Overlay */}
      {botThought.isVisible && (
        <div className="fixed bottom-4 right-4 p-4 bg-blue-500 text-white rounded-lg shadow-lg z-50">
          {botThought.message}
        </div>
      )}
    </div>
  );
}

export default App;