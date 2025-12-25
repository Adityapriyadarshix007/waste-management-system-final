from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import os
import time
import numpy as np
from PIL import Image
import io
import base64
import traceback
import cv2
import sys
from pathlib import Path
import hashlib
import random

# Add this with your other imports at the top
try:
    from huggingface_hub import hf_hub_download
    HF_HUB_AVAILABLE = True
except ImportError:
    HF_HUB_AVAILABLE = False
    print("⚠️  huggingface-hub not installed. Install with: pip install huggingface-hub")

print("\n" + "="*70)
print("🚀 STARTING WASTE DETECTION API (Lazy Loading)")
print("="*70)

# ==================== ENVIRONMENT INFO ====================
print(f"🐍 Python {sys.version}")
print(f"🖥️  Platform: {sys.platform}")
print(f"📁 Working Directory: {os.getcwd()}")

# ==================== HUGGING FACE MODEL LOADING ====================
# PRIORITY ORDER: yolov8m.pt FIRST, then custom model
HUGGING_FACE_MODELS = [
    {
        "name": "yolov8m.pt",
        "path": "Ultralytics/yolov8m.pt",
        "type": "official",
        "description": "Official YOLOv8 medium model (80+ COCO classes)"
    },
    {
        "name": "best.pt", 
        "path": "Eeeesha/waste-detector-model/best.pt",
        "type": "custom",
        "description": "Custom waste detection model (2 classes)"
    }
]

print(f"\n🔍 Model Loading Priority:")
for i, model in enumerate(HUGGING_FACE_MODELS):
    print(f"   {i+1}. {model['name']} ({model['type'].upper()})")
    print(f"      {model['description']}")

# Initialize as None - will be loaded lazily
yolo_model = None
MODEL_PATH = None
model_loaded = False
model_hash = None

# ==================== FLASK APP WITH BULLETPROOF CORS ====================
# ==================== LOCAL DEVELOPMENT CORS CONFIGURATION ====================
# ==================== UNIVERSAL CORS CONFIGURATION ====================
app = Flask(__name__)

# Detect if we're in production (Railway) or development
IS_PRODUCTION = os.environ.get('RAILWAY_ENVIRONMENT') == 'production' or os.environ.get('FLASK_ENV') == 'production'

if IS_PRODUCTION:
    print("🚀 PRODUCTION MODE: Allowing all origins for Railway")
    # In production, allow ALL origins
    CORS(app, origins="*")
else:
    print("💻 DEVELOPMENT MODE: Allowing localhost origins")
    # In development, allow localhost + Vercel
    ALLOWED_ORIGINS = [
        "http://localhost:*",  # All localhost ports
        "http://127.0.0.1:*",  # All 127.0.0.1 ports
        "https://waste-management-system-frontend.vercel.app",
        "https://*.vercel.app",
    ]
    CORS(app, origins=ALLOWED_ORIGINS)

# Force CORS headers on ALL responses (universal)
@app.after_request
def add_cors_headers(response):
    """Force CORS headers for all environments"""
    # In production, allow everything
    if IS_PRODUCTION:
        response.headers['Access-Control-Allow-Origin'] = '*'
    else:
        # In development, check origin
        origin = request.headers.get('Origin', '')
        if origin and ('localhost' in origin or '127.0.0.1' in origin or 'vercel.app' in origin):
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'
    
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Max-Age'] = '86400'
    
    return response

# Handle OPTIONS requests for all routes
@app.before_request
def handle_options():
    """Handle preflight OPTIONS requests"""
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        
        if IS_PRODUCTION:
            response.headers['Access-Control-Allow-Origin'] = '*'
        else:
            origin = request.headers.get('Origin', '')
            if origin and ('localhost' in origin or '127.0.0.1' in origin or 'vercel.app' in origin):
                response.headers['Access-Control-Allow-Origin'] = origin
            else:
                response.headers['Access-Control-Allow-Origin'] = '*'
        
        response.headers['Access-Control-Allow-Headers'] = '*'
        response.headers['Access-Control-Allow-Methods'] = '*'
        return response
