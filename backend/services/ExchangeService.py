import requests
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import pandas as pd
from .base import BaseService
from ..models import Exchange, ExchangeData, ExchangeAsset, ExchangeMarket

class ExchangeService(BaseService):
    EXCHANGES = {
        'binance': {
            'name': 'Binance',
            'api_base': 'https://api.binance.com/api/v3',
            'supported_assets': ['BTC', 'ETH', 'BNB', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC'],
            'supported_timeframes': ['1m', '5m', '15m', '1h', '4h', '1d'],
            'rate_limit': 1200,  # requests per minute
            'documentation': 'https://binance-docs.github.io/apidocs/spot/en/',
        },
        'bitvavo': {
            'name': 'Bitvavo',
            'api_base': 'https://api.bitvavo.com/v2',
            'supported_assets': ['BTC', 'ETH', 'BNB', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC'],
            'supported_timeframes': ['1m', '5m', '15m', '1h', '4h', '1d'],
            'rate_limit': 200,  # requests per minute
            'documentation': 'https://docs.bitvavo.com/',
        },
        'coinbase': {
            'name': 'Coinbase Pro',
            'api_base': 'https://api.pro.coinbase.com',
            'supported_assets': ['BTC', 'ETH', 'USDT', 'LTC', 'XRP', 'LINK', 'UNI', 'AAVE', 'COMP'],
            'supported_timeframes': ['1m', '5m', '15m', '1h', '6h', '1d'],
            'rate_limit': 3000,  # requests per minute
            'documentation': 'https://docs.pro.coinbase.com/',
        },
        'kraken': {
            'name': 'Kraken',
            'api_base': 'https://api.kraken.com/0',
            'supported_assets': ['BTC', 'ETH', 'USDT', 'XRP', 'LTC', 'ADA', 'DOT', 'LINK'],
            'supported_timeframes': ['1m', '5m', '15m', '1h', '4h', '1d'],
            'rate_limit': 15,  # requests per second
            'documentation': 'https://docs.kraken.com/rest/',
        },
        'gateio': {
            'name': 'Gate.io',
            'api_base': 'https://api.gateio.ws/api/v4',
            'supported_assets': ['BTC', 'ETH', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC', 'UNI'],
            'supported_timeframes': ['1m', '5m', '15m', '1h', '4h', '1d'],
            'rate_limit': 500,  # requests per minute
            'documentation': 'https://www.gate.io/docs/api/',
        },
        'kucoin': {
            'name': 'KuCoin',
            'api_base': 'https://api.kucoin.com/api/v1',
            'supported_assets': ['BTC', 'ETH', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC', 'UNI'],
            'supported_timeframes': ['1m', '5m', '15m', '1h', '4h', '1d'],
            'rate_limit': 100,  # requests per second
            'documentation': 'https://docs.kucoin.com/',
        },
        'huobi': {
            'name': 'Huobi',
            'api_base': 'https://api.huobi.pro',
            'supported_assets': ['BTC', 'ETH', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC', 'UNI'],
            'supported_timeframes': ['1m', '5m', '15m', '1h', '4h', '1d'],
            'rate_limit': 200,  # requests per second
            'documentation': 'https://huobiapi.github.io/docs/spot/v1/en/',
        },
        'okx': {
            'name': 'OKX',
            'api_base': 'https://www.okx.com/api/v5',
            'supported_assets': ['BTC', 'ETH', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC', 'UNI'],
            'supported_timeframes': ['1m', '5m', '15m', '1h', '4h', '1d'],
            'rate_limit': 200,  # requests per second
            'documentation': 'https://www.okx.com/docs-v5/en/',
        },
        'mexc': {
            'name': 'MEXC',
            'api_base': 'https://api.mexc.com/api/v3',
            'supported_assets': ['BTC', 'ETH', 'USDT', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC', 'UNI'],
            'supported_timeframes': ['1m', '5m', '15m', '1h', '4h', '1d'],
            'rate_limit': 100,  # requests per second
            'documentation': 'https://mxcdevelop.github.io/apidocs/spot_v3_en/',
        },
    }

    def __init__(self, db):
        super().__init__(db)
        self.exchanges = self.EXCHANGES
        self.active_exchanges = {}

    def initialize_exchange(self, exchange_name: str, api_key: str = None, api_secret: str = None) -> bool:
        """Initialize an exchange with API credentials if provided"""
        if exchange_name not in self.exchanges:
            return False

        exchange = self.exchanges[exchange_name]
        self.active_exchanges[exchange_name] = {
            'name': exchange['name'],
            'api_key': api_key,
            'api_secret': api_secret,
            'last_request': datetime.now() - timedelta(seconds=60),
            'rate_limit': exchange['rate_limit'],
            'supported_assets': exchange['supported_assets'],
            'supported_timeframes': exchange['supported_timeframes'],
        }
        return True

    def get_available_exchanges(self) -> List[Dict]:
        """Get list of available exchanges with supported assets and timeframes"""
        return [
            {
                'name': exchange['name'],
                'supported_assets': exchange['supported_assets'],
                'supported_timeframes': exchange['supported_timeframes'],
                'documentation': exchange['documentation']
            }
            for exchange in self.exchanges.values()
        ]

    def get_exchange_assets(self, exchange_name: str) -> List[str]:
        """Get list of supported assets for an exchange"""
        if exchange_name not in self.exchanges:
            return []
        return self.exchanges[exchange_name]['supported_assets']

    def get_exchange_timeframes(self, exchange_name: str) -> List[str]:
        """Get list of supported timeframes for an exchange"""
        if exchange_name not in self.exchanges:
            return []
        return self.exchanges[exchange_name]['supported_timeframes']

    def get_historical_data(self, exchange_name: str, symbol: str, timeframe: str, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """Get historical data from an exchange"""
        if exchange_name not in self.active_exchanges:
            raise ValueError(f"Exchange {exchange_name} not initialized")

        exchange = self.active_exchanges[exchange_name]
        if symbol not in exchange['supported_assets']:
            raise ValueError(f"Symbol {symbol} not supported by {exchange_name}")
        if timeframe not in exchange['supported_timeframes']:
            raise ValueError(f"Timeframe {timeframe} not supported by {exchange_name}")

        # Implement exchange-specific data fetching
        if exchange_name == 'binance':
            return self._get_binance_data(symbol, timeframe, start_time, end_time)
        elif exchange_name == 'bitvavo':
            return self._get_bitvavo_data(symbol, timeframe, start_time, end_time)
        # Add other exchanges...

    def _get_binance_data(self, symbol: str, timeframe: str, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """Get historical data from Binance"""
        url = f"{self.exchanges['binance']['api_base']}/klines"
        params = {
            'symbol': f"{symbol}USDT",
            'interval': timeframe,
            'startTime': int(start_time.timestamp() * 1000),
            'endTime': int(end_time.timestamp() * 1000),
            'limit': 1000
        }

        response = requests.get(url, params=params)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch data from Binance: {response.text}")

        data = response.json()
        df = pd.DataFrame(data, columns=[
            'timestamp', 'open', 'high', 'low', 'close', 'volume',
            'close_time', 'quote_volume', 'trades', 'taker_buy_base',
            'taker_buy_quote', 'ignore'
        ])

        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df['close_time'] = pd.to_datetime(df['close_time'], unit='ms')
        df = df.astype({
            'open': 'float',
            'high': 'float',
            'low': 'float',
            'close': 'float',
            'volume': 'float',
            'quote_volume': 'float',
            'trades': 'int',
            'taker_buy_base': 'float',
            'taker_buy_quote': 'float'
        })

        return df

    def _get_bitvavo_data(self, symbol: str, timeframe: str, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """Get historical data from Bitvavo"""
        url = f"{self.exchanges['bitvavo']['api_base']}/candlestick"
        params = {
            'market': f"{symbol}USDT",
            'interval': timeframe,
            'startTime': int(start_time.timestamp() * 1000),
            'endTime': int(end_time.timestamp() * 1000),
            'limit': 100
        }

        response = requests.get(url, params=params)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch data from Bitvavo: {response.text}")

        data = response.json()
        df = pd.DataFrame(data, columns=[
            'timestamp', 'open', 'high', 'low', 'close', 'volume', 'trades'
        ])

        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df = df.astype({
            'open': 'float',
            'high': 'float',
            'low': 'float',
            'close': 'float',
            'volume': 'float',
            'trades': 'int'
        })

        return df

    def get_market_depth(self, exchange_name: str, symbol: str) -> Dict:
        """Get order book data from an exchange"""
        if exchange_name not in self.active_exchanges:
            raise ValueError(f"Exchange {exchange_name} not initialized")

        if exchange_name == 'binance':
            return self._get_binance_market_depth(symbol)
        elif exchange_name == 'bitvavo':
            return self._get_bitvavo_market_depth(symbol)
        # Add other exchanges...

    def _get_binance_market_depth(self, symbol: str) -> Dict:
        """Get order book data from Binance"""
        url = f"{self.exchanges['binance']['api_base']}/depth"
        params = {
            'symbol': f"{symbol}USDT",
            'limit': 100
        }

        response = requests.get(url, params=params)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch market depth from Binance: {response.text}")

        data = response.json()
        return {
            'bids': [[float(price), float(amount)] for price, amount in data['bids']],
            'asks': [[float(price), float(amount)] for price, amount in data['asks']]
        }

    def _get_bitvavo_market_depth(self, symbol: str) -> Dict:
        """Get order book data from Bitvavo"""
        url = f"{self.exchanges['bitvavo']['api_base']}/orderbook"
        params = {
            'market': f"{symbol}USDT",
            'depth': 100
        }

        response = requests.get(url, params=params)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch market depth from Bitvavo: {response.text}")

        data = response.json()
        return {
            'bids': [[float(price), float(amount)] for price, amount in data['bids']],
            'asks': [[float(price), float(amount)] for price, amount in data['asks']]
        }

    def get_ticker(self, exchange_name: str, symbol: str) -> Dict:
        """Get current ticker data from an exchange"""
        if exchange_name not in self.active_exchanges:
            raise ValueError(f"Exchange {exchange_name} not initialized")

        if exchange_name == 'binance':
            return self._get_binance_ticker(symbol)
        elif exchange_name == 'bitvavo':
            return self._get_bitvavo_ticker(symbol)
        # Add other exchanges...

    def _get_binance_ticker(self, symbol: str) -> Dict:
        """Get ticker data from Binance"""
        url = f"{self.exchanges['binance']['api_base']}/ticker/24hr"
        params = {'symbol': f"{symbol}USDT"}

        response = requests.get(url, params=params)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch ticker data from Binance: {response.text}")

        data = response.json()
        return {
            'symbol': symbol,
            'price_change': float(data['priceChange']),
            'price_change_percent': float(data['priceChangePercent']),
            'weighted_avg_price': float(data['weightedAvgPrice']),
            'last_price': float(data['lastPrice']),
            'volume': float(data['volume']),
            'quote_volume': float(data['quoteVolume']),
            'open_price': float(data['openPrice']),
            'high_price': float(data['highPrice']),
            'low_price': float(data['lowPrice']),
            'timestamp': datetime.now()
        }

    def _get_bitvavo_ticker(self, symbol: str) -> Dict:
        """Get ticker data from Bitvavo"""
        url = f"{self.exchanges['bitvavo']['api_base']}/ticker/24h"
        params = {'market': f"{symbol}USDT"}

        response = requests.get(url, params=params)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch ticker data from Bitvavo: {response.text}")

        data = response.json()
        return {
            'symbol': symbol,
            'price_change': float(data['priceChange']),
            'price_change_percent': float(data['priceChangePercent']),
            'weighted_avg_price': float(data['weightedAvgPrice']),
            'last_price': float(data['lastPrice']),
            'volume': float(data['volume']),
            'quote_volume': float(data['quoteVolume']),
            'open_price': float(data['openPrice']),
            'high_price': float(data['highPrice']),
            'low_price': float(data['lowPrice']),
            'timestamp': datetime.now()
        }

    def get_exchange_info(self, exchange_name: str) -> Dict:
        """Get exchange information"""
        if exchange_name not in self.exchanges:
            return {}

        return {
            'name': self.exchanges[exchange_name]['name'],
            'supported_assets': self.exchanges[exchange_name]['supported_assets'],
            'supported_timeframes': self.exchanges[exchange_name]['supported_timeframes'],
            'rate_limit': self.exchanges[exchange_name]['rate_limit'],
            'documentation': self.exchanges[exchange_name]['documentation']
        }