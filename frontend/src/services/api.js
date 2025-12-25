import axios from 'axios';

// URLs for different environments
const LOCAL_API_URL = 'http://localhost:5001';  // Local development
const RAILWAY_API_URL = 'https://web-production-5378.up.railway.app';  // Your Railway URL

// Determine which URL to use based on environment
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

const API_BASE_URL = isDevelopment ? LOCAL_API_URL : RAILWAY_API_URL;

console.log(`🚀 API Base URL: ${API_BASE_URL}`);
console.log(`🌐 Environment: ${isDevelopment ? 'Development' : 'Production'}`);
console.log(`🔗 Backend: ${API_BASE_URL === LOCAL_API_URL ? 'Local' : 'Railway'}`);

// The rest of your code stays the same...

// Create axios instance
const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds timeout for ML operations on Render
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for debugging
API.interceptors.request.use(
  (config) => {
    console.log(`🌐 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
API.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    console.error('Error config:', error.config);
    
    // Provide more helpful error messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. The server is taking too long to respond.');
    } else if (!error.response) {
      // Network error or CORS issue
      if (isDevelopment) {
        throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Please check if the server is running.`);
      } else {
        throw new Error(`Cannot connect to server. Please try again later.`);
      }
    } else {
      // Server responded with error status
      console.error('Error response:', error.response.data);
      throw error;
    }
  }
);