# ==================== HUGGING FACE LOADING FUNCTION ====================
def load_model_from_huggingface():
    """Load YOLO model from Hugging Face Hub with fallbacks"""
    global yolo_model, MODEL_PATH, model_loaded, model_hash
    
    try:
        from ultralytics import YOLO, __version__ as ultralytics_version
        print(f"✅ ultralytics v{ultralytics_version} imported successfully")
        
        # Try loading models in priority order
        for model_info in HUGGING_FACE_MODELS:
            try:
                model_path = model_info['path']
                print(f"\n🔄 Attempting to load: {model_path}")
                
                # Handle yolov8m.pt with direct URL
                if model_info['name'] == "yolov8m.pt":
                    print(f"📥 Loading YOLOv8m with 80+ COCO classes...")
                    # Use direct GitHub URL for reliability
                    yolo_model = YOLO("https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8m.pt")
                    MODEL_PATH = "Ultralytics/yolov8m.pt"
                    model_source = "huggingface_official"
                    
                # Handle custom model from Hugging Face
                elif model_info['name'] == "best.pt":
                    print(f"📥 Loading custom waste detection model...")
                    
                    # Parse repo_id and filename
                    if "/best.pt" in model_path:
                        repo_id = model_path.replace("/best.pt", "")
                        filename = "best.pt"
                    else:
                        parts = model_path.split("/")
                        if len(parts) >= 2:
                            repo_id = "/".join(parts[:-1])
                            filename = parts[-1]
                        else:
                            raise ValueError(f"Invalid Hugging Face path: {model_path}")
                    
                    print(f"   Repository: {repo_id}")
                    
                    # Download from Hugging Face
                    try:
                        local_model_path = hf_hub_download(
                            repo_id=repo_id,
                            filename=filename,
                            cache_dir="./hf_cache",
                            force_download=False
                        )
                        
                        print(f"✅ Model downloaded to: {local_model_path}")
                        yolo_model = YOLO(local_model_path)
                        MODEL_PATH = local_model_path
                        model_source = "huggingface_custom"
                        
                    except Exception as download_error:
                        print(f"❌ Download failed: {str(download_error)[:100]}")
                        continue
                
                else:
                    # For any other model format
                    yolo_model = YOLO(model_path)
                    MODEL_PATH = model_path
                    model_source = "direct"
                
                model_loaded = True
                model_hash = hashlib.md5(str(MODEL_PATH).encode()).hexdigest()[:8]
                
                # Display model info
                print(f"✅ {model_info['name']} loaded successfully!")
                print(f"📋 Model classes: {yolo_model.names}")
                print(f"🎯 Total classes: {len(yolo_model.names)}")
                print(f"📦 Source: {model_source}")
                print(f"🔢 Hash: {model_hash}")
                
                # Quick validation
                print("🧪 Running model validation...")
                test_img = np.zeros((100, 100, 3), dtype=np.uint8)
                test_results = yolo_model(test_img, conf=0.1, verbose=False)
                print("✅ Model validation passed")
                
                return True
                
            except Exception as e:
                print(f"⚠️  Failed to load {model_info['name']}: {str(e)[:150]}")
                if model_info['name'] == "yolov8m.pt":
                    print("   Trying next model (custom best.pt)...")
                continue
        
        # If Hugging Face loading fails, try local fallback
        print("\n🔄 Hugging Face loading failed, trying local models...")
        
        # LOCAL MODEL SEARCH CODE
        LOCAL_MODEL_PATHS = [
            Path("high_accuracy_training/waste_detector_pro/weights/best.pt"),
            Path("../runs/detect/train5/weights/best.pt"),
            Path("runs/detect/train/weights/best.pt"),
            Path("best.pt"),
            Path("yolov8m.pt"),
        ]
        
        ALTERNATIVE_NAMES = ["best.pt", "last.pt", "yolov8n.pt", "yolov8s.pt", "yolov8m.pt", "yolov8l.pt"]
        
        def find_available_models():
            """Search for all available model files"""
            found_models = []
            
            for path in LOCAL_MODEL_PATHS:
                if path.exists():
                    size_mb = path.stat().st_size / 1024 / 1024
                    found_models.append({
                        'path': path,
                        'priority': 'PRIMARY',
                        'size_mb': size_mb
                    })
            
            search_dirs = [
                Path("."),
                Path("high_accuracy_training"),
                Path("runs/detect"),
                Path("../runs/detect"),
                Path("models"),
                Path("../models"),
            ]
            
            for dir_path in search_dirs:
                if dir_path.exists():
                    for alt_name in ALTERNATIVE_NAMES:
                        try:
                            for pt_file in dir_path.rglob(f"*{alt_name}"):
                                if any(str(pt_file) == str(m['path']) for m in found_models):
                                    continue
                                size_mb = pt_file.stat().st_size / 1024 / 1024
                                found_models.append({
                                    'path': pt_file,
                                    'priority': 'SEARCHED',
                                    'size_mb': size_mb
                                })
                        except Exception:
                            continue
            
            return found_models
        
        def calculate_model_hash(model_path):
            """Calculate hash of model file for caching"""
            try:
                with open(model_path, 'rb') as f:
                    file_hash = hashlib.md5()
                    chunk = f.read(8192)
                    while chunk:
                        file_hash.update(chunk)
                        chunk = f.read(8192)
                    return file_hash.hexdigest()[:8]
            except:
                return "unknown"
        
        # Try loading local models
        print("\n📂 Searching for local model files...")
        available_models = find_available_models()
        
        if available_models:
            print(f"\n📊 Found {len(available_models)} local model(s):")
            for i, model_info in enumerate(available_models):
                print(f"   {i+1}. {model_info['path']} ({model_info['size_mb']:.1f} MB)")
            
            for model_info in sorted(available_models, key=lambda x: -x['size_mb']):
                try:
                    model_path = model_info['path']
                    print(f"\n🔄 Attempting to load local: {model_path}")
                    
                    yolo_model = YOLO(str(model_path))
                    MODEL_PATH = str(model_path)
                    model_loaded = True
                    model_hash = calculate_model_hash(model_path)
                    
                    print(f"✅ Local model loaded successfully!")
                    print(f"📋 Model classes: {yolo_model.names}")
                    print(f"📦 File size: {model_info['size_mb']:.1f} MB")
                    
                    # Quick validation
                    test_img = np.zeros((100, 100, 3), dtype=np.uint8)
                    test_results = yolo_model(test_img, conf=0.1, verbose=False)
                    print("✅ Model validation passed")
                    
                    return True
                    
                except Exception as e:
                    print(f"⚠️  Failed to load local {model_path}: {str(e)[:100]}")
                    continue
        
        # Final fallback - auto-download base model
        if not model_loaded:
            print("\n🔄 No models available, attempting to auto-download base model...")
            try:
                yolo_model = YOLO('yolov8m.pt')
                MODEL_PATH = "yolov8m.pt (auto-downloaded)"
                model_loaded = True
                model_hash = "auto-downloaded"
                print("✅ Base YOLOv8m model loaded (auto-downloaded)")
                print("💡 This model has 80+ COCO classes for object detection")
                return True
            except Exception as e:
                print(f"❌ Cannot load base model: {e}")
                return False
                
    except ImportError as e:
        print(f"\n❌ CANNOT IMPORT ULTRALYTICS: {e}")
        print("\n💡 Install with: pip install ultralytics huggingface-hub")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        traceback.print_exc()
        return False

