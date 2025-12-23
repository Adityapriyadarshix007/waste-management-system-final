# train_model.py
from ultralytics import YOLO
import os
import yaml

def check_and_train():
    print("=== YOLOv8 TRAINING ===")
    
    # Check requirements
    if not os.path.exists("waste_data.yaml"):
        print("❌ waste_data.yaml not found!")
        return False
    
    # Load config to check
    with open("waste_data.yaml", 'r') as f:
        config = yaml.safe_load(f)
    
    print(f"Dataset path: {config.get('path', 'Not set')}")
    print(f"Training images: {config.get('train', 'Not set')}")
    print(f"Validation images: {config.get('val', 'Not set')}")
    print(f"Number of classes: {config.get('nc', 'Not set')}")
    print(f"Class names: {config.get('names', 'Not set')}")
    
    # Check if paths exist
    train_path = os.path.join(config['path'], config['train'])
    val_path = os.path.join(config['path'], config['val'])
    
    if not os.path.exists(train_path):
        print(f"❌ Training path not found: {train_path}")
        return False
    
    if not os.path.exists(val_path):
        print(f"❌ Validation path not found: {val_path}")
        return False
    
    # Count files
    train_images = [f for f in os.listdir(train_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    val_images = [f for f in os.listdir(val_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    print(f"\n📊 Dataset statistics:")
    print(f"  Training images: {len(train_images)}")
    print(f"  Validation images: {len(val_images)}")
    
    if len(train_images) == 0:
        print("❌ No training images found!")
        return False
    
    # Train the model
    print(f"\n🚀 Starting training...")
    
    try:
        # Load model (downloads if not present)
        model = YOLO('yolov8n.pt')
        
        # Training configuration
        results = model.train(
            data='waste_data.yaml',
            epochs=50,
            imgsz=640,
            batch=16,
            device='cpu',  # Change to 'mps' for Apple Silicon or 'cuda' for GPU
            workers=4,
            patience=10,
            save=True,
            save_period=10,
            project='runs/train',
            name='waste_detection',
            exist_ok=True,
            verbose=True
        )
        
        print(f"\n✅ Training completed!")
        print(f"Model saved in: runs/train/waste_detection/")
        
        # Test the model
        print(f"\n🧪 Testing trained model...")
        test_results = model.predict(
            source=os.path.join(val_path, val_images[0]) if val_images else train_path,
            save=True,
            project='runs/detect',
            name='test'
        )
        
        print(f"✅ Test completed! Check runs/detect/test/")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        return False

if __name__ == "__main__":
    check_and_train()