#!/usr/bin/env python3
import os
from ultralytics import YOLO

def train_model():
    # Check if dataset exists
    if not os.path.exists("yolo_dataset_final/data.yaml"):
        print("Error: Dataset not found. Please run organize_dataset_final.py first.")
        return
    
    # Count images
    train_count = len([f for f in os.listdir("yolo_dataset_final/images/train") 
                      if f.endswith(('.jpg', '.jpeg', '.png'))])
    val_count = len([f for f in os.listdir("yolo_dataset_final/images/val") 
                    if f.endswith(('.jpg', '.jpeg', '.png'))])
    
    print("=== Waste Detection Model Training ===")
    print(f"Training images: {train_count}")
    print(f"Validation images: {val_count}")
    print(f"Total: {train_count + val_count} images")
    
    # Choose model
    model_name = "yolov8s.pt"
    
    if not os.path.exists(model_name):
        print(f"\nDownloading {model_name}...")
        model = YOLO(model_name)
    else:
        model = YOLO(model_name)
    
    print("\n=== Starting Training ===")
    print("This may take a while...")
    
    # Train the model with basic parameters
    try:
        results = model.train(
            data="yolo_dataset_final/data.yaml",
            epochs=30,  # Reduced for faster training
            imgsz=640,
            batch=16,
            name="waste_detection_simple",
            patience=5,
            save=True,
            workers=2,  # Reduced for stability
            lr0=0.01,
            verbose=True,
        )
        
        print("\n=== Training Completed ===")
        
        # Test on a sample image
        test_image = "test_waste.jpg"
        if os.path.exists(test_image):
            print(f"\nTesting on {test_image}...")
            results = model(test_image, save=True, conf=0.25)
            print("Results saved to runs/detect/predict/")
        
        # Save the best model
        best_model_path = "runs/detect/waste_detection_simple/weights/best.pt"
        if os.path.exists(best_model_path):
            import shutil
            shutil.copy2(best_model_path, "best_simple_model.pt")
            print(f"\nBest model saved as: best_simple_model.pt")
        
    except Exception as e:
        print(f"\nError during training: {e}")
        print("\nTrying alternative approach...")
        
        # Try command line training instead
        print("Running training via command line...")
        os.system("yolo detect train data=yolo_dataset_final/data.yaml model=yolov8s.pt epochs=30 imgsz=640 batch=8")

if __name__ == "__main__":
    train_model()
