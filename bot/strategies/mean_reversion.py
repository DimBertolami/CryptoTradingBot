from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
from scipy.stats import zscore
from .base_strategy import TradingStrategy

class MeanReversionStrategy(TradingStrategy):
    """Mean Reversion Strategy
    
    This strategy identifies overbought and oversold conditions based on:
    - Z-Score of price deviations
    - Bollinger Bands
    - RSI (Relative Strength Index)
    """
    
    def __init__(self, config: Dict):
        super().__init__(config)
        self.z_score_threshold = config.get('z_score_threshold', 2.0)
        self.rsi_period = config.get('rsi_period', 14)
        self.rsi_oversold = config.get('rsi_oversold', 30)
        self.rsi_overbought = config.get('rsi_overbought', 70)
        self.bollinger_period = config.get('bollinger_period', 20)
        self.bollinger_std = config.get('bollinger_std', 2)
        
    def calculate_rsi(self, data: pd.DataFrame) -> pd.Series:
        """Calculate RSI indicator"""
        delta = data['price'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=self.rsi_period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=self.rsi_period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
        
    def calculate_bollinger_bands(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """Calculate Bollinger Bands"""
        rolling_mean = data['price'].rolling(window=self.bollinger_period).mean()
        rolling_std = data['price'].rolling(window=self.bollinger_period).std()
        
        upper_band = rolling_mean + (rolling_std * self.bollinger_std)
        lower_band = rolling_mean - (rolling_std * self.bollinger_std)
        
        return {
            'middle_band': rolling_mean,
            'upper_band': upper_band,
            'lower_band': lower_band
        }
        
    def analyze_market(self, data: pd.DataFrame) -> Dict:
        """Analyze market conditions for mean reversion signals"""
        if len(data) < max(self.rsi_period, self.bollinger_period):
            return {'signal': 'wait', 'reason': 'Insufficient data'}
            
        # Calculate all indicators
        rsi = self.calculate_rsi(data)
        bollinger_bands = self.calculate_bollinger_bands(data)
        price = data['price'].iloc[-1]
        
        # Calculate z-score
        price_series = data['price'].iloc[-self.bollinger_period:]
        z_score = zscore(price_series)[-1]
        
        # Get current band positions
        upper_band = bollinger_bands['upper_band'].iloc[-1]
        lower_band = bollinger_bands['lower_band'].iloc[-1]
        
        return {
            'price': price,
            'rsi': rsi.iloc[-1],
            'z_score': z_score,
            'upper_band': upper_band,
            'lower_band': lower_band,
            'is_oversold': rsi.iloc[-1] < self.rsi_oversold,
            'is_overbought': rsi.iloc[-1] > self.rsi_overbought,
            'is_extreme_low': price < lower_band,
            'is_extreme_high': price > upper_band
        }
        
    def generate_signals(self, data: pd.DataFrame) -> List[Dict]:
        """Generate mean reversion signals"""
        analysis = self.analyze_market(data)
        signals = []
        
        # Generate buy signal if:
        # 1. Price is below lower Bollinger Band
        # 2. RSI is in oversold territory
        # 3. Z-score indicates extreme deviation
        if (analysis['is_extreme_low'] or 
            analysis['is_oversold'] or 
            analysis['z_score'] < -self.z_score_threshold):
            
            signals.append({
                'type': 'buy',
                'price': analysis['price'],
                'timestamp': data.index[-1],
                'reason': 'Mean reversion buy signal triggered'
            })
            
        # Generate sell signal if:
        # 1. Price is above upper Bollinger Band
        # 2. RSI is in overbought territory
        # 3. Z-score indicates extreme deviation
        if (analysis['is_extreme_high'] or 
            analysis['is_overbought'] or 
            analysis['z_score'] > self.z_score_threshold):
            
            signals.append({
                'type': 'sell',
                'price': analysis['price'],
                'timestamp': data.index[-1],
                'reason': 'Mean reversion sell signal triggered'
            })
            
        return signals
        
    def calculate_position_size(self, signal: Dict, account_balance: float) -> float:
        """Calculate position size with mean reversion specific rules"""
        base_position = super().calculate_position_size(signal, account_balance)
        
        # Adjust position size based on signal strength
        if 'z_score' in signal.get('analysis', {}):
            z_score = abs(signal['analysis']['z_score'])
            position_multiplier = min(1.5, z_score)  # Max 50% increase
            return base_position * position_multiplier
            
        return base_position
