#!/usr/bin/env python3
import os
import yaml
from ultralytics import YOLO

def train_model():
    # Check if dataset exists
    if not os.path.exists("yolo_dataset_final/data.yaml"):
        print("Error: Dataset not found. Please run organize_dataset_final.py first.")
        return
    
    # Load the data.yaml to verify
    with open("yolo_dataset_final/data.yaml", 'r') as f:
        data_config = yaml.safe_load(f)
    
    print("=== Dataset Configuration ===")
    print(f"Path: {data_config['path']}")
    print(f"Train: {data_config['train']}")
    print(f"Val: {data_config['val']}")
    print(f"Test: {data_config['test']}")
    print(f"Number of classes: {data_config['nc']}")
    print(f"Class names: {data_config['names']}")
    
    # Count images
    train_count = len([f for f in os.listdir("yolo_dataset_final/images/train") 
                      if f.endswith(('.jpg', '.jpeg', '.png'))])
    val_count = len([f for f in os.listdir("yolo_dataset_final/images/val") 
                    if f.endswith(('.jpg', '.jpeg', '.png'))])
    test_count = len([f for f in os.listdir("yolo_dataset_final/images/test") 
                     if f.endswith(('.jpg', '.jpeg', '.png'))])
    
    print(f"\n=== Dataset Statistics ===")
    print(f"Training images: {train_count}")
    print(f"Validation images: {val_count}")
    print(f"Test images: {test_count}")
    print(f"Total images: {train_count + val_count + test_count}")
    
    # Choose model (use yolov8s.pt for good balance of speed and accuracy)
    model_name = "yolov8s.pt"
    
    if not os.path.exists(model_name):
        print(f"\nDownloading {model_name}...")
        model = YOLO(model_name)  # This will download if not exists
    else:
        model = YOLO(model_name)
    
    print(f"\n=== Starting Training ===")
    print(f"Model: {model_name}")
    print(f"Epochs: 50")
    print(f"Image size: 640")
    print(f"Batch size: 16")
    
    # Train the model
    results = model.train(
        data="yolo_dataset_final/data.yaml",
        epochs=50,
        imgsz=640,
        batch=16,
        name="waste_detection_final",
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
        pretrained=True,
        verbose=True,
    )
    
    print("\n=== Training Completed ===")
    print(f"Results saved in: runs/detect/waste_detection_final/")
    
    # Validate the model
    print("\n=== Validating Model ===")
    val_results = model.val(
        data="yolo_dataset_final/data.yaml",
        split="val",
        save=True,
        save_txt=True,
        save_conf=True,
    )
    
    print(f"Validation mAP50: {val_results.box.map50:.4f}")
    print(f"Validation mAP50-95: {val_results.box.map:.4f}")
    print(f"Validation precision: {val_results.box.mp:.4f}")
    print(f"Validation recall: {val_results.box.mr:.4f}")
    
    # Save the best model
    best_model_path = "runs/detect/waste_detection_final/weights/best.pt"
    if os.path.exists(best_model_path):
        shutil.copy2(best_model_path, "best_waste_model.pt")
        print(f"\nBest model saved as: best_waste_model.pt")
    
    print("\n=== Next Steps ===")
    print("1. Test the model: python test_final_model.py")
    print("2. Use the model in your app: best_waste_model.pt")
    print("3. For better results, replace dummy labels with real annotations")

if __name__ == "__main__":
    import shutil
    train_model()
