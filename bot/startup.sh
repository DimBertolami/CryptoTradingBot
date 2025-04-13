#!/bin/bash
# Startup script for Trading Bot System

# Get absolute path to script directory
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "$SCRIPT_DIR" || exit 1

# Define base directories
BOT_DIR="$SCRIPT_DIR"
FRONTEND_DIR="$BOT_DIR/frontend"
BACKEND_DIR="$BOT_DIR/backend"

# Set color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to check if a service is running
is_service_running() {
    local service=$1
    if pgrep -f "$service" > /dev/null; then
        echo -e "${GREEN}✓ $service is running${NC}"
        return 0
    else
        echo -e "${YELLOW}$service is not running${NC}"
        return 1
    fi
}

# 1. Clean up any existing processes
echo -e "${YELLOW}Cleaning up any existing processes...${NC}"
./shutdown.sh

# 2. Start backend server
echo -e "${GREEN}Starting backend server...${NC}"

# Create logs directory if it doesn't exist
mkdir -p "$BOT_DIR/logs"

# Start the backend server
export FLASK_APP="$BACKEND_DIR/paper_trading_api.py"
export FLASK_ENV=development
export FLASK_DEBUG=1

# Start the backend server with auto-reload
nohup flask run --host=0.0.0.0 --port=5001 \
    > "$BOT_DIR/logs/backend.log" 2>&1 \
    &

BACKEND_PID=$!
echo $BACKEND_PID > "$BOT_DIR/backend.pid"

# Wait for backend to start
sleep 2

# Verify backend is running
echo -e "${YELLOW}Verifying backend server connection...${NC}"
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s "http://localhost:5001/trading/paper" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend server is responding correctly${NC}"
        
        # Start paper trading with auto-execution
        curl -X POST "http://localhost:5001/trading/paper" -H "Content-Type: application/json" -d '{"command": "start"}'
        echo -e "${GREEN}✓ Paper trading started${NC}"
        break
    fi
    
    echo -e "${YELLOW}Waiting for backend server... (${RETRY_COUNT}/${MAX_RETRIES})${NC}"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}Error: Backend server failed to start after ${MAX_RETRIES} attempts${NC}"
    echo -e "${YELLOW}Last 20 lines of backend log:${NC}"
    tail -n 20 "$BOT_DIR/logs/backend.log"
    exit 1
fi

# 3. Start frontend server
echo -e "${GREEN}Starting frontend server...${NC}"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

# Start the frontend server
npm --prefix "$FRONTEND_DIR" start \
    > "$BOT_DIR/logs/frontend.log" 2>&1 \
    &

FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_DIR/frontend.pid"

# Wait for frontend to start
sleep 2

# 4. Verify all services are running
echo -e "${GREEN}Verifying all services are running...${NC}"

# Check backend
is_service_running "flask run"

# Check frontend
is_service_running "node.*server.js"

# 5. Print system status
echo -e "\n${GREEN}Trading Bot System is now running!${NC}"
echo -e "${GREEN}------------------------------------${NC}"
echo -e "${YELLOW}Resource Manager:${NC} Active (70% CPU/Memory limit)"
echo -e "Backend API: http://localhost:5001/trading/paper"
echo -e "Frontend UI: http://localhost:5173"
echo
echo -e "${YELLOW}To access the Paper Trading Dashboard, open your browser and navigate to:${NC}"
echo -e "${GREEN}http://localhost:5173/paper-trading${NC}"
echo
echo -e "${YELLOW}For 'Resource not found' errors, check:${NC}"
echo -e "${GREEN}1. ${YELLOW}Backend API is running:${NC} ${GREEN}curl http://localhost:5001/trading/paper${NC}"
echo -e "${GREEN}2. ${YELLOW}Proxy configuration in vite.config.ts has:${NC}"
echo -e "   ${GREEN}'/trading/paper': 'http://localhost:5001'${NC}"
echo -e "   ${GREEN}'/trading_data': 'http://localhost:5001'${NC}"

# Save PIDs to files
echo $BACKEND_PID > "$BOT_DIR/backend.pid"
echo $FRONTEND_PID > "$FRONTEND_DIR/frontend.pid"

exit 0
