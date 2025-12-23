#!/bin/bash
echo "🐍 Setting up Python 3.11 environment..."

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Download YOLO model if not exists
if [ ! -f "yolov8n.pt" ]; then
    echo "📦 Downloading yolov8n.pt..."
    python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
fi

echo "✅ Setup completed!"