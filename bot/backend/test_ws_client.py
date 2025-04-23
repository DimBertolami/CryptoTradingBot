import asyncio
import websockets
import json

async def test_market_data_ws():
    uri = "ws://localhost:5002/ws/market-data"
    
    async with websockets.connect(uri, subprotocols=["market-data"]) as websocket:
        print("Connected to WebSocket server")
        
        try:
            while True:
                # Send ping
                await websocket.send("ping")
                
                # Receive and print the response
                response = await websocket.recv()
                try:
                    data = json.loads(response)
                    if isinstance(data, dict):
                        if data.get('type') == 'market_data':
                            print("\nReceived market data:")
                            market_data = data['data']
                            print(f"Price: {market_data['price']}")
                            print(f"RSI: {market_data['rsi']}")
                            print(f"Buy Signal: {market_data['buySignal']}")
                            print(f"Sell Signal: {market_data['sellSignal']}")
                        elif response == 'pong':
                            print("Received pong")
                        else:
                            print(f"Received other message: {response}")
                except json.JSONDecodeError:
                    print(f"Received non-JSON message: {response}")
                
                # Wait before next ping
                await asyncio.sleep(5)
                
        except websockets.exceptions.ConnectionClosed:
            print("Connection closed")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    print("Starting WebSocket test client...")
    asyncio.run(test_market_data_ws())
