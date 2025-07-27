#!/bin/bash

# Development script for running the Go API server

echo "🚀 Starting Portfolio API server..."

# Kill any existing process on port 8080
echo "🔄 Checking for existing server on port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null && echo "✅ Killed existing server" || echo "📍 No existing server found"

# Check if .env file exists and load it
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found. Please create one based on env.example"
    echo "   cp env.example .env"
    echo "   Then edit .env with your Neon database connection string"
    echo ""
fi

# Check if NEON_DEV_PASS is set
if [ -z "$NEON_DEV_PASS" ]; then
    echo "❌ NEON_DEV_PASS environment variable not set!"
    echo "   Please set it with your Neon connection string:"
    echo "   export NEON_DEV_PASS='postgresql://user:pass@host:5432/db?sslmode=require'"
    echo "   Or create a .env file with this variable"
    exit 1
fi

# Set default port if not specified
if [ -z "$PORT" ]; then
    export PORT=8080
fi

echo "📍 Server will run on: http://localhost:$PORT"
echo "🔗 Health check: http://localhost:$PORT/api/health"
echo "📚 API docs: see api/README.md"
echo "🗄️  Database: Connected to Neon"
echo ""

# Ensure Go is in PATH
export PATH=$PATH:/usr/local/go/bin

# Run the server
go run cmd/server/main.go 