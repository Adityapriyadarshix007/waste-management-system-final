import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2, EfficientNetB0
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import matplotlib.pyplot as plt
import cv2
from sklearn.model_selection import train_test_split
import json

# Set random seed for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

class WasteClassifier:
    def __init__(self, img_size=224, num_classes=6, batch_size=32):
        self.img_size = img_size
        self.num_classes = num_classes
        self.batch_size = batch_size
        self.model = None
        self.class_indices = None
        self.history = None
        
    def create_model(self, use_pretrained=True):
        """
        Create CNN model for waste classification
        """
        if use_pretrained:
            # Use transfer learning with EfficientNet
            base_model = EfficientNetB0(
                weights='imagenet',
                include_top=False,
                input_shape=(self.img_size, self.img_size, 3)
            )
            base_model.trainable = True
            
            # Fine-tune last 20 layers
            for layer in base_model.layers[:-20]:
                layer.trainable = False
            
            inputs = keras.Input(shape=(self.img_size, self.img_size, 3))
            x = base_model(inputs, training=False)
            x = layers.GlobalAveragePooling2D()(x)
            x = layers.Dense(256, activation='relu')(x)
            x = layers.Dropout(0.5)(x)
            x = layers.Dense(128, activation='relu')(x)
            x = layers.Dropout(0.3)(x)
            outputs = layers.Dense(self.num_classes, activation='softmax')(x)
            
            self.model = keras.Model(inputs, outputs)
            
        else:
            # Create custom CNN from scratch
            self.model = models.Sequential([
                # First Conv Block
                layers.Conv2D(32, (3, 3), activation='relu', input_shape=(self.img_size, self.img_size, 3)),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                # Second Conv Block
                layers.Conv2D(64, (3, 3), activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                # Third Conv Block
                layers.Conv2D(128, (3, 3), activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                # Fourth Conv Block
                layers.Conv2D(256, (3, 3), activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                # Flatten and Dense layers
                layers.Flatten(),
                layers.Dense(512, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.5),
                
                layers.Dense(256, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.3),
                
                layers.Dense(self.num_classes, activation='softmax')
            ])
        
        # Compile the model
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy', 
                    keras.metrics.Precision(name='precision'),
                    keras.metrics.Recall(name='recall'),
                    keras.metrics.AUC(name='auc')]
        )
        
        print(f"Model created with {self.model.count_params():,} parameters")
        return self.model
    
    def prepare_data_generators(self, data_dir):
        """
        Prepare data generators for training and validation
        """
        # Data augmentation for training
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=30,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            vertical_flip=True,
            fill_mode='nearest',
            validation_split=0.2  # 20% for validation
        )
        
        # Validation data (only rescaling)
        val_datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)
        
        # Training generator
        train_generator = train_datagen.flow_from_directory(
            data_dir,
            target_size=(self.img_size, self.img_size),
            batch_size=self.batch_size,
            class_mode='categorical',
            subset='training',
            shuffle=True
        )
        
        # Validation generator
        val_generator = val_datagen.flow_from_directory(
            data_dir,
            target_size=(self.img_size, self.img_size),
            batch_size=self.batch_size,
            class_mode='categorical',
            subset='validation',
            shuffle=False
        )
        
        # Save class indices
        self.class_indices = train_generator.class_indices
        print(f"Classes found: {self.class_indices}")
        
        return train_generator, val_generator
    
    def train(self, train_generator, val_generator, epochs=50):
        """
        Train the model
        """
        # Callbacks
        callbacks = [
            ModelCheckpoint(
                '../waste_model_best.h5',
                monitor='val_accuracy',
                save_best_only=True,
                mode='max',
                verbose=1
            ),
            EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7,
                verbose=1
            )
        ]
        
        # Train the model
        self.history = self.model.fit(
            train_generator,
            steps_per_epoch=train_generator.samples // self.batch_size,
            validation_data=val_generator,
            validation_steps=val_generator.samples // self.batch_size,
            epochs=epochs,
            callbacks=callbacks,
            verbose=1
        )
        
        # Save final model
        self.model.save('../waste_model_final.h5')
        print("Model saved as waste_model_final.h5")
        
        return self.history
    
    def plot_training_history(self):
        """
        Plot training history
        """
        if self.history is None:
            print("No training history available")
            return
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # Accuracy
        axes[0, 0].plot(self.history.history['accuracy'], label='Training Accuracy')
        axes[0, 0].plot(self.history.history['val_accuracy'], label='Validation Accuracy')
        axes[0, 0].set_title('Model Accuracy')
        axes[0, 0].set_xlabel('Epoch')
        axes[0, 0].set_ylabel('Accuracy')
        axes[0, 0].legend()
        axes[0, 0].grid(True)
        
        # Loss
        axes[0, 1].plot(self.history.history['loss'], label='Training Loss')
        axes[0, 1].plot(self.history.history['val_loss'], label='Validation Loss')
        axes[0, 1].set_title('Model Loss')
        axes[0, 1].set_xlabel('Epoch')
        axes[0, 1].set_ylabel('Loss')
        axes[0, 1].legend()
        axes[0, 1].grid(True)
        
        # Precision
        axes[1, 0].plot(self.history.history['precision'], label='Training Precision')
        axes[1, 0].plot(self.history.history['val_precision'], label='Validation Precision')
        axes[1, 0].set_title('Model Precision')
        axes[1, 0].set_xlabel('Epoch')
        axes[1, 0].set_ylabel('Precision')
        axes[1, 0].legend()
        axes[1, 0].grid(True)
        
        # AUC
        axes[1, 1].plot(self.history.history['auc'], label='Training AUC')
        axes[1, 1].plot(self.history.history['val_auc'], label='Validation AUC')
        axes[1, 1].set_title('Model AUC')
        axes[1, 1].set_xlabel('Epoch')
        axes[1, 1].set_ylabel('AUC')
        axes[1, 1].legend()
        axes[1, 1].grid(True)
        
        plt.tight_layout()
        plt.savefig('../training_history.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def save_class_indices(self):
        """
        Save class indices to JSON file
        """
        if self.class_indices:
            # Reverse the dictionary for easy lookup
            indices_to_class = {v: k for k, v in self.class_indices.items()}
            
            with open('../class_indices.json', 'w') as f:
                json.dump(indices_to_class, f, indent=4)
            print("Class indices saved to class_indices.json")

def main():
    # Initialize classifier
    classifier = WasteClassifier(img_size=224, num_classes=6, batch_size=32)
    
    # Create model
    print("Creating model...")
    model = classifier.create_model(use_pretrained=True)
    model.summary()
    
    # Prepare data (assumes data is in 'dataset' directory)
    print("\nPreparing data generators...")
    data_dir = '../../dataset'  # Change this to your dataset path
    
    if not os.path.exists(data_dir):
        print(f"Warning: Dataset directory '{data_dir}' not found!")
        print("Creating sample directory structure...")
        os.makedirs(data_dir, exist_ok=True)
        for category in ['plastic', 'paper', 'glass', 'metal', 'organic', 'hazardous']:
            os.makedirs(os.path.join(data_dir, category), exist_ok=True)
        print("Please add your waste images to the dataset directory.")
        print("Expected structure:")
        print(f"{data_dir}/")
        print("├── plastic/")
        print("├── paper/")
        print("├── glass/")
        print("├── metal/")
        print("├── organic/")
        print("└── hazardous/")
        return
    
    train_gen, val_gen = classifier.prepare_data_generators(data_dir)
    
    # Train the model
    print("\nTraining model...")
    history = classifier.train(train_gen, val_gen, epochs=50)
    
    # Plot training history
    classifier.plot_training_history()
    
    # Save class indices
    classifier.save_class_indices()
    
    print("\nTraining completed successfully!")

if __name__ == "__main__":
    main()