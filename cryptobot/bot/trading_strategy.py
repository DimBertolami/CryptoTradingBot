from typing import Dict, List, Optional
import pandas as pd

class TradingStrategy:
    """Base class for all trading strategies"""
    
    def __init__(self, config: Dict):
        """Initialize the strategy with configuration"""
        self.config = config
        self.metrics = {
            'total_return': 0,
            'annualized_return': 0,
            'annualized_volatility': 0,
            'sharpe_ratio': 0,
            'sortino_ratio': 0,
            'max_drawdown': 0,
            'win_rate': 0,
            'profit_factor': 0,
            'total_trades': 0,
            'avg_trade_duration': 0
        }

    def analyze_market(self, data: pd.DataFrame) -> Dict:
        """Analyze market data and generate trading signals
        
        Args:
            data: DataFrame containing market data (open, high, low, close, volume)
            
        Returns:
            Dict containing trading signals and indicators
        """
        raise NotImplementedError("This method should be implemented by subclasses")

    def get_config(self) -> Dict:
        """Get strategy configuration"""
        return self.config

    def get_metrics(self) -> Dict:
        """Get strategy performance metrics"""
        return self.metrics

    def calculate_metrics(self, returns: pd.Series, trades: List[Dict]):
        """Calculate performance metrics
        
        Args:
            returns: Series of portfolio returns
            trades: List of trade records
        """
        if len(returns) == 0:
            return
            
        # Calculate basic metrics
        self.metrics['total_return'] = (returns + 1).prod() - 1
        self.metrics['annualized_return'] = ((1 + self.metrics['total_return']) ** (252/len(returns))) - 1
        self.metrics['annualized_volatility'] = returns.std() * (252 ** 0.5)
        
        # Calculate Sharpe and Sortino ratios
        risk_free_rate = 0.02  # 2% annual risk-free rate
        excess_returns = returns - (risk_free_rate / 252)
        self.metrics['sharpe_ratio'] = excess_returns.mean() / excess_returns.std() * (252 ** 0.5)
        
        negative_returns = excess_returns[excess_returns < 0]
        if len(negative_returns) > 0:
            self.metrics['sortino_ratio'] = excess_returns.mean() / negative_returns.std() * (252 ** 0.5)
        
        # Calculate drawdown
        cum_returns = (returns + 1).cumprod()
        rolling_max = cum_returns.cummax()
        drawdown = (cum_returns - rolling_max) / rolling_max
        self.metrics['max_drawdown'] = drawdown.min()
        
        # Calculate trade statistics
        if trades:
            winning_trades = [t for t in trades if t['profit'] > 0]
            losing_trades = [t for t in trades if t['profit'] <= 0]
            
            self.metrics['total_trades'] = len(trades)
            self.metrics['win_rate'] = len(winning_trades) / len(trades)
            
            if losing_trades:
                total_loss = sum(t['profit'] for t in losing_trades)
            else:
                total_loss = 0
            
            if winning_trades:
                total_profit = sum(t['profit'] for t in winning_trades)
                self.metrics['profit_factor'] = total_profit / abs(total_loss)
            
            # Calculate average trade duration
            durations = [(t['exit_time'] - t['entry_time']).total_seconds() / (60*60*24) 
                        for t in trades]  # Convert to days
            self.metrics['avg_trade_duration'] = sum(durations) / len(durations) if durations else 0
