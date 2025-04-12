from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple
import ccxt
import asyncio
from datetime import datetime
import numpy as np
from .order_types import (
    OrderRequest, SmartOrderRequest, OrderResponse,
    OrderType, OrderSide, OrderStatus
)
from ..ml.utils import logger

class ExchangeInterface(ABC):
    """Abstract base class for exchange interfaces"""
    
    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to exchange"""
        pass
    
    @abstractmethod
    async def get_market_depth(self, symbol: str, limit: int = 100) -> Dict:
        """Get order book data"""
        pass
    
    @abstractmethod
    async def get_ticker(self, symbol: str) -> Dict:
        """Get current ticker data"""
        pass
    
    @abstractmethod
    async def place_order(self, order: OrderRequest) -> OrderResponse:
        """Place a single order"""
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str, symbol: str) -> bool:
        """Cancel an existing order"""
        pass
    
    @abstractmethod
    async def get_order_status(self, order_id: str, symbol: str) -> OrderResponse:
        """Get current status of an order"""
        pass

class BinanceInterface(ExchangeInterface):
    """Binance exchange interface implementation"""
    
    def __init__(self, api_key: str, api_secret: str, testnet: bool = False):
        self.api_key = api_key
        self.api_secret = api_secret
        self.testnet = testnet
        self.exchange = None
        self.markets = {}
        self.trading_fees = {}
        
    async def connect(self) -> bool:
        try:
            self.exchange = ccxt.binance({
                'apiKey': self.api_key,
                'secret': self.api_secret,
                'enableRateLimit': True,
                'options': {'defaultType': 'future'}
            })
            
            if self.testnet:
                self.exchange.set_sandbox_mode(True)
            
            # Load markets and trading fees
            self.markets = await self.exchange.load_markets()
            self.trading_fees = await self.exchange.fetch_trading_fees()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Binance: {str(e)}")
            return False
    
    async def get_market_depth(self, symbol: str, limit: int = 100) -> Dict:
        try:
            orderbook = await self.exchange.fetch_order_book(symbol, limit)
            return {
                'bids': orderbook['bids'],
                'asks': orderbook['asks'],
                'timestamp': orderbook['timestamp'],
                'datetime': orderbook['datetime']
            }
        except Exception as e:
            logger.error(f"Failed to get market depth: {str(e)}")
            return {}
    
    async def get_ticker(self, symbol: str) -> Dict:
        try:
            ticker = await self.exchange.fetch_ticker(symbol)
            return {
                'bid': ticker['bid'],
                'ask': ticker['ask'],
                'last': ticker['last'],
                'volume': ticker['baseVolume'],
                'timestamp': ticker['timestamp']
            }
        except Exception as e:
            logger.error(f"Failed to get ticker: {str(e)}")
            return {}
    
    async def place_order(self, order: OrderRequest) -> OrderResponse:
        try:
            params = {
                'symbol': order.symbol,
                'type': order.order_type.value,
                'side': order.side.value,
                'amount': order.quantity,
                'price': order.price if order.price else None,
                'timeInForce': order.time_in_force,
                'reduceOnly': order.reduce_only,
                'postOnly': order.post_only,
                'clientOrderId': order.client_order_id
            }
            
            # Remove None values
            params = {k: v for k, v in params.items() if v is not None}
            
            response = await self.exchange.create_order(**params)
            
            return OrderResponse(
                success=True,
                order_id=response['id'],
                client_order_id=response.get('clientOrderId'),
                status=OrderStatus(response['status']),
                filled_quantity=float(response['filled']),
                average_price=float(response['average']) if response.get('average') else None,
                fees=float(response['fee']['cost']) if response.get('fee') else None,
                exchange='binance',
                timestamp=datetime.fromtimestamp(response['timestamp'] / 1000),
                raw_response=response
            )
            
        except Exception as e:
            logger.error(f"Failed to place order: {str(e)}")
            return OrderResponse(
                success=False,
                error=str(e)
            )
    
    async def cancel_order(self, order_id: str, symbol: str) -> bool:
        try:
            await self.exchange.cancel_order(order_id, symbol)
            return True
        except Exception as e:
            logger.error(f"Failed to cancel order: {str(e)}")
            return False
    
    async def get_order_status(self, order_id: str, symbol: str) -> OrderResponse:
        try:
            response = await self.exchange.fetch_order(order_id, symbol)
            
            return OrderResponse(
                success=True,
                order_id=response['id'],
                client_order_id=response.get('clientOrderId'),
                status=OrderStatus(response['status']),
                filled_quantity=float(response['filled']),
                average_price=float(response['average']) if response.get('average') else None,
                fees=float(response['fee']['cost']) if response.get('fee') else None,
                exchange='binance',
                timestamp=datetime.fromtimestamp(response['timestamp'] / 1000),
                raw_response=response
            )
            
        except Exception as e:
            logger.error(f"Failed to get order status: {str(e)}")
            return OrderResponse(
                success=False,
                error=str(e)
            )
    
    def estimate_slippage(self, symbol: str, quantity: float, 
                         side: OrderSide) -> Tuple[float, float]:
        """Estimate slippage for a given order size"""
        try:
            orderbook = self.exchange.fetch_order_book(symbol)
            book_side = orderbook['bids'] if side == OrderSide.SELL else orderbook['asks']
            
            remaining_quantity = quantity
            total_cost = 0.0
            
            for price, size in book_side:
                if remaining_quantity <= 0:
                    break
                    
                executed_quantity = min(size, remaining_quantity)
                total_cost += executed_quantity * price
                remaining_quantity -= executed_quantity
            
            if remaining_quantity > 0:
                return float('inf'), 1.0
            
            average_price = total_cost / quantity
            reference_price = book_side[0][0]
            slippage = abs(average_price - reference_price) / reference_price
            
            return slippage, average_price
            
        except Exception as e:
            logger.error(f"Failed to estimate slippage: {str(e)}")
            return float('inf'), 0.0
