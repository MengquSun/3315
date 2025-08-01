#!/bin/bash

# Run Unit Tests Script
# Executes unit tests for both backend and frontend

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HW3_ROOT="$PROJECT_ROOT/../hw3"

print_status "Running unit tests..."

# Backend unit tests
if [ -d "$HW3_ROOT/backend" ]; then
    print_status "Running backend unit tests..."
    cd "$HW3_ROOT/backend"
    npm test
    print_success "Backend unit tests completed"
fi

# Frontend unit tests
if [ -d "$HW3_ROOT/frontend" ]; then
    print_status "Running frontend unit tests..."
    cd "$HW3_ROOT/frontend"
    npm test
    print_success "Frontend unit tests completed"
fi

print_success "All unit tests completed!"