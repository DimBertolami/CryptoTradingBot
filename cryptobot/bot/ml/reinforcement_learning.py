import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import torch
import torch.nn as nn
import torch.optim as optim
import threading
import os
from datetime import datetime

from .utils import logger, ValidationError, validate_tensor, validate_network_input, ExperienceBuffer, ModelCheckpoint
from .models import DQNNetwork
from .environment import TradingEnvironment

class StrategyOptimizer:
    """Enhanced Reinforcement Learning Strategy Optimizer with safety features"""
    
    def __init__(self, input_size: int = 7, hidden_size: int = 128, output_size: int = 3,
                 checkpoint_dir: str = 'checkpoints'):
        self._validate_init_params(input_size, hidden_size, output_size)
        
        # Initialize device and networks
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.policy_net = DQNNetwork(input_size, hidden_size, output_size).to(self.device)
        self.target_net = DQNNetwork(input_size, hidden_size, output_size).to(self.device)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        
        # Initialize optimizer and memory
        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=0.001)
        self.memory = ExperienceBuffer(max_size=100000)
        
        # Training parameters
        self.batch_size = 64
        self.gamma = 0.99
        self.epsilon = 1.0
        self.epsilon_min = 0.01
        self.epsilon_decay = 0.995
        self.target_update = 10
        self.training_step = 0
        self.update_lock = threading.Lock()
        
        # Performance tracking
        self.training_metrics = {
            'episode_returns': [],
            'losses': [],
            'epsilon_values': [],
            'gradient_norms': []
        }
        
        # Checkpointing
        self.checkpoint_manager = ModelCheckpoint(checkpoint_dir)
        
    def _validate_init_params(self, input_size: int, hidden_size: int, output_size: int) -> None:
        """Validate initialization parameters"""
        if not all(isinstance(x, int) and x > 0 for x in [input_size, hidden_size, output_size]):
            raise ValidationError("All sizes must be positive integers")
        
        if input_size > 100 or hidden_size > 1000 or output_size > 10:
            raise ValidationError("Network sizes are suspiciously large")
    
    def select_action(self, state: np.ndarray, training: bool = True) -> Tuple[int, float]:
        """Select action with epsilon-greedy policy and safety checks"""
        try:
            validate_network_input(state, self.policy_net.input_size)
            
            if training and random.random() < self.epsilon:
                action = random.randint(0, 2)
                return action, 0.333  # Equal confidence for random actions
            
            return self.policy_net.predict(state)
            
        except Exception as e:
            logger.error(f"Error selecting action: {str(e)}")
            return 0, 0.0  # Safe default action (hold)
    
    def train(self, env: TradingEnvironment, episodes: int = 100,
              max_steps_per_episode: int = 1000) -> Dict[str, List[float]]:
        """Train the agent with comprehensive monitoring and safety features"""
        try:
            if not isinstance(env, TradingEnvironment):
                raise ValidationError("env must be an instance of TradingEnvironment")
            
            if episodes <= 0 or max_steps_per_episode <= 0:
                raise ValidationError("episodes and max_steps_per_episode must be positive")
            
            returns = []
            best_return = float('-inf')
            episode_count = 0
            
            while episode_count < episodes:
                try:
                    total_reward = self._train_episode(env, max_steps_per_episode)
                    returns.append(total_reward)
                    
                    # Update best model if performance improved
                    if total_reward > best_return:
                        best_return = total_reward
                        self._save_best_model(total_reward)
                    
                    # Update training metrics
                    self._update_metrics(total_reward)
                    
                    # Decay epsilon
                    self.epsilon = max(self.epsilon_min,
                                     self.epsilon * self.epsilon_decay)
                    
                    # Periodic target network update
                    if episode_count % self.target_update == 0:
                        with self.update_lock:
                            self.target_net.load_state_dict(
                                self.policy_net.state_dict())
                    
                    episode_count += 1
                    
                except Exception as e:
                    logger.error(f"Error in training episode {episode_count}: {str(e)}")
                    continue
                
            return self.training_metrics
            
        except Exception as e:
            logger.error(f"Training failed: {str(e)}")
            raise
    
    def _train_episode(self, env: TradingEnvironment,
                       max_steps: int) -> float:
        """Train a single episode with safety checks"""
        state = env.reset()
        total_reward = 0
        steps = 0
        
        while not env.done and steps < max_steps:
            # Select and execute action
            action, _ = self.select_action(state)
            next_state, reward, done, info = env.step(action)
            
            # Check for environment errors
            if 'error' in info:
                logger.warning(f"Environment error: {info['error']}")
                break
            
            # Store experience
            self.memory.add((state, action, reward, next_state, done))
            
            # Train on batch if enough samples
            if len(self.memory) >= self.batch_size:
                loss = self._optimize_model()
                self.training_metrics['losses'].append(loss)
            
            total_reward += reward
            state = next_state
            steps += 1
        
        return total_reward
    
    def _optimize_model(self) -> float:
        """Optimize the model with gradient clipping and error handling"""
        try:
            # Sample batch
            batch = self.memory.sample(self.batch_size)
            states, actions, rewards, next_states, dones = zip(*batch)
            
            # Convert to tensors with validation
            state_batch = torch.FloatTensor(states).to(self.device)
            action_batch = torch.LongTensor(actions).to(self.device)
            reward_batch = torch.FloatTensor(rewards).to(self.device)
            next_state_batch = torch.FloatTensor(next_states).to(self.device)
            done_batch = torch.FloatTensor(dones).to(self.device)
            
            # Compute Q values
            current_q_values = self.policy_net(state_batch)
            current_q_values = current_q_values.gather(1, action_batch.unsqueeze(1))
            
            # Compute target Q values
            with torch.no_grad():
                next_q_values = self.target_net(next_state_batch).max(1)[0].detach()
            target_q_values = reward_batch + (1 - done_batch) * self.gamma * next_q_values
            
            # Compute loss and optimize
            loss = nn.MSELoss()(current_q_values.squeeze(), target_q_values)
            
            self.optimizer.zero_grad()
            loss.backward()
            
            # Clip gradients
            torch.nn.utils.clip_grad_norm_(self.policy_net.parameters(), max_norm=1.0)
            
            self.optimizer.step()
            self.training_step += 1
            
            # Monitor gradients
            gradient_norms = self.policy_net.get_gradient_norms()
            self.training_metrics['gradient_norms'].append(
                max(gradient_norms.values()))
            
            return loss.item()
            
        except Exception as e:
            logger.error(f"Optimization error: {str(e)}")
            return 0.0
    
    def _save_best_model(self, return_value: float) -> None:
        """Save the best performing model"""
        try:
            model_state = {
                'policy_net_state_dict': self.policy_net.state_dict(),
                'target_net_state_dict': self.target_net.state_dict(),
                'optimizer_state_dict': self.optimizer.state_dict(),
                'training_step': self.training_step,
                'epsilon': self.epsilon
            }
            
            metrics = {
                'return': return_value,
                'training_metrics': self.training_metrics
            }
            
            self.checkpoint_manager.save(model_state, metrics,
                                        self.training_step)
            
        except Exception as e:
            logger.error(f"Error saving best model: {str(e)}")
    
    def _update_metrics(self, episode_return: float) -> None:
        """Update training metrics with safety checks"""
        try:
            self.training_metrics['episode_returns'].append(episode_return)
            self.training_metrics['epsilon_values'].append(self.epsilon)
            
            # Log progress
            if len(self.training_metrics['episode_returns']) % 10 == 0:
                avg_return = np.mean(self.training_metrics['episode_returns'][-10:])
                logger.info(f"Average return over last 10 episodes: {avg_return:.2f}")
                
        except Exception as e:
            logger.error(f"Error updating metrics: {str(e)}")
    
    def load_model(self, path: str) -> None:
        """Load model with validation"""
        try:
            checkpoint = self.checkpoint_manager.load(path)
            
            self.policy_net.load_state_dict(checkpoint['policy_net_state_dict'])
            self.target_net.load_state_dict(checkpoint['target_net_state_dict'])
            self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
            self.training_step = checkpoint['training_step']
            self.epsilon = checkpoint['epsilon']
            
            if 'metrics' in checkpoint:
                self.training_metrics = checkpoint['metrics']
            
            logger.info(f"Successfully loaded model from {path}")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def get_model_summary(self) -> Dict[str, any]:
        """Get model summary statistics"""
        return {
            'training_steps': self.training_step,
            'epsilon': self.epsilon,
            'memory_size': len(self.memory),
            'average_return': np.mean(self.training_metrics['episode_returns'][-100:]) \
                if self.training_metrics['episode_returns'] else 0.0,
            'average_loss': np.mean(self.training_metrics['losses'][-100:]) \
                if self.training_metrics['losses'] else 0.0,
            'device': str(self.device)
        }
    def __init__(self, input_size: int, hidden_size: int, output_size: int):
        super(DQNNetwork, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, output_size)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.layers(x)

