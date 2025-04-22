import unittest
from datetime import datetime
from bot.backtesting.backtest_launcher import run_backtest
from bot.strategies.rsi import RSIStrategy
from bot.strategies.macd import MACDStrategy
from bot.strategies.bollinger_bands import BollingerBandsStrategy
import pandas as pd
import numpy as np

class TestBacktestLauncher(unittest.TestCase):
    def setUp(self):
        # Create sample market data
        dates = pd.date_range(start='2025-04-01', end='2025-04-12', freq='1h')
        prices = np.random.normal(50000, 1000, len(dates))
        self.data = pd.DataFrame({
            'timestamp': dates,
            'open': prices * 0.99,
            'high': prices * 1.01,
            'low': prices * 0.98,
            'close': prices,
            'volume': np.random.randint(100, 1000, len(dates))
        })
        self.data.set_index('timestamp', inplace=True)

    def test_rsi_strategy(self):
        """Test RSI Strategy"""
        config = {
            'rsi_period': 14,
            'rsi_overbought': 70,
            'rsi_oversold': 30,
            'symbols': ['BTC/USDT']
        }
        strategy = RSIStrategy(config)
        results = strategy.analyze_market(self.data)
        self.assertIn('signal', results)
        self.assertIn('rsi', results)
        self.assertIn('risk_level', results)

    def test_macd_strategy(self):
        """Test MACD Strategy"""
        config = {
            'fast_window': 12,
            'slow_window': 26,
            'signal_window': 9,
            'symbols': ['BTC/USDT']
        }
        strategy = MACDStrategy(config)
        results = strategy.analyze_market(self.data)
        self.assertIn('signal', results)
        self.assertIn('macd', results)
        self.assertIn('signal_line', results)
        self.assertIn('risk_level', results)

    def test_bollinger_bands_strategy(self):
        """Test Bollinger Bands Strategy"""
        config = {
            'window': 20,
            'num_std': 2,
            'symbols': ['BTC/USDT']
        }
        strategy = BollingerBandsStrategy(config)
        results = strategy.analyze_market(self.data)
        self.assertIn('signal', results)
        self.assertIn('price', results)
        self.assertIn('upper_band', results)
        self.assertIn('lower_band', results)
        self.assertIn('risk_level', results)

    def test_backtest_launcher(self):
        """Test backtest launcher with RSI strategy"""
        args = argparse.Namespace(
            strategy='RSIStrategy',
            timeframe='1h',
            start_date='2025-04-01',
            end_date='2025-04-12',
            capital=100000
        )
        try:
            asyncio.run(run_backtest(args))
        except Exception as e:
            self.fail(f"Backtest launcher failed with error: {str(e)}")

if __name__ == '__main__':
    unittest.main()
