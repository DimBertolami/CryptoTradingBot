#!/bin/bash
# Script to properly set up the virtual environment

# Create virtual environment in the current directory
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install required packages
pip install -r requirements.txt

# Create necessary directories
mkdir -p logs
mkdir -p frontend/trading_data
mkdir -p bot/logs

# Set permissions
chmod -R 755 .
chmod +x startup.sh

# Deactivate virtual environment
deactivate

echo "Virtual environment setup complete!"
