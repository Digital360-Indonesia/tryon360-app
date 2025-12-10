#!/bin/bash

echo "🚀 Starting Kustompedia Try-On Platform..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the kustompedia-tryon-platform directory"
    exit 1
fi

# Install root dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check if .env exists with API key
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found. Please run setup first."
    exit 1
fi

echo "✅ Configuration looks good!"
echo "🌐 Starting both backend and frontend..."
echo ""
echo "Backend will be available at: http://localhost:3001"
echo "Frontend will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Start both services using concurrently
npm run dev
