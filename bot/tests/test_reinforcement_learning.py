import unittest
import torch
import numpy as np
import pandas as pd
from ..ml.reinforcement_learning import StrategyOptimizer
from ..ml.environment import TradingEnvironment

class TestReinforcementLearning(unittest.TestCase):
    def setUp(self):
        self.sample_data = pd.DataFrame({
            'open': [100] * 100,
            'high': [105] * 100,
            'low': [95] * 100,
            'close': [101] * 100,
            'volume': [1000] * 100
        })
        self.env = TradingEnvironment(self.sample_data)
        self.optimizer = StrategyOptimizer(input_size=7, hidden_size=64, output_size=3)
    
    def test_initialization(self):
        self.assertIsInstance(self.optimizer.policy_net, torch.nn.Module)
        self.assertIsInstance(self.optimizer.target_net, torch.nn.Module)
        self.assertEqual(self.optimizer.batch_size, 64)
        self.assertTrue(0 < self.optimizer.epsilon <= 1)
    
    def test_select_action(self):
        state = self.env.reset()
        action, confidence = self.optimizer.select_action(state, training=False)
        self.assertIsInstance(action, int)
        self.assertTrue(0 <= action <= 2)
        self.assertTrue(0 <= confidence <= 1)
    
    def test_single_training_episode(self):
        state = self.env.reset()
        total_reward = self.optimizer._train_episode(self.env, max_steps=10)
        self.assertIsInstance(total_reward, float)
    
    def test_model_saving_loading(self):
        # Train for a few steps
        self.optimizer.train(self.env, episodes=2, max_steps_per_episode=10)
        
        # Save model
        self.optimizer._save_best_model(100.0)
        
        # Create new optimizer and load model
        new_optimizer = StrategyOptimizer(input_size=7, hidden_size=64, output_size=3)
        new_optimizer.load_model('checkpoints/checkpoint_latest.pt')
        
        # Compare model parameters
        for p1, p2 in zip(self.optimizer.policy_net.parameters(),
                         new_optimizer.policy_net.parameters()):
            self.assertTrue(torch.equal(p1, p2))
    
    def test_model_summary(self):
        summary = self.optimizer.get_model_summary()
        self.assertIsInstance(summary, dict)
        self.assertTrue('training_steps' in summary)
        self.assertTrue('epsilon' in summary)
        self.assertTrue('memory_size' in summary)
    
    def test_error_handling(self):
        # Test with invalid state
        invalid_state = np.zeros(10)  # Wrong size
        with self.assertRaises(Exception):
            self.optimizer.select_action(invalid_state)
        
        # Test with invalid environment
        with self.assertRaises(Exception):
            self.optimizer.train(None, episodes=1)

if __name__ == '__main__':
    unittest.main()
