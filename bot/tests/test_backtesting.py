import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import asyncio
import os
import sys

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backtesting.data_handler import DataHandler
from backtesting.performance_metrics import (
    PerformanceAnalyzer, TradeMetrics
)
from backtesting.backtest_engine import BacktestEngine
from strategies.ml_strategy import MLTradingStrategy
from execution.order_types import (
    OrderRequest, OrderResponse, OrderType, OrderSide
)

class TestDataHandler(unittest.TestCase):
    """Test data handling functionality"""
    
    def setUp(self):
        self.data_handler = DataHandler(testnet=True)
        self.symbol = "BTCUSDT"
    
    def test_initialization(self):
        async def run_test():
            success = await self.data_handler.initialize()
            self.assertTrue(success)
            self.assertIsNotNone(self.data_handler.exchange)
        
        asyncio.run(run_test())
    
    def test_historical_data(self):
        async def run_test():
            # Test fetching 1 day of minute data
            start_time = datetime.now() - timedelta(days=1)
            end_time = datetime.now()
            
            df = await self.data_handler.fetch_historical_data(
                self.symbol, start_time, end_time, '1m')
            
            self.assertIsInstance(df, pd.DataFrame)
            self.assertGreater(len(df), 0)
            self.assertTrue(all(col in df.columns for col in [
                'open', 'high', 'low', 'close', 'volume'
            ]))
            
            # Verify data integrity
            self.assertTrue(df.index.is_monotonic_increasing)
            self.assertFalse(df.isnull().any().any())
        
        asyncio.run(run_test())
    
    def test_real_time_feed(self):
        async def run_test():
            # Setup callback to verify data
            received_data = []
            
            async def callback(data):
                received_data.append(data)
            
            # Start real-time feed
            await self.data_handler.start_real_time_feed([self.symbol])
            self.data_handler.subscribe(callback)
            
            # Wait for some data
            await asyncio.sleep(5)
            
            # Verify we received data
            self.assertGreater(len(received_data), 0)
            self.assertIn('s', received_data[0])  # Symbol
            self.assertIn('E', received_data[0])  # Event time
            
            await self.data_handler.close()
        
        asyncio.run(run_test())

class TestPerformanceMetrics(unittest.TestCase):
    """Test performance metrics calculations"""
    
    def setUp(self):
        self.analyzer = PerformanceAnalyzer(initial_capital=100000.0)
        
        # Create sample trades
        self.trades = [
            TradeMetrics(
                entry_time=datetime.now() - timedelta(days=1),
                exit_time=datetime.now(),
                symbol="BTCUSDT",
                side="buy",
                entry_price=50000.0,
                exit_price=51000.0,
                quantity=1.0,
                pnl=1000.0,
                fees=50.0,
                slippage=25.0,
                holding_period=24.0,
                return_pct=0.02
            ),
            TradeMetrics(
                entry_time=datetime.now() - timedelta(days=2),
                exit_time=datetime.now() - timedelta(days=1),
                symbol="BTCUSDT",
                side="sell",
                entry_price=52000.0,
                exit_price=51500.0,
                quantity=1.0,
                pnl=500.0,
                fees=50.0,
                slippage=25.0,
                holding_period=24.0,
                return_pct=0.01
            )
        ]
        
        for trade in self.trades:
            self.analyzer.add_trade(trade)
    
    def test_basic_metrics(self):
        metrics = self.analyzer.calculate_metrics()
        
        self.assertEqual(metrics.total_trades, 2)
        self.assertEqual(metrics.winning_trades, 2)
        self.assertEqual(metrics.losing_trades, 0)
        self.assertEqual(metrics.win_rate, 1.0)
        
        self.assertGreater(metrics.total_pnl, 0)
        self.assertGreater(metrics.net_pnl, 0)
        self.assertGreater(metrics.total_fees, 0)
        self.assertGreater(metrics.total_slippage, 0)
    
    def test_risk_metrics(self):
        metrics = self.analyzer.calculate_metrics()
        
        self.assertIsNotNone(metrics.sharpe_ratio)
        self.assertIsNotNone(metrics.sortino_ratio)
        self.assertIsNotNone(metrics.max_drawdown)
        self.assertIsNotNone(metrics.value_at_risk)
        self.assertIsNotNone(metrics.expected_shortfall)
    
    def test_return_metrics(self):
        metrics = self.analyzer.calculate_metrics()
        
        self.assertGreater(metrics.total_return, 0)
        self.assertGreater(metrics.annualized_return, 0)
        self.assertIsInstance(metrics.daily_returns, pd.Series)
        self.assertIsInstance(metrics.monthly_returns, pd.Series)

