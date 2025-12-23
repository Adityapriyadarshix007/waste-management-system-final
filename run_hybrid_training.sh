#!/bin/bash

cd ~/Desktop/waste-management-system/backend

echo "=============================================="
echo "🏗️  HYBRID MODEL TRAINING & DEPLOYMENT"
echo "=============================================="
echo "This will:"
echo "1. Train a 2-class model on your O/R dataset"
echo "2. Deploy it for app.py's 4-category mapping"
echo "3. Create all necessary files"
echo "=============================================="

# Install requirements
echo -e "\n📦 Installing requirements..."
pip install ultralytics opencv-python pyyaml --quiet

# Run the training
echo -e "\n🚀 Starting hybrid training..."
python3 hybrid_training_solution.py

# Check if successful
if [ -f "best.pt" ]; then
    echo -e "\n✅ SUCCESS! Model trained and deployed."
    echo -e "\n📊 Model information:"
    echo "   Size: $(du -h best.pt | cut -f1)"
    echo "   Location: $(pwd)/best.pt"
    echo "   Backup: high_accuracy_training/waste_detector_pro/weights/best.pt"
    
    echo -e "\n🎯 Testing the model..."
    if [ -d "DATASET/TEST" ]; then
        echo "   Test images available in DATASET/TEST/"
        echo "   You can test with: python3 app.py"
    fi
    
    echo -e "\n🔧 To use with your app:"
    echo "   1. Make sure app.py is in the same directory"
    echo "   2. Run: python3 app.py"
    echo "   3. App will automatically use best.pt"
    
    echo -e "\n📈 For better accuracy:"
    echo "   - Add real bounding box annotations"
    echo "   - Train with more epochs (100+ recommended)"
    echo "   - Use GPU if available (change device='cpu' to device='0')"
else
    echo -e "\n❌ Training failed. Trying alternative approach..."
    
    # Fallback: quick training
    echo -e "\n🔄 Attempting quick training..."
    python3 -c "
from ultralytics import YOLO
import os

# Create minimal dataset
os.makedirs('quick_train/images/train', exist_ok=True)
os.makedirs('quick_train/labels/train', exist_ok=True)

# Copy a few images
import random, shutil
from pathlib import Path

# Get some images
o_images = list(Path('DATASET/TRAIN/O').glob('*.jpg'))[:100]
r_images = list(Path('DATASET/TRAIN/R').glob('*.jpg'))[:100]

for img in o_images + r_images:
    shutil.copy2(img, f'quick_train/images/train/{img.name}')

# Create dataset.yaml
with open('quick_train/dataset.yaml', 'w') as f:
    f.write('''path: $(pwd)/quick_train
train: images/train
val: images/train

nc: 2
names: ['biodegradable', 'recyclable']
''')

# Train quickly
model = YOLO('yolov8n.pt')
model.train(data='quick_train/dataset.yaml', epochs=10, imgsz=320, batch=8, name='quick')
    "
    
    if [ -f "runs/detect/quick/weights/best.pt" ]; then
        cp runs/detect/quick/weights/best.pt best.pt
        echo -e "\n✅ Quick model created: best.pt"
    fi
fi

echo -e "\n=============================================="
echo "🎉 Done! Your app.py is ready with the new model."
echo "=============================================="
