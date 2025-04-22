from typing import Dict, List, Optional, Any, Union, Tuple
import pandas as pd
import numpy as np
from dataclasses import dataclass
from datetime import datetime, timedelta

class RiskMetrics:
    """Class for calculating comprehensive risk metrics"""
    
    def __init__(self):
        self.metrics: Dict[str, Union[float, int]] = {
            'risk_level': 0,
            'volatility': 0,
            'value_at_risk': 0,
            'expected_shortfall': 0,
            'max_drawdown': 0,
            'conditional_var': 0,
            'skewness': 0,
            'kurtosis': 0,
            'tail_risk': 0
        }

    def calculate_risk_level(self, returns: pd.Series) -> float:
        """
        Calculate comprehensive risk level (0-100) based on multiple factors
        
        Args:
            returns: Series of return values
            
        Returns:
            Normalized risk score (0-100)
        """
        if returns.empty:
            return 100.0
            
        try:
            # Calculate all risk components
            volatility = returns.std() * (252 ** 0.5)
            max_dd = self.calculate_max_drawdown(returns)
            var = self.calculate_value_at_risk(returns)
            es = self.calculate_expected_shortfall(returns)
            skew = returns.skew()
            kurt = returns.kurtosis()
            
            # Weighted risk score (weights can be adjusted)
            risk_score = (
                0.4 * volatility + 
                0.3 * abs(max_dd) + 
                0.15 * abs(var) + 
                0.1 * abs(es) + 
                0.05 * abs(skew)
            )
            
            # Normalize to 0-100 scale
            risk_level = min(100.0, max(0.0, risk_score * 100))
            
            # Update all metrics
            self.metrics.update({
                'risk_level': risk_level,
                'volatility': volatility,
                'max_drawdown': max_dd,
                'value_at_risk': var,
                'expected_shortfall': es,
                'skewness': skew,
                'kurtosis': kurt,
                'tail_risk': abs(es) / abs(var) if var != 0 else 0
            })
            
            return risk_level
            
        except Exception as e:
            print(f"Error calculating risk level: {str(e)}")
            return 100.0

    def calculate_max_drawdown(self, returns: pd.Series) -> float:
        """Calculate maximum drawdown"""
        cum_returns = (returns + 1).cumprod()
        rolling_max = cum_returns.cummax()
        drawdown = (cum_returns - rolling_max) / rolling_max
        max_drawdown = drawdown.min()
        
        self.metrics['max_drawdown'] = max_drawdown
        return max_drawdown

    def calculate_value_at_risk(self, returns: pd.Series, confidence_level: float = 0.95) -> float:
        """Calculate Value at Risk"""
        var = np.percentile(returns, 100 * (1 - confidence_level))
        self.metrics['value_at_risk'] = var
        return var

    def calculate_expected_shortfall(self, returns: pd.Series, confidence_level: float = 0.95) -> float:
        """Calculate Expected Shortfall"""
        var = self.calculate_value_at_risk(returns, confidence_level)
        es = returns[returns <= var].mean()
        self.metrics['expected_shortfall'] = es
        return es

    def get_metrics(self) -> Dict:
        """Get all calculated risk metrics"""
        return self.metrics

