import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from sklearn.preprocessing import MinMaxScaler
from scipy.signal import find_peaks

class PatternRecognition:
    def __init__(self):
        self.scaler = MinMaxScaler()
        
    def detect_candlestick_patterns(self, df: pd.DataFrame) -> Dict[str, bool]:
        """Detect common candlestick patterns"""
        patterns = {}
        
        # Calculate candlestick properties
        df['body'] = df['close'] - df['open']
        df['upper_shadow'] = df['high'] - df[['open', 'close']].max(axis=1)
        df['lower_shadow'] = df[['open', 'close']].min(axis=1) - df['low']
        
        latest = df.iloc[-1]
        
        # Doji pattern
        patterns['doji'] = abs(latest['body']) <= (latest['high'] - latest['low']) * 0.1
        
        # Hammer pattern
        if latest['body'] > 0:  # Bullish
            patterns['hammer'] = (
                latest['lower_shadow'] > abs(latest['body']) * 2 and
                latest['upper_shadow'] <= abs(latest['body']) * 0.1
            )
        
        # Shooting star pattern
        if latest['body'] < 0:  # Bearish
            patterns['shooting_star'] = (
                latest['upper_shadow'] > abs(latest['body']) * 2 and
                latest['lower_shadow'] <= abs(latest['body']) * 0.1
            )
        
        return patterns
    
    def detect_technical_patterns(self, df: pd.DataFrame) -> Dict[str, bool]:
        """Detect technical analysis patterns"""
        patterns = {}
        
        # Calculate required indicators
        df['SMA_20'] = df['close'].rolling(window=20).mean()
        df['SMA_50'] = df['close'].rolling(window=50).mean()
        
        # Golden Cross / Death Cross
        patterns['golden_cross'] = (
            df['SMA_20'].iloc[-1] > df['SMA_50'].iloc[-1] and
            df['SMA_20'].iloc[-2] <= df['SMA_50'].iloc[-2]
        )
        patterns['death_cross'] = (
            df['SMA_20'].iloc[-1] < df['SMA_50'].iloc[-1] and
            df['SMA_20'].iloc[-2] >= df['SMA_50'].iloc[-2]
        )
        
        # Double Tops and Bottoms
        peaks, _ = find_peaks(df['close'].values, distance=20)
        troughs, _ = find_peaks(-df['close'].values, distance=20)
        
        if len(peaks) >= 2:
            last_two_peaks = df['close'].values[peaks[-2:]]
            patterns['double_top'] = (
                abs(last_two_peaks[0] - last_two_peaks[1]) / last_two_peaks[0] < 0.02
            )
        
        if len(troughs) >= 2:
            last_two_troughs = df['close'].values[troughs[-2:]]
            patterns['double_bottom'] = (
                abs(last_two_troughs[0] - last_two_troughs[1]) / last_two_troughs[0] < 0.02
            )
        
        return patterns
    
    def calculate_pattern_strength(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calculate the strength of detected patterns"""
        candlestick_patterns = self.detect_candlestick_patterns(df)
        technical_patterns = self.detect_technical_patterns(df)
        
        strength_scores = {}
        
        # Volume confirmation
        volume_trend = df['volume'].pct_change().iloc[-1]
        
        # Calculate strength for each pattern
        for pattern, exists in {**candlestick_patterns, **technical_patterns}.items():
            if exists:
                # Base strength
                base_strength = 0.7
                
                # Volume confirmation bonus
                volume_bonus = 0.3 if volume_trend > 0 else -0.1
                
                # Trend alignment bonus
                trend_bonus = 0.2 if df['close'].iloc[-1] > df['close'].iloc[-5] else -0.1
                
                strength_scores[pattern] = min(1.0, base_strength + volume_bonus + trend_bonus)
        
        return strength_scores
    
    def get_trading_signals(self, df: pd.DataFrame) -> Dict[str, float]:
        """Generate trading signals based on pattern recognition"""
        pattern_strength = self.calculate_pattern_strength(df)
        
        # Aggregate bullish and bearish signals
        bullish_signals = sum(
            strength for pattern, strength in pattern_strength.items()
            if pattern in ['hammer', 'golden_cross', 'double_bottom']
        )
        
        bearish_signals = sum(
            strength for pattern, strength in pattern_strength.items()
            if pattern in ['shooting_star', 'death_cross', 'double_top']
        )
        
        # Calculate overall signal
        signal_strength = bullish_signals - bearish_signals
        
        return {
            'signal_strength': signal_strength,
            'bullish_strength': bullish_signals,
            'bearish_strength': bearish_signals,
            'patterns_detected': pattern_strength
        }
