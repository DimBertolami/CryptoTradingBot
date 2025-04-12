from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, mean_squared_error
from .market_indicators import MarketIndicators

class MLRiskPredictor:
    """Machine Learning-based risk prediction system"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.regressor = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.features = None
        self.predictions = None
        
    def prepare_features(self, market_data: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for ML models"""
        market_indicators = MarketIndicators(market_data)
        indicators = market_indicators.indicators
        
        features = pd.DataFrame({
            'volatility': indicators['volatility']['daily_volatility'],
            'trend_strength': indicators['trend_strength'],
            'adx': indicators['adx'],
            'volume_trend': indicators['volume_trend'],
            'volume_spikes': 1 if indicators['volume_spikes'] else 0,
            'market_regime': self._encode_regime(indicators['market_regime']),
            'regime_confidence': indicators['regime_confidence'],
            'sentiment_score': indicators['sentiment_score']
        }, index=[0])
        
        return features
        
    def _encode_regime(self, regime: str) -> int:
        """Encode market regime as integer"""
        regime_map = {
            'volatile': 0,
            'trending': 1,
            'range_bound': 2,
            'volume_spike': 3,
            'neutral': 4
        }
        return regime_map.get(regime, 4)
        
    def train_models(self, historical_data: pd.DataFrame) -> None:
        """Train ML models for risk prediction"""
        # Prepare training data
        features = []
        labels = []
        
        for i in range(len(historical_data) - 1):
            current_data = historical_data.iloc[:i+1]
            next_data = historical_data.iloc[i+1]
            
            features.append(self.prepare_features(current_data).iloc[0])
            
            # Calculate risk labels
            returns = next_data['close'] / current_data['close'].iloc[-1] - 1
            volatility = abs(returns) * np.sqrt(252)
            
            # Risk classification (0: low, 1: medium, 2: high)
            risk_class = 0 if volatility < 0.1 else (1 if volatility < 0.3 else 2)
            labels.append(risk_class)
            
        features_df = pd.DataFrame(features)
        labels_df = pd.Series(labels)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features_df, labels_df, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train classification model
        self.classifier.fit(X_train_scaled, y_train)
        y_pred = self.classifier.predict(X_test_scaled)
        print("Risk Classification Report:")
        print(classification_report(y_test, y_pred))
        
        # Train regression model
        self.regressor.fit(X_train_scaled, y_train)
        y_pred_reg = self.regressor.predict(X_test_scaled)
        print("Risk Prediction MSE:", mean_squared_error(y_test, y_pred_reg))
        
    def predict_risk(self, market_data: pd.DataFrame) -> Dict:
        """Predict risk level and expected volatility"""
        features = self.prepare_features(market_data)
        features_scaled = self.scaler.transform(features)
        
        # Predict risk class
        risk_class = self.classifier.predict(features_scaled)[0]
        risk_prob = self.classifier.predict_proba(features_scaled)[0]
        
        # Predict expected volatility
        expected_volatility = self.regressor.predict(features_scaled)[0]
        
        return {
            'risk_class': risk_class,
            'risk_probability': risk_prob,
            'expected_volatility': expected_volatility,
            'confidence': max(risk_prob)
        }
        
    def get_risk_adjustments(self, risk_prediction: Dict) -> Dict:
        """Get risk adjustments based on ML predictions"""
        risk_class = risk_prediction['risk_class']
        confidence = risk_prediction['confidence']
        expected_volatility = risk_prediction['expected_volatility']
        
        adjustments = {
            'position_size': 1.0,
            'stop_loss': 0.02,
            'take_profit': 0.05,
            'max_exposure': 0.5
        }
        
        # Adjust based on risk class
        if risk_class == 0:  # Low risk
            adjustments['position_size'] *= 1.2
            adjustments['stop_loss'] *= 0.8
            adjustments['take_profit'] *= 1.2
            adjustments['max_exposure'] *= 1.2
        elif risk_class == 2:  # High risk
            adjustments['position_size'] *= 0.8
            adjustments['stop_loss'] *= 1.2
            adjustments['take_profit'] *= 0.8
            adjustments['max_exposure'] *= 0.8
        
        # Adjust based on confidence
        confidence_factor = min(1.2, 1 + confidence)
        adjustments['position_size'] *= confidence_factor
        adjustments['max_exposure'] *= confidence_factor
        
        # Adjust based on expected volatility
        volatility_factor = 1 / (expected_volatility + 0.001)
        adjustments['position_size'] *= volatility_factor
        adjustments['max_exposure'] *= volatility_factor
        
        return adjustments
