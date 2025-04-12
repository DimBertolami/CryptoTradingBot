from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
from .base_strategy import TradingStrategy

class VolatilityBreakoutStrategy(TradingStrategy):
    """Volatility Breakout Strategy
    
    This strategy identifies breakout opportunities based on:
    - Historical volatility
    - Price range expansion
    - Volume confirmation
    """
    
    def __init__(self, config: Dict):
        super().__init__(config)
        self.lookback_period = config.get('lookback_period', 20)
        self.volatility_multiplier = config.get('volatility_multiplier', 2.0)
        self.volume_threshold = config.get('volume_threshold', 1.5)
        self.min_profit_target = config.get('min_profit_target', 0.02)
        
    def calculate_volatility(self, data: pd.DataFrame) -> float:
        """Calculate historical volatility"""
        returns = np.log(data['close'] / data['close'].shift(1))
        volatility = returns.std() * np.sqrt(252)  # Annualized volatility
        return volatility
        
    def calculate_range(self, data: pd.DataFrame) -> Dict:
        """Calculate price range and breakout levels"""
        high = data['high'].iloc[-self.lookback_period:].max()
        low = data['low'].iloc[-self.lookback_period:].min()
        
        range_size = high - low
        breakout_upper = high + (range_size * self.volatility_multiplier)
        breakout_lower = low - (range_size * self.volatility_multiplier)
        
        return {
            'high': high,
            'low': low,
            'range_size': range_size,
            'breakout_upper': breakout_upper,
            'breakout_lower': breakout_lower
        }
        
    def analyze_market(self, data: pd.DataFrame) -> Dict:
        """Analyze market for breakout opportunities"""
        if len(data) < self.lookback_period:
            return {'signal': 'wait', 'reason': 'Insufficient data'}
            
        # Calculate volatility and range
        volatility = self.calculate_volatility(data)
        price_range = self.calculate_range(data)
        current_price = data['close'].iloc[-1]
        current_volume = data['volume'].iloc[-1]
        avg_volume = data['volume'].iloc[-self.lookback_period:].mean()
        
        # Check for breakout conditions
        is_breakout_upper = current_price > price_range['breakout_upper']
        is_breakout_lower = current_price < price_range['breakout_lower']
        is_volume_spiked = current_volume > (avg_volume * self.volume_threshold)
        
        return {
            'volatility': volatility,
            'current_price': current_price,
            'breakout_upper': price_range['breakout_upper'],
            'breakout_lower': price_range['breakout_lower'],
            'is_breakout_upper': is_breakout_upper,
            'is_breakout_lower': is_breakout_lower,
            'is_volume_spiked': is_volume_spiked,
            'volume_ratio': current_volume / avg_volume
        }
        
    def generate_signals(self, data: pd.DataFrame) -> List[Dict]:
        """Generate breakout signals"""
        analysis = self.analyze_market(data)
        signals = []
        
        # Generate buy signal for upward breakout
        if (analysis['is_breakout_upper'] and 
            analysis['is_volume_spiked'] and 
            analysis['volume_ratio'] > self.volume_threshold):
            
            signals.append({
                'type': 'buy',
                'price': analysis['current_price'],
                'timestamp': data.index[-1],
                'reason': 'Upward breakout with volume confirmation',
                'profit_target': analysis['current_price'] * (1 + self.min_profit_target)
            })
            
        # Generate sell signal for downward breakout
        if (analysis['is_breakout_lower'] and 
            analysis['is_volume_spiked'] and 
            analysis['volume_ratio'] > self.volume_threshold):
            
            signals.append({
                'type': 'sell',
                'price': analysis['current_price'],
                'timestamp': data.index[-1],
                'reason': 'Downward breakout with volume confirmation',
                'profit_target': analysis['current_price'] * (1 - self.min_profit_target)
            })
            
        return signals
        
    def calculate_position_size(self, signal: Dict, account_balance: float) -> float:
        """Calculate position size with volatility adjustment"""
        base_position = super().calculate_position_size(signal, account_balance)
        
        if 'volatility' in signal.get('analysis', {}):
            volatility = signal['analysis']['volatility']
            volatility_adjustment = min(1.5, 1 / (volatility + 0.001))
            return base_position * volatility_adjustment
            
        return base_position