# ==================== LAZY MODEL LOADER ====================
def load_model_lazy():
    """Load model only when needed (not at startup)"""
    global yolo_model, MODEL_PATH, model_loaded, model_hash
    
    if yolo_model is None:
        print("\n" + "="*70)
        print("🌐 LAZY LOADING MODEL (First Request)")
        print("="*70)
        
        model_loaded = load_model_from_huggingface()
        
        if model_loaded:
            print(f"🚀 MODEL READY: {MODEL_PATH} ({model_hash})")
        else:
            print("⚠️  NO MODEL LOADED - Limited functionality")
        print("="*70 + "\n")
    
    return model_loaded

# ==================== WASTE CONFIGURATION ====================
CLASS_CONFIG = {
    "biodegradable": {
        "name": "Biodegradable",
        "dustbinColor": "Green",
        "dustbinName": "Green Bin (Compost)",
        "icon": "🍃",
        "color": "#10b981",
        "disposal_instructions": [
            "Place in GREEN compost bin",
            "Can be composted at home or facility",
            "Breaks down naturally in 2-6 weeks",
            "Do not mix with recyclables or hazardous waste"
        ],
        "examples": ["Food waste", "Vegetable scraps", "Fruit peels", "Coffee grounds", "All fruits & vegetables"]
    },
    "recyclable": {
        "name": "Recyclable", 
        "dustbinColor": "Blue",
        "dustbinName": "Blue Bin (Recycling)",
        "icon": "♻️",
        "color": "#3b82f6",
        "disposal_instructions": [
            "Place in BLUE recycling bin",
            "Rinse if dirty, remove caps/lids",
            "Flatten to save space",
            "Check local recycling rules"
        ],
        "examples": ["Plastic bottles", "Aluminum cans", "Glass jars", "Cardboard"]
    },
    "hazardous": {
        "name": "Hazardous",
        "dustbinColor": "Red",
        "dustbinName": "Red Bin (Hazardous)",
        "icon": "⚠️",
        "color": "#ef4444",
        "disposal_instructions": [
            "Place in RED hazardous waste bin",
            "DO NOT mix with regular waste",
            "Handle with care - wear gloves if needed",
            "Take to special collection points"
        ],
        "examples": ["Batteries", "Electronics", "Medicines", "Paint cans"]
    },
    "non_recyclable": {
        "name": "Non-Recyclable",
        "dustbinColor": "Black",
        "dustbinName": "Black Bin (General Waste)",
        "icon": "🗑️",
        "color": "#374151",
        "disposal_instructions": [
            "Place in BLACK general waste bin",
            "For landfill disposal only",
            "Minimize usage when possible",
            "Ensure waste is properly bagged"
        ],
        "examples": ["Plastic bags", "Ceramics", "Styrofoam", "Sanitary products"]
    }
}

WASTE_BINS = {
    "biodegradable": {
        "name": "Green Bin",
        "color": "#10b981",
        "icon": "🍃",
        "description": "For compostable organic waste",
        "acceptable_items": [
            "Food scraps",
            "Vegetable peels", 
            "Fruit waste",
            "Banana peels",
            "Apple cores",
            "Orange peels",
            "Bread",
            "Coffee grounds",
            "Egg shells",
            "Tea bags",
            "Garden waste",
            "Leaves",
            "Grass clippings"
        ],
        "not_acceptable": [
            "Plastic bags",
            "Metal",
            "Glass",
            "Hazardous materials"
        ]
    },
    "recyclable": {
        "name": "Blue Bin",
        "color": "#3b82f6",
        "icon": "♻️",
        "description": "For recyclable materials",
        "acceptable_items": [
            "Plastic bottles",
            "Aluminum cans",
            "Glass bottles",
            "Cardboard boxes",
            "Newspapers",
            "Clean paper"
        ],
        "not_acceptable": [
            "Food-contaminated items",
            "Plastic bags",
            "Styrofoam",
            "Broken glass"
        ]
    },
    "hazardous": {
        "name": "Red Bin",
        "color": "#ef4444",
        "icon": "⚠️",
        "description": "For hazardous and special waste",
        "acceptable_items": [
            "Batteries",
            "Electronics",
            "Medications",
            "Paint and solvents",
            "Chemicals"
        ],
        "not_acceptable": [
            "Regular household waste",
            "Food waste",
            "Recyclables",
            "Biodegradable items"
        ]
    },
    "non_recyclable": {
        "name": "Black Bin",
        "color": "#374151",
        "icon": "🗑️",
        "description": "For non-recyclable general waste",
        "acceptable_items": [
            "Plastic bags",
            "Ceramics",
            "Styrofoam",
            "Sanitary products",
            "Broken glassware"
        ],
        "not_acceptable": [
            "Hazardous waste",
            "Recyclables",
            "Biodegradable waste",
            "Large electronics"
        ]
    }
}

