"""
Deep Learning Trading Strategy
Combines DNN price prediction and DQN reinforcement learning
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import logging
from datetime import datetime
import os
import joblib
from .models import PricePredictionModel, DQNAgent, TradingState, RewardCalculator

logger = logging.getLogger("deep_learning_strategy")

class DeepLearningStrategy:
    def __init__(self, config: Dict):
        """Initialize deep learning trading strategy"""
        self.config = config
        self.window_size = config.get('window_size', 60)
        self.batch_size = config.get('batch_size', 32)
        self.prediction_threshold = config.get('prediction_threshold', 0.02)
        self.min_confidence = config.get('min_confidence', 0.7)
        
        # Initialize models
        self.price_model = PricePredictionModel(
            sequence_length=self.window_size,
            n_features=72  # Adjust based on feature engineering
        )
        
        self.dqn_agent = DQNAgent(
            state_size=9,  # Size of state representation
            action_size=3  # Hold (0), Buy (1), Sell (2)
        )
        
        self.trading_state = TradingState(window_size=self.window_size)
        self.reward_calculator = RewardCalculator()
        
        # Training state
        self.is_training = True
        self.episode_count = 0
        self.max_episodes = config.get('max_episodes', 1000)
        
        # Performance tracking
        self.performance_history = []
        self.model_predictions = []
        self.actions_taken = []
        
        # Load models if they exist
        self._load_models()

    def _load_models(self):
        """Load pre-trained models if they exist"""
        try:
            model_dir = self.config.get('model_dir', 'models')
            price_model_path = os.path.join(model_dir, 'price_prediction_model.h5')
            dqn_model_path = os.path.join(model_dir, 'dqn_model.h5')
            
            if os.path.exists(price_model_path):
                self.price_model.model.load_weights(price_model_path)
                logger.info("Loaded price prediction model")
            
            if os.path.exists(dqn_model_path):
                self.dqn_agent.model.load_weights(dqn_model_path)
                self.dqn_agent.target_model.load_weights(dqn_model_path)
                logger.info("Loaded DQN model")
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")

    def _save_models(self):
        """Save trained models"""
        try:
            model_dir = self.config.get('model_dir', 'models')
            os.makedirs(model_dir, exist_ok=True)
            
            self.price_model.model.save_weights(
                os.path.join(model_dir, 'price_prediction_model.h5')
            )
            self.dqn_agent.model.save_weights(
                os.path.join(model_dir, 'dqn_model.h5')
            )
            
            logger.info("Saved models successfully")
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")

    def prepare_features(self, data: pd.DataFrame) -> np.ndarray:
        """Prepare features for deep learning models"""
        try:
            # Price features
            features = []
            for col in ['open', 'high', 'low', 'close', 'volume']:
                values = data[col].values
                normalized = (values - np.mean(values)) / np.std(values)
                features.append(normalized)
            
            # Technical indicators
            for window in [10, 20, 50]:
                # Moving averages
                sma = data['close'].rolling(window=window).mean()
                ema = data['close'].ewm(span=window).mean()
                
                # Volatility
                std = data['close'].rolling(window=window).std()
                
                # Momentum
                momentum = data['close'] - data['close'].shift(window)
                
                # Add normalized indicators
                for indicator in [sma, ema, std, momentum]:
                    normalized = (indicator - np.mean(indicator)) / np.std(indicator)
                    features.append(normalized)
            
            # Stack and reshape features
            features = np.stack(features, axis=1)
            
            # Create sequences
            sequences = []
            for i in range(len(features) - self.window_size):
                sequences.append(features[i:i + self.window_size])
            
            return np.array(sequences)
            
        except Exception as e:
            logger.error(f"Error preparing features: {e}")
            return np.array([])

    def train(self, historical_data: pd.DataFrame):
        """Train both price prediction and DQN models"""
        try:
            # Prepare data for price prediction
            X = self.prepare_features(historical_data)
            y = historical_data['close'].values[self.window_size:]
            
            # Train price prediction model
            logger.info("Training price prediction model...")
            self.price_model.train(X, y)
            
            # Train DQN through episodes
            logger.info("Training DQN agent...")
            for episode in range(self.max_episodes):
                total_reward = 0
                state = self.trading_state.get_state(historical_data.iloc[:self.window_size])
                
                for t in range(self.window_size, len(historical_data) - 1):
                    # Get current state
                    current_data = historical_data.iloc[:t+1]
                    state = self.trading_state.get_state(current_data)
                    
                    # Get action from DQN
                    action = self.dqn_agent.act(state.reshape(1, -1))
                    
                    # Execute action and get reward
                    next_data = historical_data.iloc[:t+2]
                    next_state = self.trading_state.get_state(next_data)
                    
                    # Calculate reward
                    portfolio_value = self._calculate_portfolio_value(
                        current_data.iloc[-1]['close'],
                        action
                    )
                    reward = self.reward_calculator.calculate_reward(
                        action,
                        portfolio_value
                    )
                    
                    total_reward += reward
                    
                    # Store experience
                    done = t == len(historical_data) - 2
                    self.dqn_agent.remember(state, action, reward, next_state, done)
                    
                    # Train on batch
                    if len(self.dqn_agent.memory) > self.batch_size:
                        self.dqn_agent.replay(self.batch_size)
                    
                    if done:
                        break
                
                logger.info(f"Episode: {episode + 1}/{self.max_episodes}, Total Reward: {total_reward}")
                self.performance_history.append(total_reward)
                
                # Save models periodically
                if (episode + 1) % 100 == 0:
                    self._save_models()
            
            self.is_training = False
            logger.info("Training completed")
            
        except Exception as e:
            logger.error(f"Error in training: {e}")

    def predict(self, current_data: pd.DataFrame) -> Tuple[int, float, float]:
        """Make trading decisions using both models"""
        try:
            # Prepare features for price prediction
            features = self.prepare_features(current_data)
            if len(features) == 0:
                return 0, 0.0, 0.0
            
            # Get price prediction
            price_prediction = self.price_model.predict(features[-1:])
            current_price = current_data['close'].iloc[-1]
            predicted_return = (price_prediction[0] - current_price) / current_price
            
            # Get state for DQN
            state = self.trading_state.get_state(current_data)
            
            # Get action from DQN
            action = self.dqn_agent.act(
                state.reshape(1, -1),
                training=False
            )
            
            # Calculate confidence
            if action == 0:  # Hold
                confidence = 0.5
            else:
                # Combine price prediction and DQN confidence
                price_conf = min(abs(predicted_return) / self.prediction_threshold, 1.0)
                dqn_conf = 1.0 - self.dqn_agent.epsilon
                confidence = (price_conf + dqn_conf) / 2
            
            # Store prediction
            self.model_predictions.append({
                'timestamp': datetime.now(),
                'action': action,
                'confidence': confidence,
                'predicted_return': predicted_return
            })
            
            return action, confidence, predicted_return
            
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            return 0, 0.0, 0.0

    def _calculate_portfolio_value(self, price: float, action: int) -> float:
        """Calculate portfolio value after action"""
        # This is a simplified calculation - implement actual portfolio tracking
        return price * (1 + (0.01 if action == 1 else -0.01 if action == 2 else 0))

    def get_model_metrics(self) -> Dict:
        """Get model performance metrics"""
        try:
            if not self.model_predictions:
                return {}
            
            predictions_df = pd.DataFrame(self.model_predictions)
            
            return {
                'total_predictions': len(predictions_df),
                'buy_signals': len(predictions_df[predictions_df['action'] == 1]),
                'sell_signals': len(predictions_df[predictions_df['action'] == 2]),
                'avg_confidence': predictions_df['confidence'].mean(),
                'avg_predicted_return': predictions_df['predicted_return'].mean(),
                'last_prediction': predictions_df.iloc[-1].to_dict() if not predictions_df.empty else None
            }
            
        except Exception as e:
            logger.error(f"Error calculating metrics: {e}")
            return {}
