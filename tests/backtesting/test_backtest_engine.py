import pytest
import asyncio
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from cryptobot.bot.backtesting.backtest_engine import BacktestEngine
from cryptobot.bot.backtesting.data_handler import MockExchange
from cryptobot.bot.strategies.trading_strategy import TradingStrategy
from cryptobot.bot.execution.order_executor import OrderExecutor
from cryptobot.bot.ml.utils import logger

# Mock trading strategy class
class MockTradingStrategy(TradingStrategy):
    def __init__(self, config: dict):
        super().__init__(config)
        self.config = config
        self.signal_count = 0
        
    def analyze_market(self, data: pd.DataFrame) -> dict:
        # Generate alternating buy/sell signals
        self.signal_count += 1
        if self.signal_count % 2 == 0:
            return {'signal': 'sell'}
        return {'signal': 'buy'}
        
    def generate_signals(self, data: pd.DataFrame) -> list:
        # Generate signals based on market analysis
        analysis = self.analyze_market(data)
        if analysis['signal'] == 'buy':
            return [{'side': 'buy', 'confidence': 0.9}]
        return [{'side': 'sell', 'confidence': 0.9}]
        
    def calculate_position_size(self, signal: dict, account_balance: float) -> float:
        return account_balance * 0.01  # 1% of balance

@pytest.fixture
def mock_strategy():
    return MockTradingStrategy({
        'name': 'Mock Strategy',
        'type': 'mock',
        'risk_tolerance': 0.05,
        'symbols': ['BTC/USDT'],
        'timeframe': '1m',
        'take_profit': 0.1,
        'stop_loss': 0.05,
        'order_executor': {
            'type': 'mock',
            'commission_rate': 0.001,
            'slippage_model': 'basic'
        }
    })

@pytest.fixture
def backtest_engine(mock_strategy):
    engine = BacktestEngine(
        strategy_class=MockTradingStrategy,
        symbols=['BTC/USDT'],
        initial_capital=100000.0,
        commission_rate=0.001,
        slippage_model='basic',
        risk_free_rate=0.02,
        config={
            'name': 'Mock Strategy',
            'type': 'mock',
            'risk_tolerance': 0.05,
            'symbols': ['BTC/USDT'],
            'timeframe': '1m',
            'take_profit': 0.1,
            'stop_loss': 0.05
        }
    )
    
    # Initialize data handler with mock exchange
    engine.data_handler.exchange = MockExchange()
    engine.data_handler.testnet = False
    
    return engine

@pytest.mark.asyncio
async def test_backtest_engine_historical(backtest_engine):
    """Test historical backtest execution."""
    start_time = datetime.now() - timedelta(days=1)
    end_time = datetime.now()
    
    metrics = await backtest_engine.run_historical(
        start_time=start_time,
        end_time=end_time,
        timeframe='1m'
    )
    
    assert isinstance(metrics, dict)
    assert 'metrics' in metrics
    assert 'equity_curve' in metrics
    assert 'trades' in metrics
    assert 'positions' in metrics

@pytest.mark.asyncio
async def test_data_fetching(backtest_engine):
    """Test data fetching functionality."""
    start_time = datetime.now() - timedelta(days=1)
    end_time = datetime.now()
    
    data = await backtest_engine.data_handler.fetch_historical_data(
        symbol='BTC/USDT',
        timeframe='1m',
        start_time=start_time,
        end_time=end_time
    )
    
    assert isinstance(data, pd.DataFrame)
    assert not data.empty
    assert len(data.columns) == 5
    assert all(col in ['open', 'high', 'low', 'close', 'volume'] for col in data.columns)

def test_order_execution(backtest_engine):
    """Test order execution simulation."""
    signal = {'side': 'buy', 'confidence': 0.9}
    position_size = 1000.0
    
    # Create mock data
    data = pd.DataFrame({
        'timestamp': [pd.Timestamp.now()],
        'open': [10000],
        'high': [10050],
        'low': [9950],
        'close': [10025],
        'volume': [1000]
    })
    
    trade_result = backtest_engine._simulate_trade(
        signal=signal,
        position_size=position_size,
        current_data=data
    )
    
    assert isinstance(trade_result, dict)
    assert 'profit' in trade_result
    assert 'successful' in trade_result
