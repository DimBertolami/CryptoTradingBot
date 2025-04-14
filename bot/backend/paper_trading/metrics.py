from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd
import numpy as np

class PaperTradingMetrics:
    def __init__(self, initial_capital: float = 100000.0):
        """Initialize metrics with initial capital"""
        self.metrics = {
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "win_rate": 0.0,
            "average_profit": 0.0,
            "average_loss": 0.0,
            "max_drawdown": 0.0,
            "sharpe_ratio": 0.0,
            "sortino_ratio": 0.0,
            "annualized_return": 0.0,
            "volatility": 0.0,
            "max_profit": 0.0,
            "max_loss": 0.0,
            "initial_capital": initial_capital
        }
        self.trade_history = []
        self.equity_curve = [initial_capital]

    def update_metrics(self, trade_result: Dict) -> None:
        """Update metrics based on a new trade result"""
        self.trade_history.append(trade_result)
        
        # Update basic metrics
        self.metrics["total_trades"] += 1
        profit = trade_result["profit"]
        
        if profit > 0:
            self.metrics["winning_trades"] += 1
            self.metrics["average_profit"] = (
                (self.metrics["average_profit"] * (self.metrics["winning_trades"] - 1) + profit) / 
                self.metrics["winning_trades"]
            )
            self.metrics["max_profit"] = max(self.metrics["max_profit"], profit)
        else:
            self.metrics["losing_trades"] += 1
            self.metrics["average_loss"] = (
                (self.metrics["average_loss"] * (self.metrics["losing_trades"] - 1) + profit) / 
                self.metrics["losing_trades"]
            )
            self.metrics["max_loss"] = min(self.metrics["max_loss"], profit)

        # Calculate win rate
        if self.metrics["total_trades"] > 0:
            self.metrics["win_rate"] = (self.metrics["winning_trades"] / 
                                       self.metrics["total_trades"] * 100)

        # Update equity curve
        total_profit = sum(trade["profit"] for trade in self.trade_history)
        current_equity = self.metrics["initial_capital"] + total_profit
        self.equity_curve.append(current_equity)

        # Calculate drawdown
        peak = max(self.equity_curve)
        current = self.equity_curve[-1]
        self.metrics["max_drawdown"] = max(self.metrics["max_drawdown"], ((peak - current) / peak) * 100)

        # Calculate volatility
        if len(self.equity_curve) > 1:  # Need at least 2 points for returns
            returns = [(self.equity_curve[i] - self.equity_curve[i-1]) / self.equity_curve[i-1] 
                       for i in range(1, len(self.equity_curve))]
            if returns:
                self.metrics["volatility"] = np.std(returns) * np.sqrt(252)  # Annualized volatility

        # Calculate returns
        if self.metrics["initial_capital"] > 0:
            self.metrics["annualized_return"] = ((current_equity / self.metrics["initial_capital"]) ** (1/len(self.trade_history)) - 1) * 100

        # Calculate risk-adjusted returns
        if self.metrics["volatility"] > 0:
            self.metrics["sharpe_ratio"] = self.metrics["annualized_return"] / self.metrics["volatility"]
            
            # Calculate Sortino ratio only if there are negative returns and enough data
            if len(self.equity_curve) > 2:  # Need at least 3 points for meaningful downside returns
                downside_returns = [r for r in returns if r < 0]
                if downside_returns:
                    downside_std = np.std(downside_returns) * np.sqrt(252)
                    if downside_std > 0:  # Prevent division by zero
                        self.metrics["sortino_ratio"] = self.metrics["annualized_return"] / downside_std
                    else:
                        self.metrics["sortino_ratio"] = 0.0  # No downside risk
                else:
                    self.metrics["sortino_ratio"] = float('inf')  # Perfect upside, no downside
            else:
                self.metrics["sortino_ratio"] = 0.0  # Not enough data for meaningful calculation
        else:
            self.metrics["sharpe_ratio"] = 0.0
            self.metrics["sortino_ratio"] = 0.0

    def calculate_equity(self) -> float:
        """Calculate current equity based on trade history"""
        if not self.trade_history:
            return self.metrics["initial_capital"]
        
        total_profit = sum(trade["profit"] for trade in self.trade_history)
        return self.metrics["initial_capital"] + total_profit

    def get_metrics_summary(self) -> Dict:
        """Get a summary of performance metrics"""
        return {
            "basic_metrics": {
                "total_trades": self.metrics["total_trades"],
                "win_rate": f"{self.metrics['win_rate']:.2f}%",
                "average_profit": f"{self.metrics['average_profit']:.2f}",
                "average_loss": f"{self.metrics['average_loss']:.2f}"
            },
            "advanced_metrics": {
                "sharpe_ratio": f"{self.metrics['sharpe_ratio']:.2f}",
                "sortino_ratio": f"{self.metrics['sortino_ratio']:.2f}",
                "annualized_return": f"{self.metrics['annualized_return']:.2f}%",
                "volatility": f"{self.metrics['volatility']:.2f}%"
            },
            "risk_metrics": {
                "max_drawdown": f"{self.metrics['max_drawdown']:.2f}%",
                "max_profit": f"{self.metrics['max_profit']:.2f}",
                "max_loss": f"{self.metrics['max_loss']:.2f}"
            }
        }
