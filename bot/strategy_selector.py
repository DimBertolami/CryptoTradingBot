from typing import Dict, List, Optional, Tuple
import pandas as pd
from datetime import datetime
from .strategies.base_strategy import TradingStrategy
from .strategies.ma_crossover import MACrossoverStrategy
from .strategies.mean_reversion import MeanReversionStrategy
from .strategies.trend_following import TrendFollowingStrategy
from .strategies.ml_pattern_recognition import MLPatternRecognitionStrategy
from .strategies.volatility_breakout import VolatilityBreakoutStrategy
from .strategies.volume_profile import VolumeProfileStrategy

class MarketCondition:
    """Market condition analysis results"""
    def __init__(self, data: pd.DataFrame):
        self.data = data
        self.conditions = self._analyze_market()
        
    def _analyze_market(self) -> Dict:
        """Analyze market conditions"""
        if len(self.data) < 50:  # Minimum data needed for analysis
            return {'condition': 'insufficient_data'}
            
        # Calculate volatility
        returns = np.log(self.data['close'] / self.data['close'].shift(1))
        volatility = returns.std() * np.sqrt(252)  # Annualized volatility
        
        # Calculate trend strength
        trend_strength = abs(self.data['close'].iloc[-1] - self.data['close'].iloc[0]) / \
                        self.data['close'].iloc[0]
        
        # Calculate volume patterns
        avg_volume = self.data['volume'].mean()
        current_volume = self.data['volume'].iloc[-1]
        volume_spike = current_volume > (avg_volume * 1.5)
        
        # Calculate range expansion
        recent_range = self.data['high'].iloc[-20:].max() - self.data['low'].iloc[-20:].min()
        historical_range = self.data['high'].iloc[:-20].max() - self.data['low'].iloc[:-20].min()
        range_expansion = recent_range > (historical_range * 1.2)
        
        return {
            'volatility': volatility,
            'trend_strength': trend_strength,
            'volume_spike': volume_spike,
            'range_expansion': range_expansion,
            'market_regime': self._determine_market_regime(
                volatility, trend_strength, volume_spike, range_expansion
            )
        }
        
    def _determine_market_regime(self, volatility: float, trend_strength: float, 
                               volume_spike: bool, range_expansion: bool) -> str:
        """Determine current market regime"""
        if trend_strength > 0.05 and volatility < 0.3:
            return 'trending'
            
        if volatility > 0.3 and range_expansion:
            return 'volatile'
            
        if volume_spike:
            return 'volume_spike'
            
        return 'range_bound'

class StrategySelector:
    """Selects the most appropriate trading strategy based on market conditions"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.strategies = {
            'ma_crossover': MACrossoverStrategy(config.get('ma_crossover', {})),
            'mean_reversion': MeanReversionStrategy(config.get('mean_reversion', {})),
            'trend_following': TrendFollowingStrategy(config.get('trend_following', {})),
            'ml_pattern': MLPatternRecognitionStrategy(config.get('ml_pattern', {})),
            'volatility_breakout': VolatilityBreakoutStrategy(config.get('volatility_breakout', {})),
            'volume_profile': VolumeProfileStrategy(config.get('volume_profile', {}))
        }
        
    def select_strategy(self, market_condition: MarketCondition) -> Tuple[str, TradingStrategy]:
        """Select the most appropriate strategy based on market conditions"""
        regime = market_condition.conditions['market_regime']
        
        strategy_map = {
            'trending': 'trend_following',
            'volatile': 'volatility_breakout',
            'volume_spike': 'volume_profile',
            'range_bound': 'mean_reversion',
            'insufficient_data': 'ma_crossover'  # Fallback strategy
        }
        
        selected_strategy = strategy_map.get(regime, 'ma_crossover')
        return selected_strategy, self.strategies[selected_strategy]
        
    def get_strategy_signals(self, data: pd.DataFrame) -> List[Dict]:
        """Get signals from the selected strategy"""
        market_condition = MarketCondition(data)
        strategy_name, strategy = self.select_strategy(market_condition)
        
        # Generate signals using the selected strategy
        signals = strategy.generate_signals(data)
        
        # Add strategy name to signals for tracking
        for signal in signals:
            signal['strategy'] = strategy_name
            
        return signals
        
    def get_all_strategy_signals(self, data: pd.DataFrame) -> Dict[str, List[Dict]]:
        """Get signals from all strategies for comparison"""
        all_signals = {}
        
        for name, strategy in self.strategies.items():
            signals = strategy.generate_signals(data)
            if signals:
                all_signals[name] = signals
                
        return all_signals
