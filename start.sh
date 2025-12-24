#!/bin/bash

# Get port from Railway environment
PORT=${PORT:-5001}
echo "🚀 Starting Waste Detection API on port: $PORT"

# Check if in Railway (production)
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "📦 Railway Environment: $RAILWAY_ENVIRONMENT"
    WORKERS=2
else
    echo "💻 Local Development"
    WORKERS=1
fi

cd backend

# Use gunicorn
exec gunicorn --bind 0.0.0.0:$PORT \
    --workers $WORKERS \
    --worker-class sync \
    --threads 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    app:app

