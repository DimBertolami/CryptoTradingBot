#!/bin/bash
# Shutdown script for Trading Bot System

# Get absolute path to script directory
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "$SCRIPT_DIR" || exit 1

# Define base directories
BOT_DIR="$SCRIPT_DIR/.."
FRONTEND_DIR="$BOT_DIR/frontend"
BACKEND_DIR="$BOT_DIR/backend"

# Kill frontend process
if [ -f "$FRONTEND_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_DIR/frontend.pid")
    kill -9 "$FRONTEND_PID" 2>/dev/null
    rm "$FRONTEND_DIR/frontend.pid"
fi

# Kill backend process
if [ -f "$BOT_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$BOT_DIR/backend.pid")
    kill -9 "$BACKEND_PID" 2>/dev/null
    rm "$BOT_DIR/backend.pid"
fi

# Clean up logs
rm -f "$BOT_DIR/logs/backend.log"
rm -f "$BOT_DIR/logs/frontend.log"

exit 0