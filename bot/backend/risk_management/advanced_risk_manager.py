"""
Advanced Risk Management System for Crypto Trading Bot

This module provides comprehensive risk management capabilities including:
- Dynamic position sizing
- Portfolio optimization
- Risk-adjusted returns
- Market condition adaptation
- Advanced risk metrics
"""

import logging
from typing import Dict, Optional, Tuple, List
from datetime import datetime
import numpy as np
import pandas as pd
from scipy import stats
from scipy.optimize import minimize
from sklearn.covariance import LedoitWolf

logger = logging.getLogger("advanced_risk_manager")

class AdvancedRiskManager:
    def __init__(self, config: Dict):
        """Initialize Advanced Risk Manager"""
        self.config = config
        self.max_position_size = config.get('max_position_size', 0.1)
        self.min_confidence_threshold = config.get('min_confidence_threshold', 0.7)
        self.max_drawdown = config.get('max_drawdown', 0.05)
        self.volatility_window = config.get('volatility_window', 20)
        self.stop_loss_pct = config.get('stop_loss_pct', 0.02)
        self.take_profit_pct = config.get('take_profit_pct', 0.05)
        
        # Advanced risk parameters
        self.risk_aversion = config.get('risk_aversion', 2.5)
        self.market_volatility_threshold = config.get('market_volatility_threshold', 0.03)
        self.correlation_window = config.get('correlation_window', 60)
        
        # State management
        self.volatility_cache = {}
        self.correlation_matrix = None
        self.covariance_matrix = None
        self.last_update = None
        self.market_conditions = 'NORMAL'
        self.portfolio_weights = {}
        
    def _update_market_conditions(self, market_data: Dict[str, pd.DataFrame]) -> None:
        """Update market conditions based on volatility and correlation"""
        try:
            # Calculate market volatility
            market_volatility = self._calculate_market_volatility(market_data)
            
            # Update market conditions
            if market_volatility > self.market_volatility_threshold:
                self.market_conditions = 'VOLATILE'
            else:
                self.market_conditions = 'NORMAL'
                
            logger.info(f"Market conditions updated: {self.market_conditions}")
            
        except Exception as e:
            logger.error(f"Error updating market conditions: {str(e)}")
            
    def _calculate_market_volatility(self, market_data: Dict[str, pd.DataFrame]) -> float:
        """Calculate overall market volatility"""
        try:
            returns = []
            for symbol, df in market_data.items():
                if 'close' in df.columns:
                    returns.append(df['close'].pct_change().dropna())
            
            if returns:
                combined_returns = pd.concat(returns, axis=1)
                market_volatility = combined_returns.std().mean()
                return float(market_volatility)
            return 0.0
            
        except Exception as e:
            logger.error(f"Error calculating market volatility: {str(e)}")
            return 0.0
            
    def _calculate_correlation_matrix(self, market_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Calculate correlation matrix using Ledoit-Wolf shrinkage"""
        try:
            returns = []
            symbols = []
            
            for symbol, df in market_data.items():
                if 'close' in df.columns:
                    returns.append(df['close'].pct_change().dropna())
                    symbols.append(symbol)
                    
            if returns:
                combined_returns = pd.concat(returns, axis=1)
                combined_returns.columns = symbols
                
                # Use Ledoit-Wolf shrinkage for better estimation
                lw = LedoitWolf()
                lw.fit(combined_returns)
                return pd.DataFrame(lw.covariance_, index=symbols, columns=symbols)
            
            return pd.DataFrame()
            
        except Exception as e:
            logger.error(f"Error calculating correlation matrix: {str(e)}")
            return pd.DataFrame()
            
    def calculate_optimal_weights(self, 
                                market_data: Dict[str, pd.DataFrame],
                                portfolio_value: float) -> Dict[str, float]:
        """Calculate optimal portfolio weights using mean-variance optimization"""
        try:
            # Calculate returns and covariance
            returns = []
            symbols = []
            
            for symbol, df in market_data.items():
                if 'close' in df.columns:
                    returns.append(df['close'].pct_change().dropna())
                    symbols.append(symbol)
                    
            if not returns:
                return {}
                
            combined_returns = pd.concat(returns, axis=1)
            combined_returns.columns = symbols
            
            # Calculate mean returns and covariance
            mean_returns = combined_returns.mean()
            self.covariance_matrix = self._calculate_correlation_matrix(market_data)
            
            # Mean-variance optimization
            def objective(weights):
                portfolio_return = np.sum(mean_returns * weights)
                portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(self.covariance_matrix, weights)))
                return -portfolio_return / portfolio_volatility  # Sharpe ratio
                
            # Constraints
            constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
            bounds = tuple((0, self.max_position_size) for _ in range(len(symbols)))
            
            # Initial guess
            initial_weights = np.ones(len(symbols)) / len(symbols)
            
            # Optimize
            result = minimize(objective, 
                            initial_weights,
                            method='SLSQP',
                            bounds=bounds,
                            constraints=constraints)
            
            if result.success:
                weights = result.x
                return dict(zip(symbols, weights))
            
            return {}
            
        except Exception as e:
            logger.error(f"Error calculating optimal weights: {str(e)}")
            return {}
            
    def calculate_position_size(self, 
                              symbol: str, 
                              current_price: float, 
                              portfolio_value: float, 
                              volatility: Optional[float] = None,
                              market_data: Optional[Dict[str, pd.DataFrame]] = None) -> float:
        """
        Calculate optimal position size using:
        - Market conditions
        - Portfolio optimization
        - Risk-adjusted metrics
        - Dynamic volatility
        """
        try:
            # Get market conditions
            if market_data:
                self._update_market_conditions(market_data)
                
            # Get volatility
            if volatility is None:
                volatility = self._get_volatility(symbol)
                
            # Adjust position size based on market conditions
            market_multiplier = 1.0
            if self.market_conditions == 'VOLATILE':
                market_multiplier = 0.5  # Reduce exposure in volatile markets
                
            # Calculate base position size
            base_position = (self.max_position_size * portfolio_value) / (volatility * 100)
            
            # Apply risk aversion
            risk_adjusted = base_position / self.risk_aversion
            
            # Apply market condition multiplier
            final_position = risk_adjusted * market_multiplier
            
            # Ensure minimum position size
            min_position = portfolio_value * 0.001  # 0.1% minimum
            final_position = max(final_position, min_position)
            
            # Convert to dollar amount
            dollar_amount = final_position * current_price
            
            # Apply maximum position size limit
            max_position_dollars = portfolio_value * self.max_position_size
            dollar_amount = min(dollar_amount, max_position_dollars)
            
            return dollar_amount
            
        except Exception as e:
            logger.error(f"Error calculating position size: {str(e)}")
            return 0.0
            
    def calculate_stop_loss(self, 
                          entry_price: float, 
                          position_size: float, 
                          confidence: float,
                          volatility: float) -> Tuple[float, float]:
        """
        Calculate dynamic stop-loss and take-profit levels
        Returns: (stop_loss_price, take_profit_price)
        """
        try:
            # Adjust stop loss based on confidence and volatility
            adjusted_stop_loss_pct = self.stop_loss_pct * (1 - confidence) * (1 + volatility)
            
            # Calculate stop loss price
            stop_loss_price = entry_price * (1 - adjusted_stop_loss_pct)
            
            # Calculate take profit price
            take_profit_price = entry_price * (1 + self.take_profit_pct * (1 + confidence))
            
            return stop_loss_price, take_profit_price
            
        except Exception as e:
            logger.error(f"Error calculating stop-loss/take-profit: {str(e)}")
            return 0.0, 0.0
            
    def calculate_risk_metrics(self, 
                             portfolio: Dict[str, float],
                             current_prices: Dict[str, float],
                             market_data: Dict[str, pd.DataFrame]) -> Dict:
        """
        Calculate advanced risk metrics:
        - Portfolio volatility
        - Value at Risk (VaR)
        - Expected Shortfall
        - Conditional Value at Risk (CVaR)
        - Portfolio beta
        - Maximum Drawdown
        """
        try:
            # Calculate portfolio value
            total_value = sum(
                portfolio.get(symbol, 0) * current_prices.get(symbol, 0)
                for symbol in portfolio
            )
            
            if total_value == 0:
                return self._get_zero_metrics()
                
            # Calculate weights
            portfolio_df = pd.DataFrame({
                'symbol': list(portfolio.keys()),
                'amount': list(portfolio.values()),
                'price': [current_prices[symbol] for symbol in portfolio],
                'value': [portfolio[symbol] * current_prices[symbol] for symbol in portfolio]
            })
            
            portfolio_df['weight'] = portfolio_df['value'] / total_value
            
            # Calculate volatility for each position
            volatilities = {
                symbol: self._get_volatility(symbol)
                for symbol in portfolio.keys()
            }
            
            # Calculate portfolio volatility (using covariance matrix)
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
            
            # Calculate Conditional Value at Risk (CVaR)
            cvar_95 = expected_shortfall * 1.25
            
            # Calculate Maximum Drawdown
            max_drawdown = self._calculate_max_drawdown(portfolio_df)
            
            return {
                'portfolio_volatility': portfolio_volatility,
                'value_at_risk_95': var_95,
                'expected_shortfall': expected_shortfall,
                'conditional_var_95': cvar_95,
                'max_drawdown': max_drawdown,
                'total_value': total_value
            }
            
        except Exception as e:
            logger.error(f"Error calculating risk metrics: {str(e)}")
            return self._get_zero_metrics()
            
    def _calculate_max_drawdown(self, portfolio_df: pd.DataFrame) -> float:
        """Calculate maximum drawdown for the portfolio"""
        try:
            if portfolio_df.empty:
                return 0.0
                
            # Calculate cumulative returns
            cumulative_returns = (portfolio_df['weight'] * portfolio_df['value']).sum()
            
            # Calculate drawdown
            peak = cumulative_returns.max()
            trough = cumulative_returns.min()
            drawdown = (trough - peak) / peak
            
            return abs(drawdown)
            
        except Exception as e:
            logger.error(f"Error calculating max drawdown: {str(e)}")
            return 0.0
            
    def _get_zero_metrics(self) -> Dict:
        """Return zero metrics when calculations fail"""
        return {
            'portfolio_volatility': 0.0,
            'value_at_risk_95': 0.0,
            'expected_shortfall': 0.0,
            'conditional_var_95': 0.0,
            'max_drawdown': 0.0,
            'total_value': 0.0
        }
            
    def check_risk_limits(self, 
                         portfolio: Dict[str, float],
                         new_trade: Dict,
                         current_prices: Dict[str, float],
                         market_data: Dict[str, pd.DataFrame]) -> bool:
        """
        Check if the new trade exceeds any risk limits
        Returns True if within limits, False otherwise
        """
        try:
            # Calculate current portfolio metrics
            current_metrics = self.calculate_risk_metrics(portfolio, current_prices, market_data)
            
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
                    
            new_metrics = self.calculate_risk_metrics(new_portfolio, current_prices, market_data)
            
            # Check risk limits
            if new_metrics['portfolio_volatility'] > current_metrics['portfolio_volatility'] * 1.5:
                logger.warning("Trade exceeds volatility limit")
                return False
                
            if new_metrics['value_at_risk_95'] > current_metrics['value_at_risk_95'] * 1.5:
                logger.warning("Trade exceeds VaR limit")
                return False
                
            if new_metrics['max_drawdown'] > self.max_drawdown:
                logger.warning("Trade exceeds max drawdown limit")
                return False
                
            # Check position size limit
            position_value = new_trade['price'] * amount
            if position_value > current_metrics['total_value'] * self.max_position_size:
                logger.warning("Trade exceeds position size limit")
                return False
                
            # Check market conditions
            if self.market_conditions == 'VOLATILE' and position_value > current_metrics['total_value'] * 0.05:
                logger.warning("Trade too large for volatile market conditions")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Error checking risk limits: {str(e)}")
            return False
            
    def calculate_rebalance_weights(self, 
                                  portfolio: Dict[str, float],
                                  current_prices: Dict[str, float],
                                  target_weights: Dict[str, float]) -> Dict[str, float]:
        """
        Calculate rebalancing weights to bring portfolio back to target allocation
        Returns: Dictionary of symbol: adjustment amount
        """
        try:
            adjustments = {}
            total_value = sum(
                portfolio.get(symbol, 0) * current_prices.get(symbol, 0)
                for symbol in portfolio
            )
            
            for symbol in target_weights:
                current_value = portfolio.get(symbol, 0) * current_prices.get(symbol, 0)
                target_value = total_value * target_weights[symbol]
                
                if abs(current_value - target_value) > (total_value * 0.01):  # 1% threshold
                    adjustments[symbol] = target_value - current_value
                    
            return adjustments
            
        except Exception as e:
            logger.error(f"Error calculating rebalance weights: {str(e)}")
            return {}
