#!/bin/bash

# Set up virtual environment
echo "Setting up virtual environment..."
python3 -m venv venv2
source venv2/bin/activate

# Install pip if needed
if ! command -v pip3 &> /dev/null; then
    echo "Installing pip..."
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python3 get-pip.py
fi

# Install project dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -e .

# Install development tools
pip install -e .[dev]

# Install test dependencies
pip install pytest pytest-asyncio

# Set up Python path
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Run tests
echo "Running tests..."
python3 -m pytest tests/ -v

# Start the bot
echo "Starting the bot..."
python3 -m cryptobot
