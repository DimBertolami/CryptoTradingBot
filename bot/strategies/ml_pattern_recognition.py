from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from .base_strategy import TradingStrategy

class MLPatternRecognitionStrategy(TradingStrategy):
    """Machine Learning Pattern Recognition Strategy
    
    This strategy uses ML techniques to:
    - Identify price patterns
    - Classify market regimes
    - Predict trend continuation/reversal
    """
    
    def __init__(self, config: Dict):
        super().__init__(config)
        self.pattern_length = config.get('pattern_length', 20)
        self.n_clusters = config.get('n_clusters', 5)
        self.n_components = config.get('n_components', 3)
        self.min_pattern_strength = config.get('min_pattern_strength', 0.7)
        self.model = None
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=self.n_components)
        
    def train_model(self, historical_data: pd.DataFrame) -> None:
        """Train the pattern recognition model"""
        # Create features matrix
        features = []
        for i in range(len(historical_data) - self.pattern_length):
            window = historical_data['price'].iloc[i:i+self.pattern_length].values
            features.append(window)
            
        features = np.array(features)
        
        # Scale and reduce dimensionality
        scaled_features = self.scaler.fit_transform(features.reshape(-1, 1))
        reduced_features = self.pca.fit_transform(scaled_features.reshape(-1, self.pattern_length))
        
        # Train KMeans
        self.model = KMeans(n_clusters=self.n_clusters)
        self.model.fit(reduced_features)
        
    def identify_pattern(self, data: pd.DataFrame) -> Dict:
        """Identify current market pattern"""
        if len(data) < self.pattern_length:
            return {'signal': 'wait', 'reason': 'Insufficient data'}
            
        # Prepare current pattern
        current_pattern = data['price'].iloc[-self.pattern_length:].values
        current_pattern = current_pattern.reshape(1, -1)
        
        # Transform pattern
        scaled_pattern = self.scaler.transform(current_pattern.reshape(-1, 1))
        reduced_pattern = self.pca.transform(scaled_pattern.reshape(1, self.pattern_length))
        
        # Predict pattern cluster
        cluster = self.model.predict(reduced_pattern)[0]
        
        # Calculate pattern strength (distance from cluster center)
        cluster_center = self.model.cluster_centers_[cluster]
        pattern_strength = 1 - (np.linalg.norm(reduced_pattern - cluster_center) / 
                              np.linalg.norm(cluster_center))
        
        return {
            'cluster': cluster,
            'pattern_strength': pattern_strength,
            'price': data['price'].iloc[-1],
            'is_strong_pattern': pattern_strength > self.min_pattern_strength
        }
        
    def analyze_market(self, data: pd.DataFrame) -> Dict:
        """Analyze market using ML patterns"""
        if self.model is None:
            self.train_model(data)
            
        pattern_analysis = self.identify_pattern(data)
        
        return {
            'pattern': pattern_analysis['cluster'],
            'strength': pattern_analysis['pattern_strength'],
            'is_strong': pattern_analysis['is_strong_pattern'],
            'price': pattern_analysis['price']
        }
        
    def generate_signals(self, data: pd.DataFrame) -> List[Dict]:
        """Generate signals based on pattern recognition"""
        analysis = self.analyze_market(data)
        signals = []
        
        # Generate signals only for strong patterns
        if analysis['is_strong']:
            # Generate buy signal for bullish patterns
            if analysis['pattern'] in [0, 1]:  # These would be determined during training
                signals.append({
                    'type': 'buy',
                    'price': analysis['price'],
                    'timestamp': data.index[-1],
                    'reason': f'Bullish pattern {analysis["pattern"]} detected'
                })
                
            # Generate sell signal for bearish patterns
            elif analysis['pattern'] in [3, 4]:  # These would be determined during training
                signals.append({
                    'type': 'sell',
                    'price': analysis['price'],
                    'timestamp': data.index[-1],
                    'reason': f'Bearish pattern {analysis["pattern"]} detected'
                })
                
        return signals
        
    def calculate_position_size(self, signal: Dict, account_balance: float) -> float:
        """Calculate position size based on pattern strength"""
        base_position = super().calculate_position_size(signal, account_balance)
        
        if 'strength' in signal.get('analysis', {}):
            strength_multiplier = min(1.5, signal['analysis']['strength'] / self.min_pattern_strength)
            return base_position * strength_multiplier
            
        return base_position
