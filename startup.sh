#!/bin/bash

# Exit on error
set -e

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Function to print colored messages
print_status() {
    echo -e "${BLUE}[*] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[+] $1${NC}"
}

print_error() {
    echo -e "${RED}[-] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[!] $1${NC}"
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    # Kill any existing processes
    pkill -f "uvicorn" || true
    pkill -f "vite" || true
    
    # Start backend
    print_status "Starting backend service..."
    cd backend && /opt/lampp/htdocs/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 &
    
    # Start frontend
    print_status "Starting frontend service..."
    cd frontend && npm run build && npm run preview -- --port 3000 &
    
    print_success "Services started successfully"
}

# Function to check service status
check_status() {
    print_status "Checking service status..."
    
    # Wait for services to start
    sleep 5
    
    # Check backend
    if ! curl -s http://localhost:8000/health | grep -q '"status":"healthy"'; then
        print_error "Backend service failed to start"
        exit 1
    fi
    
    # Check frontend
    if ! curl -s http://localhost:3000 | grep -q "CryptoTradingBot"; then
        print_error "Frontend service failed to start"
        exit 1
    fi
    
    print_success "All services are running"
}

# Main startup process
print_status "Starting CryptoTradingBot..."

# Start services
start_services

# Check status
check_status

print_success "CryptoTradingBot started successfully!"
print_status "Backend: http://localhost:8000"
print_status "Frontend: http://localhost:3000"