from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from scipy.stats import zscore
from datetime import datetime

class MarketIndicators:
    """Market condition indicators for strategy selection"""
    
    def __init__(self, data: pd.DataFrame): #a pandas dataframe is a table of data with a timestamp as index.
        self.data = data
        self.indicators = self._calculate_indicators()
        
    def _calculate_indicators(self) -> Dict:
        """Calculate all market indicators"""
        indicators = {}
        
        # 1. Volatility Indicators
        indicators['volatility'] = self._calculate_volatility()
        indicators['atr'] = self._calculate_atr()
        indicators['vix_proxy'] = self._calculate_vix_proxy()
        
        # 2. Trend Indicators
        indicators['trend_strength'] = self._calculate_trend_strength()
        indicators['adx'] = self._calculate_adx()
        indicators['macd'] = self._calculate_macd()
        
        # 3. Volume Indicators
        indicators['volume_trend'] = self._calculate_volume_trend()
        indicators['volume_spikes'] = self._calculate_volume_spikes()
        indicators['volume_profile'] = self._calculate_volume_profile()
        
        # 4. Market Regime Indicators
        indicators['market_regime'] = self._determine_market_regime()
        indicators['regime_confidence'] = self._calculate_regime_confidence()
        
        # 5. Sentiment Indicators
        indicators['sentiment_score'] = self._calculate_sentiment_score()
        indicators['fear_greed'] = self._calculate_fear_greed_index()
        
        return indicators
        
    def _calculate_volatility(self) -> Dict:
        """Calculate various volatility metrics"""
        returns = np.log(self.data['close'] / self.data['close'].shift(1))
        
        return {
            'daily_volatility': returns.std() * np.sqrt(252),
            'rolling_volatility': returns.rolling(window=20).std().iloc[-1] * np.sqrt(252),
            'volatility_trend': returns.rolling(window=20).std().diff().iloc[-1]
        }
        
    def _calculate_atr(self) -> Dict:
        """Calculate Average True Range"""
        high = self.data['high']
        low = self.data['low']
        close = self.data['close']
        
        tr = pd.DataFrame({
            'h-l': high - low,
            'h-pc': abs(high - close.shift()),
            'l-pc': abs(low - close.shift())
        }).max(axis=1)
        
        return {
            'atr': tr.rolling(window=14).mean().iloc[-1],
            'atr_trend': tr.rolling(window=14).mean().diff().iloc[-1]
        }
        
    def _calculate_vix_proxy(self) -> float:
        """Calculate a proxy for market volatility index"""
        returns = np.log(self.data['close'] / self.data['close'].shift(1))
        return abs(returns).rolling(window=20).mean().iloc[-1] * 100
        
    def _calculate_trend_strength(self) -> float:
        """Calculate trend strength using price momentum"""
        close = self.data['close']
        trend = close.diff().rolling(window=20).sum()
        return trend.iloc[-1] / close.iloc[-1]
        
    def _calculate_adx(self) -> float:
        """Calculate ADX for trend strength"""
        high = self.data['high']
        low = self.data['low']
        close = self.data['close']
        
        tr = pd.DataFrame({
            'h-l': high - low,
            'h-pc': abs(high - close.shift()),
            'l-pc': abs(low - close.shift())
        }).max(axis=1)
        
        dm_plus = pd.Series(np.where(
            (high.diff() > low.diff()) & (high.diff() > 0),
            high.diff(), 0
        ))
        
        dm_minus = pd.Series(np.where(
            (low.diff() > high.diff()) & (low.diff() > 0),
            low.diff(), 0
        ))
        
        return (100 * abs(dm_plus.rolling(window=14).sum() - 
                         dm_minus.rolling(window=14).sum()) / 
                (dm_plus.rolling(window=14).sum() + 
                 dm_minus.rolling(window=14).sum())).iloc[-1]
        
    def _calculate_macd(self) -> Dict:
        """Calculate MACD indicators"""
        close = self.data['close']
        ema_fast = close.ewm(span=12, adjust=False).mean()
        ema_slow = close.ewm(span=26, adjust=False).mean()
        macd = ema_fast - ema_slow
        signal = macd.ewm(span=9, adjust=False).mean()
        
        return {
            'macd': macd.iloc[-1],
            'signal': signal.iloc[-1],
            'histogram': (macd - signal).iloc[-1]
        }
        
    def _calculate_volume_trend(self) -> float:
        """Calculate volume trend"""
        volume = self.data['volume']
        return volume.diff().rolling(window=20).mean().iloc[-1]
        
    def _calculate_volume_spikes(self) -> bool:
        """Detect volume spikes"""
        volume = self.data['volume']
        avg_volume = volume.rolling(window=20).mean()
        return volume.iloc[-1] > (avg_volume.iloc[-1] * 1.5)
        
    def _calculate_volume_profile(self) -> Dict:
        """Calculate volume profile metrics"""
        price_range = self.data['high'].max() - self.data['low'].min()
        price_increment = price_range / 20
        
        price_bins = np.arange(
            self.data['low'].min(),
            self.data['high'].max() + price_increment,
            price_increment
        )
        
        volume_profile = {}
        for i in range(len(price_bins) - 1):
            low_bin = price_bins[i]
            high_bin = price_bins[i + 1]
            volume = self.data[(self.data['low'] <= high_bin) & 
                            (self.data['high'] >= low_bin)]['volume'].sum()
            volume_profile[(low_bin, high_bin)] = volume
            
        return {
            'poc': max(volume_profile.items(), key=lambda x: x[1])[0],
            'volume_concentration': max(volume_profile.values()) / 
                                  sum(volume_profile.values())
        }
        
    def _determine_market_regime(self) -> str:
        """Determine current market regime"""
        indicators = self.indicators
        
        # Check volatility regime
        if indicators['volatility']['daily_volatility'] > 0.3:
            return 'volatile'
            
        # Check trend regime
        if (indicators['adx'] > 25 and 
            abs(indicators['trend_strength']) > 0.05):
            return 'trending'
            
        # Check volume regime
        if indicators['volume_spikes']:
            return 'volume_spike'
            
        # Check range-bound regime
        if (abs(indicators['trend_strength']) < 0.01 and 
            indicators['volatility']['daily_volatility'] < 0.1):
            return 'range_bound'
            
        return 'neutral'
        
    def _calculate_regime_confidence(self) -> float:
        """Calculate confidence in market regime classification"""
        indicators = self.indicators
        confidence = 0
        
        # Check volatility confidence
        if indicators['volatility']['daily_volatility'] > 0.3:
            confidence += 0.3
            
        # Check trend confidence
        if indicators['adx'] > 25:
            confidence += 0.2
            
        # Check volume confidence
        if indicators['volume_spikes']:
            confidence += 0.2
            
        # Check price action confidence
        if abs(indicators['trend_strength']) > 0.05:
            confidence += 0.3
            
        return min(1.0, confidence)
        
    def _calculate_sentiment_score(self) -> float:
        """Calculate market sentiment score"""
        # TODO: Implement actual sentiment analysis
        # For now, use a proxy based on price action
        returns = np.log(self.data['close'] / self.data['close'].shift(1))
        return returns.rolling(window=20).mean().iloc[-1]
        
    def _calculate_fear_greed_index(self) -> float:
        """Calculate a proxy for Fear & Greed Index"""
        # TODO: Implement actual Fear & Greed calculation
        # For now, use a proxy based on volatility and trend
        volatility = self.indicators['volatility']['daily_volatility']
        trend = self.indicators['trend_strength']
        
        # Higher volatility with negative trend = higher fear
        # Lower volatility with positive trend = higher greed
        return 50 + (trend * 25) - (volatility * 25)
