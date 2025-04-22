"""
Performance metrics calculation for trading strategies

This module provides comprehensive performance metrics calculation for trading strategies.
It includes risk-adjusted performance measures, trade statistics, and benchmark comparisons.

Key Features:
- Risk-adjusted performance metrics (Sharpe, Sortino, Calmar ratios)
- Trade statistics and distribution analysis
- Drawdown analysis
- Benchmark comparison
- Comprehensive performance reports
"""

from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from scipy import stats
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TradeMetrics:
    """Metrics for individual trades"""
    entry_time: datetime
    exit_time: datetime
    symbol: str
    side: str
    entry_price: float
    exit_price: float
    quantity: float
    pnl: float
    fees: float
    slippage: float
    holding_period: float  # in hours
    return_pct: float

@dataclass
class PerformanceMetrics:
    """Overall strategy performance metrics"""
    # Basic metrics
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    avg_win: float
    avg_loss: float
    largest_win: float
    largest_loss: float
    avg_holding_time: float  # in hours
    
    # PnL metrics
    total_pnl: float
    net_pnl: float  # after fees and slippage
    total_fees: float
    total_slippage: float
    
    # Risk metrics
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    max_drawdown_duration: float  # in hours
    calmar_ratio: float
    
    # Return metrics
    total_return: float
    annualized_return: float
    daily_returns: pd.Series
    monthly_returns: pd.Series
    
    # Risk-adjusted metrics
    value_at_risk: float  # 95% VaR
    expected_shortfall: float  # 95% CVaR
    information_ratio: float
    treynor_ratio: float
    
    # Market metrics
    beta: float
    alpha: float
    r_squared: float

