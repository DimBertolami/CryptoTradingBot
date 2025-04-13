from typing import Dict
import pandas as pd
from ..trading_strategy import TradingStrategy
from ..utils import calculate_rsi
from ..metrics import RiskMetrics, PerformanceMetrics

class RSIStrategy(TradingStrategy):
    """RSI (Relative Strength Index) Trading Strategy"""
    
    def __init__(self, config: Dict):
        super().__init__(config)
        self.rsi_period = config.get('rsi_period', 14)
        self.rsi_overbought = config.get('rsi_overbought', 70)
        self.rsi_oversold = config.get('rsi_oversold', 30)
        self.risk_metrics = RiskMetrics()
        self.performance_metrics = PerformanceMetrics()
        self.risk_tolerance = config.get('risk_tolerance', 0.1)

    async def analyze_market(self, data: pd.DataFrame) -> Dict:
        """Analyze market data and generate trading signals"""
        # Calculate RSI
        rsi = calculate_rsi(data['close'], self.rsi_period)
        
        # Generate signals
        current_rsi = rsi.iloc[-1]
        signal = None
        
        if current_rsi > self.rsi_overbought:
            signal = 'sell'
        elif current_rsi < self.rsi_oversold:
            signal = 'buy'
        
        # Calculate risk metrics
        returns = data['close'].pct_change()
        risk_level = self.risk_metrics.calculate_risk_level(returns)
        
        return {
            'signal': signal,
            'rsi': current_rsi,
            'overbought': self.rsi_overbought,
            'oversold': self.rsi_oversold,
            'risk_level': risk_level
        }

    async def calculate_position_size(self, signal: Dict, account_balance: float) -> float:
        """Calculate position size based on RSI signal"""
        if signal['signal'] == 'buy':
            return account_balance * self.risk_tolerance
        return 0

    def get_config(self) -> Dict:
        """Get strategy configuration"""
        return {
            'rsi_period': self.rsi_period,
            'rsi_overbought': self.rsi_overbought,
            'rsi_oversold': self.rsi_oversold,
            'risk_tolerance': self.risk_tolerance
        }
