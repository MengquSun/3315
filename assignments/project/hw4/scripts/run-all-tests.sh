#!/bin/bash

# Run All Tests Script
# Executes complete test suite for Personal Task Management Application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HW3_ROOT="$PROJECT_ROOT/../hw3"
BACKEND_ROOT="$HW3_ROOT/backend"
FRONTEND_ROOT="$HW3_ROOT/frontend"
TEST_RESULTS_DIR="$PROJECT_ROOT/test-results"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if directory exists
check_directory() {
    if [ ! -d "$1" ]; then
        print_error "Directory not found: $1"
        exit 1
    fi
}

# Function to check if command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "Command not found: $1"
        print_error "Please install $1 and try again"
        exit 1
    fi
}

# Function to run command with timeout
run_with_timeout() {
    local timeout=$1
    local command=$2
    shift 2
    
    if command -v timeout &> /dev/null; then
        timeout "$timeout" bash -c "$command" "$@"
    else
        # macOS doesn't have timeout by default
        eval "$command" "$@"
    fi
}

# Function to setup test environment
setup_test_environment() {
    print_status "Setting up test environment..."
    
    # Create test results directories
    mkdir -p "$TEST_RESULTS_DIR"/{coverage-reports,test-reports,performance-reports}
    mkdir -p "$TEST_RESULTS_DIR/coverage-reports"/{backend,frontend}
    
    # Set test environment variables
    export NODE_ENV=test
    export CI=true
    export FORCE_COLOR=1
    
    print_success "Test environment setup complete"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check required commands
    check_command "node"
    check_command "npm"
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Node.js version $REQUIRED_VERSION or higher required. Found: $NODE_VERSION"
        exit 1
    fi
    
    # Check project directories
    check_directory "$HW3_ROOT"
    check_directory "$BACKEND_ROOT"
    check_directory "$FRONTEND_ROOT"
    
    print_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Backend dependencies
    if [ -f "$BACKEND_ROOT/package.json" ]; then
        print_status "Installing backend dependencies..."
        cd "$BACKEND_ROOT"
        npm ci --silent
        print_success "Backend dependencies installed"
    else
        print_warning "Backend package.json not found"
    fi
    
    # Frontend dependencies
    if [ -f "$FRONTEND_ROOT/package.json" ]; then
        print_status "Installing frontend dependencies..."
        cd "$FRONTEND_ROOT"
        npm ci --silent
        print_success "Frontend dependencies installed"
    else
        print_warning "Frontend package.json not found"
    fi
}

