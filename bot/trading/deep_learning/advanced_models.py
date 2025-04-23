"""
Advanced Deep Learning Models
Implements sophisticated neural architectures and enhanced DQN variants
"""

import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Dense, LSTM, Dropout, Input, Conv1D, MaxPooling1D,
    BatchNormalization, Concatenate, Add, Attention,
    MultiHeadAttention, LayerNormalization, GlobalAveragePooling1D
)
from tensorflow.keras.optimizers import Adam
import numpy as np
from typing import Tuple, List, Dict

class TransformerBlock(tf.keras.layers.Layer):
    """Transformer block with multi-head attention"""
    def __init__(self, embed_dim: int, num_heads: int, ff_dim: int, rate=0.1):
        super().__init__()
        self.att = MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim)
        self.ffn = tf.keras.Sequential([
            Dense(ff_dim, activation="relu"),
            Dense(embed_dim),
        ])
        self.layernorm1 = LayerNormalization(epsilon=1e-6)
        self.layernorm2 = LayerNormalization(epsilon=1e-6)
        self.dropout1 = Dropout(rate)
        self.dropout2 = Dropout(rate)

    def call(self, inputs, training=False):
        attn_output = self.att(inputs, inputs)
        attn_output = self.dropout1(attn_output, training=training)
        out1 = self.layernorm1(inputs + attn_output)
        ffn_output = self.ffn(out1)
        ffn_output = self.dropout2(ffn_output, training=training)
        return self.layernorm2(out1 + ffn_output)

class AdvancedPricePredictionModel:
    """Advanced price prediction model with transformer architecture"""
    def __init__(self, sequence_length: int, n_features: int):
        self.sequence_length = sequence_length
        self.n_features = n_features
        self.model = self._build_model()

    def _build_model(self) -> Model:
        # Input layers
        market_data = Input(shape=(self.sequence_length, self.n_features))
        
        # CNN feature extraction path
        conv1 = Conv1D(64, 3, activation='relu')(market_data)
        conv1 = BatchNormalization()(conv1)
        conv2 = Conv1D(128, 3, activation='relu')(conv1)
        conv2 = BatchNormalization()(conv2)
        
        # Transformer path
        transformer_block1 = TransformerBlock(128, 4, 256)(conv2)
        transformer_block2 = TransformerBlock(128, 4, 256)(transformer_block1)
        
        # LSTM path
        lstm1 = LSTM(100, return_sequences=True)(transformer_block2)
        lstm1 = BatchNormalization()(lstm1)
        lstm2 = LSTM(100)(lstm1)
        lstm2 = BatchNormalization()(lstm2)
        
        # Merge paths
        merged = Dense(100, activation='relu')(lstm2)
        merged = Dropout(0.2)(merged)
        
        # Price prediction head
        price_output = Dense(1, name='price_output')(merged)
        
        # Volatility prediction head
        volatility_output = Dense(1, activation='relu', name='volatility_output')(merged)
        
        model = Model(
            inputs=market_data,
            outputs=[price_output, volatility_output]
        )
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss={
                'price_output': 'mse',
                'volatility_output': 'mse'
            },
            loss_weights={
                'price_output': 1.0,
                'volatility_output': 0.5
            }
        )
        
        return model

class DuelingDQN:
    """Dueling DQN with separate value and advantage streams"""
    def __init__(self, state_size: int, action_size: int):
        self.state_size = state_size
        self.action_size = action_size
        self.model = self._build_model()
        self.target_model = self._build_model()

    def _build_model(self) -> Model:
        # Input layer
        input_layer = Input(shape=(self.state_size,))
        
        # Shared layers
        shared = Dense(128, activation='relu')(input_layer)
        shared = BatchNormalization()(shared)
        shared = Dense(128, activation='relu')(shared)
        shared = BatchNormalization()(shared)
        
        # Value stream
        value_stream = Dense(64, activation='relu')(shared)
        value_stream = Dense(1)(value_stream)
        
        # Advantage stream
        advantage_stream = Dense(64, activation='relu')(shared)
        advantage_stream = Dense(self.action_size)(advantage_stream)
        
        # Combine streams
        outputs = Add()([
            value_stream,
            tf.subtract(
                advantage_stream,
                tf.reduce_mean(advantage_stream, axis=1, keepdims=True)
            )
        ])
        
        model = Model(inputs=input_layer, outputs=outputs)
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse'
        )
        
        return model

