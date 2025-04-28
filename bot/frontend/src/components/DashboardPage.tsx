import React from 'react';
import TechnicalAnalysisChartFullscreen from './TechnicalAnalysisChartFullscreen';
import CoinOverview from './CoinOverview';
import TechnicalAnalysisChart from './TechnicalAnalysisChart';
import CryptoDropdown from './CryptoDropdown';
import IndicatorDropdown from './IndicatorDropdown';
import { PriceData } from './types';

interface DashboardPageProps {
  selectedPeriod: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ selectedPeriod }) => {
  const [chartData, setChartData] = React.useState<PriceData[]>([]);
  React.useEffect(() => {
    // TODO: Replace with real data fetching
    setChartData([
      { date: '2025-04-27', price: 100, volume: 1000, sma20: 98, sma50: 95, ema12: 99, ema26: 97, upperBand: 105, middleBand: 100, lowerBand: 95, macd: 1, signal: 0.8, histogram: 0.2, rsi: 55, andy: 1.2 },
      { date: '2025-04-28', price: 105, volume: 1200, sma20: 101, sma50: 98, ema12: 103, ema26: 99, upperBand: 110, middleBand: 105, lowerBand: 100, macd: 1.5, signal: 1.0, histogram: 0.5, rsi: 60, andy: 1.5 }
    ]);
  }, []);
  const [coins, setCoins] = React.useState<{ name: string; symbol: string; imageUrl: string }[]>([]);
  const [selectedSymbol, setSelectedSymbol] = React.useState<string>('BTCUSDT');
  const [selectedIndicators, setSelectedIndicators] = React.useState<string[]>(['macd', 'rsi', 'boll']);
  const [showFullscreen, setShowFullscreen] = React.useState<boolean>(false);
  const [indicatorMenuOpen, setIndicatorMenuOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false')
      .then(res => res.json())
      .then((data: Array<{ name: string; symbol: string; image: string }>) => {
        setCoins(data.map(item => ({
          name: item.name,
          symbol: item.symbol.toUpperCase(),
          imageUrl: item.image
        })));
      });
  }, []);

  const availableIndicators = [
    { id: 'price', name: 'Price', color: '#6b46c1' },
    { id: 'volume', name: 'Volume', color: '#8884d8' },
    { id: 'sma20', name: 'SMA 20', color: '#e67e22' },
    { id: 'sma50', name: 'SMA 50', color: '#f1c40f' },
    { id: 'ema12', name: 'EMA 12', color: '#2980b9' },
    { id: 'ema26', name: 'EMA 26', color: '#16a085' },
    { id: 'macd', name: 'MACD', color: '#ff00ff' },
    { id: 'macd_signal', name: 'MACD Signal', color: '#00ff99' },
    { id: 'macd_histogram', name: 'MACD Histogram', color: '#ffb6c1' },
    { id: 'rsi', name: 'RSI', color: '#ffff00' },
    { id: 'boll', name: 'Bollinger Bands', color: '#00bfff' },
    { id: 'tradingSignals', name: 'Buy/Sell Signals', color: '#22c55e' },
    { id: 'andy', name: 'Andy-cator', color: '#ff6347' }
  ];

  return (
    <>
      <CoinOverview />
      {/* Shared dropdown selectors, always rendered once */}
      <div className="flex flex-row gap-4 mb-4">
        <CryptoDropdown
          options={coins.length > 0 ? coins : [
            { name: 'Solana', symbol: 'SOL', imageUrl: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
            { name: 'Ripple', symbol: 'XRP', imageUrl: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' }
          ]}
          value={selectedSymbol}
          onChange={setSelectedSymbol}
        />
        <IndicatorDropdown
          indicators={availableIndicators}
          selected={selectedIndicators}
          onChange={setSelectedIndicators}
          menuOpen={indicatorMenuOpen}
          onMenuToggle={() => setIndicatorMenuOpen(open => !open)}
        />
        <button
          className="theme-button-secondary px-4 py-2 rounded-lg"
          onClick={() => setShowFullscreen(true)}
        >
          Fullscreen Chart
        </button>
      </div>
      <TechnicalAnalysisChart
        data={chartData}
        timeframe={selectedPeriod}
        symbol={selectedSymbol}
        selectedIndicators={selectedIndicators}
        availableIndicators={availableIndicators}
      />
      {showFullscreen && (
        <TechnicalAnalysisChartFullscreen
          data={chartData}
          selectedIndicators={selectedIndicators}
          setSelectedIndicators={setSelectedIndicators}
          symbol={selectedSymbol}
          timeframe={selectedPeriod}
          onClose={() => setShowFullscreen(false)}
          availableIndicators={availableIndicators}
          showMACD={selectedIndicators.includes('macd')}
          showRSI={selectedIndicators.includes('rsi')}
          cryptoOptions={coins.length > 0 ? coins : [
            { name: 'Solana', symbol: 'SOL', imageUrl: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
            { name: 'Ripple', symbol: 'XRP', imageUrl: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' }
          ]}
          onSymbolChange={setSelectedSymbol}
          indicatorMenuOpen={indicatorMenuOpen}
          onIndicatorMenuToggle={() => setIndicatorMenuOpen(open => !open)}
        />
      )}
    </>
  );
};

export default DashboardPage;
