import unittest
import pandas as pd
import numpy as np
from ..ml.sentiment_analyzer import MarketSentimentAnalyzer

class TestMarketSentimentAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = MarketSentimentAnalyzer()
        self.sample_data = pd.DataFrame({
            'close': [100, 101, 99, 102, 103],
            'volume': [1000, 1100, 900, 1200, 1300],
            'open': [99, 100, 100, 101, 102]
        })
    
    def test_text_sentiment_analysis(self):
        texts = [
            "Bitcoin price surges to new highs",
            "Market shows strong bullish signals",
            "Concerns over market volatility"
        ]
        sentiment = self.analyzer.analyze_text_sentiment(texts)
        self.assertIsInstance(sentiment, float)
        self.assertTrue(-1 <= sentiment <= 1)
    
    def test_market_data_analysis(self):
        result = self.analyzer.analyze_market_data(self.sample_data)
        self.assertIsInstance(result, dict)
        self.assertTrue('overall_sentiment' in result)
        self.assertTrue('trend_sentiment' in result)
        self.assertTrue(-1 <= result['overall_sentiment'] <= 1)
    
    def test_sentiment_trend(self):
        # Add some sentiment history
        self.analyzer.sentiment_history = [0.1, 0.2, 0.3, 0.2, 0.4]
        trend = self.analyzer.get_sentiment_trend()
        self.assertIsInstance(trend, float)
    
    def test_market_confidence(self):
        # Add some sentiment history
        self.analyzer.sentiment_history = [0.5, 0.6, 0.5, 0.7, 0.6]
        confidence = self.analyzer.get_market_confidence()
        self.assertIsInstance(confidence, float)
        self.assertTrue(0 <= confidence <= 1)

if __name__ == '__main__':
    unittest.main()
