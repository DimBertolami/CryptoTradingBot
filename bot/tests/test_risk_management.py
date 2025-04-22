import unittest
import numpy as np
from ..ml.risk_management import RiskManager, RiskLimits

class TestRiskManagement(unittest.TestCase):
    def setUp(self):
        self.risk_manager = RiskManager(initial_capital=100000.0)
    
    def test_initialization(self):
        self.assertEqual(self.risk_manager.initial_capital, 100000.0)
        self.assertEqual(self.risk_manager.current_capital, 100000.0)
        self.assertIsInstance(self.risk_manager.risk_limits, RiskLimits)
    
    def test_position_updates(self):
        # Test adding a valid position
        result = self.risk_manager.update_position('BTC', 1.0, 50000.0)
        self.assertTrue(result['success'])
        self.assertIn('BTC', self.risk_manager.positions)
        
        # Test position size limit
        result = self.risk_manager.update_position('ETH', 100.0, 5000.0)
        self.assertFalse(result['success'])
        self.assertIn('error', result)
    
    def test_risk_metrics(self):
        # Add a position
        self.risk_manager.update_position('BTC', 1.0, 50000.0)
        
        # Get risk metrics
        metrics = self.risk_manager.get_current_risk_metrics()
        
        self.assertIn('drawdown', metrics)
        self.assertIn('exposure', metrics)
        self.assertIn('leverage', metrics)
        self.assertIn('volatility', metrics)
        self.assertIn('var_95', metrics)
    
    def test_volatility_adjustment(self):
        # Test position size adjustment based on volatility
        intended_size = 10000.0
        volatility = 0.02
        
        adjusted_size = self.risk_manager.adjust_position_size(
            intended_size, volatility)
        
        self.assertLess(adjusted_size, intended_size)
        self.assertGreater(adjusted_size, 0)
    
    def test_risk_limits(self):
        # Test updating risk limits
        new_limits = RiskLimits(
            max_position_size=0.05,
            max_drawdown=0.15,
            max_daily_trades=5,
            max_leverage=2.0,
            volatility_threshold=0.02,
            exposure_limit=0.4
        )
        
        self.risk_manager.update_risk_limits(new_limits)
        self.assertEqual(self.risk_manager.risk_limits.max_leverage, 2.0)
        
        # Test invalid limits
        with self.assertRaises(Exception):
            invalid_limits = RiskLimits(
                max_position_size=-0.1,
                max_drawdown=0.15,
                max_daily_trades=5,
                max_leverage=2.0,
                volatility_threshold=0.02,
                exposure_limit=0.4
            )
            self.risk_manager.update_risk_limits(invalid_limits)
    
    def test_exposure_reduction(self):
        # Add positions to approach limits
        self.risk_manager.update_position('BTC', 1.0, 50000.0)
        self.risk_manager.update_position('ETH', 10.0, 3000.0)
        
        # Update volatility
        self.risk_manager.update_market_volatility(
            np.array([0.02, 0.03, 0.04, 0.05]))
        
        # Check if exposure reduction is needed
        should_reduce, reason = self.risk_manager.should_reduce_exposure()
        self.assertIsInstance(should_reduce, bool)
        self.assertIsInstance(reason, str)

if __name__ == '__main__':
    unittest.main()
