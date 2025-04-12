from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from scipy.optimize import minimize
from .market_indicators import MarketIndicators
from .performance_tracker import PerformanceTracker

class PortfolioOptimizer:
    """Optimizes portfolio allocation based on multiple strategies"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.market_conditions = None
        self.strategy_weights = None
        self.optimization_metrics = None
        
    def optimize_portfolio(self, market_data: pd.DataFrame, 
                         strategy_signals: Dict[str, List[Dict]]) -> Dict:
        """Optimize portfolio allocation across strategies"""
        # Analyze market conditions
        market_indicators = MarketIndicators(market_data)
        self.market_conditions = market_indicators.indicators
        
        # Get strategy performance metrics
        performance_tracker = PerformanceTracker({})
        for strategy, signals in strategy_signals.items():
            for signal in signals:
                performance_tracker.record_trade(signal)
        
        # Calculate optimal weights
        weights = self._calculate_optimal_weights(
            strategy_signals,
            market_indicators.indicators,
            performance_tracker.get_performance_report()
        )
        
        # Apply risk management rules
        weights = self._apply_risk_management(
            weights,
            market_indicators.indicators
        )
        
        self.strategy_weights = weights
        self.optimization_metrics = {
            'market_regime': market_indicators.indicators['market_regime'],
            'regime_confidence': market_indicators.indicators['regime_confidence'],
            'risk_level': self._calculate_risk_level(market_indicators.indicators)
        }
        
        return {
            'weights': weights,
            'metrics': self.optimization_metrics,
            'signals': self._apply_weights_to_signals(strategy_signals, weights)
        }
        
    def _calculate_optimal_weights(self, strategy_signals: Dict[str, List[Dict]],
                                  market_indicators: Dict,
                                  performance_metrics: Dict) -> Dict[str, float]:
        """Calculate optimal weights for each strategy"""
        # Initialize weights
        strategies = list(strategy_signals.keys())
        n_strategies = len(strategies)
        
        # Define optimization constraints
        constraints = [
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},  # Weights sum to 1
            {'type': 'ineq', 'fun': lambda x: x}  # Weights must be positive
        ]
        
        # Initial guess (equal weights)
        initial_weights = np.ones(n_strategies) / n_strategies
        
        # Optimize weights
        result = minimize(
            self._objective_function,
            initial_weights,
            args=(strategy_signals, market_indicators, performance_metrics),
            constraints=constraints,
            bounds=[(0, 1)] * n_strategies
        )
        
        return dict(zip(strategies, result.x))
        
    def _objective_function(self, weights: np.ndarray,
                           strategy_signals: Dict[str, List[Dict]],
                           market_indicators: Dict,
                           performance_metrics: Dict) -> float:
        """Objective function for optimization"""
        # Calculate portfolio performance
        portfolio_return = self._calculate_portfolio_return(
            weights,
            strategy_signals,
            market_indicators,
            performance_metrics
        )
        
        # Calculate risk-adjusted return
        risk_level = self._calculate_risk_level(market_indicators)
        
        # Return negative Sharpe ratio (to minimize)
        return -portfolio_return / risk_level
        
    def _calculate_portfolio_return(self, weights: np.ndarray,
                                  strategy_signals: Dict[str, List[Dict]],
                                  market_indicators: Dict,
                                  performance_metrics: Dict) -> float:
        """Calculate expected portfolio return"""
        returns = []
        for i, strategy in enumerate(strategy_signals.keys()):
            # Get strategy performance
            strategy_perf = performance_metrics['by_strategy'][strategy]
            
            # Adjust return based on market conditions
            adjusted_return = strategy_perf['avg_pnl'] * weights[i]
            
            # Apply market regime adjustments
            regime = market_indicators['market_regime']
            regime_confidence = market_indicators['regime_confidence']
            
            if regime == 'volatile':
                adjusted_return *= 0.8  # Reduce return expectation in volatile markets
            elif regime == 'trending':
                adjusted_return *= 1.2  # Increase return expectation in trending markets
            
            returns.append(adjusted_return)
            
        return np.sum(returns)
        
    def _apply_risk_management(self, weights: Dict[str, float],
                              market_indicators: Dict) -> Dict[str, float]:
        """Apply risk management rules to weights"""
        regime = market_indicators['market_regime']
        risk_level = self._calculate_risk_level(market_indicators)
        
        adjusted_weights = {}
        for strategy, weight in weights.items():
            # Apply risk level adjustment
            adjusted_weight = weight * (1 - risk_level)
            
            # Apply market regime adjustments
            if regime == 'volatile':
                adjusted_weight *= 0.7  # Reduce exposure in volatile markets
            elif regime == 'range_bound':
                adjusted_weight *= 0.8  # Reduce exposure in range-bound markets
            
            adjusted_weights[strategy] = max(0, min(1, adjusted_weight))
            
        # Normalize weights to sum to 1
        total_weight = sum(adjusted_weights.values())
        if total_weight > 0:
            for strategy in adjusted_weights:
                adjusted_weights[strategy] /= total_weight
                
        return adjusted_weights
        
    def _calculate_risk_level(self, market_indicators: Dict) -> float:
        """Calculate overall risk level based on market conditions"""
        risk_score = 0
        
        # Volatility contribution
        risk_score += market_indicators['volatility']['daily_volatility'] * 0.4
        
        # Market regime contribution
        regime = market_indicators['market_regime']
        regime_map = {
            'volatile': 1.0,
            'trending': 0.6,
            'range_bound': 0.8,
            'neutral': 0.7
        }
        risk_score += regime_map.get(regime, 0.7) * 0.3
        
        # Volume contribution
        if market_indicators['volume_spikes']:
            risk_score += 0.2
            
        # Normalize to 0-1 range
        return min(1.0, risk_score)
        
    def _apply_weights_to_signals(self, strategy_signals: Dict[str, List[Dict]],
                                weights: Dict[str, float]) -> List[Dict]:
        """Apply weights to strategy signals"""
        weighted_signals = []
        
        for strategy, signals in strategy_signals.items():
            weight = weights.get(strategy, 0)
            for signal in signals:
                weighted_signal = signal.copy()
                weighted_signal['weight'] = weight
                weighted_signal['adjusted_position_size'] = (
                    signal.get('position_size', 0) * weight
                )
                weighted_signals.append(weighted_signal)
                
        return weighted_signals
