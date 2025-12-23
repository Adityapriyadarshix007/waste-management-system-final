#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Add the parent directory to the path
sys.path.append(str(Path(__file__).parent.parent))

from ultralytics import YOLO

def main():
    # Get absolute paths
    project_root = Path(__file__).parent.parent
    model_path = project_root / "runs" / "detect" / "train5" / "weights" / "best.pt"
    data_path = project_root / "backend" / "kaggle_yolo" / "data.yaml"
    
    print(f"Model path: {model_path}")
    print(f"Data path: {data_path}")
    
    # Check if files exist
    if not model_path.exists():
        print(f"Error: Model file not found at {model_path}")
        return
    
    if not data_path.exists():
        print(f"Error: Data config not found at {data_path}")
        return
    
    # Load model
    print("Loading model...")
    model = YOLO(str(model_path))
    
    # Train
    print("Starting training...")
    results = model.train(
        data=str(data_path),
        epochs=30,
        imgsz=640,
        batch=8,
        name="waste_detector_v2",
        project="backend/training_results",
        patience=20,
        lr0=0.001,
        device='cpu'  # Use 'cuda' if you have GPU
    )
    
    print("Training completed successfully!")
    return results

if __name__ == "__main__":
    main()