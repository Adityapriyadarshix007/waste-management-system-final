from flask import Blueprint, jsonify, request
from ..database import db, DetectionHistory
from datetime import datetime, timedelta
import os

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/api/admin/dashboard-stats', methods=['GET'])
def dashboard_stats():
    """Get comprehensive stats for admin dashboard"""
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    
    # Daily stats
    daily_stats = db.session.query(
        db.func.date(DetectionHistory.detected_at).label('date'),
        db.func.count(DetectionHistory.id).label('count')
    ).filter(db.func.date(DetectionHistory.detected_at) >= week_ago)\
     .group_by(db.func.date(DetectionHistory.detected_at))\
     .order_by(db.func.date(DetectionHistory.detected_at)).all()
    
    # Category distribution
    category_stats = db.session.query(
        DetectionHistory.waste_category,
        db.func.count(DetectionHistory.id).label('count')
    ).group_by(DetectionHistory.waste_category).all()
    
    # Confidence statistics
    confidence_stats = db.session.query(
        db.func.avg(DetectionHistory.confidence).label('avg_confidence'),
        db.func.max(DetectionHistory.confidence).label('max_confidence'),
        db.func.min(DetectionHistory.confidence).label('min_confidence')
    ).first()
    
    # Recent detections
    recent = DetectionHistory.query.order_by(
        DetectionHistory.detected_at.desc()
    ).limit(10).all()
    
    return jsonify({
        'daily_stats': [{'date': str(date), 'count': count} for date, count in daily_stats],
        'category_distribution': {category: count for category, count in category_stats},
        'confidence_stats': {
            'average': round(confidence_stats.avg_confidence * 100, 2) if confidence_stats.avg_confidence else 0,
            'maximum': round(confidence_stats.max_confidence * 100, 2) if confidence_stats.max_confidence else 0,
            'minimum': round(confidence_stats.min_confidence * 100, 2) if confidence_stats.min_confidence else 0
        },
        'total_detections': DetectionHistory.query.count(),
        'recent_detections': [d.to_dict() for d in recent]
    })

@admin_bp.route('/api/admin/delete-detection/<int:id>', methods=['DELETE'])
def delete_detection(id):
    """Delete a detection record"""
    detection = DetectionHistory.query.get_or_404(id)
    
    # Delete associated image if exists
    if detection.image_path and os.path.exists(detection.image_path):
        os.remove(detection.image_path)
    
    db.session.delete(detection)
    db.session.commit()
    
    return jsonify({'success': True})

@admin_bp.route('/api/admin/search', methods=['GET'])
def search_detections():
    """Search detections by object name or category"""
    query = request.args.get('q', '')
    category = request.args.get('category', '')
    
    search_query = DetectionHistory.query
    
    if query:
        search_query = search_query.filter(
            DetectionHistory.object_name.ilike(f'%{query}%')
        )
    
    if category:
        search_query = search_query.filter(
            DetectionHistory.waste_category == category
        )
    
    results = search_query.order_by(
        DetectionHistory.detected_at.desc()
    ).limit(50).all()
    
    return jsonify([d.to_dict() for d in results])