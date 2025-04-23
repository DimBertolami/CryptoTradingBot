"""
Deep Learning Models for Trading
Implements DNN for price prediction and DQN for reinforcement learning
"""

import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import Dense, LSTM, Dropout, Input, Conv1D, MaxPooling1D, Flatten
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
from collections import deque
import random
from typing import List, Tuple, Dict
import logging

logger = logging.getLogger("deep_learning")

class PricePredictionModel:
    def __init__(self, sequence_length: int = 60, n_features: int = 72):
        """Initialize price prediction model"""
        self.sequence_length = sequence_length
        self.n_features = n_features
        self.model = self._build_model()

    def _build_model(self) -> Model:
        """Build deep neural network for price prediction"""
        model = Sequential([
            # CNN layers for feature extraction
            Input(shape=(self.sequence_length, self.n_features)),
            Conv1D(filters=64, kernel_size=3, activation='relu'),
            MaxPooling1D(pool_size=2),
            Conv1D(filters=128, kernel_size=3, activation='relu'),
            MaxPooling1D(pool_size=2),
            
            # LSTM layers for temporal patterns
            LSTM(100, return_sequences=True),
            Dropout(0.2),
            LSTM(100),
            Dropout(0.2),
            
            # Dense layers for prediction
            Dense(100, activation='relu'),
            Dropout(0.2),
            Dense(50, activation='relu'),
            Dense(1, activation='linear')  # Price prediction
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return model

    def train(self, X: np.ndarray, y: np.ndarray, validation_split: float = 0.2):
        """Train the model on historical data"""
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        history = self.model.fit(
            X, y,
            epochs=100,
            batch_size=32,
            validation_split=validation_split,
            callbacks=[early_stopping],
            verbose=1
        )
        
        return history

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make price predictions"""
        return self.model.predict(X)

class DQNAgent:
    def __init__(self, state_size: int, action_size: int):
        """Initialize DQN agent"""
        self.state_size = state_size
        self.action_size = action_size
        
        # DQN hyperparameters
        self.memory = deque(maxlen=2000)
        self.gamma = 0.95  # Discount rate
        self.epsilon = 1.0  # Exploration rate
        self.epsilon_min = 0.01
        self.epsilon_decay = 0.995
        self.learning_rate = 0.001
        self.model = self._build_model()
        self.target_model = self._build_model()
        self.update_target_counter = 0
        self.update_target_every = 5

    def _build_model(self) -> Model:
        """Build deep Q-network"""
        model = Sequential([
            Input(shape=(self.state_size,)),
            Dense(128, activation='relu'),
            Dropout(0.2),
            Dense(128, activation='relu'),
            Dropout(0.2),
            Dense(64, activation='relu'),
            Dense(self.action_size, activation='linear')
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=self.learning_rate),
            loss='mse'
        )
        
        return model

    def update_target_model(self):
        """Update target network weights"""
        self.target_model.set_weights(self.model.get_weights())

    def remember(self, state: np.ndarray, action: int, reward: float, 
                next_state: np.ndarray, done: bool):
        """Store experience in replay memory"""
        self.memory.append((state, action, reward, next_state, done))

    def act(self, state: np.ndarray, training: bool = True) -> int:
        """Choose action using epsilon-greedy policy"""
        if training and random.random() <= self.epsilon:
            return random.randrange(self.action_size)
        
        act_values = self.model.predict(state, verbose=0)
        return np.argmax(act_values[0])

    def replay(self, batch_size: int):
        """Train on experiences from replay memory"""
        if len(self.memory) < batch_size:
            return
        
        minibatch = random.sample(self.memory, batch_size)
        states = np.zeros((batch_size, self.state_size))
        next_states = np.zeros((batch_size, self.state_size))
        
        for i, (state, _, _, next_state, _) in enumerate(minibatch):
            states[i] = state
            next_states[i] = next_state
        
        # Predict Q-values
        current_qs = self.model.predict(states, verbose=0)
        future_qs = self.target_model.predict(next_states, verbose=0)
        
        # Update Q-values
        for i, (state, action, reward, next_state, done) in enumerate(minibatch):
            if done:
                current_qs[i][action] = reward
            else:
                current_qs[i][action] = reward + self.gamma * np.amax(future_qs[i])
        
        # Train the model
        self.model.fit(states, current_qs, epochs=1, verbose=0)
        
        # Update epsilon
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
        
        # Update target network periodically
        self.update_target_counter += 1
        if self.update_target_counter >= self.update_target_every:
            self.update_target_model()
            self.update_target_counter = 0

class TradingState:
    def __init__(self, window_size: int = 60):
        """Initialize trading state representation"""
        self.window_size = window_size
        
    def get_state(self, data: Dict) -> np.ndarray:
        """Create state representation from market data"""
        state = []
        
        # Price features
        closes = np.array(data['close'])[-self.window_size:]
        highs = np.array(data['high'])[-self.window_size:]
        lows = np.array(data['low'])[-self.window_size:]
        volumes = np.array(data['volume'])[-self.window_size:]
        
        # Normalize price data
        closes = (closes - np.mean(closes)) / np.std(closes)
        highs = (highs - np.mean(highs)) / np.std(highs)
        lows = (lows - np.mean(lows)) / np.std(lows)
        volumes = (volumes - np.mean(volumes)) / np.std(volumes)
        
        # Technical indicators
        sma_10 = np.mean(closes[-10:])
        sma_30 = np.mean(closes[-30:])
        rsi = self._calculate_rsi(closes)
        
        # Combine features
        state.extend([
            closes[-1],  # Latest normalized close
            highs[-1],   # Latest normalized high
            lows[-1],    # Latest normalized low
            volumes[-1], # Latest normalized volume
            sma_10,     # Short-term SMA
            sma_30,     # Long-term SMA
            rsi,        # RSI
            (closes[-1] - sma_10) / sma_10,  # Price vs short SMA
            (closes[-1] - sma_30) / sma_30   # Price vs long SMA
        ])
        
        return np.array(state)

    def _calculate_rsi(self, prices: np.ndarray, period: int = 14) -> float:
        """Calculate Relative Strength Index"""
        deltas = np.diff(prices)
        gain = np.where(deltas > 0, deltas, 0)
        loss = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gain[-period:])
        avg_loss = np.mean(loss[-period:])
        
        if avg_loss == 0:
            return 100
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi

class RewardCalculator:
    def __init__(self):
        """Initialize reward calculator"""
        self.previous_portfolio_value = None
        
    def calculate_reward(self, 
                        action: int,
                        portfolio_value: float,
                        position_size: float = 0,
                        trading_cost: float = 0.001) -> float:
        """Calculate reward for the current action"""
        if self.previous_portfolio_value is None:
            self.previous_portfolio_value = portfolio_value
            return 0
        
        # Calculate portfolio return
        portfolio_return = (portfolio_value - self.previous_portfolio_value) / self.previous_portfolio_value
        
        # Calculate trading cost
        cost = position_size * trading_cost if action != 0 else 0
        
        # Calculate reward
        reward = portfolio_return - cost
        
        # Store current portfolio value
        self.previous_portfolio_value = portfolio_value
        
        # Scale reward
        return reward * 100  # Scale for better learning
