"""
Strategy Optimization Module
Handles ML model retraining, multi-timeframe analysis, and market regime detection
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit
from dataclasses import dataclass
import joblib
import ta

logger = logging.getLogger("strategy_optimizer")

@dataclass
class MarketRegime:
    type: str  # 'trending', 'ranging', 'volatile'
    strength: float  # 0 to 1
    direction: float  # -1 to 1
    confidence: float  # 0 to 1

class StrategyOptimizer:
    def __init__(self, config: Dict):
        """Initialize strategy optimizer with configuration"""
        self.config = config
        self.model_path = config.get('model_path', 'models')
        self.timeframes = config.get('timeframes', ['1m', '5m', '15m', '1h', '4h', '1d'])
        self.feature_windows = config.get('feature_windows', [14, 20, 50, 200])
        self.regime_window = config.get('regime_window', 100)
        self.min_training_samples = config.get('min_training_samples', 1000)
        self.models = {}
        self.scalers = {}
        self.market_regimes = {}
        self.last_training = {}

    def prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare technical analysis features for ML models"""
        try:
            df = data.copy()
            
            # Price and volume features
            df['returns'] = df['close'].pct_change()
            df['volume_ma'] = df['volume'].rolling(20).mean()
            df['volume_std'] = df['volume'].rolling(20).std()
            
            # Technical indicators
            for window in self.feature_windows:
                # Trend indicators
                df[f'sma_{window}'] = ta.trend.sma_indicator(df['close'], window=window)
                df[f'ema_{window}'] = ta.trend.ema_indicator(df['close'], window=window)
                df[f'adx_{window}'] = ta.trend.adx(df['high'], df['low'], df['close'], window=window)
                
                # Momentum indicators
                df[f'rsi_{window}'] = ta.momentum.rsi(df['close'], window=window)
                df[f'stoch_{window}'] = ta.momentum.stoch(df['high'], df['low'], df['close'], window=window)
                
                # Volatility indicators
                df[f'bb_upper_{window}'] = ta.volatility.bollinger_hband(df['close'], window=window)
                df[f'bb_lower_{window}'] = ta.volatility.bollinger_lband(df['close'], window=window)
                df[f'atr_{window}'] = ta.volatility.average_true_range(df['high'], df['low'], df['close'], window=window)
                
                # Volume indicators
                df[f'obv_{window}'] = ta.volume.on_balance_volume(df['close'], df['volume']).rolling(window).mean()
                df[f'cmf_{window}'] = ta.volume.chaikin_money_flow(df['high'], df['low'], df['close'], df['volume'], window=window)
            
            # Market microstructure features
            df['price_spread'] = (df['high'] - df['low']) / df['close']
            df['volume_price_corr'] = df['returns'].rolling(20).corr(df['volume'])
            
            # Drop NaN values
            df = df.dropna()
            
            return df
            
        except Exception as e:
            logger.error(f"Error preparing features: {e}")
            return pd.DataFrame()

    def detect_market_regime(self, data: pd.DataFrame, symbol: str) -> MarketRegime:
        """Detect current market regime using multiple indicators"""
        try:
            # Calculate trend indicators
            sma_20 = ta.trend.sma_indicator(data['close'], window=20)
            sma_50 = ta.trend.sma_indicator(data['close'], window=50)
            adx = ta.trend.adx(data['high'], data['low'], data['close'], window=14)
            
            # Calculate volatility indicators
            atr = ta.volatility.average_true_range(data['high'], data['low'], data['close'])
            bb_width = ta.volatility.bollinger_pband(data['close'])
            
            # Recent values
            current_adx = adx.iloc[-1]
            current_atr = atr.iloc[-1]
            current_bb_width = bb_width.iloc[-1]
            
            # Trend detection
            trend_strength = current_adx / 100.0  # Normalize to 0-1
            
            # Direction detection
            direction = np.sign(sma_20.iloc[-1] - sma_50.iloc[-1])
            
            # Regime classification
            if current_adx > 25:  # Strong trend
                regime_type = 'trending'
                confidence = min(current_adx / 50.0, 1.0)
            elif current_bb_width < 0.1:  # Tight range
                regime_type = 'ranging'
                confidence = 1.0 - current_bb_width
            else:  # Volatile
                regime_type = 'volatile'
                confidence = current_atr / current_atr.rolling(100).max()
            
            regime = MarketRegime(
                type=regime_type,
                strength=trend_strength,
                direction=direction,
                confidence=confidence
            )
            
            self.market_regimes[symbol] = regime
            return regime
            
        except Exception as e:
            logger.error(f"Error detecting market regime: {e}")
            return MarketRegime('unknown', 0.0, 0.0, 0.0)

    def train_model(self, 
                   symbol: str,
                   timeframe: str,
                   data: pd.DataFrame,
                   force_retrain: bool = False) -> bool:
        """Train or update ML model for a symbol and timeframe"""
        try:
            model_key = f"{symbol}_{timeframe}"
            current_time = datetime.now()
            
            # Check if retraining is needed
            if not force_retrain and model_key in self.last_training:
                last_train_time = self.last_training[model_key]
                if (current_time - last_train_time) < timedelta(days=1):
                    return True
            
            # Prepare features and labels
            features_df = self.prepare_features(data)
            if len(features_df) < self.min_training_samples:
                logger.warning(f"Insufficient data for training {model_key}")
                return False
            
            # Create labels (example: price movement prediction)
            features_df['target'] = np.where(
                features_df['close'].shift(-1) > features_df['close'],
                1,  # Price goes up
                0   # Price goes down
            )
            
            # Split features and target
            feature_cols = [col for col in features_df.columns if col not in ['target', 'open', 'high', 'low', 'close', 'volume']]
            X = features_df[feature_cols]
            y = features_df['target']
            
            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Train model
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            
            # Use time series cross-validation
            tscv = TimeSeriesSplit(n_splits=5)
            for train_idx, val_idx in tscv.split(X_scaled):
                X_train, X_val = X_scaled[train_idx], X_scaled[val_idx]
                y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
                model.fit(X_train, y_train)
            
            # Save model and scaler
            self.models[model_key] = model
            self.scalers[model_key] = scaler
            self.last_training[model_key] = current_time
            
            # Save to disk
            model_file = f"{self.model_path}/{model_key}_model.joblib"
            scaler_file = f"{self.model_path}/{model_key}_scaler.joblib"
            joblib.dump(model, model_file)
            joblib.dump(scaler, scaler_file)
            
            logger.info(f"Successfully trained model for {model_key}")
            return True
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            return False

    def predict(self, 
               symbol: str,
               timeframe: str,
               data: pd.DataFrame) -> Tuple[float, float]:
        """Make predictions using trained model"""
        try:
            model_key = f"{symbol}_{timeframe}"
            
            if model_key not in self.models or model_key not in self.scalers:
                raise ValueError(f"Model not found for {model_key}")
            
            # Prepare features
            features_df = self.prepare_features(data.tail(1000))  # Use recent data
            feature_cols = [col for col in features_df.columns if col not in ['target', 'open', 'high', 'low', 'close', 'volume']]
            X = features_df[feature_cols].iloc[-1:]
            
            # Scale features
            X_scaled = self.scalers[model_key].transform(X)
            
            # Get prediction and probability
            prediction = self.models[model_key].predict(X_scaled)[0]
            probability = self.models[model_key].predict_proba(X_scaled)[0]
            
            # Adjust probability based on market regime
            if symbol in self.market_regimes:
                regime = self.market_regimes[symbol]
                if regime.type == 'trending':
                    # Increase confidence in trend direction
                    probability = probability * (1 + regime.strength * regime.confidence)
                elif regime.type == 'ranging':
                    # Reduce confidence in all signals
                    probability = probability * (1 - regime.confidence * 0.5)
                elif regime.type == 'volatile':
                    # Significantly reduce confidence
                    probability = probability * (1 - regime.confidence * 0.7)
            
            return prediction, float(probability.max())
            
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            return 0, 0.0

    def analyze_multiple_timeframes(self, 
                                  symbol: str,
                                  timeframe_data: Dict[str, pd.DataFrame]) -> Dict:
        """Analyze multiple timeframes and combine signals"""
        try:
            signals = {}
            weights = {
                '1m': 0.05,
                '5m': 0.10,
                '15m': 0.15,
                '1h': 0.25,
                '4h': 0.25,
                '1d': 0.20
            }
            
            # Analyze each timeframe
            for timeframe, data in timeframe_data.items():
                if timeframe not in weights:
                    continue
                    
                # Get prediction for timeframe
                prediction, probability = self.predict(symbol, timeframe, data)
                
                # Detect regime for timeframe
                regime = self.detect_market_regime(data, symbol)
                
                signals[timeframe] = {
                    'prediction': prediction,
                    'probability': probability,
                    'regime': regime.__dict__,
                    'weight': weights[timeframe]
                }
            
            # Combine signals
            weighted_signal = 0
            total_weight = 0
            
            for tf, signal in signals.items():
                weight = signal['weight']
                # Adjust weight based on probability and regime confidence
                adjusted_weight = weight * signal['probability'] * signal['regime']['confidence']
                weighted_signal += signal['prediction'] * adjusted_weight
                total_weight += adjusted_weight
            
            if total_weight > 0:
                final_signal = weighted_signal / total_weight
            else:
                final_signal = 0
            
            return {
                'final_signal': final_signal,
                'timeframe_signals': signals
            }
            
        except Exception as e:
            logger.error(f"Error analyzing multiple timeframes: {e}")
            return {
                'final_signal': 0,
                'timeframe_signals': {}
            }
