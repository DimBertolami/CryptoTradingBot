"""
Trading Engine
Main trading loop that coordinates all components
"""

import os
import sys
import logging
import asyncio
import signal
from typing import Dict, List, Optional
from datetime import datetime, timezone
import pandas as pd
from concurrent.futures import ThreadPoolExecutor

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.trading_config import CONFIG
from trading.exchange_integration import ExchangeIntegration
from trading.advanced_risk_manager import AdvancedRiskManager
from trading.strategy_optimizer import StrategyOptimizer
from trading.deep_learning.trading_strategy import DeepLearningStrategy
from config.deep_learning_config import DEEP_LEARNING_CONFIG

logger = logging.getLogger("trading_engine")

class TradingEngine:
    def __init__(self):
        """Initialize trading engine with all components"""
        self.config = CONFIG
        self.running = False
        self.executor = ThreadPoolExecutor(max_workers=CONFIG['system']['cpu_threads'])
        
        # Initialize components
        self.exchange = ExchangeIntegration(CONFIG['exchange'])
        self.risk_manager = AdvancedRiskManager(CONFIG['risk'])
        self.strategy = StrategyOptimizer(CONFIG['strategy'])
        self.deep_learning = DeepLearningStrategy(DEEP_LEARNING_CONFIG)
        
        # State tracking
        self.positions = {}
        self.orders = {}
        self.market_data = {}
        self.performance_metrics = {}
        
        # Setup logging
        self._setup_logging()
        
        # Register signal handlers
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

    def _setup_logging(self):
        """Setup logging configuration"""
        os.makedirs(os.path.dirname(CONFIG['monitoring']['log_file']), exist_ok=True)
        
        logging.basicConfig(
            level=CONFIG['monitoring']['log_level'],
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(CONFIG['monitoring']['log_file']),
                logging.StreamHandler()
            ]
        )

    async def initialize(self):
        """Initialize all components"""
        try:
            # Initialize exchange connection
            await self.exchange.initialize()
            
            # Load historical data for initial analysis
            await self._load_historical_data()
            
            # Initial market analysis
            await self._analyze_markets()
            
            logger.info("Trading engine initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize trading engine: {e}")
            return False

    async def _load_historical_data(self):
        """Load historical data for all symbols and timeframes"""
        for symbol in CONFIG['exchange']['symbols']:
            self.market_data[symbol] = {}
            for timeframe in CONFIG['strategy']['timeframes']:
                try:
                    # Fetch historical data
                    data = await self.exchange.get_historical_data(
                        symbol,
                        timeframe,
                        limit=1000
                    )
                    self.market_data[symbol][timeframe] = data
                    
                    # Train initial model
                    self.strategy.train_model(symbol, timeframe, data)
                    
                except Exception as e:
                    logger.error(f"Error loading historical data for {symbol} {timeframe}: {e}")

    async def _analyze_markets(self):
        """Perform market analysis across all symbols"""
        try:
            for symbol in self.market_data:
                # Update market regime
                daily_data = self.market_data[symbol].get('1d')
                if daily_data is not None:
                    regime = self.strategy.detect_market_regime(daily_data, symbol)
                    logger.info(f"Market regime for {symbol}: {regime}")
                
                # Update correlation matrix
                self.risk_manager.update_correlation_matrix(
                    {s: self.market_data[s]['1d'] for s in self.market_data}
                )
                
        except Exception as e:
            logger.error(f"Error in market analysis: {e}")

    async def _update_market_data(self):
        """Update market data for all symbols and timeframes"""
        try:
            for symbol in CONFIG['exchange']['symbols']:
                for timeframe in CONFIG['strategy']['timeframes']:
                    data = await self.exchange.get_historical_data(
                        symbol,
                        timeframe,
                        limit=100  # Get recent data only
                    )
                    
                    if symbol in self.market_data and timeframe in self.market_data[symbol]:
                        # Update existing data
                        self.market_data[symbol][timeframe] = pd.concat(
                            [self.market_data[symbol][timeframe], data]
                        ).drop_duplicates()
                    else:
                        self.market_data[symbol][timeframe] = data
                        
        except Exception as e:
            logger.error(f"Error updating market data: {e}")

    async def _check_and_execute_trades(self):
        """Check for trading opportunities and execute trades"""
        try:
            portfolio = await self.exchange.get_portfolio()
            
            for symbol in CONFIG['exchange']['symbols']:
                # Skip if maximum positions reached
                if len(self.positions) >= CONFIG['trading']['max_open_positions']:
                    break
                
                # Get trading signals from both strategies
                traditional_signals = self.strategy.analyze_multiple_timeframes(
                    symbol,
                    self.market_data[symbol]
                )
                
                # Get deep learning predictions
                dl_action, dl_confidence, dl_return = self.deep_learning.predict(
                    self.market_data[symbol]['1m']
                )
                
                # Combine signals
                combined_signal = self._combine_signals(
                    traditional_signals['final_signal'],
                    dl_action,
                    dl_confidence,
                    dl_return
                )
                
                # Check if signal is strong enough
                if combined_signal > CONFIG['strategy']['confidence_threshold']:
                    # Check risk limits
                    position_size = await self.risk_manager.calculate_position_size(
                        symbol,
                        float(self.market_data[symbol]['1m'].iloc[-1]['close']),
                        portfolio['total_value']
                    )
                    
                    if position_size > 0:
                        # Execute trade
                        order = await self.exchange.execute_order(
                            symbol=symbol,
                            side='BUY',
                            amount=position_size
                        )
                        
                        if order:
                            logger.info(f"Executed trade: {order}")
                            self.positions[symbol] = order
                            
                            # Set stop-loss and take-profit
                            entry_price = float(order['price'])
                            stop_loss, take_profit = self.risk_manager.calculate_dynamic_stop_loss(
                                symbol,
                                entry_price,
                                position_size
                            )
                            
                            # Place stop-loss order
                            await self.exchange.execute_order(
                                symbol=symbol,
                                side='SELL',
                                amount=position_size,
                                order_type='STOP_LOSS',
                                price=stop_loss
                            )
                
        except Exception as e:
            logger.error(f"Error in trade execution: {e}")

    async def _monitor_positions(self):
        """Monitor and manage open positions"""
        try:
            for symbol, position in list(self.positions.items()):
                # Get current market data
                current_price = float(self.market_data[symbol]['1m'].iloc[-1]['close'])
                entry_price = float(position['price'])
                
                # Check for emergency exit conditions
                emergency_exit, reason = await self.risk_manager.check_emergency_shutdown(
                    self.positions
                )
                
                if emergency_exit:
                    logger.warning(f"Emergency exit triggered: {reason}")
                    # Close all positions
                    await self._close_all_positions()
                    return
                
                # Update trailing stop
                new_stop = self.risk_manager.calculate_trailing_stop(
                    entry_price,
                    current_price
                )
                
                if new_stop > position.get('stop_loss', 0):
                    # Update stop-loss order
                    await self.exchange.update_order(
                        symbol=symbol,
                        order_id=position['stop_loss_order_id'],
                        price=new_stop
                    )
                    self.positions[symbol]['stop_loss'] = new_stop
                
        except Exception as e:
            logger.error(f"Error monitoring positions: {e}")

    async def _close_all_positions(self):
        """Close all open positions"""
        try:
            for symbol, position in list(self.positions.items()):
                await self.exchange.execute_order(
                    symbol=symbol,
                    side='SELL',
                    amount=position['amount'],
                    order_type='MARKET'
                )
                del self.positions[symbol]
            
            logger.info("All positions closed")
            
        except Exception as e:
            logger.error(f"Error closing positions: {e}")

    def _combine_signals(self,
                     traditional_signal: float,
                     dl_action: int,
                     dl_confidence: float,
                     dl_return: float) -> float:
        """Combine traditional and deep learning signals"""
        try:
            # Convert DQN action to signal direction
            dl_signal = {
                0: 0.0,    # Hold
                1: 1.0,    # Buy
                2: -1.0    # Sell
            }.get(dl_action, 0.0)
            
            # Weight the signals based on confidence
            traditional_weight = 0.4  # 40% weight to traditional signals
            dl_weight = 0.6          # 60% weight to deep learning
            
            # Adjust DL weight based on confidence
            dl_weight *= dl_confidence
            
            # Combine signals
            combined = (
                traditional_signal * traditional_weight +
                dl_signal * dl_weight
            ) / (traditional_weight + dl_weight)
            
            # Factor in predicted return
            if abs(dl_return) > DEEP_LEARNING_CONFIG['prediction_threshold']:
                combined *= (1 + np.sign(dl_return) * min(abs(dl_return), 0.1))
            
            return combined
            
        except Exception as e:
            logger.error(f"Error combining signals: {e}")
            return 0.0

    async def _update_performance_metrics(self):
        """Update trading performance metrics"""
        try:
            portfolio = await self.exchange.get_portfolio()
            
            # Calculate metrics
            self.performance_metrics = {
                'total_value': portfolio['total_value'],
                'daily_pnl': portfolio.get('daily_pnl', 0),
                'total_pnl': portfolio.get('total_pnl', 0),
                'win_rate': portfolio.get('win_rate', 0),
                'sharpe_ratio': portfolio.get('sharpe_ratio', 0)
            }
            
            # Log metrics
            logger.info(f"Performance metrics: {self.performance_metrics}")
            
        except Exception as e:
            logger.error(f"Error updating performance metrics: {e}")

    def _handle_shutdown(self, signum, frame):
        """Handle shutdown signals"""
        logger.info("Shutdown signal received")
        self.running = False

    async def run(self):
        """Main trading loop"""
        logger.info("Starting trading engine")
        self.running = True
        
        if not await self.initialize():
            logger.error("Failed to initialize trading engine")
            return
        
        last_data_update = 0
        last_model_update = 0
        last_risk_update = 0
        
        while self.running:
            try:
                current_time = datetime.now(timezone.utc).timestamp()
                
                # Update market data
                if current_time - last_data_update > CONFIG['trading']['market_data_refresh']:
                    await self._update_market_data()
                    last_data_update = current_time
                
                # Update models
                if current_time - last_model_update > CONFIG['trading']['model_retrain_interval']:
                    for symbol in self.market_data:
                        for timeframe in CONFIG['strategy']['timeframes']:
                            self.strategy.train_model(
                                symbol,
                                timeframe,
                                self.market_data[symbol][timeframe],
                                force_retrain=True
                            )
                    last_model_update = current_time
                
                # Update risk metrics
                if current_time - last_risk_update > CONFIG['trading']['risk_update_interval']:
                    await self._analyze_markets()
                    last_risk_update = current_time
                
                # Check for and execute trades
                await self._check_and_execute_trades()
                
                # Monitor positions
                await self._monitor_positions()
                
                # Update performance metrics
                await self._update_performance_metrics()
                
                # Sleep for update interval
                await asyncio.sleep(CONFIG['trading']['update_interval'])
                
            except Exception as e:
                logger.error(f"Error in main trading loop: {e}")
                await asyncio.sleep(5)  # Sleep on error to prevent tight loop
        
        # Cleanup on shutdown
        await self._close_all_positions()
        await self.exchange.close()
        self.executor.shutdown()
        logger.info("Trading engine stopped")
