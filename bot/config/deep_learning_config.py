"""
Deep Learning Configuration
Contains settings for deep learning models and training
"""

DEEP_LEARNING_CONFIG = {
    # Model Architecture
    'window_size': 60,  # Sequence length for time series
    'batch_size': 32,
    'n_features': 72,  # Total number of features after engineering
    
    # Training Parameters
    'max_episodes': 1000,
    'validation_split': 0.2,
    'early_stopping_patience': 10,
    
    # DQN Parameters
    'gamma': 0.95,  # Discount rate
    'epsilon': 1.0,  # Initial exploration rate
    'epsilon_min': 0.01,  # Minimum exploration rate
    'epsilon_decay': 0.995,  # Exploration rate decay
    'learning_rate': 0.001,
    'memory_size': 2000,  # Replay memory size
    
    # Trading Parameters
    'prediction_threshold': 0.02,  # Minimum predicted return to trigger action
    'min_confidence': 0.7,  # Minimum confidence for trade execution
    'position_sizing': {
        'max_position': 0.1,  # Maximum position size as fraction of portfolio
        'risk_factor': 0.02,  # Risk per trade
    },
    
    # Model Paths
    'model_dir': 'models/deep_learning',
    'price_model_file': 'price_prediction_model.h5',
    'dqn_model_file': 'dqn_model.h5',
    
    # Feature Engineering
    'technical_indicators': {
        'sma_periods': [10, 20, 50],
        'ema_periods': [10, 20, 50],
        'rsi_period': 14,
        'macd_periods': [12, 26, 9],
        'bollinger_period': 20
    },
    
    # Training Schedule
    'training_schedule': {
        'price_model_retrain': 86400,  # Retrain every 24 hours
        'dqn_update_target': 100,  # Update target network every 100 steps
        'min_samples_retrain': 1000  # Minimum samples before retraining
    },
    
    # Performance Monitoring
    'performance_metrics': {
        'rolling_window': 100,  # Window for calculating metrics
        'profit_threshold': 0.02,  # Minimum profit to consider successful
        'max_drawdown_threshold': 0.1  # Maximum allowed drawdown
    }
}
