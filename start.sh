#!/bin/bash

# Get port from environment or use default
PORT=${PORT:-5001}

echo "🚀 Starting Waste Detection API on port: $PORT"

# Start the application
exec python app.py
