from typing import Dict, List, Optional, Tuple, Any, Union
import pandas as pd
import numpy as np
from ..trading_strategy import TradingStrategy
from ..metrics import RiskMetrics, PerformanceMetrics

class MACDStrategy(TradingStrategy):
    """
    MACD (Moving Average Convergence Divergence) Trading Strategy implementation.
    
    Args:
        config: Dictionary containing strategy configuration
            - fast_window: Fast EMA window (default: 12)
            - slow_window: Slow EMA window (default: 26)
            - signal_window: Signal line EMA window (default: 9)
    """
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.fast_window: int = config.get('fast_window', 12)
        self.slow_window: int = config.get('slow_window', 26)
        self.signal_window: int = config.get('signal_window', 9)
        self.risk_metrics = RiskMetrics()
        self.performance_metrics = PerformanceMetrics()

    def analyze_market(self, data: pd.DataFrame) -> Dict[str, Optional[Union[str, float]]]:
        """
        Analyze market data and generate trading signals using MACD.
        
        Args:
            data: DataFrame containing market data with 'close' prices
            
        Returns:
            Dictionary containing:
                - signal: 'buy', 'sell', or None
                - macd: Current MACD value
                - signal_line: Current signal line value
                - risk_level: Calculated risk level (0-100)
        """
        if data.empty or len(data) < self.slow_window:
            return {
                'signal': None,
                'macd': None,
                'signal_line': None,
                'risk_level': 100  # High risk if insufficient data
            }
            
        try:
            # Vectorized EMA calculations
            close_prices = data['close'].values
            fast_ema = pd.Series(close_prices).ewm(span=self.fast_window, adjust=False).mean().values
            slow_ema = pd.Series(close_prices).ewm(span=self.slow_window, adjust=False).mean().values
            macd = fast_ema - slow_ema
            signal = pd.Series(macd).ewm(span=self.signal_window, adjust=False).mean().values
            
            # Current values
            current_macd = macd[-1]
            current_signal = signal[-1]
            previous_macd = macd[-2]
            previous_signal = signal[-2]
            
            # Generate signals with confirmation
            signal_val = None
            if current_macd > current_signal and previous_macd <= previous_signal and not np.isnan(current_macd):
                signal_val = 'buy'
            elif current_macd < current_signal and previous_macd >= previous_signal and not np.isnan(current_macd):
                signal_val = 'sell'
            
            # Calculate risk metrics
            returns = pd.Series(close_prices).pct_change()
            risk_level = self.risk_metrics.calculate_risk_level(returns)
            
            return {
                'signal': signal_val,
                'macd': float(current_macd),
                'signal_line': float(current_signal),
                'risk_level': risk_level
            }
            
        except Exception as e:
            self.log_error(f"Error in MACD analysis: {str(e)}")
            return {
                'signal': None,
                'macd': None,
                'signal_line': None,
                'risk_level': 100
            }

    def get_config(self) -> Dict[str, int]:
        """Get strategy configuration"""
        return {
            'fast_window': self.fast_window,
            'slow_window': self.slow_window,
            'signal_window': self.signal_window
        }
