import os
import requests
import cv2
from PIL import Image
import numpy as np
from bs4 import BeautifulSoup
import time
import random

class WasteDatasetCollector:
    def __init__(self, dataset_path='../../dataset'):
        self.dataset_path = dataset_path
        self.categories = {
            'plastic': ['plastic bottle', 'plastic bag', 'plastic container'],
            'paper': ['paper', 'cardboard', 'newspaper'],
            'glass': ['glass bottle', 'glass jar', 'broken glass'],
            'metal': ['metal can', 'aluminum foil', 'metal scrap'],
            'organic': ['banana peel', 'apple core', 'vegetable waste'],
            'hazardous': ['battery', 'electronic waste', 'chemical container']
        }
        
        # Create directories
        self.create_directories()
    
    def create_directories(self):
        """Create directory structure for dataset"""
        for category in self.categories.keys():
            os.makedirs(os.path.join(self.dataset_path, category), exist_ok=True)
    
    def download_images_from_web(self, category, keywords, num_images=50):
        """
        Download images from web (for educational purposes only)
        Note: Respect copyright and terms of service
        """
        # This is a simplified version. In production, use APIs like Unsplash, Pixabay
        # or manually collect and label images
        
        print(f"Collecting {num_images} images for {category}...")
        
        # Simulate downloading (replace with actual web scraping if needed)
        for i in range(num_images):
            # Create synthetic image for demo
            self.create_synthetic_image(category, i)
            
            if (i + 1) % 10 == 0:
                print(f"  Downloaded {i + 1}/{num_images} images")
        
        print(f"Completed downloading images for {category}")
    
    def create_synthetic_image(self, category, index):
        """Create synthetic training images (for demo when real data is unavailable)"""
        # Create random colored image with text
        height, width = 224, 224
        img = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Set background color based on category
        colors = {
            'plastic': (255, 0, 0),      # Red
            'paper': (0, 255, 0),        # Green
            'glass': (0, 0, 255),        # Blue
            'metal': (255, 255, 0),      # Yellow
            'organic': (165, 42, 42),    # Brown
            'hazardous': (255, 0, 255)   # Magenta
        }
        
        color = colors.get(category, (128, 128, 128))
        
        # Fill with color
        img[:] = color
        
        # Add some random noise to make it look realistic
        noise = np.random.randint(-30, 30, (height, width, 3), dtype=np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        # Add text label
        font = cv2.FONT_HERSHEY_SIMPLEX
        text = category[:3].upper()
        text_size = cv2.getTextSize(text, font, 1, 2)[0]
        text_x = (width - text_size[0]) // 2
        text_y = (height + text_size[1]) // 2
        
        cv2.putText(img, text, (text_x, text_y), font, 1, (255, 255, 255), 2)
        
        # Save image
        save_path = os.path.join(self.dataset_path, category, f"{category}_{index:04d}.jpg")
        cv2.imwrite(save_path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
    
    def augment_existing_images(self):
        """Apply data augmentation to existing images"""
        from tensorflow.keras.preprocessing.image import ImageDataGenerator
        import cv2
        
        datagen = ImageDataGenerator(
            rotation_range=40,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode='nearest'
        )
        
        for category in self.categories.keys():
            category_path = os.path.join(self.dataset_path, category)
            images = [f for f in os.listdir(category_path) if f.endswith(('.jpg', '.png', '.jpeg'))]
            
            for img_name in images:
                img_path = os.path.join(category_path, img_name)
                img = cv2.imread(img_path)
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                img = np.expand_dims(img, axis=0)
                
                # Generate augmented images
                i = 0
                for batch in datagen.flow(img, batch_size=1, save_to_dir=category_path, 
                                         save_prefix=f'aug_{category}', save_format='jpg'):
                    i += 1
                    if i >= 5:  # Generate 5 augmented images per original
                        break
        
        print("Data augmentation completed!")
    
    def create_sample_dataset(self, images_per_category=100):
        """Create a sample dataset for training"""
        print("Creating sample dataset...")
        
        for category in self.categories.keys():
            print(f"\nProcessing {category}...")
            self.download_images_from_web(category, self.categories[category], images_per_category)
        
        # Apply data augmentation
        print("\nApplying data augmentation...")
        self.augment_existing_images()
        
        print(f"\nDataset created at: {self.dataset_path}")
        self.print_dataset_stats()
    
    def print_dataset_stats(self):
        """Print statistics about the dataset"""
        print("\nDataset Statistics:")
        print("=" * 40)
        
        total_images = 0
        for category in self.categories.keys():
            category_path = os.path.join(self.dataset_path, category)
            num_images = len([f for f in os.listdir(category_path) if f.endswith(('.jpg', '.png', '.jpeg'))])
            print(f"{category:15s}: {num_images:4d} images")
            total_images += num_images
        
        print("=" * 40)
        print(f"Total images: {total_images}")

if __name__ == "__main__":
    # Initialize collector
    collector = WasteDatasetCollector()
    
    # Create sample dataset
    collector.create_sample_dataset(images_per_category=50)