# organize_correct.py
import os
import shutil
import random
from pathlib import Path

def organize_correctly():
    """Organize the dataset correctly based on your structure"""
    
    print("Current directory:", os.getcwd())
    print("\nLooking for dataset files...")
    
    # Try different possible locations
    possible_locations = [
        Path("DATASET/DATASET"),
        Path("DATASET/TRAIN"), 
        Path("DATASET/TEST"),
        Path("DATASET")
    ]
    
    image_files = []
    txt_files = []
    actual_location = None
    
    for location in possible_locations:
        if location.exists():
            print(f"\n🔍 Checking: {location}")
            
            # Find files
            jpgs = list(location.rglob("*.jpg")) + list(location.rglob("*.jpeg")) + list(location.rglob("*.png"))
            txts = list(location.rglob("*.txt"))
            
            if jpgs:
                print(f"  Found {len(jpgs)} image files")
                image_files.extend(jpgs)
            
            if txts:
                print(f"  Found {len(txts)} annotation files")
                txt_files.extend(txts)
                
            if jpgs or txts:
                actual_location = location
                break
    
    if not image_files:
        print("\n❌ ERROR: No image files found!")
        print("Checking all directories...")
        for root, dirs, files in os.walk("."):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png', '.txt')):
                    print(f"  Found: {os.path.join(root, file)}")
        return False
    
    print(f"\n📊 Summary:")
    print(f"  Image files: {len(image_files)}")
    print(f"  TXT files: {len(txt_files)}")
    
    if len(txt_files) == 0:
        print("\n⚠️ WARNING: No .txt annotation files found!")
        print("Training won't work without annotation files.")
        print("Check if .txt files exist in your dataset.")
        return False
    
    # Create YOLO structure
    output_path = Path("organized_dataset")
    (output_path / "images" / "train").mkdir(parents=True, exist_ok=True)
    (output_path / "images" / "val").mkdir(parents=True, exist_ok=True)
    (output_path / "labels" / "train").mkdir(parents=True, exist_ok=True)
    (output_path / "labels" / "val").mkdir(parents=True, exist_ok=True)
    
    # Match images with annotations
    print(f"\n🔗 Matching images with annotations...")
    
    # Create dictionary of txt files
    txt_dict = {}
    for txt_file in txt_files:
        stem = txt_file.stem
        # Remove any path components from stem
        stem = Path(stem).name
        txt_dict[stem] = txt_file
    
    matched_pairs = []
    
    for img_file in image_files[:2000]:  # Process first 2000
        stem = img_file.stem
        stem = Path(stem).name  # Clean stem
        
        if stem in txt_dict:
            matched_pairs.append((img_file, txt_dict[stem]))
    
    print(f"✅ Matched pairs: {len(matched_pairs)}")
    
    if len(matched_pairs) == 0:
        print("\n❌ ERROR: No matching pairs!")
        print("Image and .txt files must have the same name")
        print("Example: R_9090.jpg and R_9090.txt")
        
        # Show some examples
        print("\nSample image files:")
        for img in image_files[:5]:
            print(f"  {img.name}")
        
        print("\nSample txt files:")
        for txt in txt_files[:5]:
            print(f"  {txt.name}")
        
        return False
    
    # Split into train/val
    random.shuffle(matched_pairs)
    split_idx = int(len(matched_pairs) * 0.8)
    train_pairs = matched_pairs[:split_idx]
    val_pairs = matched_pairs[split_idx:]
    
    print(f"\n📊 Dataset Split:")
    print(f"  Training: {len(train_pairs)}")
    print(f"  Validation: {len(val_pairs)}")
    
    # Copy files
    print(f"\n📋 Copying files...")
    
    for img_path, txt_path in train_pairs:
        shutil.copy2(img_path, output_path / "images" / "train" / img_path.name)
        shutil.copy2(txt_path, output_path / "labels" / "train" / txt_path.name)
    
    for img_path, txt_path in val_pairs:
        shutil.copy2(img_path, output_path / "images" / "val" / img_path.name)
        shutil.copy2(txt_path, output_path / "labels" / "val" / txt_path.name)
    
    print(f"\n🎉 Dataset organized successfully!")
    print(f"Output location: {output_path}")
    
    # Check annotation format
    print(f"\n📝 Checking annotation format...")
    sample_txt = output_path / "labels" / "train" / txt_files[0].name
    if sample_txt.exists():
        with open(sample_txt, 'r') as f:
            first_line = f.readline().strip()
            print(f"Sample annotation: {first_line}")
    
    return True, output_path

if __name__ == "__main__":
    organize_correctly()