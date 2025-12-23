#!/usr/bin/env python3
import os
from ultralytics import YOLO
import yaml

def train_model():
    # Check if dataset exists
    if not os.path.exists("yolo_dataset/data.yaml"):
        print("Error: Dataset not found. Please organize the dataset first.")
        return
    
    # Load the data.yaml to verify
    with open("yolo_dataset/data.yaml", 'r') as f:
        data_config = yaml.safe_load(f)
    
    print("Dataset configuration:")
    print(f"  Path: {data_config['path']}")
    print(f"  Train: {data_config['train']}")
    print(f"  Val: {data_config['val']}")
    print(f"  Test: {data_config['test']}")
    print(f"  Number of classes: {data_config['nc']}")
    print(f"  Class names: {data_config['names']}")
    
    # Choose a YOLO model (yolov8n, yolov8s, yolov8m)
    model_name = "yolov8n.pt"  # You can change this to yolov8s.pt or yolov8m.pt
    
    if not os.path.exists(model_name):
        print(f"Downloading {model_name}...")
        model = YOLO(model_name)  # This will download if not exists
    else:
        model = YOLO(model_name)
    
    print(f"\nStarting training with {model_name}...")
    
    # Train the model
    results = model.train(
        data="yolo_dataset/data.yaml",
        epochs=50,
        imgsz=640,
        batch=16,
        name="waste_detection_yolo",
        patience=10,
        save=True,
        save_period=10,
        workers=4,
        lr0=0.01,
        lrf=0.01,
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3.0,
        warmup_momentum=0.8,
        box=7.5,
        cls=0.5,
        dfl=1.5,
    )
    
    print("Training completed!")
    print(f"Results saved in: {results.save_dir}")

if __name__ == "__main__":
    train_model()
