#!/usr/bin/env python3
import os
import shutil
import random
from pathlib import Path

# Configuration
source_dir = "../backend_backup/kaggle_dataset_raw/DATASET"
dest_dir = "yolo_dataset"

# Create destination directories
for split in ['train', 'val', 'test']:
    os.makedirs(f"{dest_dir}/images/{split}", exist_ok=True)
    os.makedirs(f"{dest_dir}/labels/{split}", exist_ok=True)

def get_class_from_filename(filename):
    """Determine class from filename."""
    if filename.startswith('O_'):
        return 0  # Organic/Other waste
    elif filename.startswith('R_'):
        return 1  # Recyclable waste
    else:
        return 0  # Default to class 0

def create_yolo_label(image_path, label_path):
    """Create a YOLO format label file."""
    class_id = get_class_from_filename(os.path.basename(image_path).split('.')[0])
    
    # For now, create dummy bounding boxes (center of image, 50% width/height)
    # You should replace these with actual annotations
    with open(label_path, 'w') as f:
        f.write(f"{class_id} 0.5 0.5 0.5 0.5\n")

def organize_dataset():
    """Organize the dataset into YOLO format."""
    print("Organizing dataset...")
    
    # Process TRAIN directory
    train_source = os.path.join(source_dir, "TRAIN")
    if os.path.exists(train_source):
        print(f"Processing training images from {train_source}")
        train_images = []
        
        # Collect all images
        for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
            train_images.extend(list(Path(train_source).rglob(f"*{ext}")))
        
        print(f"Found {len(train_images)} training images")
        
        # Split into train and validation (80% train, 20% val)
        random.shuffle(train_images)
        split_idx = int(0.8 * len(train_images))
        
        # Copy training images
        for img_path in train_images[:split_idx]:
            dest_img = f"{dest_dir}/images/train/{img_path.name}"
            shutil.copy2(img_path, dest_img)
            
            # Create corresponding label
            label_name = img_path.stem + '.txt'
            label_path = f"{dest_dir}/labels/train/{label_name}"
            create_yolo_label(img_path, label_path)
        
        # Copy validation images
        for img_path in train_images[split_idx:]:
            dest_img = f"{dest_dir}/images/val/{img_path.name}"
            shutil.copy2(img_path, dest_img)
            
            # Create corresponding label
            label_name = img_path.stem + '.txt'
            label_path = f"{dest_dir}/labels/val/{label_name}"
            create_yolo_label(img_path, label_path)
    
    # Process TEST directory
    test_source = os.path.join(source_dir, "TEST")
    if os.path.exists(test_source):
        print(f"Processing test images from {test_source}")
        test_images = []
        
        # Collect all images
        for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
            test_images.extend(list(Path(test_source).rglob(f"*{ext}")))
        
        print(f"Found {len(test_images)} test images")
        
        # Copy test images
        for img_path in test_images:
            dest_img = f"{dest_dir}/images/test/{img_path.name}"
            shutil.copy2(img_path, dest_img)
            
            # Create corresponding label
            label_name = img_path.stem + '.txt'
            label_path = f"{dest_dir}/labels/test/{label_name}"
            create_yolo_label(img_path, label_path)
    
    print("\nDataset organization complete!")

def create_data_yaml():
    """Create data.yaml configuration file."""
    yaml_content = f"""path: {os.path.abspath(dest_dir)}
train: images/train
val: images/val
test: images/test

nc: 2
names: ['organic', 'recyclable']
"""
    
    with open(f"{dest_dir}/data.yaml", 'w') as f:
        f.write(yaml_content)
    
    print(f"Created {dest_dir}/data.yaml")

def print_statistics():
    """Print dataset statistics."""
    print("\n=== Dataset Statistics ===")
    
    for split in ['train', 'val', 'test']:
        img_dir = f"{dest_dir}/images/{split}"
        label_dir = f"{dest_dir}/labels/{split}"
        
        num_images = len([f for f in os.listdir(img_dir) if f.endswith(('.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'))])
        num_labels = len([f for f in os.listdir(label_dir) if f.endswith('.txt')])
        
        print(f"{split.capitalize()}:")
        print(f"  Images: {num_images}")
        print(f"  Labels: {num_labels}")
        
        # Count classes
        class_counts = {0: 0, 1: 0}
        for label_file in os.listdir(label_dir):
            if label_file.endswith('.txt'):
                with open(f"{label_dir}/{label_file}", 'r') as f:
                    for line in f:
                        if line.strip():
                            class_id = int(line.split()[0])
                            class_counts[class_id] = class_counts.get(class_id, 0) + 1
        
        print(f"  Class distribution:")
        print(f"    Class 0 (Organic): {class_counts.get(0, 0)}")
        print(f"    Class 1 (Recyclable): {class_counts.get(1, 0)}")

if __name__ == "__main__":
    organize_dataset()
    create_data_yaml()
    print_statistics()
