#!/bin/bash
# Shutdown script for Trading Bot System

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Get absolute path to script directory
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "$SCRIPT_DIR" || exit 1

# Define base directories
BOT_DIR="$SCRIPT_DIR"
FRONTEND_DIR="$BOT_DIR/frontend"
BACKEND_DIR="$BOT_DIR/backend"

# Function to stop a service
stop_service() {
    local service_name="$1"
    local pid_file="$2"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}Stopping $service_name (PID: $pid)...${NC}"
            kill -9 "$pid" 2>/dev/null
            rm -f "$pid_file"
            echo -e "${GREEN}✓ $service_name stopped${NC}"
        else
            echo -e "${RED}Warning: $service_name PID file exists but process is not running${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "${YELLOW}$service_name PID file not found${NC}"
    fi
}

# Function to clean up processes
cleanup_processes() {
    echo -e "${YELLOW}Cleaning up processes...${NC}"
    
    # Stop backend
    stop_service "Backend Server" "$BOT_DIR/backend.pid"
    
    # Stop frontend
    stop_service "Frontend Server" "$FRONTEND_DIR/frontend.pid"
    
    # Wait for processes to terminate
    sleep 2
    
    # Force kill any remaining processes
    echo -e "${YELLOW}Force killing any remaining processes...${NC}"
    
    # Kill remaining Node.js processes
    if pgrep -f "node.*server.js" > /dev/null; then
        pkill -f "node.*server.js"
        echo -e "${GREEN}✓ Killed remaining Node.js processes${NC}"
    fi
    
    # Kill remaining Python processes
    if pgrep -f "python.*paper_trading_api.py" > /dev/null; then
        pkill -f "python.*paper_trading_api.py"
        echo -e "${GREEN}✓ Killed remaining Python processes${NC}"
    fi
    
    # Wait for cleanup
    sleep 1
    
    # Verify all processes are stopped
    if pgrep -f "node.*server.js" > /dev/null || pgrep -f "python.*paper_trading_api.py" > /dev/null; then
        echo -e "${RED}Warning: Some processes are still running!${NC}"
    else
        echo -e "${GREEN}✓ All processes have been stopped${NC}"
    fi
}

# Function to clean up logs
cleanup_logs() {
    echo -e "${YELLOW}Cleaning up logs...${NC}"
    local logs_dir="$BOT_DIR/logs"
    
    if [ -d "$logs_dir" ]; then
        # Archive logs
        echo -e "${YELLOW}Archiving logs...${NC}"
        tar -czf "$logs_dir/logs_$(date +\%Y\%m\%d_\%H\%M\%S).tar.gz" -C "$logs_dir" .
        
        # Clear current logs
        echo -e "${YELLOW}Clearing current logs...${NC}"
        find "$logs_dir" -type f -name "*.log" -exec truncate -s 0 {} \;
        
        echo -e "${GREEN}✓ Logs cleaned up${NC}"
    else
        echo -e "${RED}Warning: Logs directory not found${NC}"
    fi
}

# Main script execution
main() {
    echo -e "${YELLOW}Starting shutdown process...${NC}"
    
    # Clean up processes
    cleanup_processes
    
    # Clean up logs
    cleanup_logs
    
    echo -e "${GREEN}✓ Trading Bot System has been successfully shut down${NC}"
}

# Run main function
main "$@"
