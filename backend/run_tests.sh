#!/bin/bash

# Navigate to backend directory
cd /opt/lampp/htdocs/bot/backend || exit 1

# Start Flask server in background
echo "Starting Flask server..."
python3 app.py &

# Wait for server to start
echo "Waiting for server to start..."
sleep 2

# Run tests
echo "Running status endpoint tests..."
python3 test_status_endpoints.py

# Stop the server
echo "Stopping server..."
pkill -f "python3 app.py"

echo "All tests completed"