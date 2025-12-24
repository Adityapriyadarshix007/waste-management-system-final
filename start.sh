#!/bin/bash
echo "🚀 Starting Waste Detection API on port: ${PORT:-5001}"
exec gunicorn --bind 0.0.0.0:${PORT:-5001} --workers 1 --threads 8 --timeout 120 app:app
