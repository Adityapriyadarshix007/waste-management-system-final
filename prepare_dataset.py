# prepare_dataset.py - Organize your dataset for YOLO training
import os
import shutil
from pathlib import Path
import random
import yaml

class DatasetOrganizer:
    def __init__(self, dataset_root):
        self.dataset_root = Path(dataset_root)
        self.images_root = self.dataset_root / "images"
        self.labels_root = self.dataset_root / "labels"
        
    def create_yolo_structure(self):
        """Create standard YOLO directory structure"""
        directories = [
            self.images_root / "train",
            self.images_root / "val",
            self.labels_root / "train", 
            self.labels_root / "val"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"Created: {directory}")
            
    def verify_files(self):
        """Check if image and label files exist"""
        # Get all image extensions
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        
        # Find all files
        all_files = list(self.dataset_root.rglob("*"))
        
        images = []
        labels = []
        
        for file_path in all_files:
            if file_path.suffix.lower() in image_extensions:
                images.append(file_path)
            elif file_path.suffix.lower() == '.txt':
                labels.append(file_path)
                
        print(f"Found {len(images)} image files")
        print(f"Found {len(labels)} label files")
        
        return images, labels
        
    def split_dataset(self, images, labels, train_ratio=0.8):
        """Split dataset into train and validation sets"""
        # Pair images with their labels
        pairs = []
        
        for image_path in images:
            label_path = image_path.with_suffix('.txt')
            if label_path.exists():
                pairs.append((image_path, label_path))
        
        print(f"Found {len(pairs)} valid image-label pairs")
        
        # Shuffle and split
        random.shuffle(pairs)
        split_idx = int(len(pairs) * train_ratio)
        train_pairs = pairs[:split_idx]
        val_pairs = pairs[split_idx:]
        
        # Move files to appropriate directories
        self._move_files(train_pairs, "train")
        self._move_files(val_pairs, "val")
        
        return len(train_pairs), len(val_pairs)
    
    def _move_files(self, pairs, split_type):
        """Move files to train/val directories"""
        for img_path, label_path in pairs:
            # Move image
            new_img_path = self.images_root / split_type / img_path.name
            shutil.copy2(img_path, new_img_path)
            
            # Move label
            new_label_path = self.labels_root / split_type / label_path.name
            shutil.copy2(label_path, new_label_path)
            
    def create_yaml_config(self, num_classes, class_names, output_path="waste_data.yaml"):
        """Create YAML configuration file"""
        config = {
            'path': str(self.dataset_root.absolute()),
            'train': 'images/train',
            'val': 'images/val',
            'nc': num_classes,
            'names': class_names
        }
        
        with open(output_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
            
        print(f"Created YAML config: {output_path}")
        return output_path

if __name__ == "__main__":
    # Configuration
    DATASET_PATH = "/Users/adityapriyadarshi/Desktop/waste-management-system/DATASET"
    NUM_CLASSES = 2  # Change based on your dataset
    CLASS_NAMES = {
        0: "biodegradable",
        1: "recyclable",
        # 2: "hazardous",
        # 3: "other"
    }
    
    # Initialize organizer
    organizer = DatasetOrganizer(DATASET_PATH)
    
    print("Step 1: Creating directory structure...")
    organizer.create_yolo_structure()
    
    print("\nStep 2: Finding image and label files...")
    images, labels = organizer.verify_files()
    
    if len(images) == 0:
        print("ERROR: No image files found!")
        print("Please ensure your dataset contains image files (.jpg, .png, etc.)")
        exit(1)
        
    print("\nStep 3: Splitting dataset...")
    train_count, val_count = organizer.split_dataset(images, labels)
    print(f"Training samples: {train_count}")
    print(f"Validation samples: {val_count}")
    
    print("\nStep 4: Creating YAML configuration...")
    yaml_path = organizer.create_yaml_config(NUM_CLASSES, CLASS_NAMES)
    
    print("\n✅ Dataset preparation complete!")
    print(f"Dataset structure ready at: {DATASET_PATH}")
    print(f"YAML config created: {yaml_path}")