import argparse
import asyncio
from datetime import datetime, timedelta
import pandas as pd
from ..strategies.rsi import RSIStrategy
from ..strategies.macd import MACDStrategy
from ..strategies.bollinger_bands import BollingerBandsStrategy
from ..strategies.moving_average_crossover import MovingAverageCrossover
from ..backtesting.backtest_engine import BacktestEngine

def get_strategy_class(strategy_name: str) -> object:
    """Get strategy class based on name."""
    strategies = {
        'RSIStrategy': RSIStrategy,
        'MACDStrategy': MACDStrategy,
        'BollingerBandsStrategy': BollingerBandsStrategy,
        'MovingAverageCrossover': MovingAverageCrossover
    }
    return strategies.get(strategy_name)

def parse_date(date_str: str) -> datetime:
    """Parse date string in YYYY-MM-DD format."""
    try:
        return datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        print(f"Error: Invalid date format '{date_str}'. Please use YYYY-MM-DD.")
        return datetime.now() - timedelta(days=30)

async def run_backtest(args):
    """Run backtest with specified configuration."""
    # Get strategy class
    strategy_class = get_strategy_class(args.strategy)
    if not strategy_class:
        print(f"Error: Unknown strategy '{args.strategy}'")
        return

    try:
        # Create strategy instance
        strategy = strategy_class({
            'symbols': ['BTC/USDT'],
            'rsi_period': 14,
            'rsi_overbought': 70,
            'rsi_oversold': 30
        })

        # Create backtest engine
        engine = BacktestEngine(
            symbols=['BTC/USDT'],
            initial_capital=args.capital,
            timeframe=args.timeframe,
            strategy=strategy,
            commission_rate=0.001,  # 0.1% commission
            slippage_rate=0.001,  # 0.1% slippage
            risk_percentage=0.01
        )

        # Run backtest
        print("\nStarting backtest...")
        results = await engine.run_historical(
            start_time=parse_date(args.start_date),
            end_time=parse_date(args.end_date)
        )

        # Display results
        if results:
            metrics = results.get('metrics', {})
            equity_curve = results.get('equity_curve', pd.DataFrame())
            trades = results.get('trades', [])

            print("\n=== Backtest Results ===")
            print(f"Total Return: {metrics.get('total_return', 0):.2%}")
            print(f"Annualized Return: {metrics.get('annualized_return', 0):.2%}")
            print(f"Annualized Volatility: {metrics.get('annualized_volatility', 0):.2%}")
            print(f"Sharpe Ratio: {metrics.get('sharpe_ratio', 0):.2f}")
            print(f"Sortino Ratio: {metrics.get('sortino_ratio', 0):.2f}")
            print(f"Max Drawdown: {metrics.get('max_drawdown', 0):.2%}")
            print(f"Win Rate: {metrics.get('win_rate', 0):.2%}")
            print(f"Profit Factor: {metrics.get('profit_factor', 0):.2f}")
            print(f"Total Trades: {metrics.get('total_trades', 0)}")
            print(f"Avg Trade Duration: {metrics.get('avg_trade_duration', 0):.2f} days")

            # Generate equity curve plot
            if not equity_curve.empty:
                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    x=equity_curve.index,
                    y=equity_curve['portfolio_value'],
                    name='Equity Curve'
                ))
                fig.update_layout(
                    title='Backtest Equity Curve',
                    xaxis_title='Date',
                    yaxis_title='Portfolio Value'
                )
                fig.show()

            # Generate trade summary
            if trades:
                print("\n=== Trade Summary ===")
                print(f"Total Trades: {len(trades)}")
                winning_trades = [t for t in trades if t.profit > 0]
                losing_trades = [t for t in trades if t.profit <= 0]
                print(f"Winning Trades: {len(winning_trades)}")
                print(f"Losing Trades: {len(losing_trades)}")
                print(f"Average Profit: {sum(t.profit for t in winning_trades) / len(winning_trades):.2f}")
                print(f"Average Loss: {sum(t.profit for t in losing_trades) / len(losing_trades):.2f}")

        else:
            print("\nBacktest failed. Please check the configuration and try again.")

    except Exception as e:
        print(f"\nError during backtest: {str(e)}")

def main():
    """Main entry point for backtest launcher."""
    parser = argparse.ArgumentParser(description='Trading Bot Backtest Launcher')
    parser.add_argument('--strategy', required=True, help='Trading strategy to use')
    parser.add_argument('--timeframe', required=True, help='Timeframe for analysis (e.g., 1m, 5m, 15m, 1h)')
    parser.add_argument('--start-date', required=True, help='Start date for backtest (YYYY-MM-DD)')
    parser.add_argument('--end-date', required=True, help='End date for backtest (YYYY-MM-DD)')
    parser.add_argument('--capital', type=float, default=100000.0, help='Initial capital for backtest')
    
    args = parser.parse_args()
    
    # Run backtest
    asyncio.run(run_backtest(args))

if __name__ == '__main__':
    main()
