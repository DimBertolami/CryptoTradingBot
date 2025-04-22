from typing import Dict, List, Optional
import pandas as pd
from datetime import datetime
from .base_strategy import TradingStrategy

class MACrossoverStrategy(TradingStrategy):
    """Moving Average Crossover Strategy
    
    This strategy generates buy/sell signals based on the crossover of two moving averages:
    - Fast MA (short-term)
    - Slow MA (long-term)
    """
    
    def __init__(self, config: Dict):
        super().__init__(config)
        self.fast_window = config.get('fast_window', 9)
        self.slow_window = config.get('slow_window', 21)
        self.stop_loss = config.get('stop_loss', 0.02)  # 2% stop loss
        self.take_profit = config.get('take_profit', 0.05)  # 5% take profit
        
    def analyze_market(self, data: pd.DataFrame) -> Dict:
        """Calculate moving averages and generate signals"""
        if len(data) < self.slow_window:
            return {'signal': 'wait', 'reason': 'Insufficient data'}
            
        data['fast_ma'] = data['price'].rolling(window=self.fast_window).mean()
        data['slow_ma'] = data['price'].rolling(window=self.slow_window).mean()
        
        current_price = data['price'].iloc[-1]
        fast_ma = data['fast_ma'].iloc[-1]
        slow_ma = data['slow_ma'].iloc[-1]
        
        return {
            'current_price': current_price,
            'fast_ma': fast_ma,
            'slow_ma': slow_ma,
            'crossed_up': fast_ma > slow_ma,
            'crossed_down': fast_ma < slow_ma
        }
        
    def generate_signals(self, data: pd.DataFrame) -> List[Dict]:
        """Generate buy/sell signals based on MA crossovers"""
        analysis = self.analyze_market(data)
        signals = []
        
        if analysis['crossed_up']:
            signals.append({
                'type': 'buy',
                'price': analysis['current_price'],
                'timestamp': data.index[-1],
                'reason': 'Fast MA crossed above Slow MA'
            })
        elif analysis['crossed_down']:
            signals.append({
                'type': 'sell',
                'price': analysis['current_price'],
                'timestamp': data.index[-1],
                'reason': 'Fast MA crossed below Slow MA'
            })
        
        return signals
        
    def calculate_position_size(self, signal: Dict, account_balance: float) -> float:
        """Calculate position size based on risk management"""
        if signal['type'] == 'buy':
            # Calculate position size based on risk tolerance
            position_size = account_balance * self.risk_tolerance
            return position_size
        return 0
        
    def validate_signal(self, signal: Dict) -> bool:
        """Validate if the signal is valid"""
        if signal.get('type') not in ['buy', 'sell']:
            return False
            
        if 'price' not in signal:
            return False
            
        return True