class PerformanceAnalyzer:
    """Analyzes trading performance and generates metrics.
    
    Args:
        initial_capital: Starting capital for the simulation
        risk_free_rate: Risk-free rate for performance calculations
        
    Attributes:
        initial_capital: Starting capital
        risk_free_rate: Risk-free rate
        trades: List of completed trades
        equity_curve: Historical equity values
        benchmark_returns: Benchmark returns for comparison
    """
    
    def __init__(self, initial_capital: float = 100000.0,
                 risk_free_rate: float = 0.02):
        self.initial_capital = initial_capital
        self.risk_free_rate = risk_free_rate
        self.trades: List[TradeMetrics] = []
        self.equity_curve = pd.Series()
        self.benchmark_returns = pd.Series()
    
    def add_trade(self, trade: TradeMetrics):
        """Add a completed trade"""
        self.trades.append(trade)
    
    def set_benchmark_returns(self, returns: pd.Series):
        """Set benchmark returns for comparison"""
        self.benchmark_returns = returns
    
    def calculate_metrics(self) -> PerformanceMetrics:
        """Calculate comprehensive performance metrics.
        
        Returns:
            PerformanceMetrics object containing:
                - total_trades: Number of completed trades
                - winning_trades: Number of winning trades
                - losing_trades: Number of losing trades
                - win_rate: Percentage of winning trades
                - avg_win: Average profit per winning trade
                - avg_loss: Average loss per losing trade
                - largest_win: Largest profit
                - largest_loss: Largest loss
                - avg_holding_time: Average trade duration
                - total_pnl: Total profit and loss
                - net_pnl: Net profit and loss after fees and slippage
                - total_fees: Total fees
                - total_slippage: Total slippage
                - sharpe_ratio: Risk-adjusted return
                - sortino_ratio: Downside risk-adjusted return
                - max_drawdown: Maximum drawdown percentage
                - max_drawdown_duration: Maximum drawdown duration
                - calmar_ratio: Calmar ratio
                - total_return: Total percentage return
                - annualized_return: Annualized return
                - daily_returns: Daily returns
                - monthly_returns: Monthly returns
                - value_at_risk: 95% Value at Risk
                - expected_shortfall: 95% Expected Shortfall
                - information_ratio: Information ratio
                - treynor_ratio: Treynor ratio
                - beta: Beta
                - alpha: Alpha
                - r_squared: R-squared
        """
        if not self.trades:
            return None
        
        # Convert trades to DataFrame
        trades_df = pd.DataFrame([vars(t) for t in self.trades])
        
        # Calculate basic metrics
        total_trades = len(trades_df)
        winning_trades = len(trades_df[trades_df['pnl'] > 0])
        losing_trades = len(trades_df[trades_df['pnl'] <= 0])
        
        # Calculate PnL metrics
        total_pnl = trades_df['pnl'].sum()
        total_fees = trades_df['fees'].sum()
        total_slippage = trades_df['slippage'].sum()
        net_pnl = total_pnl - total_fees - total_slippage
        
        # Calculate returns
        trades_df['cumulative_pnl'] = trades_df['pnl'].cumsum()
        self.equity_curve = self.initial_capital + trades_df['cumulative_pnl']
        
        returns = self.equity_curve.pct_change().dropna()
        
        # Calculate daily and monthly returns
        daily_returns = returns.resample('D').sum()
        monthly_returns = returns.resample('M').sum()
        
        # Calculate risk metrics
        sharpe = self._calculate_sharpe_ratio(returns)
        sortino = self._calculate_sortino_ratio(returns)
        max_dd, max_dd_duration = self._calculate_drawdown_metrics()
        
        # Calculate risk-adjusted metrics
        var_95 = self._calculate_value_at_risk(returns)
        es_95 = self._calculate_expected_shortfall(returns)
        
        # Calculate market metrics
        beta, alpha, r_squared = self._calculate_market_metrics(returns)
        
        return PerformanceMetrics(
            # Basic metrics
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate=winning_trades / total_trades if total_trades > 0 else 0,
            avg_win=trades_df[trades_df['pnl'] > 0]['pnl'].mean(),
            avg_loss=trades_df[trades_df['pnl'] <= 0]['pnl'].mean(),
            largest_win=trades_df['pnl'].max(),
            largest_loss=trades_df['pnl'].min(),
            avg_holding_time=trades_df['holding_period'].mean(),
            
            # PnL metrics
            total_pnl=total_pnl,
            net_pnl=net_pnl,
            total_fees=total_fees,
            total_slippage=total_slippage,
            
            # Risk metrics
            sharpe_ratio=sharpe,
            sortino_ratio=sortino,
            max_drawdown=max_dd,
            max_drawdown_duration=max_dd_duration,
            calmar_ratio=self._calculate_calmar_ratio(returns, max_dd),
            
            # Return metrics
            total_return=(self.equity_curve[-1] - self.initial_capital) / 
                        self.initial_capital,
            annualized_return=self._calculate_annualized_return(returns),
            daily_returns=daily_returns,
            monthly_returns=monthly_returns,
            
            # Risk-adjusted metrics
            value_at_risk=var_95,
            expected_shortfall=es_95,
            information_ratio=self._calculate_information_ratio(returns),
            treynor_ratio=self._calculate_treynor_ratio(returns, beta),
            
            # Market metrics
            beta=beta,
            alpha=alpha,
            r_squared=r_squared
        )
    
    def _calculate_sharpe_ratio(self, returns: pd.Series) -> float:
        """Calculate annualized Sharpe ratio.
        
        Args:
            returns: Series of returns
            
        Returns:
            Sharpe Ratio
        """
        if returns.empty:
            return 0.0
        
        excess_returns = returns - self.risk_free_rate / 252  # Daily risk-free rate
        if excess_returns.std() == 0:
            return 0.0
            
        return np.sqrt(252) * excess_returns.mean() / excess_returns.std()
    
    def _calculate_sortino_ratio(self, returns: pd.Series) -> float:
        """Calculate Sortino ratio using negative returns only.
        
        Args:
            returns: Series of returns
            
        Returns:
            Sortino Ratio
        """
        if returns.empty:
            return 0.0
        
        negative_returns = returns[returns < 0]
        if len(negative_returns) == 0:
            return np.inf
            
        downside_std = np.sqrt(np.mean(negative_returns ** 2))
        if downside_std == 0:
            return 0.0
            
        excess_returns = returns.mean() - self.risk_free_rate / 252
        return np.sqrt(252) * excess_returns / downside_std
    
    def _calculate_drawdown_metrics(self) -> tuple:
        """Calculate maximum drawdown and drawdown duration.
        
        Returns:
            Tuple containing:
                - max_drawdown: Maximum drawdown percentage
                - max_drawdown_duration: Maximum drawdown duration
        """
        if self.equity_curve.empty:
            return 0.0, 0.0
        
        rolling_max = self.equity_curve.expanding().max()
        drawdowns = self.equity_curve - rolling_max
        
        # Maximum drawdown
        max_dd = drawdowns.min()
        
        # Maximum drawdown duration
        dd_start = drawdowns[drawdowns == 0].index
        dd_end = drawdowns[drawdowns == max_dd].index
        
        if len(dd_start) == 0 or len(dd_end) == 0:
            return abs(max_dd), 0.0
            
        max_dd_duration = (dd_end[0] - dd_start[-1]).total_seconds() / 3600
        return abs(max_dd), max_dd_duration
    
    def _calculate_value_at_risk(self, returns: pd.Series,
                               confidence: float = 0.95) -> float:
        """Calculate Value at Risk.
        
        Args:
            returns: Series of returns
            confidence: Confidence level
            
        Returns:
            Value at Risk
        """
        if returns.empty:
            return 0.0
        return abs(np.percentile(returns, (1 - confidence) * 100))
    
    def _calculate_expected_shortfall(self, returns: pd.Series,
                                   confidence: float = 0.95) -> float:
        """Calculate Expected Shortfall (CVaR).
        
        Args:
            returns: Series of returns
            confidence: Confidence level
            
        Returns:
            Expected Shortfall
        """
        if returns.empty:
            return 0.0
        var = self._calculate_value_at_risk(returns, confidence)
        return abs(returns[returns <= -var].mean())
    
    def _calculate_market_metrics(self, returns: pd.Series) -> tuple:
        """Calculate beta, alpha, and R-squared.
        
        Args:
            returns: Series of returns
            
        Returns:
            Tuple containing:
                - beta: Beta
                - alpha: Alpha
                - r_squared: R-squared
        """
        if returns.empty or self.benchmark_returns.empty:
            return 0.0, 0.0, 0.0
        
        # Align returns with benchmark
        aligned_returns = pd.concat(
            [returns, self.benchmark_returns], axis=1
        ).dropna()
        
        if aligned_returns.empty:
            return 0.0, 0.0, 0.0
        
        # Calculate beta
        covar = np.cov(aligned_returns.iloc[:, 0],
                      aligned_returns.iloc[:, 1])[0][1]
        benchmark_var = np.var(aligned_returns.iloc[:, 1])
        beta = covar / benchmark_var if benchmark_var != 0 else 0
        
        # Calculate alpha
        alpha = (returns.mean() - self.risk_free_rate / 252 -
                beta * (self.benchmark_returns.mean() -
                       self.risk_free_rate / 252)) * 252
        
        # Calculate R-squared
        correlation = aligned_returns.corr().iloc[0, 1]
        r_squared = correlation ** 2
        
        return beta, alpha, r_squared
    
    def _calculate_information_ratio(self, returns: pd.Series) -> float:
        """Calculate Information Ratio.
        
        Args:
            returns: Series of returns
            
        Returns:
            Information Ratio
        """
        if returns.empty or self.benchmark_returns.empty:
            return 0.0
        
        excess_returns = returns - self.benchmark_returns
        if excess_returns.std() == 0:
            return 0.0
            
        return np.sqrt(252) * excess_returns.mean() / excess_returns.std()
    
    def _calculate_treynor_ratio(self, returns: pd.Series, beta: float) -> float:
        """Calculate Treynor Ratio.
        
        Args:
            returns: Series of returns
            beta: Beta
            
        Returns:
            Treynor Ratio
        """
        if beta == 0:
            return 0.0
            
        excess_returns = returns.mean() - self.risk_free_rate / 252
        return excess_returns / beta
    
    def _calculate_calmar_ratio(self, returns: pd.Series,
                              max_drawdown: float) -> float:
        """Calculate Calmar Ratio.
        
        Args:
            returns: Series of returns
            max_drawdown: Maximum drawdown
            
        Returns:
            Calmar Ratio
        """
        if max_drawdown == 0:
            return 0.0
            
        return self._calculate_annualized_return(returns) / max_drawdown
    
    def _calculate_annualized_return(self, returns: pd.Series) -> float:
        """Calculate annualized return.
        
        Args:
            returns: Series of returns
            
        Returns:
            Annualized return
        """
        if returns.empty:
            return 0.0
            
        total_days = (returns.index[-1] - returns.index[0]).days
        if total_days == 0:
            return 0.0
            
        total_return = (self.equity_curve[-1] / self.initial_capital) - 1
        return (1 + total_return) ** (365 / total_days) - 1
