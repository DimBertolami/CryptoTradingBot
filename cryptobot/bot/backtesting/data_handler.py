"""
Market data handler for cryptocurrency trading strategies

This module provides functionality for fetching, processing, and managing market data
from cryptocurrency exchanges. It supports both historical data fetching and real-time
data streaming via WebSocket.

Key Features:
- Historical data fetching with configurable timeframes
- Real-time data streaming via WebSocket
- Data caching and normalization
- Multiple exchange support via CCXT
- Efficient data alignment and preprocessing
"""

import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from ccxt import Exchange
from websockets import connect
from ..ml.utils import logger
from .data_fetcher import DataFetcher
from .data_cache import DataCache

class MockExchange(Exchange):
    def __init__(self):
        super().__init__()
        self.testnet = False
        self.urls = {'api': 'http://test', 'test': 'http://test'}
        
    def set_sandbox_mode(self, enabled: bool):
        self.testnet = enabled
        
    async def fetch_ohlcv(self, symbol: str, timeframe: str, since: int, limit: int):
        # Generate mock OHLCV data
        timestamps = pd.date_range(
            start=datetime.fromtimestamp(since/1000),
            periods=limit,
            freq=f'{timeframe}'
        )
        
        data = []
        for ts in timestamps:
            data.append([
                int(ts.timestamp() * 1000),  # timestamp
                10000 + np.random.normal(0, 100),  # open
                10000 + np.random.normal(0, 100),  # high
                10000 + np.random.normal(0, 100),  # low
                10000 + np.random.normal(0, 100),  # close
                np.random.uniform(100, 1000)       # volume
            ])
        return data

