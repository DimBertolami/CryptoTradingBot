from typing import Dict, List, Optional
import pandas as pd
from datetime import datetime
from .strategies.base_strategy import TradingStrategy
from .strategies.ma_crossover import MACrossoverStrategy

class StrategyManager:
    """Manages multiple trading strategies and their execution"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.strategies = self._initialize_strategies()
        self.active_positions = {}
        self.account_balance = config.get('initial_balance', 10000.0)
        
    def _initialize_strategies(self) -> Dict[str, TradingStrategy]:
        """Initialize trading strategies based on configuration"""
        strategies = {}
        
        # Example of initializing strategies from config
        for strategy_name, strategy_config in self.config['strategies'].items():
            if strategy_name == 'ma_crossover':
                strategies[strategy_name] = MACrossoverStrategy(strategy_config)
            # Add more strategy types here
            
        return strategies
        
    def process_market_data(self, market_data: pd.DataFrame) -> List[Dict]:
        """Process market data through all strategies and generate signals"""
        all_signals = []
        
        for strategy_name, strategy in self.strategies.items():
            try:
                # Get signals from each strategy
                signals = strategy.generate_signals(market_data)
                
                # Validate and process each signal
                for signal in signals:
                    if strategy.validate_signal(signal):
                        position_size = strategy.calculate_position_size(
                            signal, self.account_balance
                        )
                        
                        if position_size > 0:
                            # Add strategy name to signal for tracking
                            signal['strategy'] = strategy_name
                            signal['position_size'] = position_size
                            all_signals.append(signal)
            except Exception as e:
                print(f"Error processing strategy {strategy_name}: {str(e)}")
                continue
        
        return all_signals
        
    def execute_signals(self, signals: List[Dict]) -> None:
        """Execute trading signals based on risk management rules"""
        for signal in signals:
            if signal['type'] == 'buy':
                self._execute_buy(signal)
            elif signal['type'] == 'sell':
                self._execute_sell(signal)
        
    def _execute_buy(self, signal: Dict) -> None:
        """Execute a buy signal"""
        position_size = signal['position_size']
        price = signal['price']
        
        # Calculate actual quantity based on position size and price
        quantity = position_size / price
        
        # Update account balance
        self.account_balance -= position_size
        
        # Store position details
        self.active_positions[signal['timestamp']] = {
            'type': 'buy',
            'quantity': quantity,
            'entry_price': price,
            'strategy': signal['strategy'],
            'timestamp': signal['timestamp']
        }
        
    def _execute_sell(self, signal: Dict) -> None:
        """Execute a sell signal"""
        # Find matching buy position
        matching_position = None
        for position_id, position in self.active_positions.items():
            if position['type'] == 'buy':
                matching_position = position
                break
        
        if matching_position:
            entry_price = matching_position['entry_price']
            exit_price = signal['price']
            quantity = matching_position['quantity']
            
            # Calculate profit/loss
            pnl = (exit_price - entry_price) * quantity
            
            # Update account balance
            self.account_balance += (exit_price * quantity) + pnl
            
            # Remove position from active positions
            del self.active_positions[signal['timestamp']]
            
            # Log the trade
            print(f"Trade executed: {matching_position['strategy']}")
            print(f"Entry: {entry_price}, Exit: {exit_price}, P&L: {pnl}")