class DoubleDQN:
    """Double DQN implementation"""
    def __init__(self, state_size: int, action_size: int):
        self.state_size = state_size
        self.action_size = action_size
        self.online_network = DuelingDQN(state_size, action_size)
        self.target_network = DuelingDQN(state_size, action_size)
        self.update_target_network()

    def update_target_network(self):
        """Update target network weights"""
        self.target_network.model.set_weights(
            self.online_network.model.get_weights()
        )

    def get_action_values(self, state: np.ndarray) -> np.ndarray:
        """Get Q-values for all actions"""
        return self.online_network.model.predict(state, verbose=0)

    def update(self, 
              states: np.ndarray,
              actions: np.ndarray,
              rewards: np.ndarray,
              next_states: np.ndarray,
              dones: np.ndarray):
        """Update networks using double DQN algorithm"""
        # Get best actions from online network
        best_actions = np.argmax(
            self.online_network.model.predict(next_states, verbose=0),
            axis=1
        )
        
        # Get Q-values from target network
        target_q_values = self.target_network.model.predict(next_states, verbose=0)
        
        # Calculate targets using double DQN formula
        targets = rewards + (1 - dones) * 0.95 * np.choose(
            best_actions,
            target_q_values.T
        )
        
        # Create target array
        target_f = self.online_network.model.predict(states, verbose=0)
        for i, action in enumerate(actions):
            target_f[i][action] = targets[i]
        
        # Train online network
        self.online_network.model.fit(
            states,
            target_f,
            epochs=1,
            verbose=0
        )

class PrioritizedReplayBuffer:
    """Prioritized Experience Replay buffer"""
    def __init__(self, max_size: int = 10000, alpha: float = 0.6):
        self.max_size = max_size
        self.alpha = alpha  # How much prioritization to use
        self.buffer = []
        self.priorities = np.zeros(max_size, dtype=np.float32)
        self.position = 0
        self.size = 0

    def add(self, state: np.ndarray, action: int, reward: float,
            next_state: np.ndarray, done: bool):
        """Add experience to buffer"""
        max_priority = np.max(self.priorities) if self.buffer else 1.0
        
        if self.size < self.max_size:
            self.buffer.append((state, action, reward, next_state, done))
            self.size += 1
        else:
            self.buffer[self.position] = (state, action, reward, next_state, done)
        
        self.priorities[self.position] = max_priority
        self.position = (self.position + 1) % self.max_size

    def sample(self, batch_size: int, beta: float = 0.4) -> Dict:
        """Sample batch with priorities"""
        if self.size < batch_size:
            return None
        
        # Calculate sampling probabilities
        probs = self.priorities[:self.size] ** self.alpha
        probs /= np.sum(probs)
        
        # Sample indices and calculate importance weights
        indices = np.random.choice(self.size, batch_size, p=probs)
        weights = (self.size * probs[indices]) ** (-beta)
        weights /= np.max(weights)
        
        # Get samples
        samples = [self.buffer[idx] for idx in indices]
        states = np.array([s[0] for s in samples])
        actions = np.array([s[1] for s in samples])
        rewards = np.array([s[2] for s in samples])
        next_states = np.array([s[3] for s in samples])
        dones = np.array([s[4] for s in samples])
        
        return {
            'states': states,
            'actions': actions,
            'rewards': rewards,
            'next_states': next_states,
            'dones': dones,
            'indices': indices,
            'weights': weights
        }

    def update_priorities(self, indices: np.ndarray, priorities: np.ndarray):
        """Update priorities for sampled experiences"""
        self.priorities[indices] = priorities + 1e-5  # Small constant for stability
