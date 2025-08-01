#!/bin/bash

# Personal Task Management Application - Setup Script
# This script sets up the development environment for both backend and frontend

set -e

echo "🚀 Setting up Personal Task Management Application..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Creating backend environment file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your Firebase configuration"
fi

echo "📥 Installing backend dependencies..."
npm install

echo "🔨 Building backend..."
npm run build

cd ..

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend..."
cd frontend

echo "📥 Installing frontend dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

cd ..

# Create logs directory for backend
mkdir -p backend/logs

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update backend/.env with your Firebase configuration"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Access the application at http://localhost:5173"
echo ""
echo "📚 For more information, see the README.md files in each directory"
echo "🎯 Happy coding!"