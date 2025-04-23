"""
Advanced Risk Management System
Handles dynamic stop-loss, portfolio correlation, and emergency shutdown
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from sklearn.covariance import EmpiricalCovariance
from dataclasses import dataclass

logger = logging.getLogger("advanced_risk_manager")

@dataclass
class MarketCondition:
    volatility: float
    correlation: float
    trend_strength: float
    liquidity: float
    sentiment: float

class AdvancedRiskManager:
    def __init__(self, config: Dict):
        """Initialize advanced risk manager with configuration"""
        self.config = config
        self.max_portfolio_var = config.get('max_portfolio_var', 0.02)  # 2% daily VaR
        self.max_correlation = config.get('max_correlation', 0.7)
        self.volatility_window = config.get('volatility_window', 20)
        self.correlation_window = config.get('correlation_window', 30)
        self.emergency_triggers = config.get('emergency_triggers', {
            'max_drawdown': 0.15,  # 15% max drawdown
            'max_daily_loss': 0.05,  # 5% max daily loss
            'min_liquidity': 1000000,  # Minimum market liquidity
            'max_volatility': 0.05  # 5% maximum volatility
        })
        
        self.position_history = {}
        self.correlation_matrix = None
        self.last_update = None
        self.market_conditions = {}

    def update_market_condition(self, symbol: str, prices: pd.Series, volume: pd.Series) -> MarketCondition:
        """Update market condition metrics for a symbol"""
        try:
            # Calculate volatility
            returns = prices.pct_change().dropna()
            volatility = returns.std() * np.sqrt(252)  # Annualized
            
            # Calculate trend strength using ADX
            high = prices * 1.001  # Simulated high prices
            low = prices * 0.999   # Simulated low prices
            adx = self._calculate_adx(high, low, prices)
            
            # Calculate liquidity score
            liquidity = (volume * prices).mean()
            liquidity_score = min(1.0, liquidity / self.emergency_triggers['min_liquidity'])
            
            # Simple sentiment score (can be enhanced with external data)
            sentiment = 0.5  # Neutral sentiment
            
            condition = MarketCondition(
                volatility=volatility,
                correlation=0.0,  # Will be updated in correlation matrix
                trend_strength=adx,
                liquidity=liquidity_score,
                sentiment=sentiment
            )
            
            self.market_conditions[symbol] = condition
            return condition
            
        except Exception as e:
            logger.error(f"Error updating market condition: {e}")
            return MarketCondition(0.0, 0.0, 0.0, 0.0, 0.0)

    def _calculate_adx(self, high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> float:
        """Calculate Average Directional Index (ADX)"""
        try:
            # Calculate True Range
            tr1 = high - low
            tr2 = abs(high - close.shift(1))
            tr3 = abs(low - close.shift(1))
            tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
            atr = tr.rolling(period).mean()
            
            # Calculate Directional Movement
            up_move = high - high.shift(1)
            down_move = low.shift(1) - low
            
            plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0)
            minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0)
            
            # Calculate Directional Indicators
            plus_di = 100 * pd.Series(plus_dm).rolling(period).mean() / atr
            minus_di = 100 * pd.Series(minus_dm).rolling(period).mean() / atr
            
            # Calculate ADX
            dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di)
            adx = dx.rolling(period).mean().iloc[-1]
            
            return float(adx)
            
        except Exception as e:
            logger.error(f"Error calculating ADX: {e}")
            return 0.0

    def calculate_dynamic_stop_loss(self, 
                                  symbol: str, 
                                  entry_price: float, 
                                  position_size: float,
                                  market_condition: Optional[MarketCondition] = None) -> Tuple[float, float]:
        """Calculate dynamic stop-loss based on market conditions"""
        try:
            if market_condition is None:
                market_condition = self.market_conditions.get(symbol)
                if market_condition is None:
                    raise ValueError(f"No market condition data for {symbol}")
            
            # Base stop-loss percentage
            base_stop = 0.02  # 2%
            
            # Adjust based on volatility
            vol_factor = market_condition.volatility / 0.02  # Normalize to typical volatility
            vol_adjusted_stop = base_stop * vol_factor
            
            # Adjust based on trend strength
            trend_factor = 1.0 + (market_condition.trend_strength / 100)
            trend_adjusted_stop = vol_adjusted_stop * trend_factor
            
            # Final stop-loss percentage
            final_stop_pct = min(max(trend_adjusted_stop, 0.01), 0.05)  # Cap between 1% and 5%
            
            # Calculate actual prices
            stop_loss_price = entry_price * (1 - final_stop_pct)
            take_profit_price = entry_price * (1 + final_stop_pct * 2)  # 2:1 reward-risk ratio
            
            return stop_loss_price, take_profit_price
            
        except Exception as e:
            logger.error(f"Error calculating dynamic stop-loss: {e}")
            return entry_price * 0.98, entry_price * 1.04  # Fallback to 2% stop-loss, 4% take-profit

    def update_correlation_matrix(self, price_data: Dict[str, pd.Series]):
        """Update correlation matrix for portfolio balancing"""
        try:
            # Create returns DataFrame
            returns_data = {}
            for symbol, prices in price_data.items():
                returns_data[symbol] = prices.pct_change().dropna()
            
            returns_df = pd.DataFrame(returns_data)
            
            # Calculate correlation matrix
            self.correlation_matrix = returns_df.corr()
            
            # Update correlation in market conditions
            for symbol in self.market_conditions:
                if symbol in self.correlation_matrix:
                    avg_correlation = self.correlation_matrix[symbol].mean()
                    self.market_conditions[symbol].correlation = avg_correlation
            
            self.last_update = datetime.now()
            
        except Exception as e:
            logger.error(f"Error updating correlation matrix: {e}")

    def check_emergency_shutdown(self, portfolio: Dict[str, Dict]) -> Tuple[bool, str]:
        """Check if emergency shutdown is needed"""
        try:
            # Check portfolio drawdown
            total_value = sum(pos['value'] for pos in portfolio.values())
            peak_value = max(pos.get('peak_value', 0) for pos in portfolio.values())
            drawdown = (peak_value - total_value) / peak_value if peak_value > 0 else 0
            
            if drawdown > self.emergency_triggers['max_drawdown']:
                return True, f"Maximum drawdown exceeded: {drawdown:.2%}"
            
            # Check daily loss
            daily_pl = sum(pos.get('daily_pl', 0) for pos in portfolio.values())
            daily_pl_pct = daily_pl / total_value if total_value > 0 else 0
            
            if daily_pl_pct < -self.emergency_triggers['max_daily_loss']:
                return True, f"Maximum daily loss exceeded: {daily_pl_pct:.2%}"
            
            # Check market conditions
            for symbol, condition in self.market_conditions.items():
                # Check volatility
                if condition.volatility > self.emergency_triggers['max_volatility']:
                    return True, f"Excessive volatility in {symbol}: {condition.volatility:.2%}"
                
                # Check liquidity
                if condition.liquidity < 0.5:  # Less than 50% of minimum liquidity
                    return True, f"Insufficient liquidity in {symbol}"
            
            return False, ""
            
        except Exception as e:
            logger.error(f"Error checking emergency shutdown: {e}")
            return True, f"Error in risk assessment: {str(e)}"

    def optimize_portfolio_weights(self, 
                                current_portfolio: Dict[str, float],
                                expected_returns: Dict[str, float]) -> Dict[str, float]:
        """Optimize portfolio weights using correlation-based approach"""
        try:
            if self.correlation_matrix is None:
                raise ValueError("Correlation matrix not initialized")
            
            symbols = list(current_portfolio.keys())
            n_assets = len(symbols)
            
            if n_assets == 0:
                return {}
            
            # Create correlation-based distance matrix
            distance_matrix = 1 - abs(self.correlation_matrix.loc[symbols, symbols])
            
            # Calculate diversification scores
            div_scores = distance_matrix.mean()
            
            # Combine diversification scores with expected returns
            scores = {}
            for symbol in symbols:
                div_score = div_scores[symbol]
                ret_score = expected_returns.get(symbol, 0)
                # Weighted combination of diversification and return scores
                scores[symbol] = 0.7 * div_score + 0.3 * ret_score
            
            # Normalize scores to create weights
            total_score = sum(scores.values())
            weights = {symbol: score/total_score for symbol, score in scores.items()}
            
            return weights
            
        except Exception as e:
            logger.error(f"Error optimizing portfolio weights: {e}")
            # Fallback to equal weights
            n_assets = len(current_portfolio)
            return {symbol: 1.0/n_assets for symbol in current_portfolio} if n_assets > 0 else {}