class TradingEnvironment:
    def __init__(self, data: pd.DataFrame, initial_balance: float = 10000.0):
        self.data = data
        self.initial_balance = initial_balance
        self.reset()
        
    def reset(self) -> np.ndarray:
        self.current_step = 0
        self.balance = self.initial_balance
        self.position = 0
        self.done = False
        return self._get_state()
    
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, Dict]:
        if self.done:
            return self._get_state(), 0, True, {}
        
        # Execute action (0: hold, 1: buy, 2: sell)
        reward = self._execute_action(action)
        
        # Move to next step
        self.current_step += 1
        self.done = self.current_step >= len(self.data) - 1
        
        return self._get_state(), reward, self.done, {}
    
    def _get_state(self) -> np.ndarray:
        if self.current_step >= len(self.data):
            return np.zeros(6)
        
        current_data = self.data.iloc[self.current_step]
        return np.array([
            current_data['close'],
            current_data['volume'],
            current_data['close'] / current_data['open'] - 1,  # Returns
            self.balance,
            self.position,
            self.current_step / len(self.data)  # Progress
        ])
    
    def _execute_action(self, action: int) -> float:
        current_price = self.data.iloc[self.current_step]['close']
        
        if action == 1 and self.position <= 0:  # Buy
            self.position = self.balance / current_price
            self.balance = 0
        elif action == 2 and self.position > 0:  # Sell
            self.balance = self.position * current_price
            self.position = 0
        
        # Calculate reward
        next_price = self.data.iloc[self.current_step + 1]['close']
        price_change = next_price / current_price - 1
        
        if self.position > 0:
            return price_change * 100  # Percentage return
        return 0

