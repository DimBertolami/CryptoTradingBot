"""
Risk Management module for trading bot
Handles risk assessment, position sizing, and risk controls
"""

import logging
from typing import Dict, Optional, Tuple
from datetime import datetime
import numpy as np
import pandas as pd
from scipy import stats

logger = logging.getLogger("risk_manager")

class RiskManager:
    def __init__(self, config: Dict):
        """Initialize Risk Manager with configuration"""
        self.config = config
        self.max_position_size = config.get('max_position_size', 0.1)  # 10% of portfolio
        self.min_confidence_threshold = config.get('min_confidence_threshold', 0.7)
        self.max_drawdown = config.get('max_drawdown', 0.05)  # 5%
        self.volatility_window = config.get('volatility_window', 20)
        self.stop_loss_pct = config.get('stop_loss_pct', 0.02)  # 2%
        self.take_profit_pct = config.get('take_profit_pct', 0.05)  # 5%
        
        # Risk metrics cache
        self.volatility_cache = {}
        self.correlation_matrix = None
        self.last_update = None
        
    def calculate_position_size(self, 
                              symbol: str, 
                              current_price: float, 
                              portfolio_value: float, 
                              volatility: Optional[float] = None) -> float:
        """
        Calculate optimal position size based on:
        - Portfolio value
        - Volatility
        - Risk tolerance
        - Maximum position size
        """
        try:
            # Get volatility if not provided
            if volatility is None:
                volatility = self._get_volatility(symbol)
                
            # Calculate position size based on volatility
            position_size = (self.max_position_size * portfolio_value) / \
                           (volatility * 100)  # Convert volatility to percentage
                           
            # Calculate dollar amount
            dollar_amount = position_size * current_price
            
            # Apply maximum position size limit
            max_position_dollars = portfolio_value * self.max_position_size
            dollar_amount = min(dollar_amount, max_position_dollars)
            
            return dollar_amount
            
        except Exception as e:
            logger.error(f"Error calculating position size: {str(e)}")
            return 0.0
            
    def _get_volatility(self, symbol: str) -> float:
        """Get volatility for a symbol"""
        try:
            # Check cache first
            if symbol in self.volatility_cache:
                return self.volatility_cache[symbol]
                
            # In real implementation, this would get historical data
            # For now, return a random volatility between 0.5% and 5%
            volatility = np.random.uniform(0.5, 5.0)
            self.volatility_cache[symbol] = volatility
            return volatility
            
        except Exception as e:
            logger.error(f"Error getting volatility for {symbol}: {str(e)}")
            return 2.0  # Default volatility
            
    def calculate_stop_loss(self, 
                          entry_price: float, 
                          position_size: float, 
                          confidence: float) -> Tuple[float, float]:
        """
        Calculate stop-loss and take-profit levels
        Returns: (stop_loss_price, take_profit_price)
        """
        try:
            # Adjust stop loss based on confidence
            adjusted_stop_loss_pct = self.stop_loss_pct * (1 - confidence)
            
            # Calculate stop loss price
            stop_loss_price = entry_price * (1 - adjusted_stop_loss_pct)
            
            # Calculate take profit price
            take_profit_price = entry_price * (1 + self.take_profit_pct)
            
            return stop_loss_price, take_profit_price
            
        except Exception as e:
            logger.error(f"Error calculating stop-loss/take-profit: {str(e)}")
            return 0.0, 0.0
            
    def calculate_risk_metrics(self, 
                             portfolio: Dict[str, float],
                             current_prices: Dict[str, float]) -> Dict:
        """
        Calculate portfolio risk metrics:
        - Portfolio volatility
        - Value at Risk (VaR)
        - Expected Shortfall
        """
        try:
            # Convert portfolio to DataFrame
            portfolio_df = pd.DataFrame({
                'symbol': list(portfolio.keys()),
                'value': list(portfolio.values())
            })
            
            # Calculate weights
            total_value = sum(portfolio.values())
            portfolio_df['weight'] = portfolio_df['value'] / total_value
            
            # Calculate individual volatilities
            volatilities = {
                symbol: self._get_volatility(symbol)
                for symbol in portfolio.keys()
            }
            
            # Calculate portfolio volatility (simplified)
            portfolio_volatility = np.sqrt(
                sum(
                    (weight * vol) ** 2
                    for weight, vol in zip(
                        portfolio_df['weight'],
                        [volatilities[symbol] for symbol in portfolio_df['symbol']]
                    )
                )
            )
            
            # Calculate VaR (Value at Risk)
            var_95 = total_value * portfolio_volatility * 1.645  # 95% confidence level
            
            # Calculate Expected Shortfall
            expected_shortfall = var_95 * 1.6  # Approximation
            
            return {
                'portfolio_volatility': portfolio_volatility,
                'value_at_risk_95': var_95,
                'expected_shortfall': expected_shortfall,
                'total_value': total_value
            }
            
        except Exception as e:
            logger.error(f"Error calculating risk metrics: {str(e)}")
            return {
                'portfolio_volatility': 0.0,
                'value_at_risk_95': 0.0,
                'expected_shortfall': 0.0,
                'total_value': 0.0
            }
            
    def check_risk_limits(self, 
                         portfolio: Dict[str, float],
                         new_trade: Dict) -> bool:
        """
        Check if the new trade exceeds any risk limits
        Returns True if within limits, False otherwise
        """
        try:
            # Calculate current portfolio metrics
            current_metrics = self.calculate_risk_metrics(portfolio, {})
            
            # Calculate metrics with new trade
            new_portfolio = portfolio.copy()
            symbol = new_trade['symbol']
            side = new_trade['side']
            amount = new_trade['amount']
            
            if side == 'BUY':
                if symbol in new_portfolio:
                    new_portfolio[symbol] += amount
                else:
                    new_portfolio[symbol] = amount
            else:  # SELL
                new_portfolio[symbol] -= amount
                if new_portfolio[symbol] <= 0:
                    del new_portfolio[symbol]
                    
            new_metrics = self.calculate_risk_metrics(new_portfolio, {})
            
            # Check risk limits
            if new_metrics['portfolio_volatility'] > current_metrics['portfolio_volatility'] * 1.5:
                logger.warning("Trade exceeds volatility limit")
                return False
                
            if new_metrics['value_at_risk_95'] > current_metrics['value_at_risk_95'] * 1.5:
                logger.warning("Trade exceeds VaR limit")
                return False
                
            # Check position size limit
            position_value = new_trade['price'] * amount
            if position_value > current_metrics['total_value'] * self.max_position_size:
                logger.warning("Trade exceeds position size limit")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Error checking risk limits: {str(e)}")
            return False
            
    def calculate_trailing_stop(self, 
                              entry_price: float, 
                              current_price: float, 
                              trailing_stop_pct: float = 0.01) -> float:
        """
        Calculate trailing stop price
        """
        try:
            if current_price > entry_price:
                # Long position - trailing stop above entry
                return current_price * (1 - trailing_stop_pct)
            else:
                # Short position - trailing stop below entry
                return current_price * (1 + trailing_stop_pct)
                
        except Exception as e:
            logger.error(f"Error calculating trailing stop: {str(e)}")
            return 0.0
