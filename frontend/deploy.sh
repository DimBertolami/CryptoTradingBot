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

# Function to build and deploy frontend
deploy_frontend() {
    print_status "Building frontend..."
    npm run build
    
    print_status "Setting up build directory permissions..."
    sudo chown -R dim:dim build
    sudo chmod -R 755 build
    
    print_status "Starting Vite preview server on port 3000..."
    npm run preview -- --port 3000
    
    print_success "Frontend deployment completed"
}

# Main deployment process
print_status "Starting deployment process..."

deploy_frontend

print_success "Deployment completed successfully!"