class StrategyOptimizer:
    def __init__(self, input_size: int = 6, hidden_size: int = 64, output_size: int = 3):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.policy_net = DQNNetwork(input_size, hidden_size, output_size).to(self.device)
        self.target_net = DQNNetwork(input_size, hidden_size, output_size).to(self.device)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        
        self.optimizer = optim.Adam(self.policy_net.parameters())
        self.memory = deque(maxlen=10000)
        
        self.batch_size = 64
        self.gamma = 0.99
        self.epsilon = 1.0
        self.epsilon_min = 0.01
        self.epsilon_decay = 0.995
        self.target_update = 10
        self.training_step = 0
        
    def select_action(self, state: np.ndarray) -> int:
        if random.random() < self.epsilon:
            return random.randint(0, 2)
        
        with torch.no_grad():
            state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            q_values = self.policy_net(state_tensor)
            return q_values.max(1)[1].item()
    
    def train(self, env: TradingEnvironment, episodes: int = 100) -> List[float]:
        returns = []
        
        for episode in range(episodes):
            state = env.reset()
            episode_return = 0
            
            while not env.done:
                action = self.select_action(state)
                next_state, reward, done, _ = env.step(action)
                episode_return += reward
                
                self.memory.append((state, action, reward, next_state, done))
                state = next_state
                
                if len(self.memory) >= self.batch_size:
                    self._optimize_model()
                
                if done:
                    break
            
            returns.append(episode_return)
            self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
            
            if episode % self.target_update == 0:
                self.target_net.load_state_dict(self.policy_net.state_dict())
        
        return returns
    
    def _optimize_model(self):
        if len(self.memory) < self.batch_size:
            return
        
        batch = random.sample(self.memory, self.batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)
        
        state_batch = torch.FloatTensor(states).to(self.device)
        action_batch = torch.LongTensor(actions).to(self.device)
        reward_batch = torch.FloatTensor(rewards).to(self.device)
        next_state_batch = torch.FloatTensor(next_states).to(self.device)
        done_batch = torch.FloatTensor(dones).to(self.device)
        
        current_q_values = self.policy_net(state_batch).gather(1, action_batch.unsqueeze(1))
        next_q_values = self.target_net(next_state_batch).max(1)[0].detach()
        expected_q_values = reward_batch + (1 - done_batch) * self.gamma * next_q_values
        
        loss = nn.MSELoss()(current_q_values.squeeze(), expected_q_values)
        
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
        self.training_step += 1
    
    def get_optimal_action(self, state: np.ndarray) -> Tuple[int, float]:
        """Get the optimal action and its confidence score"""
        with torch.no_grad():
            state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            q_values = self.policy_net(state_tensor)
            action = q_values.max(1)[1].item()
            confidence = torch.softmax(q_values, dim=1)[0][action].item()
        return action, confidence
    
    def save_model(self, path: str):
        """Save the model to disk"""
        torch.save({
            'policy_net_state_dict': self.policy_net.state_dict(),
            'target_net_state_dict': self.target_net.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'training_step': self.training_step,
            'epsilon': self.epsilon
        }, path)
    
    def load_model(self, path: str):
        """Load the model from disk"""
        checkpoint = torch.load(path)
        self.policy_net.load_state_dict(checkpoint['policy_net_state_dict'])
        self.target_net.load_state_dict(checkpoint['target_net_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.training_step = checkpoint['training_step']
        self.epsilon = checkpoint['epsilon']