WASTE_GUIDE = {
    "summary": "Understanding proper waste disposal categories",
    "bins": [
        {
            "name": "Green Bin",
            "color": "Green",
            "icon": "🍃",
            "category": "Biodegradable Waste",
            "description": "Food scraps, paper, garden waste, wood, leaves, organic materials",
            "tips": ["Compost within 2-6 weeks", "Suitable for organic recycling", "All fruits & vegetables go here"]
        },
        {
            "name": "Blue Bin",
            "color": "Blue",
            "icon": "♻️",
            "category": "Recyclable Waste",
            "description": "Plastic bottles, glass, metal cans, cardboard, paper, aluminum",
            "tips": ["Can be processed & reused", "Clean and dry before disposal"]
        },
        {
            "name": "Red Bin",
            "color": "Red",
            "icon": "⚠️",
            "category": "Hazardous Waste",
            "description": "Batteries, chemicals, electronics, medicines, paint, solvents",
            "tips": ["Special disposal required", "Do not mix with regular waste"]
        },
        {
            "name": "Black Bin",
            "color": "Black",
            "icon": "🗑️",
            "category": "Non-Recyclable",
            "description": "Plastic bags, ceramics, composite materials, styrofoam, sanitary",
            "tips": ["Landfill disposal only", "Minimize usage"]
        }
    ]
}

# Ensure upload directory exists
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==================== ENHANCED CATEGORY MAPPING ====================
BIODEGRADABLE_KEYWORDS = {
    'apple': 'Apple', 'banana': 'Banana', 'orange': 'Orange', 'pear': 'Pear',
    'peach': 'Peach', 'grape': 'Grape', 'berry': 'Berry', 'strawberry': 'Strawberry',
    'blueberry': 'Blueberry', 'watermelon': 'Watermelon', 'melon': 'Melon',
    'pineapple': 'Pineapple', 'mango': 'Mango', 'kiwi': 'Kiwi', 'lemon': 'Lemon',
    'lime': 'Lime', 'coconut': 'Coconut', 'avocado': 'Avocado', 'papaya': 'Papaya',
    'guava': 'Guava', 'plum': 'Plum', 'cherry': 'Cherry', 'apricot': 'Apricot',
    'fig': 'Fig', 'date': 'Date', 'pomegranate': 'Pomegranate', 'broccoli': 'Broccoli',
    'carrot': 'Carrot', 'potato': 'Potato', 'tomato': 'Tomato', 'onion': 'Onion',
    'garlic': 'Garlic', 'cucumber': 'Cucumber', 'lettuce': 'Lettuce', 'spinach': 'Spinach',
    'cabbage': 'Cabbage', 'cauliflower': 'Cauliflower', 'pepper': 'Pepper',
    'capsicum': 'Capsicum', 'corn': 'Corn', 'pea': 'Pea', 'bean': 'Bean',
    'celery': 'Celery', 'radish': 'Radish', 'turnip': 'Turnip', 'beet': 'Beet',
    'eggplant': 'Eggplant', 'zucchini': 'Zucchini', 'pumpkin': 'Pumpkin', 'squash': 'Squash',
    'food': 'Food Waste', 'fruit': 'Fruit', 'vegetable': 'Vegetable', 'organic': 'Organic Waste',
    'compost': 'Compost', 'leaf': 'Leaves', 'grass': 'Grass', 'wood': 'Wood',
    'paper': 'Paper', 'bread': 'Bread', 'cake': 'Cake', 'pizza': 'Pizza',
    'meat': 'Meat', 'fish': 'Fish', 'rice': 'Rice', 'pasta': 'Pasta',
    'egg': 'Egg', 'coffee': 'Coffee', 'tea': 'Tea', 'plant': 'Plant',
    'flower': 'Flower', 'seed': 'Seed', 'nut': 'Nut',
}

RECYCLABLE_KEYWORDS = {
    'plastic': 'Plastic', 'bottle': 'Bottle', 'can': 'Can', 'glass': 'Glass',
    'jar': 'Jar', 'cardboard': 'Cardboard', 'box': 'Box', 'paper': 'Paper',
    'newspaper': 'Newspaper', 'magazine': 'Magazine', 'aluminum': 'Aluminum',
    'metal': 'Metal', 'container': 'Container', 'tin': 'Tin', 'envelope': 'Envelope',
    'cup': 'Cup',
}

HAZARDOUS_KEYWORDS = {
    'battery': 'Battery', 'electronic': 'Electronic', 'phone': 'Phone',
    'laptop': 'Laptop', 'medicine': 'Medicine', 'chemical': 'Chemical',
    'paint': 'Paint', 'oil': 'Oil', 'toxic': 'Toxic', 'thermometer': 'Thermometer',
    'bulb': 'Bulb', 'light': 'Light', 'cleaner': 'Cleaner', 'pesticide': 'Pesticide',
    'solvent': 'Solvent', 'mercury': 'Mercury',
}

NON_RECYCLABLE_KEYWORDS = {
    'plastic_bag': 'Plastic Bag', 'bag': 'Bag', 'styrofoam': 'Styrofoam',
    'foam': 'Foam', 'ceramic': 'Ceramic', 'broken': 'Broken', 'diaper': 'Diaper',
    'sanitary': 'Sanitary', 'tissue': 'Tissue', 'wipe': 'Wipe', 'cigarette': 'Cigarette',
    'wrapper': 'Wrapper', 'chip': 'Chip', 'composite': 'Composite', 'waxed': 'Waxed',
    'mirror': 'Mirror', 'glassware': 'Glassware', 'lightbulb': 'Lightbulb',
}

