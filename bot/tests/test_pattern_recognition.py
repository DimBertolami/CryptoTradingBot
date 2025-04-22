import unittest
import pandas as pd
import numpy as np
from ..ml.pattern_recognition import PatternRecognition

class TestPatternRecognition(unittest.TestCase):
    def setUp(self):
        self.pattern_recognition = PatternRecognition()
        self.sample_data = pd.DataFrame({
            'open': [100, 102, 101, 103, 102],
            'high': [105, 106, 104, 108, 106],
            'low': [98, 100, 99, 101, 100],
            'close': [102, 101, 103, 102, 104],
            'volume': [1000, 1100, 900, 1200, 1100]
        })
    
    def test_detect_candlestick_patterns(self):
        patterns = self.pattern_recognition.detect_candlestick_patterns(self.sample_data)
        self.assertIsInstance(patterns, dict)
        self.assertTrue(any(key in patterns for key in ['doji', 'hammer', 'shooting_star']))
    
    def test_detect_technical_patterns(self):
        patterns = self.pattern_recognition.detect_technical_patterns(self.sample_data)
        self.assertIsInstance(patterns, dict)
        self.assertTrue(any(key in patterns for key in ['golden_cross', 'death_cross']))
    
    def test_calculate_pattern_strength(self):
        strength = self.pattern_recognition.calculate_pattern_strength(self.sample_data)
        self.assertIsInstance(strength, dict)
        for value in strength.values():
            self.assertTrue(0 <= value <= 1)
    
    def test_get_trading_signals(self):
        signals = self.pattern_recognition.get_trading_signals(self.sample_data)
        self.assertIsInstance(signals, dict)
        self.assertTrue('signal_strength' in signals)
        self.assertTrue('patterns_detected' in signals)
        self.assertTrue('bullish_strength' in signals)
        self.assertTrue('bearish_strength' in signals)

if __name__ == '__main__':
    unittest.main()
