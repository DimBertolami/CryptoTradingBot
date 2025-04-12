import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

class MarketAnomalyDetector:
    def __init__(self):
        self.isolation_forest = IsolationForest(
            contamination=0.1,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.historical_anomalies: List[Dict] = []
        
    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for anomaly detection"""
        features = pd.DataFrame()
        
        # Price-based features
        features['returns'] = df['close'].pct_change()
        features['volatility'] = features['returns'].rolling(window=20).std()
        features['price_range'] = (df['high'] - df['low']) / df['low']
        
        # Volume-based features
        features['volume_change'] = df['volume'].pct_change()
        features['volume_ma_ratio'] = df['volume'] / df['volume'].rolling(window=20).mean()
        
        # Technical indicators
        features['rsi'] = self.calculate_rsi(df['close'])
        features['macd'] = self.calculate_macd(df['close'])
        
        # Drop NaN values
        features = features.dropna()
        
        return features
    
    def calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate Relative Strength Index"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
    
    def calculate_macd(self, prices: pd.Series) -> pd.Series:
        """Calculate MACD line"""
        exp1 = prices.ewm(span=12, adjust=False).mean()
        exp2 = prices.ewm(span=26, adjust=False).mean()
        return exp1 - exp2
    
    def detect_anomalies(self, df: pd.DataFrame) -> Dict[str, any]:
        """Detect market anomalies using Isolation Forest"""
        features = self.prepare_features(df)
        
        # Scale features
        scaled_features = self.scaler.fit_transform(features)
        
        # Fit and predict
        anomaly_labels = self.isolation_forest.fit_predict(scaled_features)
        anomaly_scores = self.isolation_forest.score_samples(scaled_features)
        
        # Get the most recent anomaly score
        latest_score = anomaly_scores[-1]
        is_anomaly = anomaly_labels[-1] == -1
        
        # Store anomaly if detected
        if is_anomaly:
            self.historical_anomalies.append({
                'timestamp': df.index[-1],
                'score': latest_score,
                'features': features.iloc[-1].to_dict()
            })
        
        return {
            'is_anomaly': is_anomaly,
            'anomaly_score': latest_score,
            'feature_contributions': self.get_feature_contributions(features.iloc[-1]),
            'historical_context': self.get_historical_context()
        }
    
    def get_feature_contributions(self, features: pd.Series) -> Dict[str, float]:
        """Calculate contribution of each feature to anomaly score"""
        scaled_features = self.scaler.transform(features.values.reshape(1, -1))
        contributions = {}
        
        for feature_name, scaled_value in zip(features.index, scaled_features[0]):
            contributions[feature_name] = abs(scaled_value)
        
        # Normalize contributions
        total = sum(contributions.values())
        return {k: v/total for k, v in contributions.items()}
    
    def get_historical_context(self) -> Dict[str, any]:
        """Get context from historical anomalies"""
        if not self.historical_anomalies:
            return {'count': 0, 'avg_score': 0.0}
        
        recent_anomalies = self.historical_anomalies[-10:]
        return {
            'count': len(recent_anomalies),
            'avg_score': np.mean([a['score'] for a in recent_anomalies]),
            'recent_patterns': self.analyze_anomaly_patterns(recent_anomalies)
        }
    
    def analyze_anomaly_patterns(self, anomalies: List[Dict]) -> Dict[str, any]:
        """Analyze patterns in recent anomalies"""
        if not anomalies:
            return {}
        
        # Analyze feature patterns
        feature_patterns = {}
        for feature in anomalies[0]['features'].keys():
            values = [a['features'][feature] for a in anomalies]
            feature_patterns[feature] = {
                'mean': np.mean(values),
                'std': np.std(values),
                'trend': np.polyfit(range(len(values)), values, 1)[0]
            }
        
        return {
            'dominant_features': sorted(
                feature_patterns.items(),
                key=lambda x: x[1]['std'],
                reverse=True
            )[:3],
            'trending_features': sorted(
                feature_patterns.items(),
                key=lambda x: abs(x[1]['trend']),
                reverse=True
            )[:3]
        }