# ==================== ENHANCED HELPER FUNCTIONS ====================
def get_category_from_class(class_name):
    """Map detected class name to waste category - FIXED VERSION"""
    class_name_lower = class_name.lower()
    
    print(f"  🤔 Classifying: '{class_name}' (lower: '{class_name_lower}')")
    
    # If model directly outputs waste categories (for 2-class model)
    if class_name_lower == 'biodegradable':
        print(f"    ✅ Direct waste category: BIODEGRADABLE")
        return 'biodegradable'
    elif class_name_lower == 'recyclable':
        print(f"    ✅ Direct waste category: RECYCLABLE")
        return 'recyclable'
    
    # ========== PRIORITY 1: Check exact matches in biodegradable keywords ==========
    for keyword, display_name in BIODEGRADABLE_KEYWORDS.items():
        if keyword == class_name_lower:
            print(f"    ✅ Exact match found: '{keyword}' → BIODEGRADABLE")
            return 'biodegradable'
    
    # ========== PRIORITY 2: Check if it's a fruit/vegetable/food ==========
    fruit_keywords = ['fruit', 'berry', 'apple', 'banana', 'orange', 'pear', 'peach', 'grape', 'melon', 
                      'pineapple', 'mango', 'kiwi', 'lemon', 'lime', 'coconut', 'avocado', 'papaya', 
                      'guava', 'plum', 'cherry', 'apricot', 'fig', 'date', 'pomegranate']
    
    vegetable_keywords = ['vegetable', 'broccoli', 'carrot', 'potato', 'tomato', 'onion', 'garlic', 
                          'cucumber', 'lettuce', 'spinach', 'cabbage', 'cauliflower', 'pepper', 
                          'capsicum', 'corn', 'pea', 'bean', 'celery', 'radish', 'turnip', 'beet', 
                          'eggplant', 'zucchini', 'pumpkin', 'squash']
    
    food_keywords = ['food', 'bread', 'cake', 'pizza', 'meat', 'fish', 'rice', 'pasta', 'egg', 
                     'coffee', 'tea', 'plant', 'flower', 'seed', 'nut', 'organic', 'compost']
    
    # Check if it's a fruit
    for fruit in fruit_keywords:
        if fruit in class_name_lower:
            print(f"    🍎 Fruit detected: contains '{fruit}' → BIODEGRADABLE")
            return 'biodegradable'
    
    # Check if it's a vegetable
    for vegetable in vegetable_keywords:
        if vegetable in class_name_lower:
            print(f"    🥕 Vegetable detected: contains '{vegetable}' → BIODEGRADABLE")
            return 'biodegradable'
    
    # Check if it's food/general biodegradable
    for food in food_keywords:
        if food in class_name_lower:
            print(f"    🍽️ Food/Biodegradable detected: contains '{food}' → BIODEGRADABLE")
            return 'biodegradable'
    
    # ========== PRIORITY 3: Check other categories ==========
    # Check recyclable
    for keyword in RECYCLABLE_KEYWORDS.keys():
        if keyword in class_name_lower:
            print(f"    ♻️ Recyclable detected: contains '{keyword}' → RECYCLABLE")
            return 'recyclable'
    
    # Check hazardous
    for keyword in HAZARDOUS_KEYWORDS.keys():
        if keyword in class_name_lower:
            print(f"    ⚠️ Hazardous detected: contains '{keyword}' → HAZARDOUS")
            return 'hazardous'
    
    # Check non-recyclable
    for keyword in NON_RECYCLABLE_KEYWORDS.keys():
        if keyword in class_name_lower:
            print(f"    🗑️ Non-recyclable detected: contains '{keyword}' → NON_RECYCLABLE")
            return 'non_recyclable'
    
    # ========== PRIORITY 4: Intelligent fallback ==========
    if any(word in class_name_lower for word in ['peel', 'core', 'scrap', 'leftover', 'waste', 'garbage']):
        print(f"    🗑️ Waste-related word detected → BIODEGRADABLE (fallback)")
        return 'biodegradable'
    
    print(f"    ⚠️ No specific match found, analyzing class name...")
    
    if any(char.isdigit() for char in class_name):
        print(f"    🔢 Contains numbers → NON_RECYCLABLE (default)")
        return 'non_recyclable'
    
    print(f"    ⚠️ Defaulting to NON_RECYCLABLE")
    return 'non_recyclable'

def get_object_name(detected_class):
    """Convert YOLO class names to proper object names - ENHANCED VERSION"""
    detected_class_lower = detected_class.lower()
    
    # Direct waste categories
    if detected_class_lower == 'biodegradable':
        return 'Biodegradable Waste'
    elif detected_class_lower == 'recyclable':
        return 'Recyclable Material'
    
    # Check all keyword dictionaries
    for keyword_dict in [BIODEGRADABLE_KEYWORDS, RECYCLABLE_KEYWORDS, 
                         HAZARDOUS_KEYWORDS, NON_RECYCLABLE_KEYWORDS]:
        for keyword, display_name in keyword_dict.items():
            if keyword in detected_class_lower:
                return display_name
    
    # Default formatting
    return detected_class.replace('_', ' ').title()

