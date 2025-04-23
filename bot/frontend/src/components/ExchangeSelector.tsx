import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

export interface Exchange {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
  features: string[];
  isLiveEnabled: boolean;
}

export const SUPPORTED_EXCHANGES: Exchange[] = [
  {
    id: 'paper',
    name: 'Paper Trading',
    description: 'Practice trading with virtual money',
    apiEndpoint: '/trading/paper_trading_status',
    features: ['No real money', 'Practice strategies', 'Instant execution'],
    isLiveEnabled: false
  },
  {
    id: 'coingecko',
    name: 'CoinGecko',
    description: 'Historical data for backtesting',
    apiEndpoint: '/api/coingecko',
    features: ['Historical data', 'Wide range of coins', 'Free API'],
    isLiveEnabled: false
  },
  {
    id: 'bitvavo',
    name: 'Bitvavo',
    description: 'European cryptocurrency exchange',
    apiEndpoint: '/api/bitvavo',
    features: ['EUR pairs', 'Low fees', 'iDEAL deposits'],
    isLiveEnabled: true
  },
  {
    id: 'binance',
    name: 'Binance',
    description: 'Global cryptocurrency exchange',
    apiEndpoint: '/api/binance',
    features: ['High liquidity', 'Many trading pairs', 'WebSocket API'],
    isLiveEnabled: true
  },
  {
    id: 'kraken',
    name: 'Kraken',
    description: 'US-based cryptocurrency exchange',
    apiEndpoint: '/api/kraken',
    features: ['Institutional grade', 'High security', 'Margin trading'],
    isLiveEnabled: true
  },
  {
    id: 'coinbase',
    name: 'Coinbase Pro',
    description: 'US-based cryptocurrency exchange',
    apiEndpoint: '/api/coinbase',
    features: ['Easy to use', 'USD pairs', 'High security'],
    isLiveEnabled: true
  }
];

interface ExchangeSelectorProps {
  selectedExchange: string;
  isLiveTrading: boolean;
  onExchangeChange: (exchange: Exchange) => void;
  onTradingModeChange: (isLive: boolean) => void;
}

const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({
  selectedExchange,
  isLiveTrading,
  onExchangeChange,
  onTradingModeChange
}) => {
  const handleExchangeChange = (event: SelectChangeEvent) => {
    const exchange = SUPPORTED_EXCHANGES.find(ex => ex.id === event.target.value);
    if (exchange) {
      onExchangeChange(exchange);
      // If switching to paper trading, force simulation mode
      if (exchange.id === 'paper') {
        onTradingModeChange(false);
      }
    }
  };

  return (
    <div className="exchange-selector">
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel>Exchange</InputLabel>
        <Select
          value={selectedExchange}
          onChange={handleExchangeChange}
          label="Exchange"
        >
          {SUPPORTED_EXCHANGES
            .filter(exchange => !isLiveTrading || exchange.isLiveEnabled)
            .map(exchange => (
              <MenuItem 
                key={exchange.id} 
                value={exchange.id}
                disabled={isLiveTrading && !exchange.isLiveEnabled}
              >
                {exchange.name}
                <small style={{ marginLeft: '8px', color: '#666' }}>
                  {exchange.description}
                </small>
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default ExchangeSelector;
