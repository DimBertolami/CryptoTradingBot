import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ..strategies.ml_strategy import MLTradingStrategy

class TestMLTradingStrategy(unittest.TestCase):
    def setUp(self):
        self.strategy = MLTradingStrategy(initial_capital=100000.0)
        
        # Create sample market data
        dates = pd.date_range(start='2025-01-01', periods=100, freq='H')
        self.market_data = pd.DataFrame({
            'open': np.random.normal(100, 1, 100),
            'high': np.random.normal(101, 1, 100),
            'low': np.random.normal(99, 1, 100),
            'close': np.random.normal(100, 1, 100),
            'volume': np.random.normal(1000, 100, 100)
        }, index=dates)
        
        self.news_data = [
            "Bitcoin price shows strong momentum",
            "Market sentiment remains positive"
        ]
    
    def test_market_analysis(self):
        analysis = self.strategy.analyze_market(self.market_data, self.news_data)
        
        self.assertIsInstance(analysis, dict)
        self.assertIn('sentiment_score', analysis)
        self.assertIn('market_sentiment', analysis)
        self.assertIn('pattern_strength', analysis)
        self.assertIn('anomaly_score', analysis)
        self.assertIn('volatility', analysis)
    
    def test_trading_decision(self):
        analysis = self.strategy.analyze_market(self.market_data)
        action, confidence = self.strategy.generate_trading_decision(
            self.market_data, analysis)
        
        self.assertIsInstance(action, int)
        self.assertTrue(0 <= action <= 2)
        self.assertIsInstance(confidence, float)
        self.assertTrue(0 <= confidence <= 1)
    
    def test_position_sizing(self):
        # Test normal case
        size = self.strategy.calculate_position_size(1, 100.0, 0.8)
        self.assertGreater(size, 0)
        self.assertLess(size, self.strategy.risk_manager.current_capital)
        
        # Test with high volatility
        self.strategy.risk_manager.risk_metrics['current_volatility'] = 0.05
        size_volatile = self.strategy.calculate_position_size(1, 100.0, 0.8)
        self.assertLess(size_volatile, size)
    
    def test_trade_execution(self):
        result = self.strategy.execute_trade('BTC', 1, 0.8, 50000.0)
        
        self.assertIsInstance(result, dict)
        self.assertIn('success', result)
        
        if result['success']:
            self.assertIn('action', result)
            self.assertIn('quantity', result)
            self.assertIn('price', result)
            self.assertIn('confidence', result)
            self.assertIn('risk_metrics', result)
    
    def test_strategy_update(self):
        # Execute a trade
        self.strategy.execute_trade('BTC', 1, 0.8, 50000.0)
        
        # Update with profit
        self.strategy.update_strategy(self.market_data, 1000.0)
        
        state = self.strategy.get_strategy_state()
        self.assertGreater(state['performance_metrics']['total_pnl'], 0)
        self.assertEqual(state['performance_metrics']['winning_trades'], 1)
    
    def test_risk_limits(self):
        # Test position size limits
        large_trade = self.strategy.execute_trade('BTC', 1, 1.0, 50000.0)
        self.assertTrue(
            not large_trade['success'] or 
            large_trade['quantity'] * 50000.0 <= 
            self.strategy.risk_manager.current_capital * 
            self.strategy.risk_manager.risk_limits.max_position_size
        )
        
        # Test daily trade limits
        self.strategy.strategy_state['daily_trades'] = \
            self.strategy.risk_manager.risk_limits.max_daily_trades
        limited_trade = self.strategy.execute_trade('BTC', 1, 0.8, 50000.0)
        self.assertFalse(limited_trade['success'])

if __name__ == '__main__':
<<<<<<< HEAD
    unittest.main()
=======
    unittest.main()
>>>>>>> ea1c38704abbb74e8dbb0c9c3275c87e413a456d
