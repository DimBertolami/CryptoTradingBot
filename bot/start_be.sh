#!/bin/bash

# Start backend server
BOT_DIR=$(dirname "$0")

# Set FLASK_APP environment variable
export FLASK_APP="$BOT_DIR/backend/paper_trading_api.py"

# Start backend server with proper error handling
"$BOT_DIR/venv2/bin/python3" -m flask run --host=127.0.0.1 --port=5001 --no-debugger --no-reload > "$BOT_DIR/backend.log" 2>&1 &

# Wait a moment for the process to start
sleep 1

# Check if the process is actually running
BACKEND_PID=$!
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "\033[0;31mFailed to start backend server! Check $BOT_DIR/backend.log for details.\033[0m"
    echo -e "\033[0;33mLast 20 lines of backend log:\033[0m"
    tail -n 20 "$BOT_DIR/backend.log"
    exit 1
fi

echo "$BACKEND_PID" > "$BOT_DIR/backend.pid"
echo -e "\033[0;32m✓ Backend server started successfully (PID: $BACKEND_PID)\033[0m"
