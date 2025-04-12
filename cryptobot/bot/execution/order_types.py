from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional
from datetime import datetime

class OrderType(Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"
    TRAILING_STOP = "trailing_stop"
    ICEBERG = "iceberg"
    TWAP = "twap"  # Time-Weighted Average Price
    VWAP = "vwap"  # Volume-Weighted Average Price

class OrderSide(Enum):
    BUY = "buy"
    SELL = "sell"

class OrderStatus(Enum):
    PENDING = "pending"
    OPEN = "open"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"

@dataclass
class OrderRequest:
    """Base order request with common parameters"""
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    time_in_force: str = "GTC"  # Good Till Cancelled
    leverage: float = 1.0
    reduce_only: bool = False
    post_only: bool = False
    client_order_id: Optional[str] = None
    metadata: Dict = None

@dataclass
class SmartOrderRequest(OrderRequest):
    """Extended order request with smart routing parameters"""
    max_slippage: float = 0.001  # 0.1% max slippage
    urgency: float = 0.5  # 0-1 scale, affects execution speed vs. price
    min_chunk_size: Optional[float] = None
    max_chunk_size: Optional[float] = None
    execution_style: str = "adaptive"  # adaptive, passive, or aggressive
    participation_rate: Optional[float] = None  # for TWAP/VWAP
    completion_target: Optional[datetime] = None

@dataclass
class OrderResponse:
    """Order execution response"""
    success: bool
    order_id: Optional[str] = None
    client_order_id: Optional[str] = None
    status: Optional[OrderStatus] = None
    filled_quantity: float = 0.0
    average_price: Optional[float] = None
    fees: Optional[float] = None
    error: Optional[str] = None
    exchange: Optional[str] = None
    timestamp: Optional[datetime] = None
    raw_response: Optional[Dict] = None
