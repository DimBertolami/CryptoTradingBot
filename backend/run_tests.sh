#!/bin/bash

# Make sure we're in the correct directory
cd /opt/lampp/htdocs/bot/backend || exit 1

# Make sure the script is executable
chmod +x run_tests.sh

# Run the tests
echo "Starting endpoint tests..."
./run_tests.sh

echo "Tests completed"