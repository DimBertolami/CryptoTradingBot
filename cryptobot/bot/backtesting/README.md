# Cryptocurrency Trading Bot Backtesting Framework

## Overview

This backtesting framework provides a comprehensive testing environment for cryptocurrency trading strategies. It supports both historical and real-time simulation, allowing traders to test and optimize their strategies before deploying them in live markets.

## Architecture

The framework is built with a modular architecture, consisting of several key components:

### 1. Data Handler (`data_handler.py`)
- Manages both historical and real-time market data
- Supports multiple exchanges via CCXT integration
- Implements efficient data caching
- Provides WebSocket support for real-time updates
- Handles OHLCV data normalization and preprocessing

### 2. Performance Metrics (`performance_metrics.py`)
- Calculates comprehensive performance metrics including:
  - Total Returns
  - Annualized Returns
  - Maximum Drawdown
  - Sharpe Ratio
  - Sortino Ratio
  - Win Rate
  - Profit Factor
  - Average Trade Duration
  - Risk-Adjusted Returns
- Provides benchmark comparison capabilities
- Generates detailed trade statistics

### 3. Backtest Engine (`backtest_engine.py`)
- Core component that orchestrates the backtesting process
- Supports both historical and real-time simulation modes
- Implements smart order execution with slippage modeling
- Handles position management and risk control
- Generates detailed performance reports
- Supports multiple trading strategies

### 4. Order Execution System
- Implements advanced order routing
- Supports various order types (Market, Limit, Stop)
- Includes slippage and commission modeling
- Handles partial fills and order cancellations
- Provides real-time position tracking

## Key Features

### Historical Backtesting
- Simulates trading strategies using historical data
- Supports multiple timeframes (1m, 5m, 15m, etc.)
- Implements realistic slippage and commission models
- Calculates comprehensive performance metrics
- Generates detailed trade history and equity curves

### Real-time Simulation
- Simulates trading strategies in real-time market conditions
- Supports WebSocket data feeds for live updates
- Implements real-time risk management
- Provides live performance monitoring
- Supports paper trading mode

### Performance Analysis
- Calculates risk-adjusted returns
- Tracks drawdown periods
- Analyzes trade distribution
- Provides volatility metrics
- Calculates win rate and profit factor
- Generates detailed trade statistics

### Risk Management
- Implements position sizing based on risk tolerance
- Supports stop-loss and take-profit levels
- Calculates maximum position size
- Implements portfolio rebalancing
- Provides risk-adjusted performance metrics

## Usage

### Basic Usage
```python
from cryptobot.bot.backtesting.backtest_engine import BacktestEngine
from cryptobot.bot.strategies.trading_strategy import TradingStrategy

# Initialize backtest engine
engine = BacktestEngine(
    strategy_class=YourTradingStrategy,
    symbols=['BTC/USDT'],
    initial_capital=100000.0,
    commission_rate=0.001,
    slippage_model='basic',
    risk_free_rate=0.02
)

# Run historical backtest
metrics = await engine.run_historical(
    start_time=datetime.now() - timedelta(days=30),
    end_time=datetime.now(),
    timeframe='1m'
)

# Access results
print(metrics['metrics'])  # Performance metrics
print(metrics['equity_curve'])  # Equity curve
print(metrics['trades'])  # Trade history
print(metrics['positions'])  # Final positions
```

### Real-time Simulation
```python
# Run real-time simulation
await engine.run_realtime(duration=timedelta(hours=1))
```

## Configuration Options

### Backtest Engine Configuration
- `initial_capital`: Starting capital for the simulation
- `commission_rate`: Trading commission rate (default: 0.1%)
- `slippage_model`: Type of slippage model to use ('basic', 'volume_weighted', etc.)
- `risk_free_rate`: Risk-free rate for performance calculations
- `symbols`: List of trading pairs to simulate
- `config`: Additional configuration parameters for the strategy

### Strategy Configuration
- `risk_tolerance`: Maximum risk per trade
- `take_profit`: Take profit level
- `stop_loss`: Stop loss level
- `position_size`: Position sizing method
- `timeframe`: Trading timeframe

## Performance Metrics

### Risk Metrics
- Maximum Drawdown
- Average Drawdown
- Maximum Drawdown Duration
- Risk of Ruin
- Value at Risk (VaR)

### Return Metrics
- Total Returns
- Annualized Returns
- Annualized Volatility
- Sharpe Ratio
- Sortino Ratio
- Calmar Ratio

### Trade Metrics
- Win Rate
- Profit Factor
- Average Profit/Loss
- Maximum Profit/Loss
- Average Trade Duration
- Number of Trades

### Risk-Adjusted Metrics
- Risk-Adjusted Returns
- Information Ratio
- Omega Ratio
- Sterling Ratio

## Best Practices

1. Always start with historical backtesting before moving to real-time simulation
2. Use multiple timeframes for robust strategy testing
3. Implement proper risk management parameters
4. Monitor performance metrics across different market conditions
5. Use benchmark comparison for strategy evaluation
6. Regularly update and re-optimize strategies

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
