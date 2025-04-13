import pytest
import asyncio
from datetime import datetime
import pandas as pd
from cryptobot.bot.backtesting.backtest_engine import BacktestEngine
from cryptobot.bot.strategies.rsi import RSIStrategy
from cryptobot.bot.strategies.macd import MACDStrategy
from cryptobot.bot.strategies.bollinger_bands import BollingerBandsStrategy
from cryptobot.bot.strategies.moving_average_crossover import MovingAverageCrossover
from typing import Dict

class MockTradingStrategy:
    def __init__(self, config: Dict):
        self.config = config

    def analyze_market(self, data: pd.DataFrame) -> Dict:
        return {
            'signal': 'buy' if data['close'].iloc[-1] > data['close'].iloc[0] else 'sell',
            'confidence': 0.8
        }

    def get_config(self) -> Dict:
        return self.config

@pytest.fixture
def mock_strategy():
    return MockTradingStrategy({
        'symbols': ['BTC/USDT'],
        'timeframe': '1m'
    })

@pytest.fixture
def backtest_engine(mock_strategy):
    return BacktestEngine(
        symbols=['BTC/USDT'],
        initial_capital=100000.0,
        timeframe='1m',
        strategy=mock_strategy,
        commission_rate=0.001,
        slippage_model='basic',
        risk_free_rate=0.02
    )

@pytest.mark.asyncio
async def test_backtest_engine_historical(backtest_engine):
    """Test historical backtest execution"""
    start_time = datetime.now() - pd.Timedelta(days=30)
    end_time = datetime.now()
    
    results = await backtest_engine.run_historical(start_time, end_time)
    assert isinstance(results, dict)
    assert 'total_return' in results
    assert 'annualized_return' in results
    assert 'annualized_volatility' in results
    assert 'sharpe_ratio' in results
    assert 'sortino_ratio' in results
    assert 'win_rate' in results
    assert 'profit_factor' in results
    assert 'total_trades' in results
    assert 'avg_trade_duration' in results

@pytest.mark.asyncio
async def test_data_fetching(backtest_engine):
    """Test data fetching functionality"""
    start_time = datetime.now() - pd.Timedelta(days=30)
    end_time = datetime.now()
    
    data = await backtest_engine.data_handler.fetch_data(
        symbols=['BTC/USDT'],
        timeframe='1m',
        start_time=start_time,
        end_time=end_time
    )
    assert isinstance(data, pd.DataFrame)
    assert len(data) > 0
    assert all(col in data.columns for col in ['open', 'high', 'low', 'close', 'volume'])

@pytest.mark.asyncio
async def test_order_execution(backtest_engine):
    """Test order execution and position management"""
    start_time = datetime.now() - pd.Timedelta(days=30)
    end_time = datetime.now()
    
    # Run backtest to generate trades
    results = await backtest_engine.run_historical(start_time, end_time)
    
    # Check if trades were executed
    assert len(backtest_engine.trades) > 0
    
    # Check if positions were managed correctly
    assert isinstance(backtest_engine.positions, dict)
    for symbol, position in backtest_engine.positions.items():
        assert isinstance(position, dict)
        assert 'quantity' in position
        assert 'entry_price' in position
