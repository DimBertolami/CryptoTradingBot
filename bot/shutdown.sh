#!/bin/bash
# Shutdown script for Trading Bot System

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Shutting down Trading Bot System...${NC}"

# Try to kill backend by finding process on port
echo -e "${YELLOW}Searching for backend server process...${NC}"
FOUND_PIDS=$(lsof -t -i:5001 2>/dev/null)
if [ ! -z "$FOUND_PIDS" ]; then
    echo -e "${YELLOW}Found backend processes: $FOUND_PIDS${NC}"
    kill $FOUND_PIDS 2>/dev/null
    echo -e "${GREEN}✓ Backend server(s) stopped${NC}"
else
    echo -e "${RED}No backend server found running on port 5001${NC}"
fi

# Try to kill frontend processes
echo -e "${YELLOW}Searching for frontend server processes...${NC}"
for PORT in 5173 5174 5175 5176 5177 5178 5179 5180; do
    FOUND_PIDS=$(lsof -t -i:$PORT 2>/dev/null)
    if [ ! -z "$FOUND_PIDS" ]; then
        echo -e "${YELLOW}Found frontend on port $PORT: $FOUND_PIDS${NC}"
        kill $FOUND_PIDS 2>/dev/null
        echo -e "${GREEN}✓ Frontend server on port $PORT stopped${NC}"
    fi
done

# Stop resource manager
if [ -f "$BOT_DIR/resource_manager_service.sh" ]; then
    echo -e "${YELLOW}Stopping resource manager...${NC}"
    bash "$BOT_DIR/resource_manager_service.sh" stop
fi

echo -e "${GREEN}Trading Bot System has been stopped.${NC}"
