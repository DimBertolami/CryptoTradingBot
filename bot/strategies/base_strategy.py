from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd

class TradingStrategy(ABC):
    """Base class for all trading strategies"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.name = config.get('name', 'Unnamed Strategy')
        self.risk_tolerance = config.get('risk_tolerance', 0.05)
        
    @abstractmethod
    def analyze_market(self, data: pd.DataFrame) -> Dict:
        """Analyze market data and return signals"""
        pass
        
    @abstractmethod
    def generate_signals(self, data: pd.DataFrame) -> List[Dict]:
        """Generate trading signals based on analysis"""
        pass
        
    @abstractmethod
    def calculate_position_size(self, signal: Dict, account_balance: float) -> float:
        """Calculate position size based on risk management rules"""
        pass
        
    def validate_signal(self, signal: Dict) -> bool:
        """Validate if a signal is valid based on strategy rules"""
        return True  # Override in specific strategies
        
    def get_risk_metrics(self, data: pd.DataFrame) -> Dict:
        """Calculate risk metrics for the strategy"""
        return {
            'volatility': data['price'].std(),
            'max_drawdown': self.calculate_max_drawdown(data),
            'sharpe_ratio': self.calculate_sharpe_ratio(data)
        }
        
    def calculate_max_drawdown(self, data: pd.DataFrame) -> float:
        """Calculate maximum drawdown for the strategy"""
        if 'price' not in data.columns:
            return 0
            
        prices = data['price']
        rolling_max = prices.cummax()
        drawdown = (prices - rolling_max) / rolling_max
        return drawdown.min()
        
    def calculate_sharpe_ratio(self, data: pd.DataFrame) -> float:
        """Calculate Sharpe ratio for the strategy"""
        if 'returns' not in data.columns:
            return 0
            
        returns = data['returns']
        mean_return = returns.mean()
        std_dev = returns.std()
        
        if std_dev == 0:
            return 0
            
        return mean_return / std_dev
