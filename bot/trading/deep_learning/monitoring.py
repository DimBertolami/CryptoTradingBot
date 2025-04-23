"""
AI Monitoring System
Provides metrics and monitoring for deep learning models
"""

import logging
from datetime import datetime
from typing import Dict, Any
import numpy as np
import psutil
from flask import Blueprint, jsonify
import tensorflow as tf

ai_monitor_bp = Blueprint('ai_monitor', __name__)
logger = logging.getLogger("ai_monitoring")

class AIMonitor:
    def __init__(self):
        self.metrics = {
            'priceModel': {
                'accuracy': 0.0,
                'loss': 0.0,
                'mae': 0.0,
                'predictions': []
            },
            'dqnModel': {
                'episodeReward': 0.0,
                'epsilon': 1.0,
                'lossValue': 0.0,
                'actionDistribution': {
                    'hold': 0.33,
                    'buy': 0.33,
                    'sell': 0.34
                },
                'recentActions': []
            },
            'systemStatus': {
                'isTraining': False,
                'lastUpdate': datetime.now().isoformat(),
                'modelVersion': '1.0.0',
                'memoryUsage': 0.0,
                'batchesProcessed': 0
            }
        }

    def update_price_metrics(self, 
                           predictions: np.ndarray,
                           actuals: np.ndarray,
                           loss: float,
                           mae: float):
        """Update price prediction model metrics"""
        try:
            # Calculate accuracy (within 2% threshold)
            accuracy = np.mean(
                np.abs((predictions - actuals) / actuals) < 0.02
            )
            
            # Update metrics
            self.metrics['priceModel'].update({
                'accuracy': float(accuracy),
                'loss': float(loss),
                'mae': float(mae)
            })
            
            # Store recent predictions
            new_predictions = []
            for i in range(min(len(predictions), 100)):
                new_predictions.append({
                    'timestamp': datetime.now().isoformat(),
                    'predicted': float(predictions[i]),
                    'actual': float(actuals[i])
                })
            
            self.metrics['priceModel']['predictions'] = (
                new_predictions +
                self.metrics['priceModel']['predictions']
            )[:100]
            
        except Exception as e:
            logger.error(f"Error updating price metrics: {e}")

    def update_dqn_metrics(self,
                          episode_reward: float,
                          epsilon: float,
                          loss: float,
                          action_counts: Dict[str, int],
                          action: str,
                          confidence: float,
                          reward: float):
        """Update DQN model metrics"""
        try:
            # Update main metrics
            self.metrics['dqnModel'].update({
                'episodeReward': float(episode_reward),
                'epsilon': float(epsilon),
                'lossValue': float(loss)
            })
            
            # Update action distribution
            total_actions = sum(action_counts.values())
            if total_actions > 0:
                self.metrics['dqnModel']['actionDistribution'] = {
                    'hold': action_counts.get('hold', 0) / total_actions,
                    'buy': action_counts.get('buy', 0) / total_actions,
                    'sell': action_counts.get('sell', 0) / total_actions
                }
            
            # Add recent action
            self.metrics['dqnModel']['recentActions'].insert(0, {
                'timestamp': datetime.now().isoformat(),
                'action': action,
                'confidence': float(confidence),
                'reward': float(reward)
            })
            
            # Keep only recent actions
            self.metrics['dqnModel']['recentActions'] = \
                self.metrics['dqnModel']['recentActions'][:50]
            
        except Exception as e:
            logger.error(f"Error updating DQN metrics: {e}")

    def update_system_status(self,
                           is_training: bool = None,
                           model_version: str = None,
                           batches_processed: int = None):
        """Update system status metrics"""
        try:
            if is_training is not None:
                self.metrics['systemStatus']['isTraining'] = is_training
            
            if model_version is not None:
                self.metrics['systemStatus']['modelVersion'] = model_version
            
            if batches_processed is not None:
                self.metrics['systemStatus']['batchesProcessed'] = batches_processed
            
            # Update timestamp and memory usage
            self.metrics['systemStatus'].update({
                'lastUpdate': datetime.now().isoformat(),
                'memoryUsage': psutil.Process().memory_info().rss / 1024 / 1024  # MB
            })
            
        except Exception as e:
            logger.error(f"Error updating system status: {e}")

ai_monitor = AIMonitor()

@ai_monitor_bp.route('/api/ai/metrics', methods=['GET'])
def get_ai_metrics():
    """Get all AI metrics"""
    try:
        return jsonify(ai_monitor.metrics)
    except Exception as e:
        logger.error(f"Error getting AI metrics: {e}")
        return jsonify({
            'error': 'Failed to get AI metrics'
        }), 500

def init_app(app):
    """Initialize the AI monitoring blueprint"""
    app.register_blueprint(ai_monitor_bp)
