import numpy as np
import pandas as pd
from typing import Dict, Tuple, Optional
from .utils import logger, ValidationError

class TradingEnvironment:
    """Enhanced trading environment with safety features and validation"""
    
    def __init__(self, data: pd.DataFrame, initial_balance: float = 10000.0,
                 max_position_size: float = 1.0, stop_loss: float = 0.1):
        self._validate_init_params(data, initial_balance, max_position_size, stop_loss)
        
        self.data = data
        self.initial_balance = initial_balance
        self.max_position_size = max_position_size
        self.stop_loss = stop_loss
        self.reset()
        
        # Trading constraints
        self.min_trade_amount = 100.0  # Minimum trade size
        self.max_trades_per_day = 5    # Maximum trades per day
        self.trading_fee = 0.001       # 0.1% trading fee
        
        # Risk management
        self.max_drawdown = 0.2        # 20% maximum drawdown
        self.position_limits = {
            'long': self.max_position_size,
            'short': -self.max_position_size
        }
        
    def _validate_init_params(self, data: pd.DataFrame, initial_balance: float,
                            max_position_size: float, stop_loss: float) -> None:
        """Validate initialization parameters"""
        if not isinstance(data, pd.DataFrame):
            raise ValidationError("data must be a pandas DataFrame")
        
        required_columns = {'open', 'high', 'low', 'close', 'volume'}
        if not all(col in data.columns for col in required_columns):
            raise ValidationError(f"data must contain columns: {required_columns}")
        
        if initial_balance <= 0:
            raise ValidationError("initial_balance must be positive")
        
        if not 0 < max_position_size <= 1:
            raise ValidationError("max_position_size must be between 0 and 1")
        
        if not 0 < stop_loss < 1:
            raise ValidationError("stop_loss must be between 0 and 1")
    
    def reset(self) -> np.ndarray:
        """Reset the environment with validation"""
        self.current_step = 0
        self.balance = self.initial_balance
        self.position = 0
        self.entry_price = 0
        self.trades_today = 0
        self.last_trade_day = None
        self.done = False
        self.max_balance = self.initial_balance
        self.trades_history = []
        
        return self._get_state()
    
    def _get_state(self) -> np.ndarray:
        """Get current state with validation"""
        try:
            if self.current_step >= len(self.data):
                return np.zeros(7)  # Safe default state
            
            current_data = self.data.iloc[self.current_step]
            state = np.array([
                current_data['close'],
                current_data['volume'],
                current_data['close'] / current_data['open'] - 1,  # Returns
                self.balance,
                self.position,
                self.current_step / len(self.data),  # Progress
                self._calculate_drawdown()
            ])
            
            # Validate state
            if np.isnan(state).any() or np.isinf(state).any():
                raise ValidationError("Invalid state values detected")
            
            return state
            
        except Exception as e:
            logger.error(f"Error getting state: {str(e)}")
            return np.zeros(7)  # Safe default state
    
    def _calculate_drawdown(self) -> float:
        """Calculate current drawdown"""
        current_total = self.balance + self.position * self.data.iloc[self.current_step]['close']
        return (self.max_balance - current_total) / self.max_balance if self.max_balance > 0 else 0
    
    def _check_stop_loss(self) -> bool:
        """Check if stop loss has been triggered"""
        if self.position == 0 or self.entry_price == 0:
            return False
            
        current_price = self.data.iloc[self.current_step]['close']
        loss_percentage = (current_price - self.entry_price) / self.entry_price
        
        return abs(loss_percentage) >= self.stop_loss
    
    def _validate_action(self, action: int) -> None:
        """Validate trading action"""
        if not isinstance(action, int) or action not in {0, 1, 2}:
            raise ValidationError("Invalid action. Must be 0 (hold), 1 (buy), or 2 (sell)")
        
        # Check trading limits
        current_date = self.data.iloc[self.current_step].name.date()
        if current_date == self.last_trade_day:
            if self.trades_today >= self.max_trades_per_day:
                raise ValidationError("Maximum daily trades exceeded")
    
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, Dict]:
        """Execute step with comprehensive validation and safety checks"""
        try:
            if self.done:
                return self._get_state(), 0, True, {}
            
            self._validate_action(action)
            
            # Execute action with safety checks
            reward = self._safe_execute_action(action)
            
            # Update environment state
            self.current_step += 1
            self.done = (self.current_step >= len(self.data) - 1 or
                        self._calculate_drawdown() >= self.max_drawdown)
            
            # Get next state and info
            next_state = self._get_state()
            info = self._get_step_info()
            
            return next_state, reward, self.done, info
            
        except Exception as e:
            logger.error(f"Error in step: {str(e)}")
            return self._get_state(), 0, True, {'error': str(e)}
    
    def _safe_execute_action(self, action: int) -> float:
        """Execute action with safety checks and position sizing"""
        current_price = self.data.iloc[self.current_step]['close']
        
        # Check stop loss
        if self._check_stop_loss():
            return self._close_position(current_price)
        
        # Execute action
        if action == 1 and self.position <= 0:  # Buy
            return self._open_position(current_price, 'long')
        elif action == 2 and self.position > 0:  # Sell
            return self._close_position(current_price)
        
        # Calculate holding reward/penalty
        return self._calculate_holding_reward()
    
    def _open_position(self, price: float, direction: str) -> float:
        """Open a new position with position sizing and safety checks"""
        # Calculate position size with safety limits
        available_balance = self.balance * self.max_position_size
        position_size = max(min(available_balance / price, self.position_limits[direction]), 0)
        
        if position_size * price < self.min_trade_amount:
            return 0  # Too small to trade
        
        # Apply trading fee
        fee = position_size * price * self.trading_fee
        self.balance -= fee
        
        # Execute trade
        self.position = position_size if direction == 'long' else -position_size
        self.entry_price = price
        self.balance -= position_size * price
        
        # Update trade tracking
        current_date = self.data.iloc[self.current_step].name.date()
        if current_date != self.last_trade_day:
            self.trades_today = 1
            self.last_trade_day = current_date
        else:
            self.trades_today += 1
        
        return 0  # No immediate reward for opening position
    
    def _close_position(self, price: float) -> float:
        """Close current position with proper accounting"""
        if self.position == 0:
            return 0
        
        # Calculate profit/loss
        position_value = self.position * price
        entry_value = self.position * self.entry_price
        profit = position_value - entry_value
        
        # Apply trading fee
        fee = abs(position_value) * self.trading_fee
        profit -= fee
        
        # Update balance and position
        self.balance += position_value + profit
        self.position = 0
        self.entry_price = 0
        
        # Update maximum balance
        self.max_balance = max(self.max_balance, self.balance)
        
        # Record trade
        self.trades_history.append({
            'exit_price': price,
            'profit': profit,
            'fee': fee
        })
        
        return profit / entry_value * 100  # Return percentage profit/loss
    
    def _calculate_holding_reward(self) -> float:
        """Calculate reward/penalty for holding position"""
        if self.position == 0:
            return 0
        
        current_price = self.data.iloc[self.current_step]['close']
        unrealized_profit = self.position * (current_price - self.entry_price)
        return unrealized_profit / (self.position * self.entry_price) * 100
    
    def _get_step_info(self) -> Dict:
        """Get detailed step information"""
        return {
            'balance': self.balance,
            'position': self.position,
            'drawdown': self._calculate_drawdown(),
            'trades_today': self.trades_today,
            'total_trades': len(self.trades_history),
            'stop_loss_triggered': self._check_stop_loss()
        }
