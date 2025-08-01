#!/bin/bash

# Run Integration Tests Script
# Executes integration tests with proper setup

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HW3_ROOT="$PROJECT_ROOT/../hw3"
BACKEND_ROOT="$HW3_ROOT/backend"

print_status "Setting up integration test environment..."

# Set test environment variables
export NODE_ENV=test
export TEST_DATABASE_URL="test-db"

# Start backend server for integration tests
if [ -d "$BACKEND_ROOT" ]; then
    print_status "Starting backend server..."
    cd "$BACKEND_ROOT"
    
    # Start server in background
    npm run dev > /tmp/backend-test-server.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait for server to start
    print_status "Waiting for server to start..."
    sleep 5
    
    # Check if server is running
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend server is running"
    else
        print_warning "Backend server may not be fully ready"
    fi
else
    print_warning "Backend directory not found, proceeding without server"
fi

# Run integration tests
print_status "Running integration tests..."
cd "$PROJECT_ROOT/integration-tests"

if npm test; then
    print_success "Integration tests passed"
    TEST_RESULT=0
else
    print_warning "Integration tests failed"
    TEST_RESULT=1
fi

# Cleanup
if [ ! -z "$BACKEND_PID" ]; then
    print_status "Stopping backend server..."
    kill $BACKEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
    print_success "Backend server stopped"
fi

exit $TEST_RESULT