"""Module for caching market data."""

from typing import Dict, List, Optional, Any
import pandas as pd
from datetime import datetime, timedelta
from ..ml.utils import logger

class DataCache:
    """Caches market data for efficient access."""
    
    def __init__(self, max_size: int = 10000):
        """Initialize the data cache.
        
        Args:
            max_size: Maximum number of records to cache
        """
        self._cache: Dict[str, pd.DataFrame] = {}
        self._max_size = max_size
        logger.info(f"Data cache initialized with max size: {max_size}")
    
    def add(self, symbol: str, data: pd.DataFrame) -> None:
        """Add data to cache.
        
        Args:
            symbol: Trading pair symbol
            data: DataFrame containing market data
        """
        if len(data) > self._max_size:
            logger.warning(f"Data size exceeds cache limit: {len(data)} > {self._max_size}")
            data = data[-self._max_size:]
            
        self._cache[symbol] = data
        logger.info(f"Cached {len(data)} records for {symbol}")
    
    def get(self, symbol: str) -> Optional[pd.DataFrame]:
        """Get cached data for a symbol.
        
        Args:
            symbol: Trading pair symbol
            
        Returns:
            Cached DataFrame or None if not found
        """
        return self._cache.get(symbol)
    
    def update(self, symbol: str, new_data: pd.DataFrame) -> None:
        """Update cached data with new records.
        
        Args:
            symbol: Trading pair symbol
            new_data: DataFrame containing new records
        """
        if symbol not in self._cache:
            self._cache[symbol] = new_data
            return
            
        current_data = self._cache[symbol]
        combined = pd.concat([current_data, new_data])
        combined = combined.drop_duplicates(subset=['timestamp'])
        
        if len(combined) > self._max_size:
            combined = combined[-self._max_size:]
            
        self._cache[symbol] = combined
        logger.info(f"Updated cache for {symbol} with {len(new_data)} new records")
    
    def clear(self) -> None:
        """Clear all cached data."""
        self._cache.clear()
        logger.info("Cache cleared")
    
    def get_cache_size(self) -> int:
        """Get total number of records in cache.
        
        Returns:
            Total number of records
        """
        return sum(len(df) for df in self._cache.values())
