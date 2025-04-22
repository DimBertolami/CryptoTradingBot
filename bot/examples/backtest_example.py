import asyncio
import pandas as pd
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns
from ..backtesting.backtest_engine import BacktestEngine
from ..strategies.ml_strategy import MLTradingStrategy
from ..ml.utils import logger

async def run_backtest():
    """Run a comprehensive backtest of the ML trading strategy"""
    
    # Initialize backtest engine
    engine = BacktestEngine(
        strategy_class=MLTradingStrategy,
        symbols=["BTCUSDT", "ETHUSDT"],  # Test on major pairs
        initial_capital=100000.0,
        commission_rate=0.001,  # 0.1% commission
        slippage_model='volume_based'  # More realistic slippage
    )
    
    # Define test period
    end_time = datetime.now()
    start_time = end_time - timedelta(days=30)  # 30 days of data
    
    logger.info(f"Running backtest from {start_time} to {end_time}")
    
    # Run backtest
    results = await engine.run_historical(
        start_time=start_time,
        end_time=end_time,
        timeframe='1m'  # 1-minute candles
    )
    
    # Extract results
    metrics = results['metrics']
    equity_curve = results['equity_curve']
    trades = results['trades']
    
    # Print performance summary
    print("\n=== Performance Summary ===")
    print(f"Total Return: {metrics.total_return:.2%}")
    print(f"Sharpe Ratio: {metrics.sharpe_ratio:.2f}")
    print(f"Max Drawdown: {metrics.max_drawdown:.2%}")
    print(f"Win Rate: {metrics.win_rate:.2%}")
    print(f"Total Trades: {metrics.total_trades}")
    print(f"Profit Factor: {abs(metrics.avg_win/metrics.avg_loss):.2f}")
    print(f"Average Trade: ${metrics.net_pnl/metrics.total_trades:.2f}")
    
    # Plot results
    plot_backtest_results(equity_curve, metrics)
    
    return results

def plot_backtest_results(equity_curve: pd.DataFrame, metrics):
    """Create comprehensive visualization of backtest results"""
    
    # Set style
    plt.style.use('seaborn')
    sns.set_palette("husl")
    
    # Create subplots
    fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(15, 12))
    
    # 1. Equity Curve
    equity_curve['portfolio_value'].plot(ax=ax1)
    ax1.set_title('Portfolio Value Over Time')
    ax1.set_xlabel('Date')
    ax1.set_ylabel('Portfolio Value ($)')
    ax1.grid(True)
    
    # 2. Drawdown
    drawdown = (equity_curve['portfolio_value'] - 
               equity_curve['portfolio_value'].cummax()) / \
               equity_curve['portfolio_value'].cummax()
    drawdown.plot(ax=ax2)
    ax2.set_title('Drawdown')
    ax2.set_xlabel('Date')
    ax2.set_ylabel('Drawdown (%)')
    ax2.grid(True)
    
    # 3. Daily Returns Distribution
    daily_returns = equity_curve['portfolio_value'].resample('D').last().pct_change()
    sns.histplot(daily_returns.dropna(), kde=True, ax=ax3)
    ax3.set_title('Distribution of Daily Returns')
    ax3.set_xlabel('Return (%)')
    ax3.set_ylabel('Frequency')
    
    # Add key metrics as text
    metrics_text = (
        f'Sharpe Ratio: {metrics.sharpe_ratio:.2f}\n'
        f'Sortino Ratio: {metrics.sortino_ratio:.2f}\n'
        f'Max Drawdown: {metrics.max_drawdown:.2%}\n'
        f'Win Rate: {metrics.win_rate:.2%}\n'
        f'Total Trades: {metrics.total_trades}'
    )
    
    plt.figtext(0.15, 0.02, metrics_text, fontsize=10, 
                bbox=dict(facecolor='white', alpha=0.8))
    
    plt.tight_layout()
    plt.savefig('backtest_results.png')
    plt.close()

async def run_realtime_simulation():
    """Run a real-time trading simulation"""
    
    engine = BacktestEngine(
        strategy_class=MLTradingStrategy,
        symbols=["BTCUSDT"],
        initial_capital=100000.0,
        commission_rate=0.001,
        slippage_model='basic'
    )
    
    logger.info("Starting real-time simulation...")
    
    # Run for 1 hour
    results = await engine.run_realtime(duration=timedelta(hours=1))
    
    # Print real-time performance
    metrics = results['metrics']
    print("\n=== Real-time Simulation Results ===")
    print(f"Total Return: {metrics.total_return:.2%}")
    print(f"Number of Trades: {metrics.total_trades}")
    print(f"Win Rate: {metrics.win_rate:.2%}")
    
    return results

async def main():
    """Run both historical backtest and real-time simulation"""
    
    # Run historical backtest
    print("\nRunning historical backtest...")
    backtest_results = await run_backtest()
    
    # Run real-time simulation
    print("\nRunning real-time simulation...")
    realtime_results = await run_realtime_simulation()
    
    # Compare results
    print("\n=== Results Comparison ===")
    print("Metric\t\tHistorical\tReal-time")
    print("-" * 50)
    metrics = [
        ("Total Return", "total_return", "{:.2%}"),
        ("Sharpe Ratio", "sharpe_ratio", "{:.2f}"),
        ("Win Rate", "win_rate", "{:.2%}"),
        ("Max Drawdown", "max_drawdown", "{:.2%}")
    ]
    
    for name, attr, fmt in metrics:
        hist_val = fmt.format(getattr(backtest_results['metrics'], attr))
        real_val = fmt.format(getattr(realtime_results['metrics'], attr))
        print(f"{name:<15}{hist_val:>12}{real_val:>12}")

if __name__ == "__main__":
    asyncio.run(main())
