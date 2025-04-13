"""
Paper Trading Strategy
This strategy simulates trading without real money, allowing for testing and analysis.
"""

import json
import os
import logging
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

# Configure logging
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / 'frontend'
TRADING_DATA_DIR = FRONTEND_DIR / 'trading_data'
LOGS_DIR = BASE_DIR / 'logs'

# Create directories if they don't exist
os.makedirs(TRADING_DATA_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOGS_DIR / 'paper_trading.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class PaperTradingStrategy:
    def __init__(self, config_file: Optional[str] = None):
        """Initialize paper trading strategy."""
        self.is_running = False
        self.mode = "paper"  # Default to paper trading mode
        self.base_currency = "USDT"
        self.balance = 10000.0  # Initial balance
        self.holdings = {}  # symbol: amount
        self.last_prices = {}  # symbol: price
        self.trade_history = []
        self.symbols = []  # List of trading symbols
        
        # Default configuration
        self.config = {
            'auto_execute_suggested_trades': True,
            'min_confidence_threshold': 0.75,
            'suggested_trade_refresh_interval': 300,
            'initial_balance': 10000.0,
            'trading_interval': 300,
            'symbols': [],
            'last_updated': datetime.now().isoformat()
        }
        
        # Set default config file path if not provided
        if config_file is None:
            config_file = TRADING_DATA_DIR / 'trading_config.json'
            
        self.config_file = config_file
        
        # Load configuration if file exists
        if os.path.exists(config_file):
            self.load_config(config_file)
        else:
            # Save default config if file doesn't exist
            self.save_config()
        
        # Update instance variables from config
        self.balance = self.config.get('initial_balance', 10000.0)
        self.symbols = self.config.get('symbols', [])
        self.trading_interval = self.config.get('trading_interval', 300)
        self.auto_execute_suggested_trades = self.config.get('auto_execute_suggested_trades', True)
        self.min_confidence_threshold = self.config.get('min_confidence_threshold', 0.75)
        self.suggested_trade_refresh_interval = self.config.get('suggested_trade_refresh_interval', 300)

    def load_config(self, config_file: str) -> None:
        """Load configuration from file."""
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            # Validate and update configuration
            for key, default in self.config.items():
                if isinstance(default, bool):
                    self.config[key] = bool(config.get(key, default))
                elif isinstance(default, float):
                    self.config[key] = float(config.get(key, default))
                elif isinstance(default, int):
                    self.config[key] = int(config.get(key, default))
                elif isinstance(default, list):
                    self.config[key] = list(config.get(key, default))
                else:
                    self.config[key] = config.get(key, default)
            
            # Update instance variables
            self.update_config_from_dict(self.config)
            
            logger.info(f"Loaded configuration from {config_file}")
        except Exception as e:
            logger.error(f"Error loading configuration: {str(e)}")
            raise

    def save_config(self) -> None:
        """Save current configuration to file."""
        try:
            if not self.config_file:
                raise ValueError("No config file path provided")
                
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=2)
            
            logger.info(f"Trading configuration saved to {self.config_file}")
        except Exception as e:
            logger.error(f"Error saving configuration: {str(e)}")
            raise

    def update_config_from_dict(self, config: Dict) -> None:
        """Update configuration from dictionary."""
        self.config.update(config)
        
        # Update instance variables from config
        self.balance = self.config.get('initial_balance', 10000.0)
        self.symbols = self.config.get('symbols', [])
        self.trading_interval = self.config.get('trading_interval', 300)
        self.auto_execute_suggested_trades = self.config.get('auto_execute_suggested_trades', True)
        self.min_confidence_threshold = self.config.get('min_confidence_threshold', 0.75)
        self.suggested_trade_refresh_interval = self.config.get('suggested_trade_refresh_interval', 300)
        
        logger.info("Configuration updated from dictionary")

    def get_config(self) -> Dict:
        """Get current configuration."""
        return {
            'auto_execute_suggested_trades': self.auto_execute_suggested_trades,
            'min_confidence_threshold': self.min_confidence_threshold,
            'suggested_trade_refresh_interval': self.suggested_trade_refresh_interval,
            'initial_balance': self.balance,
            'trading_interval': self.trading_interval,
            'symbols': self.symbols,
            'last_updated': datetime.now().isoformat(),
            'api_keys_configured': bool(self.config.get('api_key') and self.config.get('api_secret')),
            'api_keys_valid': self.validate_api_keys()
        }

    def validate_api_keys(self) -> bool:
        """Validate API keys format and length."""
        try:
            api_key = self.config.get('api_key', '')
            api_secret = self.config.get('api_secret', '')
            
            # Basic validation - API keys should be of certain length and format
            if not api_key or not api_secret:
                return False
                
            # Validate key length
            if len(api_key) < 20 or len(api_secret) < 30:
                return False
                
            # Validate format (basic alphanumeric check)
            if not api_key.isalnum() or not api_secret.isalnum():
                return False
                
            return True
        except Exception as e:
            logger.error(f"Error validating API keys: {str(e)}")
            return False

    def save_state(self) -> None:
        """Save current state to file."""
        state = {
            'balance': self.balance,
            'holdings': self.holdings,
            'last_prices': self.last_prices,
            'trade_history': self.trade_history
        }
        
        state_path = TRADING_DATA_DIR / 'paper_trading_state.json'
        try:
            with open(state_path, 'w') as f:
                json.dump(state, f, indent=4)
            logger.info(f"Trading state saved to {state_path}")
        except Exception as e:
            logger.error(f"Failed to save trading state: {e}")

    def load_state(self) -> None:
        """Load state from file."""
        state_path = TRADING_DATA_DIR / 'paper_trading_state.json'
        try:
            if state_path.exists():
                with open(state_path, 'r') as f:
                    state = json.load(f)
                self.balance = state.get('balance', self.balance)
                self.holdings = state.get('holdings', self.holdings)
                self.last_prices = state.get('last_prices', self.last_prices)
                self.trade_history = state.get('trade_history', self.trade_history)
                logger.info(f"Trading state loaded from {state_path}")
        except Exception as e:
            logger.error(f"Failed to load trading state: {e}")
            self.reset_state()

    def calculate_portfolio_value(self) -> float:
        """Calculate current portfolio value."""
        holdings_value = sum(
            self.holdings[symbol] * self.last_prices.get(symbol, 0)
            for symbol in self.holdings
        )
        return self.balance + holdings_value

    def get_performance_metrics(self) -> Dict[str, float]:
        """Get performance metrics."""
        total_trades = len(self.trade_history)
        
        # Calculate win rate
        wins = sum(
            1 for trade in self.trade_history
            if trade.get('side') == 'SELL' and trade.get('confidence', 0) > 0.5
        )
        win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
        
        # Calculate profit/loss
        initial_balance = 10000.0
        current_value = self.calculate_portfolio_value()
        profit_loss = current_value - initial_balance
        return_pct = (profit_loss / initial_balance) * 100
        
        # Calculate max drawdown
        max_drawdown = 0
        peak = initial_balance
        for trade in self.trade_history:
            if trade.get('side') == 'SELL':
                value = self.calculate_portfolio_value()
                if value > peak:
                    peak = value
                drawdown = (peak - value) / peak * 100
                max_drawdown = max(max_drawdown, drawdown)
        
        return {
            'total_trades': total_trades,
            'win_rate': win_rate,
            'profit_loss': profit_loss,
            'return_pct': return_pct,
            'max_drawdown': max_drawdown
        }

    def start(self, interval_seconds: int = 300) -> None:
        """Start the paper trading strategy."""
        if self.is_running:
            logger.warning("Paper trading is already running")
            return
            
        self.is_running = True
        self.trading_interval = interval_seconds
        logger.info(f"Started paper trading with interval: {interval_seconds} seconds")
        
        # Save updated configuration
        self.save_config()

    def stop(self) -> None:
        """Stop the paper trading strategy."""
        if not self.is_running:
            logger.warning("Paper trading is already stopped")
            return
            
        self.is_running = False
        logger.info("Stopped paper trading")
        
        # Save final state
        self.save_state()

    def reset(self) -> None:
        """Reset to initial state."""
        self.balance = 10000.0
        self.holdings = {}
        self.last_prices = {}
        self.trade_history = []
        self.is_running = False
        logger.info("Paper trading reset to initial state")

    def _start_trading_cycle(self) -> None:
        """Start the trading cycle."""
        if not self.is_running:
            return

        try:
            # Get current prices for all symbols
            for symbol in self.symbols:
                # Simulate getting current price (in real implementation, this would be from an exchange)
                current_price = self._get_current_price(symbol)
                self.last_prices[symbol] = current_price
                
                # Check for trading opportunities
                self._check_trading_opportunities(symbol, current_price)
            
            # Save current state
            self.save_state()
            
            # Schedule next cycle
            import time
            time.sleep(self.trading_interval)
            self._start_trading_cycle()
            
        except Exception as e:
            logger.error(f"Error in trading cycle: {str(e)}")
            import traceback
            traceback.print_exc()
            self.stop()

    def _get_current_price(self, symbol: str) -> float:
        """Simulate getting current price for a symbol."""
        # In real implementation, this would fetch from an exchange
        import random
        return random.uniform(100, 1000)  # Random price for simulation

    def _check_trading_opportunities(self, symbol: str, current_price: float) -> None:
        """Check for trading opportunities based on price."""
        # Simple example strategy - in real implementation this would be more complex
        if current_price > 500:  # Buy when price is high
            self._execute_trade(symbol, current_price, "BUY")
        elif current_price < 300:  # Sell when price is low
            self._execute_trade(symbol, current_price, "SELL")

    def _execute_trade(self, symbol: str, price: float, side: str, quantity: Optional[float] = None) -> None:
        """Execute a trade."""
        confidence = 0.8  # Simulated confidence score
        
        if side == "BUY":
            if quantity is None:
                # Calculate quantity based on balance if not specified
                max_spend = self.balance * 0.1  # 10% of balance
                quantity = max_spend / price
            
            # Ensure we don't exceed balance
            if quantity * price > self.balance:
                quantity = self.balance / price
            
            # Execute buy
            self.balance -= (quantity * price)
            if symbol in self.holdings:
                self.holdings[symbol] += quantity
            else:
                self.holdings[symbol] = quantity
            
            trade = {
                'timestamp': datetime.now().isoformat(),
                'symbol': symbol,
                'side': side,
                'price': price,
                'quantity': quantity,
                'confidence': confidence
            }
            self.trade_history.append(trade)
            logger.info(f"BUY {quantity:.4f} {symbol} at {price:.2f} = {quantity*price:.4f} USDT")
            
        elif side == "SELL":
            if quantity is None:
                # Get quantity to sell (50% of holdings)
                quantity = self.holdings.get(symbol, 0) * 0.5
            
            if quantity > 0:
                if quantity > self.holdings[symbol]:
                    quantity = self.holdings[symbol]
                
                # Execute sell
                proceeds = quantity * price
                self.balance += proceeds
                self.holdings[symbol] -= quantity
                if self.holdings[symbol] <= 0:
                    del self.holdings[symbol]
                
                trade = {
                    'timestamp': datetime.now().isoformat(),
                    'symbol': symbol,
                    'side': side,
                    'price': price,
                    'quantity': quantity,
                    'confidence': confidence
                }
                self.trade_history.append(trade)
                logger.info(f"SELL {quantity:.4f} {symbol} at {price:.2f} = {proceeds:.4f} USDT")
