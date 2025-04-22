"""Module for fetching market data."""

from typing import Dict, List, Optional, Any
import pandas as pd
from datetime import datetime, timedelta
from ccxt import Exchange
from ..ml.utils import logger

class DataFetcher:
    """Fetches market data from exchanges."""
    
    def __init__(self, exchange: Exchange, testnet: bool = False):
        """Initialize the data fetcher.
        
        Args:
            exchange: CCXT exchange instance
            testnet: Whether to use testnet
        """
        self.exchange = exchange
        self.testnet = testnet
        self._setup_exchange()
    
    def _setup_exchange(self) -> None:
        """Configure exchange settings."""
        self.exchange.options['defaultType'] = 'future'
        if self.testnet:
            self.exchange.urls['api'] = self.exchange.urls['test']
        logger.info(f"Exchange configured: {self.exchange.name}")
    
    async def fetch_historical_data(self, symbol: str, timeframe: str, 
                                  start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """Fetch historical OHLCV data.
        
        Args:
            symbol: Trading pair symbol
            timeframe: Timeframe (e.g., '1m', '5m')
            start_time: Start time for data
            end_time: End time for data
            
        Returns:
            DataFrame containing OHLCV data
        """
        try:
            since = int(start_time.timestamp() * 1000)
            limit = (end_time - start_time) // pd.Timedelta(timeframe)
            
            ohlcv = await self.exchange.fetch_ohlcv(
                symbol=symbol,
                timeframe=timeframe,
                since=since,
                limit=limit
            )
            
            df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 
                                             'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            logger.info(f"Fetched {len(df)} records for {symbol}")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching historical data: {str(e)}")
            raise
    
    async def fetch_order_book(self, symbol: str, limit: int = 10) -> Dict[str, List[List[float]]]:
        """Fetch order book data.
        
        Args:
            symbol: Trading pair symbol
            limit: Number of levels to fetch
            
        Returns:
            Dictionary containing order book data
        """
        try:
            order_book = await self.exchange.fetch_order_book(symbol, limit)
            logger.info(f"Fetched order book for {symbol}")
            return order_book
            
        except Exception as e:
            logger.error(f"Error fetching order book: {str(e)}")
            raise
    
    async def fetch_ticker(self, symbol: str) -> Dict[str, Any]:
        """Fetch current market ticker data.
        
        Args:
            symbol: Trading pair symbol
            
        Returns:
            Dictionary containing ticker data
        """
        try:
            ticker = await self.exchange.fetch_ticker(symbol)
            logger.info(f"Fetched ticker for {symbol}")
            return ticker
            
        except Exception as e:
            logger.error(f"Error fetching ticker: {str(e)}")
            raise
