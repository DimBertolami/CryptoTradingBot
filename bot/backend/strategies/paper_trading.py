from datetime import datetime, timedelta
import json
import os
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/opt/lampp/htdocs/bot/logs/paper_trading.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("paper_trading_strategy")

class PaperTradingStrategy:
    def __init__(self):
        self.is_running = False
        self.mode = "paper"
        self.base_currency = "USDT"
        self.balance = 10000.0  # Starting balance
        self.holdings: Dict[str, float] = {}  # {symbol: amount}
        self.trade_history: list = []
        self.performance: Dict[str, Any] = {
            "total_trades": 0,
            "win_rate": 0.0,
            "profit_loss": 0.0
        }
        self.last_prices: Dict[str, float] = {}
        self.config_file = '/opt/lampp/htdocs/bot/backend/paper_trading_config.json'
        self.state_file = '/opt/lampp/htdocs/bot/backend/paper_trading_state.json'
        
        # Load configuration
        self.load_config()
        self.load_state()

    def load_config(self):
        """Load configuration from file"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                    self.base_currency = config.get('base_currency', 'USDT')
                    self.risk_params = config.get('risk_params', {
                        'max_position_size': 0.1,
                        'stop_loss': 0.02,
                        'take_profit': 0.05
                    })
                    logger.info("Configuration loaded successfully")
            else:
                logger.warning("No configuration file found, using defaults")
        except Exception as e:
            logger.error(f"Error loading configuration: {str(e)}")
            raise

    def load_state(self):
        """Load state from file"""
        try:
            if os.path.exists(self.state_file):
                with open(self.state_file, 'r') as f:
                    state = json.load(f)
                    self.balance = state.get('balance', 10000.0)
                    self.holdings = state.get('holdings', {})
                    self.trade_history = state.get('trade_history', [])
                    self.performance = state.get('performance', {
                        "total_trades": 0,
                        "win_rate": 0.0,
                        "profit_loss": 0.0
                    })
                    logger.info("State loaded successfully")
            else:
                logger.warning("No state file found, starting fresh")
        except Exception as e:
            logger.error(f"Error loading state: {str(e)}")
            raise

    def save_state(self):
        """Save current state to file"""
        try:
            state = {
                'balance': self.balance,
                'holdings': self.holdings,
                'trade_history': self.trade_history,
                'performance': self.performance
            }
            os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
            with open(self.state_file, 'w') as f:
                json.dump(state, f, indent=2)
            logger.info("State saved successfully")
        except Exception as e:
            logger.error(f"Error saving state: {str(e)}")
            raise

    def validate_trade(self, symbol: str, side: str, amount: float) -> bool:
        """Validate if a trade is possible"""
        try:
            if side == 'buy':
                # Check if we have enough balance
                if amount * self.last_prices.get(symbol, 0) > self.balance:
                    logger.warning(f"Insufficient balance for buying {symbol}")
                    return False
            elif side == 'sell':
                # Check if we have enough holdings
                if amount > self.holdings.get(symbol, 0):
                    logger.warning(f"Insufficient holdings for selling {symbol}")
                    return False
            return True
        except Exception as e:
            logger.error(f"Error validating trade: {str(e)}")
            return False

    def execute_trade(self, symbol: str, side: str, amount: float, price: float) -> Dict:
        """Execute a trade"""
        try:
            if not self.validate_trade(symbol, side, amount):
                return {
                    'success': False,
                    'message': 'Trade validation failed'
                }

            # Update holdings
            if side == 'buy':
                self.balance -= amount * price
                self.holdings[symbol] = self.holdings.get(symbol, 0) + amount
            elif side == 'sell':
                self.balance += amount * price
                self.holdings[symbol] = self.holdings.get(symbol, 0) - amount

            # Record trade
            trade = {
                'timestamp': datetime.now().isoformat(),
                'symbol': symbol,
                'side': side,
                'amount': amount,
                'price': price,
                'balance': self.balance
            }
            self.trade_history.append(trade)
            self.performance['total_trades'] += 1

            # Update performance metrics
            self.update_performance_metrics()

            # Save state
            self.save_state()

            return {
                'success': True,
                'trade': trade,
                'balance': self.balance,
                'holdings': self.holdings
            }
        except Exception as e:
            logger.error(f"Error executing trade: {str(e)}")
            return {
                'success': False,
                'message': str(e)
            }

    def update_performance_metrics(self):
        """Update performance metrics based on trade history"""
        if not self.trade_history:
            return

        total_trades = len(self.trade_history)
        winning_trades = sum(
            1 for trade in self.trade_history
            if trade['side'] == 'buy' and trade['price'] < self.last_prices.get(trade['symbol'], 0) or
               trade['side'] == 'sell' and trade['price'] > self.last_prices.get(trade['symbol'], 0)
        )

        self.performance['win_rate'] = winning_trades / total_trades if total_trades > 0 else 0
        self.performance['profit_loss'] = (self.balance - 10000.0) / 10000.0  # Calculate from initial balance

    def get_status(self) -> Dict:
        """Get current trading status"""
        return {
            'is_running': self.is_running,
            'mode': self.mode,
            'balance': self.balance,
            'holdings': self.holdings,
            'performance': self.performance,
            'trade_history': self.trade_history[-10:],  # Last 10 trades
            'last_prices': self.last_prices,
            'last_updated': datetime.now().isoformat()
        }

    def start(self):
        """Start trading"""
        if self.is_running:
            return {
                'success': False,
                'message': 'Trading is already running'
            }
        
        self.is_running = True
        logger.info("Paper trading started")
        return {
            'success': True,
            'message': 'Paper trading started'
        }

    def stop(self):
        """Stop trading"""
        if not self.is_running:
            return {
                'success': False,
                'message': 'Trading is not running'
            }
        
        self.is_running = False
        logger.info("Paper trading stopped")
        return {
            'success': True,
            'message': 'Paper trading stopped'
        }
