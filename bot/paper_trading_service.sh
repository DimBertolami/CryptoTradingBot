#!/bin/bash
# Paper Trading Service Management Script

BASE_DIR=$(dirname "$(readlink -f "$0")")
PID_FILE="$BASE_DIR/logs/paper_trading.pid"
LOG_FILE="$BASE_DIR/logs/paper_trading.log"

start() {
    echo -e "\033[0;32mStarting Paper Trading Service...\033[0m"
    
    # Ensure logs directory exists
    mkdir -p "$BASE_DIR/logs"
    
    # Start the service
    nohup python "$BASE_DIR/backend/paper_trading_api.py" \
        > "$LOG_FILE" 2>&1 \
        &
    
    echo $! > "$PID_FILE"
    echo -e "\033[0;32m✓ Paper Trading Service started\033[0m"
    echo -e "Logs: $LOG_FILE"
    echo -e "PID: $(cat "$PID_FILE")"
}

stop() {
    echo -e "\033[0;33mStopping Paper Trading Service...\033[0m"
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        kill -9 "$PID" 2>/dev/null
        rm -f "$PID_FILE"
        echo -e "\033[0;32m✓ Paper Trading Service stopped\033[0m"
    else
        echo -e "\033[0;31mWarning: No PID file found\033[0m"
    fi
}

status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null; then
            echo -e "\033[0;32m✓ Paper Trading Service is running (PID: $PID)\033[0m"
        else
            echo -e "\033[0;31mError: PID file exists but process is not running\033[0m"
            rm -f "$PID_FILE"
        fi
    else
        echo -e "\033[0;33mPaper Trading Service is not running\033[0m"
    fi
}

restart() {
    stop
    sleep 1
    start
}

# Main script execution
if [ "$#" -eq 0 ]; then
    echo -e "\033[0;31mUsage: $0 {start|stop|restart|status}\033[0m"
    exit 1
fi

COMMAND="$1"
shift

"$COMMAND" "$@"
