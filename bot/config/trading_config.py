"""
Trading Bot Configuration
Contains all configuration parameters for the trading bot
"""

# Exchange configuration
EXCHANGE_CONFIG = {
    'api_key': '',  # Your Binance API key
    'api_secret': '',  # Your Binance API secret
    'test_mode': True,  # Use testnet if True
    'max_retries': 3,
    'retry_delay': 1,  # seconds
    'symbols': ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'],  # Trading pairs
    'base_currency': 'USDT',
    'slippage_tolerance': 0.001,  # 0.1%
}

# Risk management configuration
RISK_CONFIG = {
    'max_position_size': 0.1,  # Maximum 10% of portfolio per position
    'max_portfolio_var': 0.02,  # 2% daily Value at Risk limit
    'max_correlation': 0.7,  # Maximum correlation between assets
    'volatility_window': 20,
    'correlation_window': 30,
    'emergency_triggers': {
        'max_drawdown': 0.15,  # 15% maximum drawdown
        'max_daily_loss': 0.05,  # 5% maximum daily loss
        'min_liquidity': 1000000,  # Minimum market liquidity in USDT
        'max_volatility': 0.05,  # 5% maximum volatility
    },
    'stop_loss_config': {
        'base_stop_loss': 0.02,  # 2% base stop-loss
        'min_stop_loss': 0.01,  # 1% minimum stop-loss
        'max_stop_loss': 0.05,  # 5% maximum stop-loss
        'atr_multiplier': 2.0,  # Multiplier for ATR-based stops
    }
}

# Strategy configuration
STRATEGY_CONFIG = {
    'timeframes': ['1m', '5m', '15m', '1h', '4h', '1d'],
    'feature_windows': [14, 20, 50, 200],
    'regime_window': 100,
    'min_training_samples': 1000,
    'model_path': 'models',
    'confidence_threshold': 0.7,
    'min_profit_ratio': 1.5,  # Minimum profit/loss ratio
    'position_sizing': {
        'kelly_fraction': 0.5,  # Kelly criterion fraction
        'max_kelly': 0.2,  # Maximum Kelly bet size
    }
}

# Trading loop configuration
TRADING_CONFIG = {
    'update_interval': 60,  # seconds
    'market_data_refresh': 300,  # 5 minutes
    'model_retrain_interval': 86400,  # 24 hours
    'risk_update_interval': 300,  # 5 minutes
    'max_open_positions': 5,
    'max_daily_trades': 20,
    'trading_hours': {
        'start': '00:00',
        'end': '23:59',
        'timezone': 'UTC'
    }
}

# Monitoring configuration
MONITORING_CONFIG = {
    'log_level': 'INFO',
    'log_file': 'logs/trading.log',
    'metrics_file': 'logs/metrics.csv',
    'telegram_notifications': {
        'enabled': False,
        'bot_token': '',
        'chat_id': ''
    },
    'health_check_interval': 60,  # seconds
    'performance_metrics': [
        'sharpe_ratio',
        'max_drawdown',
        'win_rate',
        'profit_factor'
    ]
}

# System configuration
SYSTEM_CONFIG = {
    'data_dir': 'data',
    'models_dir': 'models',
    'logs_dir': 'logs',
    'debug_mode': False,
    'max_memory_usage': 0.8,  # 80% of available RAM
    'cpu_threads': 4
}

# Combine all configurations
CONFIG = {
    'exchange': EXCHANGE_CONFIG,
    'risk': RISK_CONFIG,
    'strategy': STRATEGY_CONFIG,
    'trading': TRADING_CONFIG,
    'monitoring': MONITORING_CONFIG,
    'system': SYSTEM_CONFIG
}
