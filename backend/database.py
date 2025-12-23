from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class DetectionHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    object_name = db.Column(db.String(100), nullable=False)
    waste_category = db.Column(db.String(50), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    dustbin_color = db.Column(db.String(20), nullable=False)
    properties = db.Column(db.JSON)
    detected_at = db.Column(db.DateTime, default=db.func.now())
    image_path = db.Column(db.String(255))
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'object_name': self.object_name,
            'waste_category': self.waste_category,
            'confidence': round(self.confidence * 100, 2),
            'dustbin_color': self.dustbin_color,
            'properties': self.properties,
            'detected_at': self.detected_at.isoformat() if self.detected_at else None,
            'image_path': self.image_path
        }