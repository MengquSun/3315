#!/bin/bash

# Personal Task Management Application - Development Startup Script
# This script starts both backend and frontend in development mode

set -e

echo "🚀 Starting Personal Task Management Application in Development Mode..."
echo "=================================================================="

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    jobs -p | xargs -r kill
    exit 0
}

# Trap SIGINT and SIGTERM to cleanup
trap cleanup SIGINT SIGTERM

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found. Please run setup.sh first."
    exit 1
fi

# Start Backend
echo "🔧 Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Frontend Development Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Development servers started successfully!"
echo ""
echo "📍 Application URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   API Docs: http://localhost:3001/health"
echo ""
echo "💡 Tips:"
echo "   - Both servers will auto-reload on file changes"
echo "   - Press Ctrl+C to stop both servers"
echo "   - Check logs in separate terminals if needed"
echo ""
echo "🎯 Ready for development! Open http://localhost:5173 in your browser."

# Wait for background processes
wait