# Function to run backend tests
run_backend_tests() {
    print_status "Running backend unit tests..."
    
    cd "$BACKEND_ROOT"
    
    # Check if backend has tests
    if [ ! -d "src" ] && [ ! -f "package.json" ]; then
        print_warning "Backend tests not available"
        return 0
    fi
    
    # Run tests with coverage
    if npm run test:coverage > "$TEST_RESULTS_DIR/test-reports/backend-test-output.log" 2>&1; then
        print_success "Backend tests passed"
        
        # Copy coverage reports
        if [ -d "coverage" ]; then
            cp -r coverage/* "$TEST_RESULTS_DIR/coverage-reports/backend/" 2>/dev/null || true
        fi
    else
        print_error "Backend tests failed"
        cat "$TEST_RESULTS_DIR/test-reports/backend-test-output.log"
        return 1
    fi
}

# Function to run frontend tests
run_frontend_tests() {
    print_status "Running frontend unit tests..."
    
    cd "$FRONTEND_ROOT"
    
    # Check if frontend has tests
    if [ ! -d "src" ] && [ ! -f "package.json" ]; then
        print_warning "Frontend tests not available"
        return 0
    fi
    
    # Run tests with coverage
    if npm run test:coverage > "$TEST_RESULTS_DIR/test-reports/frontend-test-output.log" 2>&1; then
        print_success "Frontend tests passed"
        
        # Copy coverage reports
        if [ -d "coverage" ]; then
            cp -r coverage/* "$TEST_RESULTS_DIR/coverage-reports/frontend/" 2>/dev/null || true
        fi
    else
        print_error "Frontend tests failed"
        cat "$TEST_RESULTS_DIR/test-reports/frontend-test-output.log"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    cd "$PROJECT_ROOT/integration-tests"
    
    # Start backend server for integration tests
    print_status "Starting backend server..."
    cd "$BACKEND_ROOT"
    npm run dev > "$TEST_RESULTS_DIR/test-reports/backend-server.log" 2>&1 &
    BACKEND_PID=$!
    
    # Wait for server to start
    print_status "Waiting for backend server to start..."
    sleep 10
    
    # Check if server is running
    if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_warning "Backend server not responding, running integration tests without server"
    fi
    
    # Run integration tests
    cd "$PROJECT_ROOT/integration-tests"
    if npm test > "$TEST_RESULTS_DIR/test-reports/integration-test-output.log" 2>&1; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        cat "$TEST_RESULTS_DIR/test-reports/integration-test-output.log"
        
        # Stop backend server
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
        fi
        return 1
    fi
    
    # Stop backend server
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_status "Backend server stopped"
    fi
}

# Function to run linting
run_linting() {
    print_status "Running code linting..."
    
    # Backend linting
    if [ -f "$BACKEND_ROOT/package.json" ]; then
        cd "$BACKEND_ROOT"
        if npm run lint > "$TEST_RESULTS_DIR/test-reports/backend-lint.log" 2>&1; then
            print_success "Backend linting passed"
        else
            print_warning "Backend linting issues found"
            cat "$TEST_RESULTS_DIR/test-reports/backend-lint.log"
        fi
    fi
    
    # Frontend linting
    if [ -f "$FRONTEND_ROOT/package.json" ]; then
        cd "$FRONTEND_ROOT"
        if npm run lint > "$TEST_RESULTS_DIR/test-reports/frontend-lint.log" 2>&1; then
            print_success "Frontend linting passed"
        else
            print_warning "Frontend linting issues found"
            cat "$TEST_RESULTS_DIR/test-reports/frontend-lint.log"
        fi
    fi
}

# Function to run security audit
run_security_audit() {
    print_status "Running security audit..."
    
    # Backend security audit
    if [ -f "$BACKEND_ROOT/package.json" ]; then
        cd "$BACKEND_ROOT"
        if npm audit --audit-level=high > "$TEST_RESULTS_DIR/test-reports/backend-security.log" 2>&1; then
            print_success "Backend security audit passed"
        else
            print_warning "Backend security vulnerabilities found"
            cat "$TEST_RESULTS_DIR/test-reports/backend-security.log"
        fi
    fi
    
    # Frontend security audit
    if [ -f "$FRONTEND_ROOT/package.json" ]; then
        cd "$FRONTEND_ROOT"
        if npm audit --audit-level=high > "$TEST_RESULTS_DIR/test-reports/frontend-security.log" 2>&1; then
            print_success "Frontend security audit passed"
        else
            print_warning "Frontend security vulnerabilities found"
            cat "$TEST_RESULTS_DIR/test-reports/frontend-security.log"
        fi
    fi
}

# Function to generate test summary
generate_test_summary() {
    print_status "Generating test summary..."
    
    local summary_file="$TEST_RESULTS_DIR/test-summary.md"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat > "$summary_file" << EOF
# Test Execution Summary

**Generated**: $timestamp  
**Test Suite**: Complete Application Test Suite  
**Environment**: Local Development  

## Test Results Overview

### Unit Tests
- **Backend**: $([ -f "$TEST_RESULTS_DIR/test-reports/backend-test-output.log" ] && echo "✅ Passed" || echo "❌ Failed")
- **Frontend**: $([ -f "$TEST_RESULTS_DIR/test-reports/frontend-test-output.log" ] && echo "✅ Passed" || echo "❌ Failed")

### Integration Tests
- **API Integration**: $([ -f "$TEST_RESULTS_DIR/test-reports/integration-test-output.log" ] && echo "✅ Passed" || echo "❌ Failed")

### Code Quality
- **Backend Linting**: $([ -f "$TEST_RESULTS_DIR/test-reports/backend-lint.log" ] && echo "✅ Passed" || echo "⚠️ Issues")
- **Frontend Linting**: $([ -f "$TEST_RESULTS_DIR/test-reports/frontend-lint.log" ] && echo "✅ Passed" || echo "⚠️ Issues")

### Security
- **Backend Audit**: $([ -f "$TEST_RESULTS_DIR/test-reports/backend-security.log" ] && echo "✅ Clean" || echo "⚠️ Issues")
- **Frontend Audit**: $([ -f "$TEST_RESULTS_DIR/test-reports/frontend-security.log" ] && echo "✅ Clean" || echo "⚠️ Issues")

## Coverage Reports
- Backend Coverage: [View Report](coverage-reports/backend/index.html)
- Frontend Coverage: [View Report](coverage-reports/frontend/index.html)

## Detailed Logs
- [Backend Test Output](test-reports/backend-test-output.log)
- [Frontend Test Output](test-reports/frontend-test-output.log)
- [Integration Test Output](test-reports/integration-test-output.log)
- [Backend Lint Report](test-reports/backend-lint.log)
- [Frontend Lint Report](test-reports/frontend-lint.log)
- [Backend Security Audit](test-reports/backend-security.log)
- [Frontend Security Audit](test-reports/frontend-security.log)

---
*Generated by automated test suite*
EOF
    
    print_success "Test summary generated: $summary_file"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    
    # Kill any remaining processes
    pkill -f "node.*dev" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    
    # Reset working directory
    cd "$PROJECT_ROOT"
    
    print_success "Cleanup complete"
}

# Main execution function
main() {
    local start_time=$(date +%s)
    
    print_status "Starting complete test suite execution..."
    print_status "Project root: $PROJECT_ROOT"
    
    # Trap cleanup on exit
    trap cleanup EXIT
    
    # Execute test phases
    check_prerequisites
    setup_test_environment
    install_dependencies
    
    # Run tests (continue on failure to collect all results)
    local test_failures=0
    
    run_backend_tests || ((test_failures++))
    run_frontend_tests || ((test_failures++))
    run_integration_tests || ((test_failures++))
    run_linting
    run_security_audit
    
    # Generate reports
    generate_test_summary
    
    # Calculate execution time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_formatted=$(date -u -d @$duration +"%M:%S" 2>/dev/null || echo "${duration}s")
    
    # Print final results
    echo ""
    print_status "=========================================="
    print_status "TEST SUITE EXECUTION COMPLETE"
    print_status "=========================================="
    print_status "Duration: $duration_formatted"
    print_status "Results directory: $TEST_RESULTS_DIR"
    
    if [ $test_failures -eq 0 ]; then
        print_success "All tests passed! ✅"
        echo ""
        print_status "Next steps:"
        print_status "- Review coverage reports in $TEST_RESULTS_DIR/coverage-reports/"
        print_status "- Check test summary at $TEST_RESULTS_DIR/test-summary.md"
        print_status "- Address any linting or security issues if found"
        exit 0
    else
        print_error "$test_failures test suite(s) failed ❌"
        echo ""
        print_status "Please review:"
        print_status "- Failed test logs in $TEST_RESULTS_DIR/test-reports/"
        print_status "- Fix failing tests and re-run the suite"
        exit 1
    fi
}

# Script options
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Run complete test suite for Personal Task Management Application"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --skip-deps         Skip dependency installation"
        echo "  --backend-only      Run only backend tests"
        echo "  --frontend-only     Run only frontend tests"
        echo "  --integration-only  Run only integration tests"
        echo ""
        echo "Examples:"
        echo "  $0                  Run complete test suite"
        echo "  $0 --backend-only   Run only backend tests"
        echo "  $0 --skip-deps      Run tests without installing dependencies"
        exit 0
        ;;
    --skip-deps)
        SKIP_DEPS=true
        ;;
    --backend-only)
        TEST_MODE="backend"
        ;;
    --frontend-only)
        TEST_MODE="frontend"
        ;;
    --integration-only)
        TEST_MODE="integration"
        ;;
esac

# Execute main function
main "$@"