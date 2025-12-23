#!/bin/bash

# Install requirements if needed
# pip install ultralytics

# Check if dataset exists
if [ ! -f "yolo_dataset/data.yaml" ]; then
    echo "Error: Dataset not found. Please run organize_yolo_dataset.py first."
    exit 1
fi

echo "Starting YOLO training..."
echo "Dataset: yolo_dataset/data.yaml"
echo "Model: yolov8n.pt"

# Train using YOLO command line
yolo detect train \
  data=yolo_dataset/data.yaml \
  model=yolov8n.pt \
  epochs=50 \
  imgsz=640 \
  batch=16 \
  name=waste_yolo_final \
  patience=10 \
  save=True \
  save_period=10 \
  workers=4 \
  lr0=0.01 \
  lrf=0.01 \
  momentum=0.937 \
  weight_decay=0.0005 \
  project=training_results \
  exist_ok=True

echo "Training completed!"
echo "Check results in: training_results/waste_yolo_final/"