class PerformanceMetrics:
    """Enhanced performance metrics tracking with additional calculations"""
    
    def __init__(self):
        """Initialize performance metrics with additional fields"""
        # Trade statistics
        self.total_trades = 0
        self.winning_trades = 0
        self.losing_trades = 0
        self.win_rate = 0.0
        
        # Trade size metrics
        self.avg_win = 0.0
        self.avg_loss = 0.0
        self.largest_win = 0.0
        self.largest_loss = 0.0
        self.avg_holding_time = pd.Timedelta(0)
        
        # P&L metrics
        self.total_pnl = 0.0
        self.net_pnl = 0.0
        self.total_fees = 0.0
        self.total_slippage = 0.0
        
        # Risk-adjusted returns
        self.sharpe_ratio = 0.0
        self.sortino_ratio = 0.0
        self.max_drawdown = 0.0
        self.max_drawdown_duration = 0
        self.calmar_ratio = 0.0
        
        # Returns
        self.total_return = 0.0
        self.annualized_return = 0.0
        self.daily_returns = []
        self.monthly_returns = []
        
        # Risk metrics
        self.value_at_risk = 0.0
        self.expected_shortfall = 0.0
        
        # Performance ratios
        self.information_ratio = 0.0
        self.treynor_ratio = 0.0
        self.beta = 0.0
        self.alpha = 0.0
        self.r_squared = 0.0
        
        # Buy/Sell metrics
        self.total_buy_trades = 0
        self.total_sell_trades = 0
        self.total_buy_volume = 0.0
        self.total_sell_volume = 0.0
        self.average_buy_price = 0.0
        self.average_sell_price = 0.0
        
        # Overall metrics
        self.total_profit = 0.0
        self.average_profit = 0.0
        self.profit_factor = 0.0
        
        # New metrics
        self.avg_trade_duration: timedelta = timedelta(0)
        self.win_loss_ratio: float = 0.0
        self.profit_per_trade: float = 0.0
        self.risk_adjusted_return: float = 0.0
        
    def update_metrics(self, trade_type: str, price: float, size: float, 
                      profit: float, duration: Optional[timedelta] = None) -> None:
        """
        Enhanced metrics update with additional calculations
        
        Args:
            trade_type: 'buy' or 'sell'
            price: Execution price
            size: Trade size
            profit: Trade profit/loss
            duration: Optional trade duration
        """
        if trade_type == 'buy':
            self.total_trades += 1
            self.total_buy_trades += 1
            self.total_buy_volume += size
            self.average_buy_price = (self.average_buy_price * (self.total_buy_trades - 1) + price) / self.total_buy_trades
        elif trade_type == 'sell':
            self.total_trades += 1
            self.total_sell_trades += 1
            self.total_sell_volume += size
            self.average_sell_price = (self.average_sell_price * (self.total_sell_trades - 1) + price) / self.total_sell_trades
            
            # Convert profit to scalar if it's a Series
            if isinstance(profit, pd.Series):
                profit = profit.item()
            
            if profit > 0:
                self.winning_trades += 1
            else:
                self.losing_trades += 1
            
            self.total_profit += profit
            self.average_profit = self.total_profit / self.total_trades
            
            if self.total_trades > 0:
                self.win_rate = self.winning_trades / self.total_trades
            
            # Calculate profit factor only if we have trades and the denominator is not zero
            if self.total_trades > 0:
                denominator = self.total_profit - self.average_profit * self.total_trades
                if denominator != 0:
                    self.profit_factor = abs(self.total_profit / denominator)
                else:
                    self.profit_factor = 0
        
        # Calculate new metrics
        if self.winning_trades > 0 and self.losing_trades > 0:
            self.win_loss_ratio = self.winning_trades / self.losing_trades
            
        if self.total_trades > 0:
            self.profit_per_trade = self.total_profit / self.total_trades
            
        if duration:
            self.avg_trade_duration = (
                (self.avg_trade_duration * (self.total_trades - 1) + duration) / 
                self.total_trades
            )
            
        # Calculate risk-adjusted return if we have volatility
        if hasattr(self, 'annualized_volatility') and self.annualized_volatility > 0:
            self.risk_adjusted_return = (
                self.annualized_return / self.annualized_volatility
            )

    def update_trade_metrics(self, trade_type: str, price: float, size: float, profit: float) -> None:
        """Update metrics based on trade execution"""
        self.update_metrics(trade_type, price, size, profit)

class PerformanceAnalyzer:
    """Analyzes trading performance and generates metrics."""
    
    def __init__(self):
        """Initialize performance metrics"""
        self.metrics = PerformanceMetrics()
        self.trades: List[Dict[str, Any]] = []
        self.equity_curve = pd.Series()
        self.benchmark_returns = pd.Series()
    
    def update_trade_metrics(self, trade_type: str, price: float, size: float, profit: float) -> None:
        """Update trade execution metrics"""
        self.metrics.update_trade_metrics(trade_type, price, size, profit)

    def calculate_metrics(self, returns: pd.Series, trades: List[Dict]) -> Dict:
        """Calculate performance metrics"""
        if len(returns) == 0:
            return {
                'total_return': 0,
                'annualized_return': 0,
                'annualized_volatility': 0,
                'sharpe_ratio': 0,
                'sortino_ratio': 0,
                'max_drawdown': 0,
                'win_rate': 0,
                'total_trades': 0,
                'profit_factor': 0
            }

        # Calculate basic metrics
        total_return = (returns + 1).prod() - 1
        annualized_return = ((1 + total_return) ** (252 / len(returns))) - 1
        
        # Calculate volatility
        annualized_volatility = returns.std() * np.sqrt(252)
        
        # Calculate Sharpe and Sortino ratios
        sharpe_ratio = annualized_return / annualized_volatility
        
        # Calculate drawdown
        cumulative_returns = (returns + 1).cumprod()
        running_max = cumulative_returns.cummax()
        drawdown = (cumulative_returns - running_max) / running_max
        max_drawdown = drawdown.min()
        
        # Calculate trade metrics
        if trades:
            profits = [trade['profit'] for trade in trades]
            wins = sum(1 for p in profits if p > 0)
            win_rate = wins / len(profits)
            
            total_profit = sum(profits)
            total_loss = sum(min(0, p) for p in profits)
            profit_factor = abs(total_profit / total_loss) if total_loss != 0 else float('inf')
        else:
            win_rate = 0
            profit_factor = 0
        
        return {
            'total_return': float(total_return),
            'annualized_return': float(annualized_return),
            'annualized_volatility': float(annualized_volatility),
            'sharpe_ratio': float(sharpe_ratio),
            'sortino_ratio': float(sharpe_ratio),  # Simplified for now
            'max_drawdown': float(max_drawdown),
            'win_rate': float(win_rate),
            'total_trades': len(trades),
            'profit_factor': float(profit_factor)
        }

class PerformanceMetricsCalculator:
    """Class for calculating performance metrics"""
    
    def __init__(self):
        self.metrics = {
            'total_return': 0,
            'annualized_return': 0,
            'annualized_volatility': 0,
            'sharpe_ratio': 0,
            'sortino_ratio': 0,
            'win_rate': 0,
            'profit_factor': 0,
            'total_trades': 0,
            'avg_trade_duration': 0
        }

    def calculate_metrics(self, returns: pd.Series, trades: List[Dict]) -> Dict:
        """Calculate all performance metrics"""
        if len(returns) == 0:
            return self.metrics
            
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
            
        return self.metrics
