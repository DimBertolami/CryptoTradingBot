from typing import Dict, List, Optional, Tuple
import asyncio
import numpy as np
from datetime import datetime, timedelta
from .order_types import (
    OrderRequest, SmartOrderRequest, OrderResponse,
    OrderType, OrderSide, OrderStatus
)
from .exchange_interface import ExchangeInterface
from ..ml.utils import logger

class OrderExecutor:
    """Smart order execution system with advanced routing and optimization"""
    
    def __init__(self, exchanges: Dict[str, ExchangeInterface]):
        self.exchanges = exchanges
        self.active_orders: Dict[str, SmartOrderRequest] = {}
        self.execution_history: List[Dict] = []
        
    async def execute_smart_order(self, order: SmartOrderRequest) -> OrderResponse:
        """Execute a smart order with optimal routing and execution"""
        try:
            # Validate order
            self._validate_smart_order(order)
            
            # Get market conditions across exchanges
            market_conditions = await self._analyze_market_conditions(
                order.symbol)
            
            # Determine optimal execution strategy
            strategy = self._determine_execution_strategy(
                order, market_conditions)
            
            # Execute the order according to strategy
            if strategy['type'] == 'split':
                return await self._execute_split_order(order, strategy)
            elif strategy['type'] == 'twap':
                return await self._execute_twap_order(order, strategy)
            elif strategy['type'] == 'direct':
                return await self._execute_direct_order(order, strategy)
            else:
                raise ValueError(f"Unknown strategy type: {strategy['type']}")
            
        except Exception as e:
            logger.error(f"Smart order execution failed: {str(e)}")
            return OrderResponse(success=False, error=str(e))
    
    def _validate_smart_order(self, order: SmartOrderRequest) -> None:
        """Validate smart order parameters"""
        if order.quantity <= 0:
            raise ValueError("Order quantity must be positive")
        
        if order.max_slippage <= 0 or order.max_slippage > 0.1:
            raise ValueError("Invalid max slippage (must be between 0 and 0.1)")
        
        if order.urgency < 0 or order.urgency > 1:
            raise ValueError("Urgency must be between 0 and 1")
    
    async def _analyze_market_conditions(self, symbol: str) -> Dict:
        """Analyze market conditions across all exchanges"""
        conditions = {}
        
        for exchange_name, exchange in self.exchanges.items():
            try:
                depth = await exchange.get_market_depth(symbol)
                ticker = await exchange.get_ticker(symbol)
                
                conditions[exchange_name] = {
                    'liquidity': self._calculate_liquidity(depth),
                    'spread': (depth['asks'][0][0] - depth['bids'][0][0]) / 
                             depth['bids'][0][0],
                    'volume': ticker['volume'],
                    'depth': depth
                }
            except Exception as e:
                logger.error(f"Failed to analyze {exchange_name}: {str(e)}")
        
        return conditions
    
    def _calculate_liquidity(self, depth: Dict) -> float:
        """Calculate liquidity score from order book depth"""
        bids_liquidity = sum(bid[1] for bid in depth['bids'][:10])
        asks_liquidity = sum(ask[1] for ask in depth['asks'][:10])
        return (bids_liquidity + asks_liquidity) / 2
    
    def _determine_execution_strategy(self, order: SmartOrderRequest,
                                   market_conditions: Dict) -> Dict:
        """Determine optimal execution strategy based on market conditions"""
        total_liquidity = sum(cond['liquidity'] 
                            for cond in market_conditions.values())
        
        # Calculate order size relative to liquidity
        order_size_ratio = order.quantity / total_liquidity
        
        # High urgency prefers direct execution
        if order.urgency > 0.8 and order_size_ratio < 0.1:
            return {
                'type': 'direct',
                'exchange': self._select_best_exchange(market_conditions),
                'reason': 'high_urgency_small_size'
            }
        
        # Large orders relative to liquidity use TWAP
        if order_size_ratio > 0.2:
            return {
                'type': 'twap',
                'num_chunks': self._calculate_optimal_chunks(
                    order.quantity, total_liquidity),
                'interval': self._calculate_twap_interval(
                    order.urgency, order.completion_target),
                'exchanges': self._rank_exchanges(market_conditions),
                'reason': 'large_order_size'
            }
        
        # Default to smart splitting across exchanges
        return {
            'type': 'split',
            'allocations': self._calculate_exchange_allocations(
                order.quantity, market_conditions),
            'reason': 'optimal_split'
        }
    
    def _select_best_exchange(self, market_conditions: Dict) -> str:
        """Select best exchange based on liquidity and spread"""
        scores = {}
        for exchange, conditions in market_conditions.items():
            # Score based on liquidity (70%) and spread (30%)
            score = (0.7 * conditions['liquidity'] / max(c['liquidity'] 
                    for c in market_conditions.values()) +
                    0.3 * (1 - conditions['spread'] / max(c['spread']
                    for c in market_conditions.values())))
            scores[exchange] = score
        
        return max(scores.items(), key=lambda x: x[1])[0]
    
    def _calculate_optimal_chunks(self, quantity: float,
                                liquidity: float) -> int:
        """Calculate optimal number of chunks for order splitting"""
        base_chunks = int(quantity / (liquidity * 0.1))  # Split if >10% of liquidity
        return max(min(base_chunks, 10), 1)  # Between 1 and 10 chunks
    
    def _calculate_twap_interval(self, urgency: float,
                               completion_target: Optional[datetime]) -> float:
        """Calculate interval between TWAP orders"""
        if completion_target:
            total_time = (completion_target - datetime.now()).total_seconds()
            return max(total_time / 10, 60)  # At least 1 minute between orders
        else:
            # Base interval on urgency (between 1 and 10 minutes)
            return 60 * (1 + 9 * (1 - urgency))
    
    def _calculate_exchange_allocations(self, quantity: float,
                                     market_conditions: Dict) -> Dict[str, float]:
        """Calculate optimal order allocation across exchanges"""
        total_score = 0
        scores = {}
        
        for exchange, conditions in market_conditions.items():
            # Score based on liquidity (60%), spread (30%), and volume (10%)
            score = (0.6 * conditions['liquidity'] +
                    0.3 * (1 / max(conditions['spread'], 1e-6)) +
                    0.1 * conditions['volume'])
            scores[exchange] = score
            total_score += score
        
        # Allocate proportionally to scores
        allocations = {
            exchange: (score / total_score) * quantity
            for exchange, score in scores.items()
        }
        
        return allocations
    
    async def _execute_split_order(self, order: SmartOrderRequest,
                                 strategy: Dict) -> OrderResponse:
        """Execute order split across multiple exchanges"""
        responses = []
        
        for exchange_name, allocation in strategy['allocations'].items():
            if allocation > 0:
                split_order = SmartOrderRequest(
                    symbol=order.symbol,
                    side=order.side,
                    order_type=order.order_type,
                    quantity=allocation,
                    price=order.price,
                    time_in_force=order.time_in_force,
                    max_slippage=order.max_slippage
                )
                
                response = await self.exchanges[exchange_name].place_order(
                    split_order)
                responses.append(response)
        
        # Combine responses
        return self._combine_responses(responses)
    
    async def _execute_twap_order(self, order: SmartOrderRequest,
                                strategy: Dict) -> OrderResponse:
        """Execute TWAP order"""
        responses = []
        chunk_size = order.quantity / strategy['num_chunks']
        
        for i in range(strategy['num_chunks']):
            for exchange_name in strategy['exchanges']:
                chunk_order = SmartOrderRequest(
                    symbol=order.symbol,
                    side=order.side,
                    order_type=order.order_type,
                    quantity=chunk_size,
                    price=order.price,
                    time_in_force=order.time_in_force,
                    max_slippage=order.max_slippage
                )
                
                response = await self.exchanges[exchange_name].place_order(
                    chunk_order)
                
                if response.success:
                    responses.append(response)
                    break  # Move to next chunk if successful
            
            if i < strategy['num_chunks'] - 1:
                await asyncio.sleep(strategy['interval'])
        
        return self._combine_responses(responses)
    
    async def _execute_direct_order(self, order: SmartOrderRequest,
                                  strategy: Dict) -> OrderResponse:
        """Execute order directly on a single exchange"""
        exchange = self.exchanges[strategy['exchange']]
        return await exchange.place_order(order)
    
    def _combine_responses(self, responses: List[OrderResponse]) -> OrderResponse:
        """Combine multiple order responses into one"""
        if not responses:
            return OrderResponse(success=False, error="No orders executed")
        
        total_filled = sum(r.filled_quantity for r in responses if r.success)
        total_cost = sum(r.filled_quantity * r.average_price
                        for r in responses if r.success and r.average_price)
        
        return OrderResponse(
            success=any(r.success for r in responses),
            filled_quantity=total_filled,
            average_price=total_cost / total_filled if total_filled > 0 else None,
            fees=sum(r.fees for r in responses if r.success and r.fees),
            timestamp=datetime.now()
        )
