import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
import pandas as pd
from bot.backend.paper_trading.metrics import PaperTradingMetrics

class TestPaperTradingMetrics(unittest.TestCase):
    def setUp(self):
        self.metrics = PaperTradingMetrics()
        
    def test_initial_metrics(self):
        """Test that metrics are initialized correctly"""
        self.assertEqual(self.metrics.metrics["total_trades"], 0)
        self.assertEqual(self.metrics.metrics["winning_trades"], 0)
        self.assertEqual(self.metrics.metrics["losing_trades"], 0)
        self.assertEqual(self.metrics.metrics["win_rate"], 0.0)
        self.assertEqual(self.metrics.metrics["initial_capital"], 100000.0)
        self.assertEqual(self.metrics.metrics["sharpe_ratio"], 0.0)
        self.assertEqual(self.metrics.metrics["sortino_ratio"], 0.0)
        self.assertEqual(self.metrics.metrics["volatility"], 0.0)

    def test_update_metrics(self):
        """Test updating metrics with trade results"""
        trade_result = {
            "profit": 100.0,
            "entry_price": 1000.0,
            "exit_price": 1100.0,
            "symbol": "BTCUSDT",
            "timestamp": datetime.now()
        }
        
        self.metrics.update_metrics(trade_result)
        
        self.assertEqual(self.metrics.metrics["total_trades"], 1)
        self.assertEqual(self.metrics.metrics["winning_trades"], 1)
        self.assertEqual(self.metrics.metrics["losing_trades"], 0)
        self.assertEqual(self.metrics.metrics["win_rate"], 100.0)
        self.assertEqual(self.metrics.metrics["average_profit"], 100.0)
        self.assertEqual(self.metrics.metrics["average_loss"], 0.0)

    def test_equity_curve(self):
        """Test equity curve calculation"""
        # Add trades
        self.metrics.update_metrics({"profit": 1000.0, "entry_price": 1000.0})
        self.metrics.update_metrics({"profit": -500.0, "entry_price": 1000.0})
        
        # Get metrics summary
        summary = self.metrics.get_metrics_summary()
        
        # Check equity curve
        self.assertEqual(summary["basic_metrics"]["total_trades"], 2)
        self.assertEqual(summary["basic_metrics"]["win_rate"], "50.00%")
        self.assertNotEqual(summary["advanced_metrics"]["volatility"], "0.00%")  # Should have some volatility
        self.assertEqual(len(self.metrics.equity_curve), 3)  # Initial capital + 2 trades

    def test_metrics_summary(self):
        """Test metrics summary with multiple trades"""
        # Add multiple trades
        self.metrics.update_metrics({"profit": 100.0, "entry_price": 1000.0})
        self.metrics.update_metrics({"profit": 200.0, "entry_price": 1000.0})
        self.metrics.update_metrics({"profit": -50.0, "entry_price": 1000.0})
        
        # Get metrics summary
        summary = self.metrics.get_metrics_summary()
        
        # Check basic metrics
        self.assertEqual(summary["basic_metrics"]["total_trades"], 3)
        self.assertEqual(summary["basic_metrics"]["win_rate"], "66.67%")
        self.assertGreater(float(summary["basic_metrics"]["average_profit"]), 0)
        self.assertLess(float(summary["basic_metrics"]["average_loss"]), 0)
        
        # Check advanced metrics
        sharpe_ratio = float(summary["advanced_metrics"]["sharpe_ratio"]) if "%" not in summary["advanced_metrics"]["sharpe_ratio"] else float(summary["advanced_metrics"]["sharpe_ratio"][0:-1])
        sortino_ratio = float(summary["advanced_metrics"]["sortino_ratio"]) if "%" not in summary["advanced_metrics"]["sortino_ratio"] else float(summary["advanced_metrics"]["sortino_ratio"][0:-1])
        volatility = float(summary["advanced_metrics"]["volatility"]) if "%" not in summary["advanced_metrics"]["volatility"] else float(summary["advanced_metrics"]["volatility"][0:-1])
        
        self.assertGreater(sharpe_ratio, 0)
        self.assertGreaterEqual(sortino_ratio, 0)  # Sortino can be 0 or inf
        self.assertGreater(volatility, 0)
        
        # Check risk metrics
        drawdown = float(summary["risk_metrics"]["max_drawdown"][0:-1])
        max_profit = float(summary["risk_metrics"]["max_profit"])
        max_loss = float(summary["risk_metrics"]["max_loss"])
        
        self.assertGreaterEqual(drawdown, 0)
        self.assertGreater(max_profit, 0)
        self.assertLess(max_loss, 0)

    def test_calculate_metrics(self):
        """Test calculation of advanced metrics"""
        # Add some trades
        self.metrics.update_metrics({"profit": 100.0, "entry_price": 1000.0})
        self.metrics.update_metrics({"profit": 200.0, "entry_price": 1000.0})
        self.metrics.update_metrics({"profit": -50.0, "entry_price": 1000.0})
        
        metrics = self.metrics.get_metrics_summary()
        
        # Convert percentages to floats before comparing
        sharpe_ratio = float(metrics["advanced_metrics"]["sharpe_ratio"]) if "%" not in metrics["advanced_metrics"]["sharpe_ratio"] else float(metrics["advanced_metrics"]["sharpe_ratio"][0:-1])
        sortino_ratio = float(metrics["advanced_metrics"]["sortino_ratio"]) if "%" not in metrics["advanced_metrics"]["sortino_ratio"] else float(metrics["advanced_metrics"]["sortino_ratio"][0:-1])
        volatility = float(metrics["advanced_metrics"]["volatility"]) if "%" not in metrics["advanced_metrics"]["volatility"] else float(metrics["advanced_metrics"]["volatility"][0:-1])
        drawdown = float(metrics["risk_metrics"]["max_drawdown"][0:-1])
        
        self.assertGreater(sharpe_ratio, 0)
        self.assertGreaterEqual(sortino_ratio, 0)  # Sortino can be 0 or inf
        self.assertGreater(volatility, 0)
        self.assertGreaterEqual(drawdown, 0)

if __name__ == '__main__':
    unittest.main()
