"""
Backtesting engine supporting both historical and real-time simulation

This module provides a comprehensive backtesting framework for cryptocurrency trading strategies.
It supports both historical data simulation and real-time market simulation, allowing traders
to test and optimize their strategies in various market conditions.

Key Features:
- Historical backtesting with configurable timeframes
- Real-time simulation with WebSocket support
- Advanced order execution with slippage modeling
- Comprehensive performance metrics calculation
- Risk management and position sizing
- Multiple trading strategy support
"""

from typing import Dict, List, Optional, Type
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import asyncio
from .data_handler import DataHandler, MockExchange
from .performance_metrics import PerformanceAnalyzer, TradeMetrics
from ..strategies.trading_strategy import TradingStrategy
from ..execution.order_types import OrderRequest, OrderResponse, OrderSide
from ..ml.utils import logger

class BacktestEngine:
    """Main backtesting engine class that orchestrates the simulation process.
    
    Args:
        strategy_class: Trading strategy class to use for simulation
        symbols: List of trading pairs to simulate
        initial_capital: Starting capital for the simulation
        commission_rate: Trading commission rate (default: 0.1%)
        slippage_model: Type of slippage model to use ('basic', 'volume_weighted', etc.)
        risk_free_rate: Risk-free rate for performance calculations
        config: Additional configuration parameters for the strategy
    
    Attributes:
        data_handler: Component for handling market data
        performance_analyzer: Component for calculating performance metrics
        current_capital: Current available capital
        positions: Dictionary of open positions
        open_orders: List of pending orders
        filled_orders: List of executed orders
        equity_curve: Historical equity values
        trade_history: List of completed trades
    """
    
    def __init__(self, 
                 strategy_class: Type[TradingStrategy],
                 symbols: List[str],
                 initial_capital: float = 100000.0,
                 commission_rate: float = 0.001,  # 0.1%
                 slippage_model: str = 'basic',
                 risk_free_rate: float = 0.02,
                 config: Dict = {}):
        
        self.strategy_class = strategy_class
        self.symbols = symbols
        self.initial_capital = initial_capital
        self.commission_rate = commission_rate
        self.slippage_model = slippage_model
        self.config = config
        
        # Initialize components
        self.data_handler = DataHandler(
            exchange_id='mock',
            testnet=False
        )
        self.performance_analyzer = PerformanceAnalyzer(
            initial_capital, risk_free_rate)
        
        # State management
        self.current_capital = initial_capital
        self.positions: Dict[str, Dict] = {}
        self.open_orders: List[OrderRequest] = []
        self.filled_orders: List[OrderResponse] = []
        
        # Performance tracking
        self.equity_curve = []
        self.trade_history: List[TradeMetrics] = []
    
    async def run_historical(self,
                           start_time: datetime,
                           end_time: datetime,
                           timeframe: str = '1m') -> Dict:
        """Run historical backtest simulation.
        
        Args:
            start_time: Start time for the backtest
            end_time: End time for the backtest
            timeframe: Timeframe for data (e.g., '1m', '5m', '1h')
            
        Returns:
            Dictionary containing:
                - metrics: Comprehensive performance metrics
                - equity_curve: Historical equity values
                - trades: List of completed trades
                - positions: Final positions
            
        Raises:
            Exception: If data fetching or strategy execution fails
        """
        try:
            # Initialize
            await self.data_handler.initialize()
            strategy = self.strategy_class(self.config)  # Pass config to strategy
            
            # Fetch historical data
            data = {}
            for symbol in self.symbols:
                data[symbol] = await self.data_handler.fetch_historical_data(
                    symbol, start_time, end_time, timeframe)
            
            # Align all data to same timestamps
            timestamps = sorted(set().union(*[df.index for df in data.values()]))
            
            # Run simulation
            for timestamp in timestamps:
                # Update market data
                current_data = {
                    symbol: df[df.index <= timestamp].iloc[-1]
                    for symbol, df in data.items()
                }
                
                # Process any pending orders
                await self._process_orders(current_data, timestamp)
                
                # Update strategy
                signals = strategy.analyze_market(current_data)
                
                if signals:
                    for signal in signals:
                        order = self._create_order(signal)
                        if order:
                            self.open_orders.append(order)
                
                # Update equity curve
                self._update_equity_curve(timestamp, current_data)
            
            # Calculate performance metrics
            return self._generate_results()
            
        except Exception as e:
            logger.error(f"Historical backtest failed: {str(e)}")
            return {}
    
    async def run_realtime(self, duration: timedelta) -> None:
        """Run real-time market simulation.
        
        Args:
            duration: Duration of the simulation
            
        Note:
            This method uses WebSocket data feeds for real-time updates
        """
        try:
            # Initialize
            await self.data_handler.initialize()
            strategy = self.strategy_class(self.config)
            
            # Start real-time data feed
            await self.data_handler.start_real_time_feed(self.symbols)
            
            # Subscribe to data updates
            self.data_handler.subscribe(self._handle_realtime_update)
            
            # Run for specified duration
            end_time = datetime.now() + duration
            while datetime.now() < end_time:
                await asyncio.sleep(1)
            
            # Clean up
            await self.data_handler.close()
            
            # Calculate final metrics
            return self._generate_results()
            
        except Exception as e:
            logger.error(f"Real-time simulation failed: {str(e)}")
            return {}
    
    async def _handle_realtime_update(self, data: Dict):
        """Handle real-time data updates.
        
        Args:
            data: Real-time market data
            
        Note:
            This method processes real-time data updates and triggers strategy updates
        """
        try:
            timestamp = pd.to_datetime(data['E'], unit='ms')
            
            # Process any pending orders
            current_data = {
                symbol: self.data_handler.get_latest_data(symbol).iloc[-1]
                for symbol in self.symbols
            }
            
            await self._process_orders(current_data, timestamp)
            
            # Update strategy
            strategy = self.strategy_class(self.config)
            signals = strategy.analyze_market(current_data)
            
            if signals:
                for signal in signals:
                    order = self._create_order(signal)
                    if order:
                        self.open_orders.append(order)
            
            # Update equity curve
            self._update_equity_curve(timestamp, current_data)
            
        except Exception as e:
            logger.error(f"Real-time update failed: {str(e)}")
    
    async def _process_orders(self, current_data: Dict,
                            timestamp: datetime) -> None:
        """Process pending orders and update positions.
        
        Args:
            current_data: Current market data
            timestamp: Current timestamp
            
        Note:
            This method handles order execution, slippage, and position updates
        """
        for order in self.open_orders[:]:  # Copy list for iteration
            filled_price = self._calculate_fill_price(
                order, current_data[order.symbol])
            
            if filled_price:
                # Calculate fees and slippage
                fees = self._calculate_fees(order.quantity, filled_price)
                slippage = self._calculate_slippage(
                    order, filled_price, current_data[order.symbol])
                
                # Create fill response
                response = OrderResponse(
                    success=True,
                    order_id=str(len(self.filled_orders) + 1),
                    filled_quantity=order.quantity,
                    average_price=filled_price,
                    fees=fees,
                    timestamp=timestamp
                )
                
                # Update positions
                self._update_position(order, filled_price, fees + slippage)
                
                # Record trade
                self._record_trade(order, response, slippage)
                
                # Move order to filled
                self.open_orders.remove(order)
                self.filled_orders.append(response)
    
    def _calculate_fill_price(self, order: OrderRequest,
                            market_data: pd.Series) -> Optional[float]:
        """Calculate fill price based on order type and market data.
        
        Args:
            order: Order request
            market_data: Current market data
            
        Returns:
            Fill price or None if order cannot be filled
        """
        if order.order_type == "market":
            return market_data['close']
        
        elif order.order_type == "limit":
            if (order.side == OrderSide.BUY and
                market_data['low'] <= order.price) or \
               (order.side == OrderSide.SELL and
                market_data['high'] >= order.price):
                return order.price
        
        return None
    
    def _calculate_fees(self, quantity: float, price: float) -> float:
        """Calculate trading fees.
        
        Args:
            quantity: Order quantity
            price: Order price
            
        Returns:
            Trading fees
        """
        return quantity * price * self.commission_rate
    
    def _calculate_slippage(self, order: OrderRequest, fill_price: float,
                          market_data: pd.Series) -> float:
        """Calculate slippage based on configured model.
        
        Args:
            order: Order request
            fill_price: Fill price
            market_data: Current market data
            
        Returns:
            Slippage amount
        """
        if self.slippage_model == 'basic':
            # Basic fixed percentage slippage
            return abs(fill_price * 0.0001)  # 0.01% slippage
            
        elif self.slippage_model == 'volume_based':
            # Slippage based on order size relative to volume
            volume_ratio = (order.quantity * fill_price) / \
                         market_data['volume']
            return abs(fill_price * 0.0001 * (1 + volume_ratio))
            
        return 0.0
    
    def _update_position(self, order: OrderRequest, fill_price: float,
                        costs: float):
        """Update position after order fill.
        
        Args:
            order: Order request
            fill_price: Fill price
            costs: Total costs (fees + slippage)
        """
        symbol = order.symbol
        quantity = order.quantity if order.side == OrderSide.BUY else -order.quantity
        
        if symbol not in self.positions:
            self.positions[symbol] = {
                'quantity': 0,
                'average_price': 0,
                'realized_pnl': 0
            }
        
        position = self.positions[symbol]
        
        # Update position
        if position['quantity'] == 0:
            position['average_price'] = fill_price
        else:
            # Calculate new average price for additional buys
            if (position['quantity'] > 0 and quantity > 0) or \
               (position['quantity'] < 0 and quantity < 0):
                total_quantity = position['quantity'] + quantity
                position['average_price'] = (
                    position['quantity'] * position['average_price'] +
                    quantity * fill_price
                ) / total_quantity
        
        # Update quantity
        position['quantity'] += quantity
        
        # Update capital
        self.current_capital -= (quantity * fill_price + costs)
    
    def _record_trade(self, order: OrderRequest, response: OrderResponse,
                     slippage: float):
        """Record completed trade metrics.
        
        Args:
            order: Order request
            response: Order response
            slippage: Slippage amount
        """
        trade = TradeMetrics(
            entry_time=response.timestamp,
            exit_time=response.timestamp,
            symbol=order.symbol,
            side=order.side.value,
            entry_price=response.average_price,
            exit_price=response.average_price,
            quantity=order.quantity,
            pnl=0,  # Will be updated on position close
            fees=response.fees,
            slippage=slippage,
            holding_period=0,
            return_pct=0
        )
        
        self.performance_analyzer.add_trade(trade)
    
    def _update_equity_curve(self, timestamp: datetime,
                           current_data: Dict):
        """Update equity curve with current portfolio value.
        
        Args:
            timestamp: Current timestamp
            current_data: Current market data
            
        Note:
            This method calculates and records the current portfolio value
            including unrealized P&L from open positions
        """
        portfolio_value = self.current_capital
        
        # Add unrealized P&L from open positions
        for symbol, position in self.positions.items():
            if position['quantity'] != 0:
                current_price = current_data[symbol]['close']
                unrealized_pnl = position['quantity'] * (
                    current_price - position['average_price'])
                portfolio_value += unrealized_pnl
        
        self.equity_curve.append({
            'timestamp': timestamp,
            'portfolio_value': portfolio_value
        })
    
    def _generate_results(self) -> Dict:
        """Generate final backtest results.
        
        Returns:
            Dictionary containing:
                - metrics: Comprehensive performance metrics
                - equity_curve: Historical equity values
                - trades: List of completed trades
                - positions: Final positions
        """
        # Convert equity curve to DataFrame
        equity_df = pd.DataFrame(self.equity_curve)
        equity_df.set_index('timestamp', inplace=True)
        
        # Calculate returns
        returns = equity_df['portfolio_value'].pct_change()
        
        # Calculate benchmark returns if available
        if len(self.symbols) == 1:
            symbol = self.symbols[0]
            benchmark_data = self.data_handler.data_cache.get(
                f"{symbol}_1m")
            if benchmark_data is not None:
                benchmark_returns = benchmark_data['close'].pct_change()
                self.performance_analyzer.set_benchmark_returns(
                    benchmark_returns)
        
        # Calculate comprehensive metrics
        metrics = self.performance_analyzer.calculate_metrics()
        
        return {
            'metrics': metrics,
            'equity_curve': equity_df,
            'trades': self.trade_history,
            'positions': self.positions
        }
    
    def _simulate_trade(self, signal: Dict, position_size: float, 
                       current_data: pd.DataFrame) -> Dict:
        """Simulate a trade execution.
        
        Args:
            signal: Trading signal
            position_size: Size of the position
            current_data: Current market data
            
        Returns:
            Dictionary containing trade result
        """
        trade_result = {
            'profit': 0.0,
            'successful': False
        }
        
        try:
            # Simulate order execution
            entry_price = current_data['close'].iloc[-1]
            exit_price = entry_price * (1 + np.random.normal(0, 0.001))  # Small random fluctuation
            
            if signal['side'] == 'buy':
                trade_result['profit'] = (exit_price - entry_price) * position_size
            else:
                trade_result['profit'] = (entry_price - exit_price) * position_size
                
            trade_result['successful'] = trade_result['profit'] > 0
            
            return trade_result
            
        except Exception as e:
            logger.error(f"Error simulating trade: {str(e)}")
            trade_result['profit'] = 0.0
            trade_result['successful'] = False
            return trade_result

    def _create_order(self, signal: dict) -> Optional[OrderRequest]:
        """Create an order request based on the trading signal.
        
        Args:
            signal: Trading signal containing side and confidence
            
        Returns:
            OrderRequest object or None if order cannot be created
        """
        try:
            # Calculate position size
            position_size = self.strategy_class.calculate_position_size(
                signal,
                self.current_capital
            )
            
            if position_size <= 0:
                return None
            
            # Create order request
            return OrderRequest(
                symbol=self.symbols[0],  # Using first symbol for now
                side=OrderSide.BUY if signal['side'] == 'buy' else OrderSide.SELL,
                quantity=position_size,
                price=None,  # Will be filled by market price
                type='market',
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return None
