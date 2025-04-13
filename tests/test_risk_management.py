import unittest
from unittest.mock import patch, MagicMock
from bot.backend.risk_management.risk_manager import RiskManager
import numpy as np

class TestRiskManager(unittest.TestCase):
    def setUp(self):
        self.config = {
            'max_position_size': 0.1,
            'min_confidence_threshold': 0.7,
            'max_drawdown': 0.05,
            'volatility_window': 20,
            'stop_loss_pct': 0.02,
            'take_profit_pct': 0.05
        }
        self.risk_manager = RiskManager(self.config)

    def test_calculate_position_size(self):
        """Test position size calculation"""
        portfolio_value = 100000.0
        current_price = 100.0
        volatility = 2.0

        position_size = self.risk_manager.calculate_position_size(
            "BTCUSDT",
            current_price,
            portfolio_value,
            volatility
        )

        self.assertGreater(position_size, 0)
        self.assertLessEqual(position_size, portfolio_value * self.config['max_position_size'])

    def test_calculate_stop_loss(self):
        """Test stop-loss calculation"""
        entry_price = 100.0
        position_size = 1000.0
        confidence = 0.8

        stop_loss, take_profit = self.risk_manager.calculate_stop_loss(
            entry_price,
            position_size,
            confidence
        )

        self.assertLess(stop_loss, entry_price)
        self.assertGreater(take_profit, entry_price)

    def test_check_risk_limits(self):
        """Test risk limit checking"""
        portfolio = {
            "BTCUSDT": 10000.0,
            "ETHUSDT": 5000.0
        }

        # Test valid trade
        valid_trade = {
            'symbol': 'BTCUSDT',
            'side': 'BUY',
            'amount': 1000.0,
            'price': 100.0
        }
        self.assertTrue(self.risk_manager.check_risk_limits(portfolio, valid_trade))

        # Test trade that exceeds position size limit
        invalid_trade = {
            'symbol': 'BTCUSDT',
            'side': 'BUY',
            'amount': 50000.0,  # Too large
            'price': 100.0
        }
        self.assertFalse(self.risk_manager.check_risk_limits(portfolio, invalid_trade))

    def test_calculate_risk_metrics(self):
        """Test risk metrics calculation"""
        portfolio = {
            "BTCUSDT": 10000.0,
            "ETHUSDT": 5000.0
        }
        current_prices = {
            "BTCUSDT": 100.0,
            "ETHUSDT": 200.0
        }

        metrics = self.risk_manager.calculate_risk_metrics(portfolio, current_prices)
        
        self.assertGreaterEqual(metrics['portfolio_volatility'], 0)
        self.assertGreaterEqual(metrics['value_at_risk_95'], 0)
        self.assertGreaterEqual(metrics['expected_shortfall'], 0)
        self.assertGreater(metrics['total_value'], 0)

    def test_calculate_trailing_stop(self):
        """Test trailing stop calculation"""
        entry_price = 100.0
        current_price = 110.0
        trailing_stop_pct = 0.01

        trailing_stop = self.risk_manager.calculate_trailing_stop(
            entry_price,
            current_price,
            trailing_stop_pct
        )

        self.assertLess(trailing_stop, current_price)
        self.assertGreater(trailing_stop, entry_price)

if __name__ == '__main__':
    unittest.main()
