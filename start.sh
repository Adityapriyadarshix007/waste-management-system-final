#!/bin/bash

# Get port from Railway environment or use default
PORT=${PORT:-5001}
echo "🚀 Starting Waste Detection API on port: $PORT"

# Use gunicorn with sync workers (not gevent) for stability
exec gunicorn --bind 0.0.0.0:$PORT \
    --workers 2 \
    --worker-class sync \
    --threads 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    app:app