def process_yolo_prediction(results):
    """Convert YOLOv8 results to frontend format - ENHANCED VERSION"""
    detections = []
    
    if not results or len(results) == 0:
        print("    ⚠️ No results from YOLO model")
        return detections
    
    if results[0].boxes is None:
        print("    ⚠️ No bounding boxes detected")
        return detections
    
    boxes = results[0].boxes
    
    print(f"    📦 Processing {len(boxes)} detected objects...")
    
    for i, box in enumerate(boxes):
        try:
            # Extract data
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            confidence = float(box.conf[0].cpu().numpy())
            class_id = int(box.cls[0].cpu().numpy())
            
            # Get class name from model
            detected_class = "unknown"
            if hasattr(yolo_model, 'names') and class_id in yolo_model.names:
                detected_class = yolo_model.names[class_id]
            else:
                detected_class = f"class_{class_id}"
            
            print(f"\n    🔍 Object {i+1}: '{detected_class}' (confidence: {confidence:.1%})")
            
            # Get proper object name
            object_name = get_object_name(detected_class)
            
            # Map detected object to waste category
            category = get_category_from_class(detected_class)
            
            # Get bin information
            class_info = CLASS_CONFIG.get(category, CLASS_CONFIG['non_recyclable'])
            bin_info = WASTE_BINS.get(category, WASTE_BINS['non_recyclable'])
            
            # Create detection object
            detection = {
                'id': f"{int(time.time())}_{i}_{hashlib.md5(f'{x1}{y1}{x2}{y2}'.encode()).hexdigest()[:6]}",
                'class': detected_class,
                'name': object_name,
                'category': category,
                'confidence': round(confidence * 100, 1),
                'confidence_raw': confidence,
                'dustbinColor': class_info.get('dustbinColor', 'Black'),
                'dustbinName': class_info.get('dustbinName', 'General Waste Bin'),
                'description': f"Detected: {object_name}. This is {category} waste and belongs in the {class_info.get('dustbinName', 'appropriate bin')}.",
                'properties': {
                    'material': object_name,
                    'detection_time': time.strftime('%H:%M:%S'),
                    'original_class': detected_class
                },
                'disposal_instructions': class_info.get('disposal_instructions', [
                    f"Place in {class_info.get('dustbinName', 'appropriate bin')}"
                ]),
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'icon': class_info.get('icon', '🗑️'),
                'color': class_info.get('color', '#666666'),
                'bbox': {
                    'x': float(x1),
                    'y': float(y1),
                    'width': float(x2 - x1),
                    'height': float(y2 - y1),
                    'confidence': round(confidence * 100, 1)
                },
                'bin_info': bin_info,
                'debug_info': {
                    'original_class': detected_class,
                    'classification_method': 'enhanced_mapping'
                }
            }
            
            detections.append(detection)
            print(f"    ✅ Classified as: {object_name} → {category.upper()} → {class_info.get('dustbinName')}")
            
        except Exception as e:
            print(f"    ❌ Error processing box {i}: {e}")
            continue
    
    return detections

def optimize_image_for_detection(image_np, target_size=640):
    """Optimize image for YOLO detection"""
    height, width = image_np.shape[:2]
    
    # Calculate scale factor
    scale = min(target_size / width, target_size / height)
    
    if scale < 1:
        new_width = int(width * scale)
        new_height = int(height * scale)
        image_np = cv2.resize(image_np, (new_width, new_height), interpolation=cv2.INTER_AREA)
    
    return image_np

