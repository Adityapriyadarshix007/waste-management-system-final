import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Model paths
    MODEL_PATH = 'model/waste_model_final.h5'
    CLASS_INDICES_PATH = 'model/class_indices.json'
    
    # Waste categories configuration
    WASTE_CATEGORIES = {
        'biodegradable': {
            'color': '#4CAF50',
            'dustbin_color': 'Green',
            'description': 'Organic waste that can decompose naturally',
            'examples': ['food scraps', 'vegetables', 'fruits', 'paper']
        },
        'recyclable': {
            'color': '#2196F3',
            'dustbin_color': 'Blue',
            'description': 'Materials that can be processed into new products',
            'examples': ['plastic bottles', 'glass', 'metal cans', 'cardboard']
        },
        'hazardous': {
            'color': '#F44336',
            'dustbin_color': 'Red',
            'description': 'Dangerous materials requiring special handling',
            'examples': ['batteries', 'chemicals', 'electronics', 'medicines']
        },
        'non-recyclable': {
            'color': '#9E9E9E',
            'dustbin_color': 'Black',
            'description': 'Waste that cannot be recycled or composted',
            'examples': ['plastic bags', 'styrofoam', 'ceramics', 'composite materials']
        }
    }
    