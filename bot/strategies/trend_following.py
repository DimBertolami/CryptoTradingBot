from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
from .base_strategy import TradingStrategy

class TrendFollowingStrategy(TradingStrategy):
    """Trend Following Strategy
    
    This strategy identifies and follows market trends using:
    - ADX (Average Directional Index)
    - MACD (Moving Average Convergence Divergence)
    - ATR (Average True Range) for volatility management
    """
    
    def __init__(self, config: Dict):
        super().__init__(config)
        self.adx_period = config.get('adx_period', 14)
        self.adx_threshold = config.get('adx_threshold', 25)
        self.macd_fast = config.get('macd_fast', 12)
        self.macd_slow = config.get('macd_slow', 26)
        self.macd_signal = config.get('macd_signal', 9)
        self.atr_period = config.get('atr_period', 14)
        self.volatility_multiplier = config.get('volatility_multiplier', 2.0)
        
    def calculate_adx(self, data: pd.DataFrame) -> pd.Series:
        """Calculate ADX indicator"""
        high = data['high']
        low = data['low']
        close = data['close']
        
        # Calculate True Range
        tr = pd.DataFrame({
            'h-l': high - low,
            'h-pc': abs(high - close.shift()),
            'l-pc': abs(low - close.shift())
        }).max(axis=1)
        
        # Calculate Directional Movement
        dm_plus = pd.Series(np.where(
            (high.diff() > low.diff()) & (high.diff() > 0),
            high.diff(), 0
        ))
        
        dm_minus = pd.Series(np.where(
            (low.diff() > high.diff()) & (low.diff() > 0),
            low.diff(), 0
        ))
        
        # Calculate smoothed values
        atr = tr.rolling(window=self.adx_period).mean()
        di_plus = (100 * dm_plus.rolling(window=self.adx_period).sum() / atr).fillna(0)
        di_minus = (100 * dm_minus.rolling(window=self.adx_period).sum() / atr).fillna(0)
        
        # Calculate ADX
        dx = 100 * abs(di_plus - di_minus) / (di_plus + di_minus)
        adx = dx.rolling(window=self.adx_period).mean()
        
        return adx
        
    def calculate_macd(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """Calculate MACD indicators"""
        close = data['close']
        
        ema_fast = close.ewm(span=self.macd_fast, adjust=False).mean()
        ema_slow = close.ewm(span=self.macd_slow, adjust=False).mean()
        macd = ema_fast - ema_slow
        signal = macd.ewm(span=self.macd_signal, adjust=False).mean()
        histogram = macd - signal
        
        return {
            'macd': macd,
            'signal': signal,
            'histogram': histogram
        }
        
    def analyze_market(self, data: pd.DataFrame) -> Dict:
        """Analyze market trends"""
        if len(data) < max(self.adx_period, self.macd_slow):
            return {'signal': 'wait', 'reason': 'Insufficient data'}
            
        # Calculate indicators
        adx = self.calculate_adx(data)
        macd_indicators = self.calculate_macd(data)
        
        # Get current values
        current_adx = adx.iloc[-1]
        current_macd = macd_indicators['macd'].iloc[-1]
        current_signal = macd_indicators['signal'].iloc[-1]
        
        # Determine trend strength and direction
        trend_strength = current_adx > self.adx_threshold
        trend_up = current_macd > current_signal
        trend_down = current_macd < current_signal
        
        return {
            'adx': current_adx,
            'macd': current_macd,
            'signal': current_signal,
            'trend_strength': trend_strength,
            'trend_up': trend_up,
            'trend_down': trend_down,
            'price': data['close'].iloc[-1]
        }
        
    def generate_signals(self, data: pd.DataFrame) -> List[Dict]:
        """Generate trend following signals"""
        analysis = self.analyze_market(data)
        signals = []
        
        # Generate buy signal if:
        # 1. Strong trend (ADX > threshold)
        # 2. MACD crossing above signal line
        if analysis['trend_strength'] and analysis['trend_up']:
            signals.append({
                'type': 'buy',
                'price': analysis['price'],
                'timestamp': data.index[-1],
                'reason': 'Strong uptrend detected'
            })
            
        # Generate sell signal if:
        # 1. Strong trend (ADX > threshold)
        # 2. MACD crossing below signal line
        if analysis['trend_strength'] and analysis['trend_down']:
            signals.append({
                'type': 'sell',
                'price': analysis['price'],
                'timestamp': data.index[-1],
                'reason': 'Strong downtrend detected'
            })
            
        return signals
        
    def calculate_position_size(self, signal: Dict, account_balance: float) -> float:
        """Calculate position size with trend following rules"""
        base_position = super().calculate_position_size(signal, account_balance)
        
        # Adjust position size based on trend strength
        if 'adx' in signal.get('analysis', {}):
            trend_strength = min(1.5, signal['analysis']['adx'] / self.adx_threshold)
            return base_position * trend_strength
            
        return base_position