# ==================== API ROUTES ====================
@app.route('/')
def home():
    return jsonify({
        'message': 'Waste Classification API',
        'model_status': 'LOADED' if yolo_model is not None else 'NOT LOADED (Lazy Loading)',
        'model_path': MODEL_PATH if yolo_model is not None else 'Will load on first detection',
        'model_hash': model_hash,
        'classes': list(yolo_model.names.values()) if yolo_model is not None else [],
        'available_classes': CLASS_CONFIG,
        'waste_bins': WASTE_BINS,
        'waste_guide': WASTE_GUIDE,
        'endpoints': {
            '/detect': 'POST - Detect waste from base64 image',
            '/health': 'GET - Health check',
            '/classes': 'GET - Get available classes',
            '/model-info': 'GET - Get model information',
            '/bin-info/<type>': 'GET - Get bin information',
            '/waste-guide': 'GET - Get waste classification guide',
            '/stats': 'GET - Get waste statistics',
            '/train-model': 'POST - Train a new model'
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check - responds immediately without loading model"""
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),  # CHANGED: Use time.time() for speed
        'app_ready': True,
        'model_loaded': yolo_model is not None,
        'api_version': '1.0',
        'ready_for_requests': True
    })

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get detailed model information"""
    # Load model if not already loaded
    if yolo_model is None:
        return jsonify({
            'status': 'not_loaded_yet',
            'message': 'Model will load on first detection request',
            'model_available': True,
            'lazy_loading': True
        })
    
    model_data = {
        'status': 'loaded',
        'model_path': MODEL_PATH,
        'model_name': Path(MODEL_PATH).name if '/' not in MODEL_PATH else MODEL_PATH.split('/')[-1],
        'model_hash': model_hash,
        'num_classes': len(yolo_model.names),
        'classes': yolo_model.names,
        'class_list': list(yolo_model.names.values()),
        'device': str(yolo_model.device),
        'task': yolo_model.task if hasattr(yolo_model, 'task') else 'detection',
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'category_mapping': {
            'biodegradable_keywords': len(BIODEGRADABLE_KEYWORDS),
            'recyclable_keywords': len(RECYCLABLE_KEYWORDS),
            'hazardous_keywords': len(HAZARDOUS_KEYWORDS),
            'non_recyclable_keywords': len(NON_RECYCLABLE_KEYWORDS)
        }
    }
    
    # Add model stats if available
    try:
        if not ('huggingface' in MODEL_PATH.lower() or 'http' in MODEL_PATH.lower()):
            model_data['model_size_mb'] = round(os.path.getsize(MODEL_PATH) / 1024 / 1024, 1)
    except:
        pass
    
    return jsonify(model_data)

@app.route('/classes', methods=['GET'])
def get_classes():
    """Get available waste classes"""
    # Load model if not already loaded
    if yolo_model is None:
        return jsonify({
            'success': True,
            'model_loaded': False,
            'message': 'Model will load on first detection',
            'frontend_classes': CLASS_CONFIG,
            'waste_bins': WASTE_BINS,
            'waste_guide': WASTE_GUIDE,
        })
    
    return jsonify({
        'success': True,
        'model_loaded': True,
        'model_classes': list(yolo_model.names.values()),
        'frontend_classes': CLASS_CONFIG,
        'waste_bins': WASTE_BINS,
        'waste_guide': WASTE_GUIDE,
        'tips': {
            'biodegradable': 'Point camera at food waste, banana peels, vegetable scraps, fruits',
            'recyclable': 'Point camera at plastic bottles, cans, cardboard, glass',
            'hazardous': 'Point camera at batteries, electronics, chemicals',
            'non_recyclable': 'Point camera at plastic bags, ceramics, styrofoam'
        },
        'category_mapping_summary': {
            'biodegradable_items': list(BIODEGRADABLE_KEYWORDS.values())[:10],
            'total_biodegradable_keywords': len(BIODEGRADABLE_KEYWORDS)
        }
    })

@app.route('/bin-info/<bin_type>', methods=['GET'])
def get_bin_info(bin_type):
    """Get detailed information about a specific waste bin type"""
    if bin_type not in WASTE_BINS:
        return jsonify({
            'success': False,
            'error': f"Bin type '{bin_type}' not found. Available types: {list(WASTE_BINS.keys())}"
        }), 404
    
    bin_info = WASTE_BINS[bin_type].copy()
    bin_info['success'] = True
    bin_info['type'] = bin_type
    
    # Add specific examples for biodegradable bin
    if bin_type == 'biodegradable':
        bin_info['common_fruits'] = ['Apple', 'Banana', 'Orange', 'Grapes', 'Berries', 'Mango', 'Pineapple']
        bin_info['common_vegetables'] = ['Carrot', 'Broccoli', 'Potato', 'Tomato', 'Onion', 'Lettuce', 'Spinach']
    
    return jsonify(bin_info)

@app.route('/all-bin-info', methods=['GET'])
def get_all_bin_info():
    """Get information about all waste bins"""
    return jsonify({
        'success': True,
        'bins': WASTE_BINS,
        'count': len(WASTE_BINS),
        'waste_guide': WASTE_GUIDE,
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'special_note': 'FRUITS & VEGETABLES always go in GREEN biodegradable bin'
    })

@app.route('/waste-guide', methods=['GET'])
def get_waste_guide():
    """Get comprehensive waste classification guide"""
    return jsonify({
        'success': True,
        'guide': WASTE_GUIDE,
        'bins': WASTE_BINS,
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'important_note': 'All fruit and vegetable waste belongs in GREEN bin (biodegradable)'
    })

@app.route('/stats', methods=['GET'])
def get_waste_stats():
    """Get waste statistics and information"""
    return jsonify({
        'success': True,
        'stats': {
            'total_bins': 4,
            'bins': [
                {'name': 'Green Bin', 'items': len(WASTE_BINS['biodegradable']['acceptable_items']), 'color': '#10b981', 'note': 'Includes ALL fruits & vegetables'},
                {'name': 'Blue Bin', 'items': len(WASTE_BINS['recyclable']['acceptable_items']), 'color': '#3b82f6'},
                {'name': 'Red Bin', 'items': len(WASTE_BINS['hazardous']['acceptable_items']), 'color': '#ef4444'},
                {'name': 'Black Bin', 'items': len(WASTE_BINS['non_recyclable']['acceptable_items']), 'color': '#374151'}
            ],
            'total_acceptable_items': sum(len(bin['acceptable_items']) for bin in WASTE_BINS.values()),
            'decomposition_times': {
                'biodegradable': '2-6 weeks',
                'recyclable': '50-500 years',
                'hazardous': 'Indefinite (requires special handling)',
                'non_recyclable': '100-1000+ years'
            },
            'biodegradable_keywords': len(BIODEGRADABLE_KEYWORDS)
        },
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    })

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint"""
    return jsonify({
        'success': True,
        'message': 'API is working!',
        'model_loaded': yolo_model is not None,
        'model_classes': list(yolo_model.names.values()) if yolo_model is not None else [],
        'class_config': CLASS_CONFIG,
        'bin_config': WASTE_BINS,
        'waste_guide': WASTE_GUIDE,
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'model_path': MODEL_PATH if yolo_model is not None else 'Will load on first request',
        'biodegradable_detection': 'ENABLED - All fruits/vegetables will be classified as biodegradable'
    })

@app.route('/detect', methods=['POST'])
def detect_from_base64():
    """MAIN ENDPOINT FOR REACT - Accepts base64 image"""
    try:
        # Load model only when needed
        if not load_model_lazy():
            return jsonify({
                'success': False,
                'error': 'Model failed to load',
                'detections': [],
                'model_info': {'loaded': False}
            }), 500
        
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        print(f"\n📸 ===== NEW DETECTION REQUEST =====")
        print(f"📦 Request received at: {time.strftime('%H:%M:%S')}")
        
        # Show which model is being used
        model_name = "YOLOv8m (80+ classes)" if "yolov8m" in str(MODEL_PATH).lower() else "Custom waste model (2 classes)"
        print(f"🔧 Using: {model_name}")
        print(f"🔧 Biodegradable detection: ENABLED (Enhanced mapping)")
        
        start_time = time.time()
        
        # Decode base64 image
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image_np = np.array(image)
        
        print(f"📐 Original image size: {image.width}x{image.height}")
        
        # Optimize image for detection
        image_np = optimize_image_for_detection(image_np, target_size=640)
        print(f"📐 Optimized size: {image_np.shape[1]}x{image_np.shape[0]}")
        
        print(f"🔍 Running object detection...")
        
        # Get confidence threshold from request or use default
        confidence_threshold = float(data.get('confidence', 0.25))
        
        # Run inference
        inference_start = time.time()
        results = yolo_model(image_np, conf=confidence_threshold, verbose=False)
        inference_time = time.time() - inference_start
        
        # Process results
        detections = process_yolo_prediction(results)
        
        # Count by category
        waste_counts = {}
        bins_used = []
        
        for detection in detections:
            category = detection['category']
            waste_counts[category] = waste_counts.get(category, 0) + 1
            
            # Track unique bins used
            bin_name = detection.get('dustbinName', 'General Bin')
            if bin_name not in bins_used:
                bins_used.append(bin_name)
        
        total_time = time.time() - start_time
        
        print(f"\n✅ Object detection complete: {len(detections)} objects found")
        print(f"📊 Waste counts: {waste_counts}")
        print(f"🗑️  Bins needed: {bins_used}")
        print(f"⏱️  Detection time: {inference_time:.2f}s, Total time: {total_time:.2f}s")
        
        # Show biodegradability summary
        if 'biodegradable' in waste_counts:
            print(f"🍃 Biodegradable items detected: {waste_counts['biodegradable']}")
            print(f"   These items will decompose naturally in 2-6 weeks")
        print("="*50)
        
        # Prepare bin summary
        bin_summary = []
        for category, count in waste_counts.items():
            bin_info = WASTE_BINS.get(category, {})
            bin_summary.append({
                'category': category,
                'count': count,
                'bin_name': bin_info.get('name', 'General Bin'),
                'bin_color': bin_info.get('color', '#666666'),
                'bin_icon': bin_info.get('icon', '🗑️')
            })
        
        # Prepare response
        response = {
            'success': True,
            'detections': detections,
            'waste_counts': waste_counts,
            'bin_summary': bin_summary,
            'bins_needed': bins_used,
            'total_detections': len(detections),
            'performance': {
                'inference_time_ms': round(inference_time * 1000, 2),
                'total_time_ms': round(total_time * 1000, 2),
                'confidence_threshold_used': confidence_threshold
            },
            'image_info': {
                'original_size': f"{image.width}x{image.height}",
                'processed_size': f"{image_np.shape[1]}x{image_np.shape[0]}"
            },
            'model_info': {
                'model_name': Path(MODEL_PATH).name if '/' not in MODEL_PATH else MODEL_PATH.split('/')[-1],
                'model_hash': model_hash,
                'model_type': model_name,
                'classes': list(yolo_model.names.values()),
                'bins_available': list(WASTE_BINS.keys())
            },
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'biodegradable_note': 'All fruits and vegetables are automatically classified as biodegradable waste'
        }
        
        # Add tips if no detections
        if len(detections) == 0:
            if "yolov8m" in str(MODEL_PATH).lower():
                response['tips'] = [
                    'Try pointing camera at: fruits, vegetables, plastic bottles, cans, etc.',
                    'Ensure good lighting and clear focus',
                    'Try different angles',
                    f'Try lower confidence threshold (current: {confidence_threshold})',
                    'Suggested objects: apple, banana, bottle, can, cardboard'
                ]
            else:
                response['tips'] = [
                    'Point camera at general waste items',
                    'Ensure good lighting',
                    'Try different angles',
                    f'Try lower confidence threshold (current: {confidence_threshold})',
                    'Model detects: biodegradable vs recyclable waste'
                ]
        
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'detections': [],
            'model_info': {'loaded': yolo_model is not None}
        }), 500

# ==================== TRAINING FUNCTION ====================
@app.route('/train-model', methods=['POST'])
def train_model():
    """Train a new YOLO model with current data"""
    try:
        # Load model if not already loaded
        if not load_model_lazy():
            return jsonify({
                'success': False,
                'error': 'No base model loaded for training'
            })
        
        print("\n🎯 Starting model training...")
        
        # Create dataset.yaml for training
        dataset_config = {
            'path': os.path.abspath('waste_dataset'),
            'train': 'images/train',
            'val': 'images/val',
            'nc': 4,
            'names': ['biodegradable', 'recyclable', 'hazardous', 'non_recyclable']
        }
        
        # Ensure dataset directory exists
        os.makedirs('waste_dataset', exist_ok=True)
        os.makedirs('waste_dataset/images/train', exist_ok=True)
        os.makedirs('waste_dataset/images/val', exist_ok=True)
        os.makedirs('waste_dataset/labels/train', exist_ok=True)
        os.makedirs('waste_dataset/labels/val', exist_ok=True)
        
        import yaml
        with open('waste_dataset/dataset.yaml', 'w') as f:
            yaml.dump(dataset_config, f)
        
        # Training configuration
        training_args = {
            'data': 'waste_dataset/dataset.yaml',
            'epochs': 50,
            'imgsz': 640,
            'batch': 16,
            'save': True,
            'save_period': 10,
            'project': 'waste_training',
            'name': 'waste_detector_v2',
            'exist_ok': True,
        }
        
        # Start training
        print("🤖 Training YOLO model...")
        results = yolo_model.train(**training_args)
        
        return jsonify({
            'success': True,
            'message': 'Model training started',
            'training_id': 'waste_detector_v2',
            'epochs': 50,
            'status': 'training'
        })
        
    except Exception as e:
        print(f"Training error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

# ==================== ERROR HANDLERS ====================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found', 'success': False}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'success': False}), 500

# ==================== MAIN EXECUTION ====================
# Only run Flask dev server if running directly (not imported by Gunicorn)
# ==================== MAIN EXECUTION ====================
# CRITICAL: This block ONLY runs when executing: python app.py
# When Railway runs start.sh -> gunicorn app:app, this block is NOT executed
if __name__ == '__main__':
    print(f"\n{'='*70}")
    print(f"🚀 LOCAL DEVELOPMENT MODE")
    print(f"📡 Running: python app.py")
    print(f"💡 For production, Railway uses start.sh -> gunicorn")
    print(f"{'='*70}")
    
    # For local testing only - use fixed port 5000
    app.run(host='127.0.0.1', port=5001, debug = True)
