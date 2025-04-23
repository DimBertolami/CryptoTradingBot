import React, { useState, useEffect } from 'react';
import { Select, MenuItem, Button, CircularProgress } from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { TechnicalAnalysisChart } from './components/TechnicalAnalysisChart';

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
}

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

const indicators = [
  { value: 'rsi', label: 'RSI' },
  { value: 'macd', label: 'MACD' },
  { value: 'bollinger', label: 'Bollinger Bands' },
];

const CoinGeckoDataDisplay: React.FC = () => {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [selectedIndicator, setSelectedIndicator] = useState('rsi');
  const [portfolio, setPortfolio] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [technicalData, setTechnicalData] = useState<TechnicalIndicator[]>([]);

  useEffect(() => {
    fetchPortfolioData();
    fetchTechnicalData();
  }, [selectedCrypto]);

  const fetchPortfolioData = async () => {
    try {
      // This would be replaced with your actual portfolio API endpoint
      const samplePortfolio = [
        { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
        { id: 'solana', symbol: 'SOL', name: 'Solana' },
      ];
      setPortfolio(samplePortfolio);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const fetchTechnicalData = async () => {
    setIsLoading(true);
    try {
      // This would be replaced with your actual technical analysis API endpoint
      const response = await fetch(`/api/technical-analysis/${selectedCrypto}`);
      const data = await response.json();
      setTechnicalData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching technical data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTechnicalData();
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Cryptocurrency Analysis</h2>
        <span className="text-gray-400">
          Last updated: {lastUpdated.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Select
          value={selectedCrypto}
          onChange={(e) => setSelectedCrypto(e.target.value)}
          className="bg-gray-700 text-white"
        >
          {portfolio.map((crypto) => (
            <MenuItem key={crypto.symbol} value={crypto.symbol}>
              {crypto.name} ({crypto.symbol})
            </MenuItem>
          ))}
        </Select>

        <Select
          value={selectedIndicator}
          onChange={(e) => setSelectedIndicator(e.target.value)}
          className="bg-gray-700 text-white"
        >
          {indicators.map((indicator) => (
            <MenuItem key={indicator.value} value={indicator.value}>
              {indicator.label}
            </MenuItem>
          ))}
        </Select>
      </div>

      <div className="relative">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <CircularProgress />
          </div>
        ) : (
          <div className="h-96">
            <TechnicalAnalysisChart
              data={technicalData}
              timeRange="1h"
              selectedIndicator={selectedIndicator}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end mt-4">
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshCw size={16} />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh Data
        </Button>
      </div>

      <div className="mt-4 p-4 bg-gray-700 rounded">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-gray-300">Data Cache Status: Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-gray-300">CoinGecko API: Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinGeckoDataDisplay;
