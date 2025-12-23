// src/services/detection.js
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export class ObjectDetector {
  constructor(videoElement, canvasElement, onDetection) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.onDetection = onDetection;
    this.objects = [];
    this.isDetecting = false;
    this.model = null;
    
    // Define waste categories mapping for objects
    this.wasteCategories = {
      // Biodegradable items
      'apple': 'biodegradable',
      'banana': 'biodegradable',
      'orange': 'biodegradable',
      'broccoli': 'biodegradable',
      'carrot': 'biodegradable',
      'food': 'biodegradable',
      'leaf': 'biodegradable',
      'wood': 'biodegradable',
      'paper': 'biodegradable', // Can be both recyclable and biodegradable
      'paper towel': 'biodegradable',
      'napkin': 'biodegradable',
      'vegetable': 'biodegradable',
      'fruit': 'biodegradable',
      'bread': 'biodegradable',
      'eggshell': 'biodegradable',
      'coffee ground': 'biodegradable',
      'tea bag': 'biodegradable',
      'plant': 'biodegradable',
      'flower': 'biodegradable',
      'grass': 'biodegradable',
      'banana peel': 'biodegradable',
      'orange peel': 'biodegradable',
      'egg': 'biodegradable',
      'cake': 'biodegradable',
      'pizza': 'biodegradable',
      'sandwich': 'biodegradable',
      'meat': 'biodegradable',
      'fish': 'biodegradable',
      'rice': 'biodegradable',
      'pasta': 'biodegradable',
      'potato': 'biodegradable',
      'tomato': 'biodegradable',
      'onion': 'biodegradable',
      'lettuce': 'biodegradable',
      'cucumber': 'biodegradable',
      
      // Recyclable items
      'bottle': 'recyclable',
      'plastic bottle': 'recyclable',
      'glass': 'recyclable',
      'can': 'recyclable',
      'aluminum can': 'recyclable',
      'cardboard': 'recyclable',
      'newspaper': 'recyclable',
      'magazine': 'recyclable',
      'metal': 'recyclable',
      'paper cup': 'recyclable',
      'plastic container': 'recyclable',
      'tin can': 'recyclable',
      'jar': 'recyclable',
      'box': 'recyclable',
      'envelope': 'recyclable',
      
      // Hazardous items
      'battery': 'hazardous',
      'medicine': 'hazardous',
      'chemical': 'hazardous',
      'thermometer': 'hazardous',
      'light bulb': 'hazardous',
      'aerosol': 'hazardous',
      'paint': 'hazardous',
      'oil': 'hazardous',
      'pesticide': 'hazardous',
      'cleaner': 'hazardous',
      
      // Non-recyclable items
      'plastic bag': 'non-recyclable',
      'styrofoam': 'non-recyclable',
      'chip bag': 'non-recyclable',
      'candy wrapper': 'non-recyclable',
      'diaper': 'non-recyclable',
      'ceramic': 'non-recyclable',
      'mirror': 'non-recyclable',
      'glassware': 'non-recyclable',
      'lightbulb': 'non-recyclable',
      'waxed paper': 'non-recyclable'
    };
  }
  
  async initializeCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });
      this.video.srcObject = stream;
      
      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
          resolve();
        };
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw error;
    }
  }
  
  async loadModel() {
    try {
      console.log('Loading COCO-SSD model...');
      this.model = await cocoSsd.load();
      console.log('Model loaded successfully');
      return this.model;
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }
  
  async detectObjects() {
    if (!this.model || !this.isDetecting) return;
    
    try {
      // Perform object detection
      const predictions = await this.model.detect(this.video);
      
      // Process predictions and categorize them
      this.objects = predictions
        .filter(prediction => prediction.score > 0.3) // Confidence threshold
        .map(prediction => {
          const objectName = prediction.class.toLowerCase();
          const wasteCategory = this.getWasteCategory(objectName);
          
          return {
            object_name: objectName,
            confidence: prediction.score,
            bounding_box: {
              x: prediction.bbox[0],
              y: prediction.bbox[1],
              width: prediction.bbox[2],
              height: prediction.bbox[3]
            },
            waste_category: wasteCategory,
            prediction: prediction
          };
        });
      
      // Draw bounding boxes
      this.drawBoundingBoxes();
      
      // Trigger callback with detected objects
      if (this.onDetection) {
        this.onDetection(this.objects);
      }
      
      // Continue detection loop
      if (this.isDetecting) {
        requestAnimationFrame(() => this.detectObjects());
      }
    } catch (error) {
      console.error('Error detecting objects:', error);
      // Continue detection even if there's an error
      if (this.isDetecting) {
        setTimeout(() => this.detectObjects(), 100);
      }
    }
  }
  
  getWasteCategory(objectName) {
    // First, check for exact matches
    if (this.wasteCategories[objectName]) {
      return this.wasteCategories[objectName];
    }
    
    // Check for partial matches
    for (const [key, category] of Object.entries(this.wasteCategories)) {
      if (objectName.includes(key) || key.includes(objectName)) {
        return category;
      }
    }
    
    // Special handling for common biodegradable items
    const biodegradableKeywords = ['fruit', 'vegetable', 'food', 'plant', 'leaf', 'flower', 'grass', 'wood'];
    const recyclableKeywords = ['bottle', 'can', 'glass', 'plastic', 'metal', 'cardboard', 'paper', 'box'];
    const hazardousKeywords = ['battery', 'chemical', 'medicine', 'paint', 'oil', 'cleaner'];
    
    for (const keyword of biodegradableKeywords) {
      if (objectName.includes(keyword)) {
        return 'biodegradable';
      }
    }
    
    for (const keyword of recyclableKeywords) {
      if (objectName.includes(keyword)) {
        return 'recyclable';
      }
    }
    
    for (const keyword of hazardousKeywords) {
      if (objectName.includes(keyword)) {
        return 'hazardous';
      }
    }
    
    // Default to non-recyclable for unknown items
    return 'non-recyclable';
  }
  
  drawBoundingBoxes() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw video frame
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    
    this.objects.forEach(obj => {
      const box = obj.bounding_box;
      const category = obj.waste_category;
      
      const colors = {
        'biodegradable': '#4CAF50', // Green
        'recyclable': '#2196F3',    // Blue
        'hazardous': '#F44336',     // Red
        'non-recyclable': '#9E9E9E' // Gray
      };
      
      const color = colors[category] || '#9E9E9E';
      
      if (box && box.x && box.y && box.width && box.height) {
        // Draw bounding box
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Draw label
        const confidence = Math.round(obj.confidence * 100);
        const label = `${obj.object_name} (${category}) ${confidence}%`;
        
        // Label background
        this.ctx.font = 'bold 14px Arial';
        const textWidth = this.ctx.measureText(label).width;
        const labelHeight = 20;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          box.x,
          box.y - labelHeight,
          textWidth + 10,
          labelHeight
        );
        
        // Label text
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(label, box.x + 5, box.y - 5);
      }
    });
  }
  
  async startDetection() {
    if (!this.model) {
      await this.loadModel();
    }
    
    if (!this.isDetecting) {
      this.isDetecting = true;
      this.detectObjects();
    }
  }
  
  stopDetection() {
    this.isDetecting = false;
    this.objects = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  captureImage() {
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    this.ctx.drawImage(this.video, 0, 0);
    return this.canvas.toDataURL('image/jpeg', 0.8);
  }
  
  stopCamera() {
    this.stopDetection();
    if (this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(track => track.stop());
    }
  }
  
  // Get statistics about detected objects
  getDetectionStats() {
    const stats = {
      biodegradable: 0,
      recyclable: 0,
      hazardous: 0,
      'non-recyclable': 0,
      total: 0
    };
    
    this.objects.forEach(obj => {
      const category = obj.waste_category;
      if (stats[category] !== undefined) {
        stats[category]++;
        stats.total++;
      }
    });
    
    return stats;
  }
}

// Export a utility function for easy use
export async function createDetector(videoElement, canvasElement, onDetection) {
  const detector = new ObjectDetector(videoElement, canvasElement, onDetection);
  await detector.initializeCamera();
  await detector.loadModel();
  return detector;
}