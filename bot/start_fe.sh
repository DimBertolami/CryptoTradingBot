#!/bin/bash

# Start frontend server
BOT_DIR=$(dirname "$0")

# Set VITE_PORT environment variable
export VITE_PORT=5173

# Start frontend server with Vite
if ! cd "$BOT_DIR/frontend" && npx vite > "$BOT_DIR/frontend.log" 2>&1 &
then
    echo -e "\033[0;31mFailed to start frontend server! Check $BOT_DIR/frontend.log for details.\033[0m"
    echo -e "\033[0;33mLast 20 lines of frontend log:\033[0m"
    tail -n 20 "$BOT_DIR/frontend.log"
    exit 1
fi

FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$BOT_DIR/frontend.pid"
echo -e "\033[0;32m✓ Frontend server started successfully (PID: $FRONTEND_PID)\033[0m"