export const wasteAPI = {
  // MAIN ENDPOINT - Send base64 image to /detect
  detectWaste: (base64Image) => {
    // Remove "data:image/jpeg;base64," prefix if present
    const imageData = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;
    
    console.log('📤 Sending image to backend for detection...');
    console.log(`📊 Image size: ${Math.round(imageData.length / 1024)} KB`);
    
    return API.post('/detect', {
      image: imageData,
      confidence: 0.25
    });
  },
  
  // Alternative: For file uploads (uses FormData)
  detectFromFile: (imageFile) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert file to base64
        const base64 = await fileToBase64(imageFile);
        const imageData = base64.includes(',') 
          ? base64.split(',')[1] 
          : base64;
        
        console.log('📤 Sending file to backend for detection...');
        
        resolve(API.post('/detect', {
          image: imageData,
          confidence: 0.25
        }));
      } catch (error) {
        reject(error);
      }
    });
  },
  
  // Health check - Returns proper response
  checkHealth: async () => {
    try {
      console.log('🏥 Checking backend health...');
      const response = await API.get('/health');
      
      // Check if response has proper structure
      if (response.data && (response.data.status === 'healthy' || response.data.model_loaded)) {
        return {
          data: {
            status: 'healthy',
            message: 'Backend is healthy and ready',
            timestamp: response.data.timestamp,
            model_loaded: response.data.model_loaded || false,
            version: '2.0.0'
          }
        };
      } else {
        // If response doesn't have expected structure
        return {
          data: {
            status: 'unknown',
            message: 'Unexpected response format',
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      
      // Try alternative endpoints
      try {
        const testResponse = await API.get('/');
        return {
          data: {
            status: 'connected',
            message: 'Backend is responding',
            timestamp: new Date().toISOString(),
            backend_url: API_BASE_URL
          }
        };
      } catch (secondError) {
        // Return structured error response
        return {
          data: {
            status: 'error',
            message: 'Cannot connect to backend',
            error: error.message,
            timestamp: new Date().toISOString(),
            backend_url: API_BASE_URL,
            note: 'Make sure your Flask app is running on Render'
          }
        };
      }
    }
  },
  
  // Test endpoint (if exists)
  testDetection: () => {
    return API.get('/test').catch(error => {
      console.log('Test endpoint not available:', error.message);
      // Try alternative endpoint
      return API.get('/').then(response => ({
        data: {
          success: true,
          message: 'API is working!',
          response: response.data
        }
      }));
    });
  },
  
  // Get categories
  getCategories: () => {
    return API.get('/classes').catch(error => {
      console.log('Categories endpoint not available');
      // Return default categories
      return {
        data: {
          categories: [
            { id: 'recyclable', name: 'Recyclable', color: '#3b82f6', icon: '♻️' },
            { id: 'biodegradable', name: 'Biodegradable', color: '#10b981', icon: '🍃' },
            { id: 'hazardous', name: 'Hazardous', color: '#ef4444', icon: '⚠️' },
            { id: 'non_recyclable', name: 'Non-Recyclable', color: '#6b7280', icon: '🗑️' }
          ]
        }
      };
    });
  },
  
  // Get statistics
  getStats: async () => {
    try {
      const response = await API.get('/stats');
      return response;
    } catch (error) {
      console.log('Stats endpoint not available, using mock data');
      // Return mock stats
      return {
        data: {
          success: true,
          stats: {
            total_bins: 4,
            bins: [
              { name: 'Green Bin', items: 11, color: '#10b981', note: 'Includes ALL fruits & vegetables' },
              { name: 'Blue Bin', items: 6, color: '#3b82f6' },
              { name: 'Red Bin', items: 5, color: '#ef4444' },
              { name: 'Black Bin', items: 5, color: '#374151' }
            ],
            total_acceptable_items: 27,
            model_loaded: true
          }
        }
      };
    }
  },
  
  // Get detection examples
  getDetectionExamples: async () => {
    try {
      const response = await API.get('/');
      // Extract examples from response
      const examples = {
        recyclable: ['Plastic Bottle', 'Aluminum Can', 'Glass Jar', 'Cardboard'],
        biodegradable: ['Banana Peel', 'Apple Core', 'Food Waste', 'Orange Peel'],
        hazardous: ['Battery', 'Electronic', 'Medicine', 'Chemical'],
        non_recyclable: ['Plastic Bag', 'Styrofoam', 'Ceramic', 'Diaper']
      };
      return {
        data: {
          success: true,
          examples: examples
        }
      };
    } catch (err) {
      console.log('Using default detection examples');
      // Default examples if API fails
      return {
        data: {
          success: true,
          examples: {
            recyclable: ['Plastic Bottle', 'Aluminum Can', 'Glass Jar', 'Newspaper'],
            biodegradable: ['Banana Peel', 'Apple Core', 'Food Waste', 'Leaves'],
            hazardous: ['Battery', 'Medicine', 'Chemical Container', 'E-waste'],
            non_recyclable: ['Plastic Bag', 'Styrofoam', 'Chip Bag', 'Diaper']
          }
        }
      };
    }
  },
  
  // Get model info
  getModelInfo: () => {
    return API.get('/model-info').catch(error => {
      console.log('Model info endpoint not available');
      return {
        data: {
          status: 'unknown',
          message: 'Model info not available'
        }
      };
    });
  },
  
  // Fallback mock detection for demo purposes
  mockDetectWaste: (imageData) => {
    console.log('🎭 Using mock detection (backend unavailable)');
    
    // Simulate API delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          data: {
            success: true,
            detections: [
              {
                id: Date.now(),
                class: 'plastic_bottle',
                confidence: 0.92,
                name: 'Plastic Bottle',
                category: 'recyclable',
                dustbinColor: 'Blue',
                dustbinName: 'Blue Bin (Recycling)',
                disposalInstructions: ['Empty bottle', 'Remove cap', 'Rinse if needed'],
                icon: '♻️',
                color: '#3b82f6',
                description: 'Recyclable plastic container - belongs in Blue Bin',
                timestamp: new Date().toISOString()
              },
              {
                id: Date.now() + 1,
                class: 'banana',
                confidence: 0.87,
                name: 'Banana',
                category: 'biodegradable',
                dustbinColor: 'Green',
                dustbinName: 'Green Bin (Compost)',
                disposalInstructions: ['Place in compost bin', 'Will decompose naturally in 2-6 weeks'],
                icon: '🍃',
                color: '#10b981',
                description: 'Fruit waste - belongs in Green Bin',
                timestamp: new Date().toISOString()
              }
            ],
            waste_counts: {
              recyclable: 1,
              biodegradable: 1
            },
            bins_needed: ['Blue Bin (Recycling)', 'Green Bin (Compost)'],
            total_detections: 2,
            message: 'Mock detection - 2 objects found',
            mock: true,
            timestamp: new Date().toISOString()
          }
        });
      }, 1500); // 1.5 second delay to simulate processing
    });
  }
};

// Helper function to convert File to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Test connection on import
console.log(`🔗 Testing connection to: ${API_BASE_URL}`);

// Export the API instance as well
export { API, API_BASE_URL };
export default API;
