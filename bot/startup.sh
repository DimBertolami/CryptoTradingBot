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

<<<<<<< HEAD
echo -e "${GREEN}Starting Paper Trading Bot System...${NC}"

# 1. Define directories
BOT_DIR="/opt/lampp/htdocs/bot"
BACKEND_DIR="$BOT_DIR/backend"
FRONTEND_DIR="$BOT_DIR/frontend"
VENV_DIR="$BOT_DIR/venv"

# 1.1 Start resource manager to limit CPU/memory usage to 70%
if [ -f "$BOT_DIR/resource_manager_service.sh" ]; then
    echo -e "${YELLOW}Starting resource manager (70% limit)...${NC}"
    bash "$BOT_DIR/resource_manager_service.sh" start
    sleep 2
fi

# 2. Check for existing processes and stop them if necessary
echo -e "${YELLOW}Checking for existing processes...${NC}"

# Check backend port (5001)
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}Port 5001 is already in use. Stopping existing process...${NC}"
    PID=$(lsof -t -i:5001)
    kill -9 $PID
    sleep 2
    echo -e "${GREEN}✓ Stopped process on port 5001${NC}"
fi

# Check frontend port (default is 5173, but it might use up to 5179 if ports are taken)
for PORT in {5173..5179}; do
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}Port $PORT is already in use. Stopping existing process...${NC}"
        PID=$(lsof -t -i:$PORT)
        kill -9 $PID
        sleep 1
        echo -e "${GREEN}✓ Stopped process on port $PORT${NC}"
=======
# Function to check if a service is running
is_service_running() {
    local service=$1
    if pgrep -f "$service" > /dev/null; then
        echo -e "${GREEN}✓ $service is running${NC}"
        return 0
    else
        echo -e "${YELLOW}$service is not running${NC}"
        return 1
>>>>>>> main
    fi
}

# 1. Clean up any existing processes
echo -e "${YELLOW}Cleaning up any existing processes...${NC}"
./shutdown.sh

# 2. Start backend server
echo -e "${GREEN}Starting backend server...${NC}"
<<<<<<< HEAD
cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Install backend dependencies if requirements.txt exists
if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    pip install -r "$BACKEND_DIR/requirements.txt"
fi

# Install Flask and other core dependencies if not already installed
pip install flask flask-cors python-dotenv requests pandas numpy ccxt ta python-binance

# Set Python path to include project root and backend
export PYTHONPATH="$BOT_DIR:$BACKEND_DIR:$PYTHONPATH"

# Start the backend server
python3 "$BACKEND_DIR/paper_trading_api.py" > "$BOT_DIR/backend.log" 2>&1 &
=======

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

>>>>>>> main
BACKEND_PID=$!
echo $BACKEND_PID > "$BOT_DIR/backend.pid"

# Wait for backend to start
sleep 2

# Verify backend is running
echo -e "${YELLOW}Verifying backend server connection...${NC}"
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
<<<<<<< HEAD
    if curl -s "http://localhost:5001/trading/status" > /dev/null 2>&1; then
=======
    if curl -s "http://localhost:5001/trading/paper" > /dev/null 2>&1; then
>>>>>>> main
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
