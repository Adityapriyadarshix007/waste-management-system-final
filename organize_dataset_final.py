#!/usr/bin/env python3
import os
import shutil
import random
from pathlib import Path

# Configuration
source_train_o = "DATASET/TRAIN/O"
source_train_r = "DATASET/TRAIN/R"
source_test_o = "DATASET/TEST/O"
source_test_r = "DATASET/TEST/R"
dest_dir = "yolo_dataset_final"

# Class mappings
class_mapping = {
    'O': 0,  # Organic waste
    'R': 1   # Recyclable waste
}

def collect_images(source_dir, class_id):
    """Collect all images from a directory."""
    images = []
    for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
        images.extend(list(Path(source_dir).rglob(f"*{ext}")))
    
    print(f"Found {len(images)} images in {source_dir} (class {class_id})")
    return images

def create_yolo_label(image_path, class_id, label_path):
    """Create a YOLO format label file."""
    # For now, create dummy bounding boxes (center of image, 30% width/height)
    # You should replace these with actual annotations if you have them
    with open(label_path, 'w') as f:
        f.write(f"{class_id} 0.5 0.5 0.3 0.3\n")

def organize_dataset():
    """Organize the dataset into YOLO format."""
    print("Organizing dataset...")
    
    # Collect all training images
    train_o_images = collect_images(source_train_o, class_mapping['O'])
    train_r_images = collect_images(source_train_r, class_mapping['R'])
    
    # Combine and shuffle
    all_train_images = []
    for img in train_o_images:
        all_train_images.append((img, class_mapping['O']))
    for img in train_r_images:
        all_train_images.append((img, class_mapping['R']))
    
    random.shuffle(all_train_images)
    
    # Split into train and validation (80% train, 20% val)
    split_idx = int(0.8 * len(all_train_images))
    train_set = all_train_images[:split_idx]
    val_set = all_train_images[split_idx:]
    
    print(f"\nSplitting training data:")
    print(f"  Training: {len(train_set)} images")
    print(f"  Validation: {len(val_set)} images")
    
    # Process training set
    print("\nProcessing training set...")
    for idx, (img_path, class_id) in enumerate(train_set):
        # Copy image
        dest_img = f"{dest_dir}/images/train/{img_path.name}"
        shutil.copy2(img_path, dest_img)
        
        # Create label
        label_name = img_path.stem + '.txt'
        label_path = f"{dest_dir}/labels/train/{label_name}"
        create_yolo_label(img_path, class_id, label_path)
        
        if (idx + 1) % 1000 == 0:
            print(f"  Processed {idx + 1} training images...")
    
    # Process validation set
    print("\nProcessing validation set...")
    for idx, (img_path, class_id) in enumerate(val_set):
        # Copy image
        dest_img = f"{dest_dir}/images/val/{img_path.name}"
        shutil.copy2(img_path, dest_img)
        
        # Create label
        label_name = img_path.stem + '.txt'
        label_path = f"{dest_dir}/labels/val/{label_name}"
        create_yolo_label(img_path, class_id, label_path)
        
        if (idx + 1) % 1000 == 0:
            print(f"  Processed {idx + 1} validation images...")
    
    # Process test set
    print("\nProcessing test set...")
    test_o_images = collect_images(source_test_o, class_mapping['O'])
    test_r_images = collect_images(source_test_r, class_mapping['R'])
    
    all_test_images = []
    for img in test_o_images:
        all_test_images.append((img, class_mapping['O']))
    for img in test_r_images:
        all_test_images.append((img, class_mapping['R']))
    
    print(f"Total test images: {len(all_test_images)}")
    
    for idx, (img_path, class_id) in enumerate(all_test_images):
        # Copy image
        dest_img = f"{dest_dir}/images/test/{img_path.name}"
        shutil.copy2(img_path, dest_img)
        
        # Create label
        label_name = img_path.stem + '.txt'
        label_path = f"{dest_dir}/labels/test/{label_name}"
        create_yolo_label(img_path, class_id, label_path)
        
        if (idx + 1) % 1000 == 0:
            print(f"  Processed {idx + 1} test images...")
    
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
    
    # Check if we have any real annotation files
    print("\n=== Checking for real annotations ===")
    print("Note: Current labels are dummy labels (center of image).")
    print("If you have real annotations, you need to replace these label files.")
    
    # Look for annotation files in the dataset
    annotation_files = list(Path("DATASET").rglob("*.txt")) + list(Path("DATASET").rglob("*.xml")) + list(Path("DATASET").rglob("*.json"))
    
    if annotation_files:
        print(f"\nFound {len(annotation_files)} potential annotation files:")
        for file in annotation_files[:10]:  # Show first 10
            print(f"  - {file}")
        print("\nYou should convert these to YOLO format and replace the dummy labels.")
    else:
        print("\nNo annotation files found. You need to:")
        print("1. Manually annotate images using tools like LabelImg")
        print("2. Or use the dummy labels for basic testing (not effective training)")
