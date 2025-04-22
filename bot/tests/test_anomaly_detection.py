import unittest
import pandas as pd
import numpy as np
from ..ml.anomaly_detection import MarketAnomalyDetector

class TestMarketAnomalyDetector(unittest.TestCase):
    def setUp(self):
        self.detector = MarketAnomalyDetector()
        # Create sample data with known anomaly
        self.sample_data = pd.DataFrame({
            'close': [100, 101, 102, 150, 103],  # 150 is anomalous
            'high': [102, 103, 104, 155, 105],
            'low': [98, 99, 100, 145, 101],
            'open': [99, 100, 101, 148, 102],
            'volume': [1000, 1100, 1050, 5000, 1200]  # 5000 is anomalous
        })
    
    def test_prepare_features(self):
        features = self.detector.prepare_features(self.sample_data)
        self.assertIsInstance(features, pd.DataFrame)
        self.assertTrue('returns' in features.columns)
        self.assertTrue('volatility' in features.columns)
        self.assertTrue('volume_change' in features.columns)
    
    def test_detect_anomalies(self):
        result = self.detector.detect_anomalies(self.sample_data)
        self.assertIsInstance(result, dict)
        self.assertTrue('is_anomaly' in result)
        self.assertTrue('anomaly_score' in result)
        self.assertTrue('feature_contributions' in result)
    
    def test_get_feature_contributions(self):
        features = self.detector.prepare_features(self.sample_data)
        contributions = self.detector.get_feature_contributions(features.iloc[-1])
        self.assertIsInstance(contributions, dict)
        self.assertTrue(all(0 <= v <= 1 for v in contributions.values()))
        self.assertAlmostEqual(sum(contributions.values()), 1.0, places=5)
    
    def test_historical_context(self):
        # Add some anomalies to history
        self.detector.historical_anomalies = [
            {'timestamp': pd.Timestamp.now(), 'score': -0.5, 
             'features': {'returns': 0.1, 'volume_change': 2.0}}
        ]
        context = self.detector.get_historical_context()
        self.assertIsInstance(context, dict)
        self.assertTrue('count' in context)
        self.assertTrue('avg_score' in context)

if __name__ == '__main__':
    unittest.main()
