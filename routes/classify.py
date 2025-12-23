from flask import Blueprint, request, jsonify
import os
from werkzeug.utils import secure_filename
from PIL import Image
from ..config import Config
from ..database import db, DetectionHistory
from ..model.predict import WastePredictor
from datetime import datetime

classify_bp = Blueprint('classify', __name__)
predictor = WastePredictor(Config.MODEL_PATH, Config.CLASS_INDICES_PATH)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

@classify_bp.route('/api/detect-objects', methods=['POST'])
def detect_objects():
    """Detect multiple objects in image with bounding boxes"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        upload_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        
        # Save original image
        file.save(upload_path)
        
        try:
            # Detect objects
            objects = predictor.detect_objects(upload_path)
            
            # Save detection history
            for obj in objects:
                detection = DetectionHistory(
                    filename=filename,
                    object_name=obj['prediction']['object_name'],
                    waste_category=obj['prediction']['waste_category'],
                    confidence=obj['prediction']['confidence'],
                    dustbin_color=obj['prediction']['dustbin_color'],
                    properties=obj['prediction']['properties'],
                    image_path=upload_path
                )
                db.session.add(detection)
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'image_path': f"/uploads/{unique_filename}",
                'detected_objects': objects,
                'total_objects': len(objects)
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

@classify_bp.route('/api/classify', methods=['POST'])
def classify():
    """Classify single waste object"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        upload_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        
        # Save image
        file.save(upload_path)
        
        try:
            # Open and predict
            img = Image.open(upload_path)
            prediction = predictor.predict(img)
            
            # Save to history
            detection = DetectionHistory(
                filename=filename,
                object_name=prediction['object_name'],
                waste_category=prediction['waste_category'],
                confidence=prediction['confidence'],
                dustbin_color=prediction['dustbin_color'],
                properties=prediction['properties'],
                image_path=upload_path
            )
            db.session.add(detection)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'prediction': prediction,
                'image_path': f"/uploads/{unique_filename}"
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

@classify_bp.route('/api/history', methods=['GET'])
def get_history():
    """Get detection history"""
    detections = DetectionHistory.query.order_by(DetectionHistory.detected_at.desc()).all()
    return jsonify([d.to_dict() for d in detections])

@classify_bp.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics about waste detection"""
    stats = db.session.query(
        DetectionHistory.waste_category,
        db.func.count(DetectionHistory.id).label('count')
    ).group_by(DetectionHistory.waste_category).all()
    
    return jsonify({
        'by_category': {category: count for category, count in stats},
        'total_detections': DetectionHistory.query.count()
    })