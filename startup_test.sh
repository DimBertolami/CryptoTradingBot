#!/bin/bash
# Paper Trading Bot Startup Script
# This script starts the backend server, bot, and frontend

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Paper Trading Bot System...${NC}"

# 1. Define directories
BOT_DIR="/opt/lampp/htdocs/bot"
BACKEND_DIR="$BOT_DIR/backend"
FRONTEND_DIR="$BOT_DIR/frontend"

# 2. Setup virtual environment
echo -e "${YELLOW}Setting up virtual environment...${NC}"
if [ ! -d "$BOT_DIR/venv2" ]; then
    python3 -m venv "$BOT_DIR/venv2"
fi
source "$BOT_DIR/venv2/bin/activate"

# 3. Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install --upgrade pip
pip install -e /opt/lampp/htdocs

# 4. Start backend server
echo -e "${YELLOW}Starting backend server...${NC}"
cd "$BACKEND_DIR"
export PYTHONPATH="$BOT_DIR"
export FLASK_APP="backend.paper_trading_api:app"
python3 -m flask run --host=0.0.0.0 --port=5001 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"

# 5. Start the bot
echo -e "${YELLOW}Starting the bot...${NC}"
cd "$BOT_DIR"
"$BOT_DIR/venv2/bin/python3" "$BOT_DIR/paper_trading_cli.py" start --interval 300 &
BOT_PID=$!
echo -e "${GREEN}✓ Bot started (PID: $BOT_PID)${NC}"

# 6. Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
cd "$FRONTEND_DIR"
npm install
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

# 7. Wait for all services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 5

# 8. Verify services are running
echo -e "${YELLOW}Checking service status:${NC}"
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend server is running${NC}"
else
    echo -e "${RED}✗ Backend server failed to start${NC}"
fi

if ps -p $BOT_PID > /dev/null; then
    echo -e "${GREEN}✓ Bot is running${NC}"
else
    echo -e "${RED}✗ Bot failed to start${NC}"
fi

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend failed to start${NC}"
fi

echo -e "${GREEN}All services are now running!${NC}"
echo -e "Backend: http://localhost:5001"
echo -e "Frontend: http://localhost:5173"

# Test if the backend server is actually responding
echo -e "${YELLOW}Verifying backend server connection...${NC}"
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s "http://localhost:5001/trading/status" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend server is responding correctly${NC}"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT+1))
        if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
            echo -e "${RED}Backend server is not responding after $MAX_RETRIES attempts!${NC}"
            exit 1
        fi
        sleep 1
    fi
done

# Check if vite.config.ts exists and has correct proxy configuration
if [ ! -f "vite.config.ts" ]; then
    echo -e "vite.config.ts not found in $FRONTEND_DIR. Aborting.${NC}"
    exit 1
fi

# Add proxy configuration if needed
if ! grep -q "'/trading'" vite.config.ts && ! grep -q "'/trading_data'" vite.config.ts; then
    echo -e "Adding proxy configuration to vite.config.ts...${NC}"
    cp vite.config.ts vite.config.ts.bak
    sed -i "s|server: {|server: {
    proxy: {
      '/trading': 'http://localhost:5001',
      '/trading_data': 'http://localhost:5001',
    },|" vite.config.ts
fi

# Wait for frontend to be ready and determine the port${NC}
sleep 3
FRONTEND_PORT=""
for PORT in {5173..5179}; do
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        FRONTEND_PORT=$PORT
        break
    fi
done

if [ -z "$FRONTEND_PORT" ]; then
    echo -e "Could not determine frontend port! Using default 5173.${NC}"
    FRONTEND_PORT=5173
fi
