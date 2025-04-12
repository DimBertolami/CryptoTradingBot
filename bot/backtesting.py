from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from .strategy_selector import StrategySelector
from .performance_tracker import PerformanceTracker
from .risk_manager import RiskManager
from .advanced_optimization import AdvancedOptimization

class BacktestingSystem:
    """Backtesting system for trading strategies"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.strategy_selector = StrategySelector(config)
        self.performance_tracker = PerformanceTracker(config)
        self.risk_manager = RiskManager(config)
        self.optimizer = AdvancedOptimization(config)
        
        self.results = {
            'performance': [],
            'trades': [],
            'metrics': {},
            'strategy_performance': {},
            'risk_metrics': {}
        }
        
    def run_backtest(self, historical_data: pd.DataFrame, 
                    start_date: datetime, end_date: datetime) -> Dict:
        """Run backtest over specified period"""
        current_date = start_date
        
        while current_date <= end_date:
            # Get market data for current date
            market_data = self._get_market_data(historical_data, current_date)
            
            # Select strategy based on market conditions
            selected_strategy = self.strategy_selector.select_strategy(market_data)
            
            # Generate trading signals
            signals = self._generate_signals(selected_strategy, market_data)
            
            # Optimize portfolio
            optimized_weights = self.optimizer.multi_objective_optimization(
                signals, market_data
            )
            
            # Execute trades and track performance
            self._execute_trades(signals, optimized_weights, market_data)
            
            # Update risk metrics
            self._update_risk_metrics(signals, market_data)
            
            # Move to next date
            current_date += timedelta(days=1)
            
        # Generate final report
        return self._generate_backtest_report()
        
    def _get_market_data(self, historical_data: pd.DataFrame, 
                        current_date: datetime) -> pd.DataFrame:
        """Get market data for current date"""
        # Get data up to current date
        mask = historical_data.index <= current_date
        return historical_data[mask]
        
    def _generate_signals(self, strategy: str, market_data: pd.DataFrame) -> Dict:
        """Generate trading signals for selected strategy"""
        # Get strategy instance
        strategy_class = self.strategy_selector.get_strategy(strategy)
        
        # Generate signals
        signals = strategy_class.generate_signals(market_data)
        
        return signals
        
    def _execute_trades(self, signals: Dict, weights: Dict, market_data: pd.DataFrame) -> None:
        """Execute trades and track performance"""
        for strategy, signal_list in signals.items():
            for signal in signal_list:
                # Adjust position size based on weights
                signal['position_size'] *= weights[strategy]
                
                # Validate trade
                if self.risk_manager.validate_trade(signal, market_data):
                    # Execute trade
                    self._execute_trade(signal)
                    
                    # Track performance
                    self.performance_tracker.record_trade(signal)
        
    def _execute_trade(self, signal: Dict) -> None:
        """Execute a single trade"""
        # Simulate trade execution
        trade = {
            'type': signal['type'],
            'price': signal['price'],
            'quantity': signal['quantity'],
            'position_size': signal['position_size'],
            'strategy': signal['strategy'],
            'timestamp': signal['timestamp']
        }
        
        self.results['trades'].append(trade)
        
    def _update_risk_metrics(self, signals: Dict, market_data: pd.DataFrame) -> None:
        """Update risk metrics"""
        # Get current risk level
        risk_level = self.risk_manager.get_risk_metrics()
        
        # Get ML risk predictions
        ml_risk = self.risk_manager.ml_risk_predictor.predict_risk(market_data)
        
        self.results['risk_metrics'][market_data.index[-1]] = {
            'risk_level': risk_level,
            'ml_risk': ml_risk
        }
        
    def _generate_backtest_report(self) -> Dict:
        """Generate comprehensive backtest report"""
        # Get performance metrics
        performance = self.performance_tracker.get_performance_report()
        
        # Get risk metrics
        risk_metrics = self.results['risk_metrics']
        
        # Get strategy performance
        strategy_performance = self.performance_tracker.strategy_performance
        
        return {
            'performance': performance,
            'risk_metrics': risk_metrics,
            'strategy_performance': strategy_performance,
            'trades': self.results['trades'],
            'metrics': {
                'total_trades': len(self.results['trades']),
                'total_pnl': sum(t['pnl'] for t in self.results['trades']),
                'max_drawdown': max(
                    m['risk_level']['max_drawdown'] for m in risk_metrics.values()
                ),
                'sharpe_ratio': performance['metrics']['sharpe_ratio'],
                'sortino_ratio': performance['metrics']['sortino_ratio']
            }
        }
        
    def get_backtest_analysis(self) -> Dict:
        """Get detailed backtest analysis"""
        return {
            'performance': self._analyze_performance(),
            'risk': self._analyze_risk(),
            'strategy': self._analyze_strategies(),
            'market_conditions': self._analyze_market_conditions()
        }
        
    def _analyze_performance(self) -> Dict:
        """Analyze performance metrics"""
        trades = self.results['trades']
        if not trades:
            return {}
            
        returns = [t['pnl'] / t['entry_price'] for t in trades]
        
        return {
            'annualized_return': np.mean(returns) * 252,
            'volatility': np.std(returns) * np.sqrt(252),
            'win_rate': sum(1 for r in returns if r > 0) / len(returns),
            'avg_profit': np.mean([r for r in returns if r > 0]),
            'avg_loss': abs(np.mean([r for r in returns if r < 0]))
        }
        
    def _analyze_risk(self) -> Dict:
        """Analyze risk metrics"""
        risk_metrics = self.results['risk_metrics'].values()
        
        return {
            'avg_risk_level': np.mean([m['risk_level'] for m in risk_metrics]),
            'max_drawdown': max(m['risk_level']['max_drawdown'] for m in risk_metrics),
            'avg_ml_confidence': np.mean([m['ml_risk']['confidence'] for m in risk_metrics]),
            'volatility': np.std([m['ml_risk']['expected_volatility'] for m in risk_metrics])
        }
        
    def _analyze_strategies(self) -> Dict:
        """Analyze strategy performance"""
        strategy_performance = {}
        
        for strategy, metrics in self.results['strategy_performance'].items():
            strategy_performance[strategy] = {
                'total_trades': metrics['trades'],
                'total_pnl': metrics['total_pnl'],
                'win_rate': metrics['win_rate'],
                'avg_pnl': metrics['avg_pnl'],
                'max_drawdown': metrics['max_drawdown']
            }
            
        return strategy_performance
        
    def _analyze_market_conditions(self) -> Dict:
        """Analyze market conditions during backtest"""
        market_conditions = {}
        
        for date, metrics in self.results['risk_metrics'].items():
            regime = metrics['ml_risk']['risk_class']
            
            if regime not in market_conditions:
                market_conditions[regime] = {
                    'duration': 0,
                    'trades': 0,
                    'pnl': 0
                }
                
            market_conditions[regime]['duration'] += 1
            
            # Count trades during this regime
            trades = [t for t in self.results['trades'] 
                     if t['timestamp'].date() == date]
            market_conditions[regime]['trades'] += len(trades)
            
            # Calculate P&L during this regime
            pnl = sum(t['pnl'] for t in trades)
            market_conditions[regime]['pnl'] += pnl
            
        return market_conditions
