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

# Function to build frontend
build_frontend() {
    print_status "Building frontend with Vite..."
    npm run build
    print_success "Frontend build completed"
}

# Main build process
print_status "Starting build process..."

# Build frontend
build_frontend

print_success "Build completed successfully!"
