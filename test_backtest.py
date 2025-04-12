import sys
import os

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bot.backtesting.data_handler import DataHandler
from bot.backtesting.backtest_engine import BacktestEngine
from bot.strategies.ml_strategy import MLTradingStrategy

async def test_backtest():
    # Initialize backtest engine
    engine = BacktestEngine(
        strategy_class=MLTradingStrategy,
        symbols=["BTCUSDT"],
        initial_capital=100000.0,
        commission_rate=0.001,
        slippage_model='basic'
    )
    
    # Run a short historical backtest
    end_time = datetime.now()
    start_time = end_time - timedelta(days=1)
    
    print("Running backtest...")
    results = await engine.run_historical(
        start_time=start_time,
        end_time=end_time,
        timeframe='1m'
    )
    
    # Print basic results
    metrics = results['metrics']
    print("\n=== Backtest Results ===")
    print(f"Total Return: {metrics.total_return:.2%}")
    print(f"Sharpe Ratio: {metrics.sharpe_ratio:.2f}")
    print(f"Max Drawdown: {metrics.max_drawdown:.2%}")
    print(f"Total Trades: {metrics.total_trades}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_backtest())
