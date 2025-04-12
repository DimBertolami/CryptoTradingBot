from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from .portfolio_management import PortfolioManager
from .market_indicators import MarketIndicators
from .ml_risk_predictor import MLRiskPredictor

class RebalancingManager:
    """Advanced rebalancing strategies"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.ml_risk_predictor = MLRiskPredictor(config)
        self.rebalancing_strategies = {
            'threshold': self._threshold_rebalancing,
            'periodic': self._periodic_rebalancing,
            'volatility': self._volatility_based_rebalancing,
            'market_regime': self._market_regime_rebalancing,
            'adaptive': self._adaptive_rebalancing,
            'ml_driven': self._ml_driven_rebalancing,
            'cost_aware': self._cost_aware_rebalancing,
            'momentum': self._momentum_based_rebalancing
        }
        self.current_strategy = self.config.get('rebalancing_strategy', 'adaptive')
        self.last_rebalance = None
        self.rebalance_history = []
        
    def rebalance_portfolio(self, portfolio_weights: Dict, 
                          target_weights: Dict,
                          market_data: pd.DataFrame) -> Dict:
        """Execute rebalancing using selected strategy"""
        strategy = self.rebalancing_strategies[self.current_strategy]
        new_weights = strategy(portfolio_weights, target_weights, market_data)
        
        # Record rebalancing action
        self._record_rebalance(portfolio_weights, new_weights, market_data)
        
        return new_weights
        
    def _threshold_rebalancing(self, portfolio_weights: Dict, 
                             target_weights: Dict, 
                             market_data: pd.DataFrame) -> Dict:
        """Rebalance when weights deviate beyond threshold"""
        rebalance_needed = False
        threshold = self.config.get('rebalance_threshold', 0.05)
        new_weights = portfolio_weights.copy()
        
        for asset in portfolio_weights:
            if abs(portfolio_weights[asset] - target_weights.get(asset, 0)) > threshold:
                rebalance_needed = True
                break
                
        if rebalance_needed:
            # Calculate trading costs
            costs = self._calculate_trading_costs(portfolio_weights, target_weights)
            
            # Only rebalance if benefits outweigh costs
            if self._evaluate_rebalance_benefit(portfolio_weights, target_weights) > costs:
                new_weights = self._execute_rebalance(portfolio_weights, target_weights)
                
        return new_weights
        
    def _periodic_rebalancing(self, portfolio_weights: Dict, 
                            target_weights: Dict, 
                            market_data: pd.DataFrame) -> Dict:
        """Rebalance at fixed intervals with dynamic frequency"""
        current_date = datetime.now()
        base_frequency = self.config.get('rebalance_frequency', 'monthly')
        
        # Adjust frequency based on market conditions
        market_indicators = MarketIndicators(market_data)
        volatility = market_indicators.indicators['volatility']['daily_volatility']
        
        if volatility > self.config.get('high_volatility_threshold', 0.05):
            base_frequency = 'weekly'
        elif volatility < self.config.get('low_volatility_threshold', 0.02):
            base_frequency = 'quarterly'
            
        if self._should_rebalance(current_date, base_frequency):
            return self._execute_rebalance(portfolio_weights, target_weights)
            
        return portfolio_weights
        
    def _volatility_based_rebalancing(self, portfolio_weights: Dict, 
                                    target_weights: Dict, 
                                    market_data: pd.DataFrame) -> Dict:
        """Rebalance based on market volatility levels"""
        market_indicators = MarketIndicators(market_data)
        volatility = market_indicators.indicators['volatility']['daily_volatility']
        
        # Dynamic thresholds based on volatility
        threshold = self.config.get('base_threshold', 0.05)
        if volatility > self.config.get('high_volatility_threshold', 0.05):
            threshold *= 0.5  # More frequent rebalancing in high volatility
        elif volatility < self.config.get('low_volatility_threshold', 0.02):
            threshold *= 2  # Less frequent rebalancing in low volatility
            
        return self._threshold_rebalancing(
            portfolio_weights,
            target_weights,
            market_data
        )
        
    def _market_regime_rebalancing(self, portfolio_weights: Dict, 
                                 target_weights: Dict, 
                                 market_data: pd.DataFrame) -> Dict:
        """Rebalance based on market regime with regime-specific rules"""
        market_indicators = MarketIndicators(market_data)
        regime = market_indicators.indicators['market_regime']
        
        regime_rules = {
            'volatile': {
                'threshold': 0.03,
                'max_deviation': 0.1,
                'cost_factor': 1.5
            },
            'trending': {
                'threshold': 0.07,
                'max_deviation': 0.15,
                'cost_factor': 1.0
            },
            'range_bound': {
                'threshold': 0.05,
                'max_deviation': 0.12,
                'cost_factor': 1.2
            }
        }
        
        rules = regime_rules.get(regime, regime_rules['range_bound'])
        
        # Apply regime-specific rules
        if self._check_regime_conditions(portfolio_weights, target_weights, rules):
            return self._execute_rebalance(
                portfolio_weights,
                target_weights,
                cost_factor=rules['cost_factor']
            )
            
        return portfolio_weights
        
    def _adaptive_rebalancing(self, portfolio_weights: Dict, 
                            target_weights: Dict, 
                            market_data: pd.DataFrame) -> Dict:
        """Adaptive rebalancing using multiple factors"""
        factors = self._calculate_adaptive_factors(market_data)
        
        # Calculate adaptive threshold
        base_threshold = self.config.get('base_threshold', 0.05)
        adaptive_threshold = base_threshold * factors['threshold_multiplier']
        
        # Check if rebalancing is needed
        max_deviation = max(
            abs(portfolio_weights[asset] - target_weights.get(asset, 0))
            for asset in portfolio_weights
        )
        
        if max_deviation > adaptive_threshold:
            return self._execute_rebalance(
                portfolio_weights,
                target_weights,
                cost_factor=factors['cost_multiplier']
            )
            
        return portfolio_weights
        
    def _ml_driven_rebalancing(self, portfolio_weights: Dict, 
                              target_weights: Dict, 
                              market_data: pd.DataFrame) -> Dict:
        """ML-driven rebalancing strategy"""
        # Get ML risk predictions
        risk_prediction = self.ml_risk_predictor.predict_risk(market_data)
        
        # Adjust weights based on risk prediction
        adjusted_weights = {}
        for asset in target_weights:
            risk_factor = 1 - (risk_prediction['risk_class'] * 0.1)
            adjusted_weights[asset] = target_weights[asset] * risk_factor
            
        # Normalize weights
        total_weight = sum(adjusted_weights.values())
        if total_weight > 0:
            for asset in adjusted_weights:
                adjusted_weights[asset] /= total_weight
                
        return self._execute_rebalance(portfolio_weights, adjusted_weights)
        
    def _cost_aware_rebalancing(self, portfolio_weights: Dict, 
                               target_weights: Dict, 
                               market_data: pd.DataFrame) -> Dict:
        """Cost-aware rebalancing strategy"""
        # Calculate trading costs
        costs = self._calculate_trading_costs(portfolio_weights, target_weights)
        
        # Calculate potential benefits
        benefits = self._evaluate_rebalance_benefit(portfolio_weights, target_weights)
        
        # Only rebalance if benefits significantly outweigh costs
        if benefits > costs * self.config.get('cost_benefit_ratio', 1.5):
            return self._execute_rebalance(portfolio_weights, target_weights)
            
        return portfolio_weights
        
    def _momentum_based_rebalancing(self, portfolio_weights: Dict, 
                                  target_weights: Dict, 
                                  market_data: pd.DataFrame) -> Dict:
        """Momentum-based rebalancing strategy"""
        # Calculate momentum signals
        momentum = self._calculate_momentum_signals(market_data)
        
        # Adjust target weights based on momentum
        adjusted_weights = {}
        for asset in target_weights:
            momentum_factor = 1 + (momentum.get(asset, 0) * 0.2)
            adjusted_weights[asset] = target_weights[asset] * momentum_factor
            
        # Normalize weights
        total_weight = sum(adjusted_weights.values())
        if total_weight > 0:
            for asset in adjusted_weights:
                adjusted_weights[asset] /= total_weight
                
        return self._execute_rebalance(portfolio_weights, adjusted_weights)
        
    def _calculate_adaptive_factors(self, market_data: pd.DataFrame) -> Dict:
        """Calculate factors for adaptive rebalancing"""
        market_indicators = MarketIndicators(market_data)
        
        return {
            'threshold_multiplier': self._calculate_threshold_multiplier(market_indicators),
            'cost_multiplier': self._calculate_cost_multiplier(market_indicators),
            'frequency_multiplier': self._calculate_frequency_multiplier(market_indicators)
        }
        
    def _calculate_trading_costs(self, current_weights: Dict, 
                               target_weights: Dict) -> float:
        """Calculate trading costs for rebalancing"""
        total_cost = 0
        base_cost = self.config.get('base_trading_cost', 0.001)
        
        for asset in set(current_weights) | set(target_weights):
            trade_size = abs(
                current_weights.get(asset, 0) - target_weights.get(asset, 0)
            )
            total_cost += trade_size * base_cost
            
        return total_cost
        
    def _evaluate_rebalance_benefit(self, current_weights: Dict, 
                                  target_weights: Dict) -> float:
        """Evaluate potential benefit of rebalancing"""
        # Calculate risk reduction
        current_risk = self._calculate_portfolio_risk(current_weights)
        target_risk = self._calculate_portfolio_risk(target_weights)
        risk_benefit = max(0, current_risk - target_risk)
        
        # Calculate expected return improvement
        return_benefit = self._calculate_expected_return_improvement(
            current_weights,
            target_weights
        )
        
        return risk_benefit + return_benefit
        
    def _execute_rebalance(self, current_weights: Dict, target_weights: Dict,
                          cost_factor: float = 1.0) -> Dict:
        """Execute rebalancing trades"""
        new_weights = {}
        
        for asset in set(current_weights) | set(target_weights):
            current = current_weights.get(asset, 0)
            target = target_weights.get(asset, 0)
            
            # Apply cost-aware adjustment
            adjustment = (target - current) * cost_factor
            new_weights[asset] = current + adjustment
            
        # Normalize weights
        total_weight = sum(new_weights.values())
        if total_weight > 0:
            for asset in new_weights:
                new_weights[asset] /= total_weight
                
        return new_weights
        
    def _record_rebalance(self, old_weights: Dict, new_weights: Dict,
                         market_data: pd.DataFrame) -> None:
        """Record rebalancing action for analysis"""
        self.rebalance_history.append({
            'timestamp': datetime.now(),
            'old_weights': old_weights.copy(),
            'new_weights': new_weights.copy(),
            'market_conditions': MarketIndicators(market_data).indicators,
            'strategy': self.current_strategy
        })
        
    def get_rebalancing_stats(self) -> Dict:
        """Get statistics about rebalancing actions"""
        if not self.rebalance_history:
            return {}
            
        return {
            'total_rebalances': len(self.rebalance_history),
            'avg_weight_change': np.mean([
                sum(abs(h['new_weights'][a] - h['old_weights'].get(a, 0))
                    for a in h['new_weights'])
                for h in self.rebalance_history
            ]),
            'last_rebalance': self.rebalance_history[-1]['timestamp'],
            'strategy_usage': {
                strategy: sum(1 for h in self.rebalance_history
                            if h['strategy'] == strategy)
                for strategy in self.rebalancing_strategies
            }
        }
