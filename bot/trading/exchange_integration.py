"""
Live Trading Exchange Integration
Handles real-time order execution, slippage management, and order book analysis
"""

import os
import logging
import asyncio
import hmac
import hashlib
import time
from typing import Dict, List, Optional, Tuple
from decimal import Decimal
import pandas as pd
import numpy as np
from binance.client import AsyncClient
from binance.exceptions import BinanceAPIException

logger = logging.getLogger("exchange_integration")

class ExchangeIntegration:
    def __init__(self, config: Dict):
        """Initialize exchange integration with configuration"""
        self.config = config
        self.api_key = config.get('api_key')
        self.api_secret = config.get('api_secret')
        self.client = None
        self.order_book_cache = {}
        self.last_order_book_update = {}
        self.slippage_tolerance = config.get('slippage_tolerance', 0.001)  # 0.1%
        self.max_retries = config.get('max_retries', 3)
        self.retry_delay = config.get('retry_delay', 1)  # seconds

    async def initialize(self):
        """Initialize exchange client"""
        try:
            self.client = await AsyncClient.create(self.api_key, self.api_secret)
            logger.info("Exchange client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize exchange client: {e}")
            raise

    async def get_order_book(self, symbol: str, depth: int = 20) -> Dict:
        """Get real-time order book data with caching"""
        try:
            current_time = time.time()
            cache_age = current_time - self.last_order_book_update.get(symbol, 0)

            # Update cache if older than 1 second
            if cache_age > 1 or symbol not in self.order_book_cache:
                order_book = await self.client.get_order_book(symbol=symbol, limit=depth)
                self.order_book_cache[symbol] = order_book
                self.last_order_book_update[symbol] = current_time
                return order_book
            
            return self.order_book_cache[symbol]
        except Exception as e:
            logger.error(f"Error fetching order book for {symbol}: {e}")
            return {"bids": [], "asks": []}

    async def analyze_order_book(self, symbol: str) -> Dict:
        """Analyze order book for market depth and liquidity"""
        try:
            order_book = await self.get_order_book(symbol)
            
            bids = np.array(order_book['bids'], dtype=float)
            asks = np.array(order_book['asks'], dtype=float)
            
            bid_liquidity = np.sum(bids[:, 1])
            ask_liquidity = np.sum(asks[:, 1])
            spread = float(asks[0][0]) - float(bids[0][0])
            
            # Calculate order book imbalance
            bid_depth = np.sum(bids[:5, 1])  # Top 5 levels
            ask_depth = np.sum(asks[:5, 1])
            imbalance = (bid_depth - ask_depth) / (bid_depth + ask_depth)
            
            return {
                "spread": spread,
                "bid_liquidity": bid_liquidity,
                "ask_liquidity": ask_liquidity,
                "imbalance": imbalance,
                "best_bid": float(bids[0][0]),
                "best_ask": float(asks[0][0])
            }
        except Exception as e:
            logger.error(f"Error analyzing order book: {e}")
            return {}

    async def estimate_slippage(self, symbol: str, side: str, amount: float) -> float:
        """Estimate potential slippage for a given order size"""
        try:
            order_book = await self.get_order_book(symbol)
            orders = order_book['bids'] if side == 'SELL' else order_book['asks']
            orders = np.array(orders, dtype=float)
            
            remaining = amount
            weighted_price = 0
            
            for price, quantity in orders:
                if remaining <= 0:
                    break
                    
                filled = min(remaining, quantity)
                weighted_price += price * filled
                remaining -= filled
                
            if remaining > 0:
                logger.warning(f"Not enough liquidity for {symbol} {side} order of size {amount}")
                return float('inf')
                
            return abs(weighted_price / amount - float(orders[0][0])) / float(orders[0][0])
        except Exception as e:
            logger.error(f"Error estimating slippage: {e}")
            return float('inf')

    async def execute_order(self, 
                          symbol: str,
                          side: str,
                          amount: float,
                          order_type: str = 'MARKET',
                          price: Optional[float] = None) -> Dict:
        """Execute order with slippage protection and retry mechanism"""
        for attempt in range(self.max_retries):
            try:
                # Check slippage before execution
                estimated_slippage = await self.estimate_slippage(symbol, side, amount)
                if estimated_slippage > self.slippage_tolerance:
                    raise Exception(f"Estimated slippage {estimated_slippage:.4%} exceeds tolerance {self.slippage_tolerance:.4%}")
                
                # Prepare order parameters
                order_params = {
                    'symbol': symbol,
                    'side': side,
                    'quantity': amount
                }
                
                if order_type == 'LIMIT':
                    if not price:
                        raise ValueError("Price required for LIMIT orders")
                    order_params.update({
                        'type': 'LIMIT',
                        'price': price,
                        'timeInForce': 'GTC'
                    })
                else:
                    order_params['type'] = 'MARKET'
                
                # Execute order
                order = await self.client.create_order(**order_params)
                
                # Verify execution price
                executed_price = float(order['fills'][0]['price'])
                if order_type == 'LIMIT':
                    if side == 'BUY' and executed_price > price * (1 + self.slippage_tolerance):
                        raise Exception("Execution price exceeds limit price + tolerance")
                    if side == 'SELL' and executed_price < price * (1 - self.slippage_tolerance):
                        raise Exception("Execution price below limit price - tolerance")
                
                return order
                
            except BinanceAPIException as e:
                if attempt == self.max_retries - 1:
                    logger.error(f"Final attempt failed: {e}")
                    raise
                logger.warning(f"Order attempt {attempt + 1} failed: {e}")
                await asyncio.sleep(self.retry_delay)
            
            except Exception as e:
                logger.error(f"Order execution error: {e}")
                raise

    async def close(self):
        """Close exchange client connection"""
        if self.client:
            await self.client.close_connection()