class TestBacktestEngine(unittest.TestCase):
    """Test backtesting engine functionality"""
    
    def setUp(self):
        self.engine = BacktestEngine(
            strategy_class=MLTradingStrategy,
            symbols=["BTCUSDT"],
            initial_capital=100000.0,
            commission_rate=0.001,
            slippage_model='basic'
        )
    
    def test_historical_backtest(self):
        async def run_test():
            # Run 1-day backtest
            start_time = datetime.now() - timedelta(days=1)
            end_time = datetime.now()
            
            results = await self.engine.run_historical(
                start_time, end_time, '1m')
            
            # Verify results structure
            self.assertIn('metrics', results)
            self.assertIn('equity_curve', results)
            self.assertIn('trades', results)
            self.assertIn('positions', results)
            
            # Verify equity curve
            equity_curve = results['equity_curve']
            self.assertIsInstance(equity_curve, pd.DataFrame)
            self.assertGreater(len(equity_curve), 0)
            
            # Verify metrics
            metrics = results['metrics']
            self.assertIsNotNone(metrics.total_trades)
            self.assertIsNotNone(metrics.sharpe_ratio)
            self.assertIsNotNone(metrics.max_drawdown)
        
        asyncio.run(run_test())
    
    def test_order_execution(self):
        # Test market order execution
        order = OrderRequest(
            symbol="BTCUSDT",
            side=OrderSide.BUY,
            order_type=OrderType.MARKET,
            quantity=1.0,
            price=None
        )
        
        # Verify order processing
        current_data = {
            "BTCUSDT": pd.Series({
                'open': 50000.0,
                'high': 51000.0,
                'low': 49000.0,
                'close': 50500.0,
                'volume': 100.0
            })
        }
        
        fill_price = self.engine._calculate_fill_price(
            order, current_data["BTCUSDT"])
        self.assertEqual(fill_price, 50500.0)
        
        # Verify fee calculation
        fees = self.engine._calculate_fees(order.quantity, fill_price)
        self.assertEqual(fees, fill_price * 0.001)
        
        # Verify slippage calculation
        slippage = self.engine._calculate_slippage(
            order, fill_price, current_data["BTCUSDT"])
        self.assertGreater(slippage, 0)
    
    def test_portfolio_updates(self):
        # Test position updates
        order = OrderRequest(
            symbol="BTCUSDT",
            side=OrderSide.BUY,
            order_type=OrderType.MARKET,
            quantity=1.0,
            price=None
        )
        
        fill_price = 50000.0
        costs = 50.0
        
        # Update position
        self.engine._update_position(order, fill_price, costs)
        
        # Verify position
        self.assertIn("BTCUSDT", self.engine.positions)
        position = self.engine.positions["BTCUSDT"]
        self.assertEqual(position['quantity'], 1.0)
        self.assertEqual(position['average_price'], fill_price)
        
        # Verify capital update
        expected_capital = 100000.0 - (fill_price + costs)
        self.assertEqual(self.engine.current_capital, expected_capital)

class TestStrategyIntegration(unittest.TestCase):
    """Test integration with ML trading strategy"""
    
    def setUp(self):
        self.engine = BacktestEngine(
            strategy_class=MLTradingStrategy,
            symbols=["BTCUSDT"],
            initial_capital=100000.0
        )
        self.strategy = MLTradingStrategy()
    
    def test_strategy_signals(self):
        async def run_test():
            # Get some historical data
            start_time = datetime.now() - timedelta(days=1)
            end_time = datetime.now()
            
            data = await self.engine.data_handler.fetch_historical_data(
                "BTCUSDT", start_time, end_time, '1m')
            
            # Test strategy analysis
            market_data = {"BTCUSDT": data.iloc[-1]}
            analysis = self.strategy.analyze_market(market_data)
            
            self.assertIsInstance(analysis, dict)
            self.assertGreaterEqual(len(analysis), 1)
        
        asyncio.run(run_test())
    
    def test_end_to_end_backtest(self):
        async def run_test():
            # Run 1-week backtest
            start_time = datetime.now() - timedelta(days=7)
            end_time = datetime.now()
            
            results = await self.engine.run_historical(
                start_time, end_time, '1m')
            
            # Verify strategy execution
            self.assertGreater(len(results['trades']), 0)
            self.assertGreater(
                results['metrics'].total_trades, 0)
            
            # Verify risk management
            self.assertLess(
                abs(results['metrics'].max_drawdown),
                self.engine.initial_capital * 0.1  # Max 10% drawdown
            )
        
        asyncio.run(run_test())

if __name__ == '__main__':
    unittest.main()
