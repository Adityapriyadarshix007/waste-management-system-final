#!/usr/bin/env python3
import os
from ultralytics import YOLO

def test_model():
    # Check for the best model
    model_path = "training_results/waste_yolo_final/weights/best.pt"
    
    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}")
        print("Please train the model first using train_yolo.sh")
        return
    
    # Load the trained model
    model = YOLO(model_path)
    
    print("Testing model on validation set...")
    
    # Validate the model
    results = model.val(
        data="yolo_dataset/data.yaml",
        split="val",
        save=True,
        save_txt=True,
        save_conf=True,
        save_json=True
    )
    
    print("\nValidation results:")
    print(f"mAP50: {results.box.map50:.4f}")
    print(f"mAP50-95: {results.box.map:.4f}")
    print(f"Precision: {results.box.mp:.4f}")
    print(f"Recall: {results.box.mr:.4f}")
    
    # Test on a single image
    test_image = "test_waste.jpg"
    if os.path.exists(test_image):
        print(f"\nTesting on {test_image}...")
        result = model(test_image, save=True, conf=0.25)
        
        # Show results
        for r in result:
            print(f"Detected {len(r.boxes)} objects")
            if len(r.boxes) > 0:
                for box in r.boxes:
                    class_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    print(f"  Class: {class_id}, Confidence: {conf:.2f}")

if __name__ == "__main__":
    test_model()
