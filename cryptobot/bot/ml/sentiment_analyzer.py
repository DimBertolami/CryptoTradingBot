import numpy as np
from textblob import TextBlob
from typing import List, Dict
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

class MarketSentimentAnalyzer:
    def __init__(self):
        self.scaler = MinMaxScaler()
        self.sentiment_history: List[float] = []
        
    def analyze_text_sentiment(self, texts: List[str]) -> float:
        """Analyze sentiment from text data (news, social media, etc.)"""
        sentiments = []
        for text in texts:
            analysis = TextBlob(text)
            sentiments.append(analysis.sentiment.polarity)
        return np.mean(sentiments) if sentiments else 0.0
    
    def analyze_market_data(self, market_data: pd.DataFrame) -> Dict[str, float]:
        """Analyze market indicators for sentiment"""
        # Calculate technical indicators
        market_data['SMA_20'] = market_data['close'].rolling(window=20).mean()
        market_data['SMA_50'] = market_data['close'].rolling(window=50).mean()
        
        # Calculate momentum
        market_data['momentum'] = market_data['close'].pct_change(periods=14)
        
        # Calculate volume trend
        market_data['volume_trend'] = market_data['volume'].pct_change()
        
        latest = market_data.iloc[-1]
        
        sentiment_factors = {
            'trend': 1 if latest['SMA_20'] > latest['SMA_50'] else -1,
            'momentum': latest['momentum'],
            'volume_trend': latest['volume_trend']
        }
        
        # Combine factors into overall market sentiment
        overall_sentiment = (
            sentiment_factors['trend'] * 0.4 +
            np.clip(sentiment_factors['momentum'], -1, 1) * 0.4 +
            np.clip(sentiment_factors['volume_trend'], -1, 1) * 0.2
        )
        
        self.sentiment_history.append(overall_sentiment)
        
        return {
            'overall_sentiment': overall_sentiment,
            'trend_sentiment': sentiment_factors['trend'],
            'momentum_sentiment': sentiment_factors['momentum'],
            'volume_sentiment': sentiment_factors['volume_trend']
        }
    
    def get_sentiment_trend(self) -> float:
        """Get the trend of sentiment over time"""
        if len(self.sentiment_history) < 2:
            return 0.0
        return np.mean(np.diff(self.sentiment_history[-10:]))
    
    def get_market_confidence(self) -> float:
        """Calculate confidence level in current market sentiment"""
        if len(self.sentiment_history) < 10:
            return 0.5
        
        recent_sentiments = self.sentiment_history[-10:]
        sentiment_std = np.std(recent_sentiments)
        sentiment_consistency = 1 / (1 + sentiment_std)  # Higher consistency = lower std
        
        return np.clip(sentiment_consistency, 0, 1)
