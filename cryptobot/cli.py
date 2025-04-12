import argparse
import asyncio
from datetime import datetime, timedelta
from cryptobot.bot.backtesting.backtest_engine import BacktestEngine
from cryptobot.bot.strategies.ml_strategy import MLTradingStrategy

def main():
    parser = argparse.ArgumentParser(description='Cryptocurrency Trading Bot')
    parser.add_argument('--backtest', action='store_true',
                      help='Run backtest mode')
    parser.add_argument('--realtime', action='store_true',
                      help='Run real-time mode')
    parser.add_argument('--duration', type=int, default=1,
                      help='Duration in days for backtest (default: 1)')
    
    args = parser.parse_args()
    
    if args.backtest:
        asyncio.run(run_backtest(args.duration))
    elif args.realtime:
        asyncio.run(run_realtime())
    else:
        print("Please specify --backtest or --realtime")

async def run_backtest(duration_days: int):
    engine = BacktestEngine(
        strategy_class=MLTradingStrategy,
        symbols=["BTCUSDT"],
        initial_capital=100000.0,
        commission_rate=0.001,
        slippage_model='basic'
    )
    
    end_time = datetime.now()
    start_time = end_time - timedelta(days=duration_days)
    
    print(f"Running backtest from {start_time} to {end_time}...")
    
    results = await engine.run_historical(
        start_time=start_time,
        end_time=end_time,
        timeframe='1m'
    )
    
    metrics = results['metrics']
    print("\n=== Backtest Results ===")
    print(f"Total Return: {metrics.total_return:.2%}")
    print(f"Sharpe Ratio: {metrics.sharpe_ratio:.2f}")
    print(f"Max Drawdown: {metrics.max_drawdown:.2%}")
    print(f"Total Trades: {metrics.total_trades}")
    print(f"Win Rate: {metrics.win_rate:.2%}")

async def run_realtime():
    engine = BacktestEngine(
        strategy_class=MLTradingStrategy,
        symbols=["BTCUSDT"],
        initial_capital=100000.0,
        commission_rate=0.001,
        slippage_model='basic'
    )
    
    print("Starting real-time simulation...")
    results = await engine.run_realtime(duration=timedelta(hours=1))
    
    metrics = results['metrics']
    print("\n=== Real-time Results ===")
    print(f"Total Return: {metrics.total_return:.2%}")
    print(f"Total Trades: {metrics.total_trades}")
    print(f"Win Rate: {metrics.win_rate:.2%}")

if __name__ == "__main__":
    main()
