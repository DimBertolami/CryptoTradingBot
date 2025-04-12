from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
from .market_indicators import MarketIndicators

class PerformanceTracker:
    """Tracks and analyzes strategy performance"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.performance_data = {
            'trades': [],
            'metrics': {},
            'strategy_performance': {}
        }
        self.risk_metrics = self._initialize_risk_metrics()
        
    def _initialize_risk_metrics(self) -> Dict:
        """Initialize risk metrics for tracking"""
        return {
            'max_drawdown': 0,
            'current_drawdown': 0,
            'sharpe_ratio': 0,
            'sortino_ratio': 0,
            'win_rate': 0,
            'avg_profit': 0,
            'avg_loss': 0,
            'profit_factor': 0
        }
        
    def record_trade(self, trade: Dict) -> None:
        """Record a trade and update performance metrics"""
        self.performance_data['trades'].append(trade)
        self._update_performance_metrics(trade)
        
    def _update_performance_metrics(self, trade: Dict) -> None:
        """Update performance metrics based on trade results"""
        if trade['type'] == 'sell':
            # Calculate trade result
            entry_price = trade['entry_price']
            exit_price = trade['price']
            quantity = trade['quantity']
            
            pnl = (exit_price - entry_price) * quantity
            
            # Update risk metrics
            self._update_risk_metrics(pnl)
            
            # Update strategy performance
            self._update_strategy_performance(trade['strategy'], pnl)
            
    def _update_risk_metrics(self, pnl: float) -> None:
        """Update risk management metrics"""
        # Update drawdown
        if pnl < 0:
            self.risk_metrics['current_drawdown'] += abs(pnl)
            self.risk_metrics['max_drawdown'] = max(
                self.risk_metrics['max_drawdown'],
                self.risk_metrics['current_drawdown']
            )
        else:
            self.risk_metrics['current_drawdown'] = 0
            
        # Update win rate
        if pnl > 0:
            self.risk_metrics['win_rate'] = (
                self.risk_metrics.get('win_count', 0) + 1
            ) / (self.risk_metrics.get('total_trades', 0) + 1)
            
        # Update average profit/loss
        self.risk_metrics['avg_profit'] = np.mean(
            [t['pnl'] for t in self.performance_data['trades'] if t['pnl'] > 0]
        )
        self.risk_metrics['avg_loss'] = np.mean(
            [t['pnl'] for t in self.performance_data['trades'] if t['pnl'] < 0]
        )
        
        # Update profit factor
        self.risk_metrics['profit_factor'] = (
            abs(self.risk_metrics['avg_profit']) / 
            abs(self.risk_metrics['avg_loss'])
        ) if self.risk_metrics['avg_loss'] != 0 else 0
        
    def _update_strategy_performance(self, strategy: str, pnl: float) -> None:
        """Update performance metrics for specific strategy"""
        if strategy not in self.performance_data['strategy_performance']:
            self.performance_data['strategy_performance'][strategy] = {
                'trades': 0,
                'total_pnl': 0,
                'win_rate': 0,
                'avg_pnl': 0,
                'max_drawdown': 0,
                'current_drawdown': 0
            }
            
        strategy_metrics = self.performance_data['strategy_performance'][strategy]
        
        # Update trade count and P&L
        strategy_metrics['trades'] += 1
        strategy_metrics['total_pnl'] += pnl
        
        # Update win rate
        if pnl > 0:
            strategy_metrics['win_rate'] = (
                strategy_metrics.get('win_count', 0) + 1
            ) / strategy_metrics['trades']
            
        # Update drawdown
        if pnl < 0:
            strategy_metrics['current_drawdown'] += abs(pnl)
            strategy_metrics['max_drawdown'] = max(
                strategy_metrics['max_drawdown'],
                strategy_metrics['current_drawdown']
            )
        else:
            strategy_metrics['current_drawdown'] = 0
            
        # Update average P&L
        strategy_metrics['avg_pnl'] = strategy_metrics['total_pnl'] / strategy_metrics['trades']
        
    def get_performance_report(self) -> Dict:
        """Generate comprehensive performance report"""
        report = {
            'overall': self._generate_overall_metrics(),
            'by_strategy': self._generate_strategy_metrics(),
            'risk_metrics': self.risk_metrics,
            'recent_trades': self._get_recent_trades()
        }
        return report
        
    def _generate_overall_metrics(self) -> Dict:
        """Generate overall performance metrics"""
        trades = self.performance_data['trades']
        if not trades:
            return {}
            
        total_pnl = sum(t['pnl'] for t in trades)
        total_trades = len(trades)
        win_trades = sum(1 for t in trades if t['pnl'] > 0)
        
        return {
            'total_trades': total_trades,
            'total_pnl': total_pnl,
            'win_rate': win_trades / total_trades if total_trades > 0 else 0,
            'avg_pnl': total_pnl / total_trades if total_trades > 0 else 0,
            'sharpe_ratio': self._calculate_sharpe_ratio(),
            'sortino_ratio': self._calculate_sortino_ratio()
        }
        
    def _generate_strategy_metrics(self) -> Dict:
        """Generate performance metrics by strategy"""
        return self.performance_data['strategy_performance']
        
    def _get_recent_trades(self, n: int = 10) -> List[Dict]:
        """Get recent trades"""
        return self.performance_data['trades'][-n:]
        
    def _calculate_sharpe_ratio(self) -> float:
        """Calculate Sharpe ratio"""
        trades = self.performance_data['trades']
        if not trades:
            return 0
            
        returns = [t['pnl'] / t['entry_price'] for t in trades]
        mean_return = np.mean(returns)
        std_dev = np.std(returns)
        
        return mean_return / std_dev if std_dev != 0 else 0
        
    def _calculate_sortino_ratio(self) -> float:
        """Calculate Sortino ratio (focuses on downside risk)"""
        trades = self.performance_data['trades']
        if not trades:
            return 0
            
        returns = [t['pnl'] / t['entry_price'] for t in trades]
        mean_return = np.mean(returns)
        
        # Calculate downside deviation
        downside_returns = [r for r in returns if r < 0]
        if not downside_returns:
            return 0
            
        downside_dev = np.std(downside_returns)
        
        return mean_return / downside_dev if downside_dev != 0 else 0