class DataHandler:
    """
    Handles both historical and real-time market data.
    
    Args:
        exchange_id: ID of the exchange (e.g., 'binance', 'mock')
        testnet: Whether to use testnet
        
    Attributes:
        exchange_id: ID of the exchange
        testnet: Testnet flag
        exchange: Exchange instance for data fetching
        data_cache: Cache for storing market data
        websocket: WebSocket connection for real-time updates
        subscribers: List of callback functions for real-time updates
        real_time_data: Dictionary for storing real-time data
    """
    
    def __init__(self, exchange_id: str = 'binance', testnet: bool = False):
        self.exchange_id = exchange_id
        self.testnet = testnet
        self.exchange = None
        self.ws = None
        self.data_cache: Dict[str, pd.DataFrame] = {}
        self.real_time_data: Dict[str, List[Dict]] = {}
        self.subscribers = []
    
    async def initialize(self):
        """
        Initialize exchange connection.
        
        Returns:
            bool: Whether initialization was successful
            
        Raises:
            Exception: If initialization fails
        """
        try:
            if self.exchange_id == 'mock':
                self.exchange = MockExchange()
            else:
                self.exchange = getattr(ccxt, self.exchange_id)({
                    'enableRateLimit': True,
                    'options': {'defaultType': 'future'}
                })
            
            if self.testnet:
                self.exchange.set_sandbox_mode(True)
            
            return True
        except Exception as e:
            logger.error(f"Failed to initialize exchange: {str(e)}")
            return False
    
    async def fetch_historical_data(self, symbol: str,
                                  start_time: datetime,
                                  end_time: Optional[datetime] = None,
                                  timeframe: str = '1m') -> pd.DataFrame:
        """
        Fetch historical OHLCV data.
        
        Args:
            symbol: Trading pair symbol
            start_time: Start time for data
            end_time: End time for data (optional)
            timeframe: Timeframe (e.g., '1m', '5m')
            
        Returns:
            DataFrame containing OHLCV data
            
        Raises:
            Exception: If data fetching fails
        """
        try:
            if end_time is None:
                end_time = datetime.now()
            
            # Convert times to timestamps
            start_ts = int(start_time.timestamp() * 1000)
            end_ts = int(end_time.timestamp() * 1000)
            
            # Fetch data in chunks to handle rate limits
            all_candles = []
            current_ts = start_ts
            
            while current_ts < end_ts:
                candles = await self.exchange.fetch_ohlcv(
                    symbol, timeframe, current_ts, limit=1000)
                
                if not candles:
                    break
                
                all_candles.extend(candles)
                current_ts = candles[-1][0] + 1
            
            # Convert to DataFrame
            df = pd.DataFrame(all_candles, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume'
            ])
            
            # Process DataFrame
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            df.set_index('timestamp', inplace=True)
            
            # Cache the data
            self.data_cache[f"{symbol}_{timeframe}"] = df
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to fetch historical data: {str(e)}")
            return pd.DataFrame()
    
    async def start_real_time_feed(self, symbols: List[str]):
        """
        Start real-time data feed using WebSocket.
        
        Args:
            symbols: List of trading pair symbols
            
        Raises:
            Exception: If WebSocket connection fails
        """
        try:
            if self.exchange_id == 'binance':
                ws_url = 'wss://fstream.binance.com/ws'
                if self.testnet:
                    ws_url = 'wss://stream.binancefuture.com/ws'
                
                self.ws = await connect(ws_url)
                
                # Subscribe to ticker and kline streams
                subscribe_msg = {
                    "method": "SUBSCRIBE",
                    "params": [
                        f"{s.lower()}@kline_1m" for s in symbols
                    ] + [
                        f"{s.lower()}@ticker" for s in symbols
                    ],
                    "id": 1
                }
                
                await self.ws.send(json.dumps(subscribe_msg))
                
                # Start processing messages
                asyncio.create_task(self._process_ws_messages())
                
        except Exception as e:
            logger.error(f"Failed to start real-time feed: {str(e)}")
    
    async def _process_ws_messages(self):
        """
        Process incoming WebSocket messages.
        
        Raises:
            Exception: If message processing fails
        """
        try:
            while True:
                message = await self.ws.recv()
                data = json.loads(message)
                
                if 'e' in data:  # Event type exists
                    if data['e'] == 'kline':
                        await self._handle_kline_data(data)
                    elif data['e'] == 'ticker':
                        await self._handle_ticker_data(data)
                    
                    # Notify subscribers
                    for callback in self.subscribers:
                        await callback(data)
                        
        except Exception as e:
            logger.error(f"WebSocket processing error: {str(e)}")
    
    async def _handle_kline_data(self, data: Dict):
        """
        Handle real-time kline data.
        
        Args:
            data: Kline data from WebSocket
        """
        symbol = data['s']
        kline = data['k']
        
        candle = {
            'timestamp': pd.to_datetime(kline['t'], unit='ms'),
            'open': float(kline['o']),
            'high': float(kline['h']),
            'low': float(kline['l']),
            'close': float(kline['c']),
            'volume': float(kline['v'])
        }
        
        if symbol not in self.real_time_data:
            self.real_time_data[symbol] = []
        
        self.real_time_data[symbol].append(candle)
        
        # Keep only last 1000 candles in memory
        if len(self.real_time_data[symbol]) > 1000:
            self.real_time_data[symbol].pop(0)
    
    async def _handle_ticker_data(self, data: Dict):
        """
        Handle real-time ticker data.
        
        Args:
            data: Ticker data from WebSocket
        """
        symbol = data['s']
        
        ticker = {
            'timestamp': pd.to_datetime(data['E'], unit='ms'),
            'price': float(data['c']),
            'volume': float(data['v']),
            'quote_volume': float(data['q']),
            'trades': int(data['n'])
        }
        
        key = f"{symbol}_ticker"
        if key not in self.real_time_data:
            self.real_time_data[key] = []
        
        self.real_time_data[key].append(ticker)
        
        # Keep only last 1000 tickers in memory
        if len(self.real_time_data[key]) > 1000:
            self.real_time_data[key].pop(0)
    
    def get_latest_data(self, symbol: str,
                       n_candles: int = 100) -> pd.DataFrame:
        """
        Get latest data combining historical and real-time.
        
        Args:
            symbol: Trading pair symbol
            n_candles: Number of candles to retrieve
            
        Returns:
            DataFrame containing latest data
        """
        if symbol in self.real_time_data:
            df = pd.DataFrame(self.real_time_data[symbol][-n_candles:])
            df.set_index('timestamp', inplace=True)
            return df
        return pd.DataFrame()
    
    def subscribe(self, callback):
        """
        Subscribe to real-time data updates.
        
        Args:
            callback: Callback function for real-time updates
        """
        self.subscribers.append(callback)
    
    def unsubscribe(self, callback):
        """
        Unsubscribe from real-time data updates.
        
        Args:
            callback: Callback function to remove
        """
        if callback in self.subscribers:
            self.subscribers.remove(callback)
    
    async def close(self):
        """
        Close connections.
        
        Raises:
            Exception: If connection closing fails
        """
        if self.ws:
            await self.ws.close()
