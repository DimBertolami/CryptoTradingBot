import asyncio
import websockets
import json
import logging
import time
import os
from datetime import datetime
import ssl
from typing import Set, Optional
import ccxt
import pandas as pd

# Ensure logs directory exists
os.makedirs('logs', exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/opt/lampp/htdocs/bot/logs/ws.log'),
        logging.StreamHandler()
    ]
)

class MarketDataWebSocket:
    def __init__(self, host: str = '0.0.0.0', port: int = 5002):
        self.host = host
        self.port = port
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.ssl_context = None
        self.server: Optional[websockets.Server] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    async def get_market_data(self, symbol='BTC/USDT'):
        exchange = ccxt.binance()
        try:
            # Fetch OHLCV data for technical analysis
            ohlcv = exchange.fetch_ohlcv(symbol, '1m', limit=100)
            df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            
            # Calculate technical indicators
            df['sma20'] = df['close'].rolling(window=20).mean()
            df['sma50'] = df['close'].rolling(window=50).mean()
            df['ema20'] = df['close'].ewm(span=20, adjust=False).mean()
            df['ema50'] = df['close'].ewm(span=50, adjust=False).mean()
            
            # Calculate RSI
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            df['rsi'] = 100 - (100 / (1 + rs))
            
            # Calculate MACD
            df['macd'] = df['close'].ewm(span=12, adjust=False).mean() - df['close'].ewm(span=26, adjust=False).mean()
            df['macdSignal'] = df['macd'].ewm(span=9, adjust=False).mean()
            df['macdHistogram'] = df['macd'] - df['macdSignal']
            
            # Calculate Bollinger Bands
            df['bollingerMiddle'] = df['close'].rolling(window=20).mean()
            df['bollingerStd'] = df['close'].rolling(window=20).std()
            df['bollingerUpper'] = df['bollingerMiddle'] + (df['bollingerStd'] * 2)
            df['bollingerLower'] = df['bollingerMiddle'] - (df['bollingerStd'] * 2)
            
            # Generate signals
            df['buySignal'] = (df['close'] < df['bollingerLower']) & (df['rsi'] < 30)
            df['sellSignal'] = (df['close'] > df['bollingerUpper']) & (df['rsi'] > 70)
            
            # Get latest data
            latest = df.iloc[-1]
            
            # Format data for WebSocket
            data = {
                'type': 'market_data',
                'data': {
                    'date': latest['timestamp'].isoformat(),
                    'price': float(latest['close']),
                    'volume': float(latest['volume']),
                    'sma20': float(latest['sma20']),
                    'sma50': float(latest['sma50']),
                    'ema20': float(latest['ema20']),
                    'ema50': float(latest['ema50']),
                    'rsi': float(latest['rsi']),
                    'macd': float(latest['macd']),
                    'macdSignal': float(latest['macdSignal']),
                    'macdHistogram': float(latest['macdHistogram']),
                    'bollingerUpper': float(latest['bollingerUpper']),
                    'bollingerLower': float(latest['bollingerLower']),
                    'buySignal': bool(latest['buySignal']),
                    'sellSignal': bool(latest['sellSignal'])
                }
            }
            
            return json.dumps(data)
            
        except Exception as e:
            logging.error(f"Error fetching market data: {e}")
            return json.dumps({'type': 'error', 'data': { 'message': str(e), 'timestamp': datetime.now().isoformat() }})

    async def market_data_handler(self, ws: websockets.WebSocketServerProtocol, path: str):
        client_id = id(ws)
        logging.info(f"Client {client_id} connected")
        self.clients.add(ws)
        current_subscription = None
        last_pong = time.time()

        try:
            # Wait for initial subscription
            message = await ws.recv()
            data = json.loads(message)
            
            if data.get('type') == 'subscribe':
                symbol = data.get('data', {}).get('symbol', 'BTC/USDT')
                timeframe = data.get('data', {}).get('timeframe', '1m')
                current_subscription = (symbol, timeframe)
                logging.info(f"Client {client_id} subscribed to {symbol} with timeframe {timeframe}")
                
                # Send initial market data
                market_data = await self.get_market_data(symbol)
                await ws.send(market_data)
                
                # Start sending updates every minute
                while True:
                    await asyncio.sleep(60)  # Update every minute
                    if current_subscription:
                        market_data = await self.get_market_data(current_subscription[0])
                        await ws.send(market_data)
            else:
                logging.warning(f"Client {client_id} sent unexpected message type: {data.get('type')}")
                if hasattr(ws, 'close') and callable(ws.close):
                    await ws.close(code=4000, reason="Expected subscription message")
                return

            while True:
                try:
                    message = await ws.recv()
                    data = json.loads(message)
                    
                    if data.get('type') == 'ping':
                        logging.debug(f"Received ping from client {client_id}")
                        await ws.send(json.dumps({'type': 'pong'}))
                        last_pong = time.time()
                        continue
                    
                    else:
                        logging.warning(f"Unsupported message type from client {client_id}")
                        await ws.send(json.dumps({
                            'type': 'error',
                            'data': {
                                'message': 'Unsupported message type'
                            }
                        }))
                
                except websockets.ConnectionClosed:
                    logging.info(f"Client {client_id} connection closed")
                    break
                
                except json.JSONDecodeError:
                    logging.warning(f"Invalid JSON received from client {client_id}")
                    error_data = json.dumps({
                        'type': 'error',
                        'data': {
                            'message': 'Invalid JSON format'
                        }
                    })
                    try:
                        await ws.send(error_data)
                    except:
                        break
                
                except Exception as e:
                    logging.error(f"Error handling message from client {client_id}: {e}")
                    try:
                        await ws.send(json.dumps({
                            'type': 'error',
                            'data': {
                                'message': 'Internal server error'
                            }
                        }))
                    except:
                        break
                
                # Check for connection timeout
                if time.time() - last_pong > 30:  # 30 second timeout
                    logging.warning(f"Client {client_id} timed out")
                    if hasattr(ws, 'close') and callable(ws.close):
                        await ws.close(code=1006, reason="Connection timeout")
                    break
        
        finally:
            self.clients.remove(ws)
            logging.info(f"Client {client_id} removed from active clients")

    async def start(self):
        try:
            logging.info(f"Starting WebSocket server on ws://{self.host}:{self.port}")
            
            # Disable SSL for now to avoid handshake issues
            ssl_context = None
            
            # Start the server
            self.server = await websockets.serve(
                self.market_data_handler,
                self.host,
                self.port,
                ssl=ssl_context,
                origins=None,  # Allow all origins
                subprotocols=['market-data'],  # Specify supported subprotocol
                ping_interval=20,
                ping_timeout=20,
                close_timeout=10,
                max_size=2**20,  # 1MB
                max_queue=32,
                read_limit=2**16,  # 64KB
                write_limit=2**16,  # 64KB
            )
            
            logging.info("WebSocket server started successfully")
            await self.server.wait_closed()
        except Exception as e:
            logging.error(f"Error starting WebSocket server: {e}")
            raise

async def main():
    server = MarketDataWebSocket()
    await server.start()

if __name__ == "__main__":
    asyncio.run(main())
