from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
from .market_indicators import MarketIndicators

class RiskManager:
    """Manages risk across different market regimes and strategies"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.market_regime_rules = self._initialize_regime_rules()
        self.strategy_risk_limits = self._initialize_strategy_limits()
        self.current_risk_metrics = {
            'total_exposure': 0,
            'max_drawdown': 0,
            'current_drawdown': 0,
            'position_count': 0
        }
        
    def _initialize_regime_rules(self) -> Dict:
        """Initialize risk rules for different market regimes"""
        return {
            'volatile': {
                'max_exposure': 0.3,
                'max_position_size': 0.05,
                'stop_loss_multiplier': 1.5,
                'take_profit_multiplier': 1.2
            },
            'trending': {
                'max_exposure': 0.7,
                'max_position_size': 0.1,
                'stop_loss_multiplier': 1.2,
                'take_profit_multiplier': 1.5
            },
            'range_bound': {
                'max_exposure': 0.5,
                'max_position_size': 0.08,
                'stop_loss_multiplier': 1.3,
                'take_profit_multiplier': 1.3
            },
            'volume_spike': {
                'max_exposure': 0.4,
                'max_position_size': 0.06,
                'stop_loss_multiplier': 1.4,
                'take_profit_multiplier': 1.3
            },
            'neutral': {
                'max_exposure': 0.6,
                'max_position_size': 0.09,
                'stop_loss_multiplier': 1.3,
                'take_profit_multiplier': 1.4
            }
        }
        
    def _initialize_strategy_limits(self) -> Dict:
        """Initialize risk limits for different strategies"""
        return {
            'ma_crossover': {
                'max_exposure': 0.2,
                'stop_loss': 0.02,
                'take_profit': 0.05
            },
            'mean_reversion': {
                'max_exposure': 0.15,
                'stop_loss': 0.03,
                'take_profit': 0.06
            },
            'trend_following': {
                'max_exposure': 0.3,
                'stop_loss': 0.025,
                'take_profit': 0.08
            },
            'ml_pattern': {
                'max_exposure': 0.25,
                'stop_loss': 0.035,
                'take_profit': 0.07
            },
            'volatility_breakout': {
                'max_exposure': 0.2,
                'stop_loss': 0.04,
                'take_profit': 0.08
            },
            'volume_profile': {
                'max_exposure': 0.15,
                'stop_loss': 0.03,
                'take_profit': 0.06
            }
        }
        
    def validate_trade(self, trade: Dict, market_data: pd.DataFrame) -> bool:
        """Validate if trade is within risk limits"""
        market_indicators = MarketIndicators(market_data)
        regime = market_indicators.indicators['market_regime']
        
        # Check market regime limits
        if not self._check_regime_limits(trade, regime):
            return False
            
        # Check strategy-specific limits
        if not self._check_strategy_limits(trade):
            return False
            
        # Check portfolio-level limits
        if not self._check_portfolio_limits(trade):
            return False
            
        return True
        
    def _check_regime_limits(self, trade: Dict, regime: str) -> bool:
        """Check if trade is within market regime limits"""
        regime_rules = self.market_regime_rules.get(regime, self.market_regime_rules['neutral'])
        
        # Check position size
        position_size = trade.get('position_size', 0)
        if position_size > regime_rules['max_position_size']:
            return False
            
        # Check exposure
        self.current_risk_metrics['total_exposure'] += position_size
        if self.current_risk_metrics['total_exposure'] > regime_rules['max_exposure']:
            return False
            
        return True
        
    def _check_strategy_limits(self, trade: Dict) -> bool:
        """Check if trade is within strategy-specific limits"""
        strategy = trade.get('strategy', 'unknown')
        strategy_limits = self.strategy_risk_limits.get(strategy, self.strategy_risk_limits['ma_crossover'])
        
        # Check position size
        position_size = trade.get('position_size', 0)
        if position_size > strategy_limits['max_exposure']:
            return False
            
        # Calculate stop-loss and take-profit
        trade['stop_loss'] = trade['price'] * (1 - strategy_limits['stop_loss'])
        trade['take_profit'] = trade['price'] * (1 + strategy_limits['take_profit'])
        
        return True
        
    def _check_portfolio_limits(self, trade: Dict) -> bool:
        """Check portfolio-level risk limits"""
        # Check position count
        self.current_risk_metrics['position_count'] += 1
        if self.current_risk_metrics['position_count'] > self.config.get('max_positions', 10):
            return False
            
        # Check drawdown
        if trade['type'] == 'sell':
            pnl = (trade['price'] - trade['entry_price']) * trade['quantity']
            if pnl < 0:
                self.current_risk_metrics['current_drawdown'] += abs(pnl)
                self.current_risk_metrics['max_drawdown'] = max(
                    self.current_risk_metrics['max_drawdown'],
                    self.current_risk_metrics['current_drawdown']
                )
                
        # Check max drawdown limit
        if self.current_risk_metrics['max_drawdown'] > self.config.get('max_drawdown', 0.1):
            return False
            
        return True
        
    def adjust_position_size(self, trade: Dict, market_data: pd.DataFrame) -> Dict:
        """Adjust position size based on risk metrics"""
        market_indicators = MarketIndicators(market_data)
        regime = market_indicators.indicators['market_regime']
        
        # Get regime-specific rules
        regime_rules = self.market_regime_rules.get(regime, self.market_regime_rules['neutral'])
        
        # Adjust position size based on:
        # 1. Market volatility
        volatility = market_indicators.indicators['volatility']['daily_volatility']
        volatility_adjustment = 1 / (volatility + 0.001)
        
        # 2. Market regime
        regime_adjustment = regime_rules['max_position_size']
        
        # 3. Strategy risk profile
        strategy = trade.get('strategy', 'unknown')
        strategy_limits = self.strategy_risk_limits.get(strategy, self.strategy_risk_limits['ma_crossover'])
        
        # Calculate final position size
        adjusted_size = min(
            trade['position_size'] * volatility_adjustment * regime_adjustment,
            strategy_limits['max_exposure']
        )
        
        trade['adjusted_position_size'] = adjusted_size
        return trade
        
    def get_risk_metrics(self) -> Dict:
        """Get current risk metrics"""
        return self.current_risk_metrics
        
    def reset_risk_metrics(self) -> None:
        """Reset risk metrics after portfolio rebalancing"""
        self.current_risk_metrics = {
            'total_exposure': 0,
            'max_drawdown': 0,
            'current_drawdown': 0,
            'position_count': 0
        }
