#!/bin/bash
# Startup script for Trading Bot System

# Get absolute path to script directory
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "$SCRIPT_DIR" || exit 1

# Define base directories
BOT_DIR="$SCRIPT_DIR/.."
FRONTEND_DIR="$BOT_DIR/frontend"
BACKEND_DIR="$BOT_DIR/backend"

# Clean up existing processes
./shutdown.sh

# Build frontend first
npm --prefix "$FRONTEND_DIR" run build

# Start backend server
export FLASK_APP="$BACKEND_DIR/app/main.py"
export FLASK_ENV=development
export FLASK_DEBUG=1

mkdir -p "$BOT_DIR/logs"
nohup uvicorn app.main:app --host 0.0.0.0 --port 5001 > "$BOT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BOT_DIR/backend.pid"

# Start frontend server
npm --prefix "$FRONTEND_DIR" start > "$BOT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_DIR/frontend.pid"

# Give services a moment to start
sleep 2

# Verify backend
if ! curl -s "http://localhost:5001/api/v1/status/backend" > /dev/null 2>&1; then
    echo "Backend failed to start. Check logs for details."
    exit 1
fi

# Verify frontend
if ! curl -s "http://localhost:5173" > /dev/null 2>&1; then
    echo "Frontend failed to start. Check logs for details."
    exit 1
fi

exit 0