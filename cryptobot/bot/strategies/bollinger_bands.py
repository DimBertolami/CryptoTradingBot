from typing import Dict, List, Optional, Tuple, Any, Union
import pandas as pd
import numpy as np
from ..trading_strategy import TradingStrategy
from ..metrics import RiskMetrics, PerformanceMetrics

class BollingerBandsStrategy(TradingStrategy):
    """
    Bollinger Bands Trading Strategy implementation.
    
    Args:
        config: Dictionary containing strategy configuration
            - window: Lookback window for moving average (default: 20)
            - num_std: Number of standard deviations for bands (default: 2)
    """
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.window: int = config.get('window', 20)
        self.num_std: float = config.get('num_std', 2.0)
        self.risk_metrics = RiskMetrics()
        self.performance_metrics = PerformanceMetrics()

    def analyze_market(self, data: pd.DataFrame) -> Dict[str, Optional[Union[str, float]]]:
        """
        Analyze market data and generate trading signals using Bollinger Bands.
        
        Args:
            data: DataFrame containing market data with 'close' prices
            
        Returns:
            Dictionary containing:
                - signal: 'buy', 'sell', or None
                - price: Current closing price
                - upper_band: Current upper band value
                - lower_band: Current lower band value
                - risk_level: Calculated risk level (0-100)
        """
        if data.empty or len(data) < self.window:
            return {
                'signal': None,
                'price': None,
                'upper_band': None,
                'lower_band': None,
                'risk_level': 100  # High risk if insufficient data
            }
            
        try:
            # Vectorized calculations for better performance
            close_prices = data['close'].values
            rolling_mean = pd.Series(close_prices).rolling(window=self.window).mean().values
            rolling_std = pd.Series(close_prices).rolling(window=self.window).std().values
            
            upper_band = rolling_mean + (rolling_std * self.num_std)
            lower_band = rolling_mean - (rolling_std * self.num_std)
            
            current_price = close_prices[-1]
            current_upper = upper_band[-1]
            current_lower = lower_band[-1]
            
            # Generate signals with additional confirmation
            signal = None
            if current_price > current_upper and not np.isnan(current_upper):
                signal = 'sell'
            elif current_price < current_lower and not np.isnan(current_lower):
                signal = 'buy'
            
            # Calculate risk metrics
            returns = pd.Series(close_prices).pct_change()
            risk_level = self.risk_metrics.calculate_risk_level(returns)
            
            return {
                'signal': signal,
                'price': float(current_price),
                'upper_band': float(current_upper),
                'lower_band': float(current_lower),
                'risk_level': risk_level
            }
            
        except Exception as e:
            self.log_error(f"Error in Bollinger Bands analysis: {str(e)}")
            return {
                'signal': None,
                'price': None,
                'upper_band': None,
                'lower_band': None,
                'risk_level': 100
            }

    def get_config(self) -> Dict[str, Union[int, float]]:
        """Get strategy configuration"""
        return {
            'window': self.window,
            'num_std': self.num_std
        }
