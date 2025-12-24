#!/bin/bash

echo "================================================"
echo "🚀 WASTE DETECTION API - STARTUP SCRIPT"
echo "================================================"

# Set default PORT if not provided
if [ -z "$PORT" ]; then
    PORT=5001
    echo "⚠️  PORT environment variable not set"
    echo "   Using default port: $PORT"
else
    echo "✅ PORT environment variable found: $PORT"
fi

# Export PORT to ensure it's available
export PORT
echo "📡 Server will run on port: $PORT"

# Change to backend directory if it exists
if [ -d "backend" ]; then
    echo "📁 Changing to backend directory..."
    cd backend
else
    echo "📁 Running from current directory"
fi

echo ""
echo "📦 Checking Python dependencies..."

# Install Python dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "   Installing from requirements.txt..."
    pip install -r requirements.txt
    echo "   ✅ Dependencies installed"
else
    echo "   ⚠️  requirements.txt not found, skipping dependency installation"
fi

echo ""
echo "🔍 Checking for app.py..."

# Check if app.py exists
if [ ! -f "app.py" ]; then
    echo "❌ ERROR: app.py not found!"
    echo "   Current directory: $(pwd)"
    echo "   Files in directory:"
    ls -la
    exit 1
fi

echo "✅ app.py found"

echo ""
echo "================================================"
echo "🔥 STARTING FLASK APPLICATION"
echo "================================================"

# Start the Flask application
exec python app.py
