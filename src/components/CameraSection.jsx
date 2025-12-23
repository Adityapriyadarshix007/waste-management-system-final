import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, RotateCw, X, Loader2, CheckCircle, BarChart3, Info, AlertCircle, Download, Trash2 } from 'lucide-react';
import { wasteAPI } from '../services/api';

const CameraSection = ({ onSingleDetection, onObjectsDetected }) => {
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mode, setMode] = useState('single');
  const [isUploading, setIsUploading] = useState(false);
  const [predictionResults, setPredictionResults] = useState([]);
  const [detectionCount, setDetectionCount] = useState(0);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [wasteStats, setWasteStats] = useState(null);
  const [showWasteGuide, setShowWasteGuide] = useState(false);
  const [detectionExamples, setDetectionExamples] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check backend health on component mount
  useEffect(() => {
    checkBackendHealth();
    fetchWasteStats();
    fetchDetectionExamples();
    
    // Load detection history from localStorage if available
    const savedHistory = localStorage.getItem('wasteDetectionHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setDetectionHistory(parsedHistory);
        setDetectionCount(parsedHistory.length);
      } catch (e) {
        console.error('Failed to parse saved history:', e);
      }
    }
  }, []);

  const checkBackendHealth = async () => {
    try {
      console.log('Checking backend health...');
      const response = await wasteAPI.checkHealth();
      const healthData = response.data || response;
      
      if (healthData.status === 'healthy' || healthData.status === 'connected') {
        setBackendStatus('connected');
        setError(null);
        console.log('✅ Backend connected successfully');
      } else {
        setBackendStatus('error');
        setError(`Backend error: ${healthData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Backend connection error:', err);
      setBackendStatus('disconnected');
      setError('Cannot connect to backend. Make sure it\'s running on port 5001');
    }
  };

  const fetchWasteStats = async () => {
    try {
      const response = await wasteAPI.getStats();
      if (response.data.success) {
        setWasteStats(response.data.stats);
      }
    } catch (err) {
      console.log('Could not fetch waste stats');
    }
  };

  const fetchDetectionExamples = async () => {
    try {
      const response = await wasteAPI.getDetectionExamples();
      if (response.data.success) {
        // Combine all examples into one array for display
        const examples = [];
        Object.values(response.data.examples).forEach(categoryExamples => {
          examples.push(...categoryExamples.slice(0, 2));
        });
        setDetectionExamples(examples);
      }
    } catch (err) {
      console.log('Using default detection examples');
      // Default examples if API fails
      setDetectionExamples([
        'Plastic Bottle', 'Banana Peel', 'Battery', 
        'Aluminum Can', 'Food Waste', 'Glass Jar'
      ]);
    }
  };

  // Start camera
  const startCamera = () => {
    setIsCameraActive(true);
    setError(null);
  };

  // Stop camera
  const stopCamera = () => {
    setIsCameraActive(false);
    setImage(null);
    setPredictionResults([]);
  };

  // Capture image
  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImage(imageSrc);
      setPredictionResults([]);
      setError(null);
    }
  };

  // Retake image
  const retakeImage = () => {
    setImage(null);
    setPredictionResults([]);
    setError(null);
  };

  // REAL detection for single/multiple objects
  const detectObjects = async () => {
    if (!image) {
      setError('Please capture an image first!');
      return;
    }

    if (backendStatus !== 'connected') {
      setError('Backend is not connected. Please check if the server is running.');
      await checkBackendHealth();
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log('Sending image to backend for object detection...');
      const response = await wasteAPI.detectWaste(image);
      const data = response.data;
      
      console.log('Object detection response:', data);

      if (data.success) {
        // Process the detections from backend
        const processedResults = data.detections.map((detection, index) => ({
          id: detection.id || Date.now() + index,
          class: detection.class || 'unknown',
          confidence: detection.confidence ? (detection.confidence / 100) : 0.5,
          name: detection.name || (detection.class ? detection.class.charAt(0).toUpperCase() + detection.class.slice(1) : 'Unknown Object'),
          category: detection.category || 'non_recyclable',
          timestamp: detection.timestamp || new Date().toLocaleString(),
          bbox: detection.bbox || {},
          description: detection.description || `${detection.name || 'Object'} detected`,
          
          // Bin information
          dustbinColor: detection.dustbinColor || 'Black',
          dustbinName: detection.dustbinName || 'General Waste Bin',
          disposalInstructions: detection.disposalInstructions || ['Place in appropriate bin'],
          icon: detection.icon || '🗑️',
          color: detection.color || '#666666',
          binInfo: detection.binInfo || {}
        }));

        setPredictionResults(processedResults);
        
        // Update detection count and history - FIXED: Add ALL detected objects to history
        const newDetections = processedResults.length;
        setDetectionCount(prev => prev + newDetections);
        
        const detectionDataArray = processedResults.map(obj => ({
          id: obj.id,
          name: obj.name,
          category: obj.category,
          confidence: Math.round(obj.confidence * 100),
          dustbinColor: obj.dustbinColor,
          dustbinName: obj.dustbinName,
          disposalInstructions: obj.disposalInstructions,
          description: obj.description,
          timestamp: obj.timestamp,
          color: obj.color,
          icon: obj.icon,
          date: new Date().toISOString().split('T')[0] // Add date for grouping
        }));

        // Add all new detections to history (not just limited to 9)
        const updatedHistory = [...detectionDataArray, ...detectionHistory];
        setDetectionHistory(updatedHistory);
        
        // Save to localStorage
        try {
          localStorage.setItem('wasteDetectionHistory', JSON.stringify(updatedHistory));
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
        
        // Call parent callbacks if provided
        if (mode === 'single' && processedResults.length > 0 && onSingleDetection) {
          onSingleDetection(detectionDataArray[0]);
        } else if (mode === 'multi' && onObjectsDetected) {
          onObjectsDetected(detectionDataArray);
        }

        setError(null);
      } else {
        setError(data.error || 'Object detection failed. Please try again.');
      }
    } catch (err) {
      console.error('Detection error:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to process image: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Function to get bin icon based on bin type
  const getBinIcon = (binType) => {
    switch(binType?.toLowerCase()) {
      case 'green': return '🍃';
      case 'blue': return '♻️';
      case 'red': return '⚠️';
      case 'black': return '🗑️';
      default: return '🗑️';
    }
  };

  // Function to get bin color based on bin type
  const getBinColor = (binType) => {
    switch(binType?.toLowerCase()) {
      case 'green': return '#10b981';
      case 'blue': return '#3b82f6';
      case 'red': return '#ef4444';
      case 'black': return '#374151';
      default: return '#666666';
    }
  };

  // Function to render bin recommendations
  const renderBinRecommendations = () => {
    if (!predictionResults || predictionResults.length === 0) {
      return null;
    }

    // Group by bin type
    const bins = {};
    predictionResults.forEach(detection => {
      const binType = detection.dustbinColor?.toLowerCase() || detection.category;
      if (!bins[binType]) {
        bins[binType] = {
          color: detection.color || getBinColor(binType),
          name: detection.dustbinName || `${detection.category} Bin`,
          icon: detection.icon || getBinIcon(binType),
          items: [],
          count: 0,
          category: detection.category
        };
      }
      bins[binType].items.push(detection);
      bins[binType].count++;
    });

    // Sort bins: Green, Blue, Red, Black
    const sortedBins = Object.entries(bins).sort(([binTypeA], [binTypeB]) => {
      const order = { 'green': 0, 'blue': 1, 'red': 2, 'black': 3 };
      return (order[binTypeA] || 4) - (order[binTypeB] || 4);
    });

    return (
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="mr-2">🗑️</span>
            Waste Bin Recommendations
          </h3>
          <button 
            onClick={() => setShowWasteGuide(!showWasteGuide)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition flex items-center"
          >
            <Info className="h-4 w-4 mr-2" />
            {showWasteGuide ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>
        
        {showWasteGuide && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
            <h4 className="font-bold text-blue-800 mb-3 text-lg">📋 Waste Classification Guide</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center mr-2">🍃</div>
                  <div className="font-bold text-green-700">Green Bin</div>
                </div>
                <div className="text-sm text-gray-600">Biodegradable waste, food scraps, garden waste</div>
                <div className="text-xs text-green-600 mt-2">Compost within 2-6 weeks</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center mr-2">♻️</div>
                  <div className="font-bold text-blue-700">Blue Bin</div>
                </div>
                <div className="text-sm text-gray-600">Recyclables: plastic, glass, metal, paper</div>
                <div className="text-xs text-blue-600 mt-2">Clean and dry before disposal</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-red-200">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center mr-2">⚠️</div>
                  <div className="font-bold text-red-700">Red Bin</div>
                </div>
                <div className="text-sm text-gray-600">Hazardous: batteries, chemicals, electronics</div>
                <div className="text-xs text-red-600 mt-2">Special disposal required</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-700 text-white flex items-center justify-center mr-2">🗑️</div>
                  <div className="font-bold text-gray-700">Black Bin</div>
                </div>
                <div className="text-sm text-gray-600">Non-recyclable general waste</div>
                <div className="text-xs text-gray-600 mt-2">Landfill disposal only</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
          {sortedBins.map(([binType, binData]) => (
            <div key={binType} className="p-5 rounded-xl border-2 shadow-sm break-words overflow-hidden" style={{ borderColor: binData.color }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-lg mr-3 flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: binData.color }}
                  >
                    {binData.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{binData.name}</h4>
                    <p className="text-sm text-gray-600">{binData.count} item(s)</p>
                  </div>
                </div>
                <div 
                  className="px-3 py-1 rounded-full text-white font-medium text-sm"
                  style={{ backgroundColor: binData.color }}
                >
                  {binType.charAt(0).toUpperCase() + binType.slice(1)}
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Detected Items:</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {binData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition">
                      <div className="flex items-center">
                        <span className="mr-2">{item.icon || '📦'}</span>
                        <span className="text-sm truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-medium text-sm bg-white px-2 py-1 rounded">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="font-medium text-gray-700 mb-2">Disposal Instructions:</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {binData.items[0]?.disposalInstructions?.slice(0, 3).map((instruction, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span className="leading-tight">{instruction}</span>
                    </li>
                  )) || [
                    `Place in ${binData.name}`,
                    'Follow local guidelines',
                    'Proper disposal required'
                  ].map((instruction, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span className="leading-tight">{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">💡</span>
            <div>
              <h5 className="font-medium text-green-800">Waste Sorting Tip:</h5>
              <p className="text-sm text-green-700">
                {sortedBins.length > 1 
                  ? "You have multiple waste types. Please separate them into different colored bins."
                  : "Place all items in the recommended bin above."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Get color based on waste type for badges
  const getWasteColor = (type) => {
    const colors = {
      biodegradable: 'bg-green-100 border-green-200 text-green-800',
      recyclable: 'bg-blue-100 border-blue-200 text-blue-800',
      hazardous: 'bg-red-100 border-red-200 text-red-800',
      non_recyclable: 'bg-gray-100 border-gray-200 text-gray-800',
    };
    return colors[type?.toLowerCase()] || 'bg-gray-100 border-gray-200 text-gray-800';
  };

  // Get category display name
  const getCategoryDisplayName = (category) => {
    const names = {
      biodegradable: 'Biodegradable',
      recyclable: 'Recyclable',
      hazardous: 'Hazardous',
      non_recyclable: 'Non-Recyclable'
    };
    return names[category?.toLowerCase()] || category || 'Unknown';
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      biodegradable: '🍃',
      recyclable: '♻️',
      hazardous: '⚠️',
      non_recyclable: '🗑️'
    };
    return icons[category?.toLowerCase()] || '📦';
  };

  // Export to CSV
  const exportToCSV = async () => {
    if (detectionHistory.length === 0) {
      alert('No detection data to export!');
      return;
    }

    setIsExporting(true);
    
    try {
      const headers = ['Date', 'Time', 'Object Name', 'Category', 'Bin Color', 'Bin Name', 'AI Confidence %', 'Disposal Instructions'];
      const csvRows = [
        headers.join(','),
        ...detectionHistory.map(item => {
          const date = new Date(item.timestamp);
          const formattedDate = date.toLocaleDateString();
          const formattedTime = date.toLocaleTimeString();
          
          const disposalInstructions = item.disposalInstructions 
            ? item.disposalInstructions.join('; ') 
            : 'Place in appropriate bin';
          
          return [
            `"${formattedDate}"`,
            `"${formattedTime}"`,
            `"${item.name}"`,
            `"${getCategoryDisplayName(item.category)}"`,
            `"${item.dustbinColor}"`,
            `"${item.dustbinName}"`,
            item.confidence,
            `"${disposalInstructions}"`
          ].join(',');
        })
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `waste_detection_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`✅ Exported ${detectionHistory.length} records to CSV successfully!`);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Clear all data
  const clearData = () => {
    if (window.confirm('Are you sure you want to clear all detection data? This action cannot be undone.')) {
      setDetectionHistory([]);
      setDetectionCount(0);
      setPredictionResults([]);
      localStorage.removeItem('wasteDetectionHistory');
      alert('All detection data has been cleared.');
    }
  };

  // Get backend status indicator
  const getStatusIndicator = () => {
    switch (backendStatus) {
      case 'connected':
        return { text: '✅ Backend Connected', color: 'bg-green-500', icon: '✅' };
      case 'checking':
        return { text: '🔄 Checking Backend...', color: 'bg-yellow-500', icon: '🔄' };
      case 'error':
        return { text: '❌ Backend Error', color: 'bg-red-500', icon: '❌' };
      default:
        return { text: '❌ Backend Disconnected', color: 'bg-red-500', icon: '❌' };
    }
  };

  const status = getStatusIndicator();

  // Calculate waste distribution
  const calculateWasteDistribution = () => {
    if (predictionResults.length === 0) return null;
    
    const counts = {
      biodegradable: 0,
      recyclable: 0,
      hazardous: 0,
      non_recyclable: 0
    };
    
    predictionResults.forEach(item => {
      const category = item.category?.toLowerCase();
      if (counts.hasOwnProperty(category)) {
        counts[category]++;
      }
    });
    
    const total = predictionResults.length;
    
    return {
      biodegradable: counts.biodegradable,
      recyclable: counts.recyclable,
      hazardous: counts.hazardous,
      non_recyclable: counts.non_recyclable,
      biodegradablePercent: Math.round((counts.biodegradable / total) * 100),
      recyclablePercent: Math.round((counts.recyclable / total) * 100),
      hazardousPercent: Math.round((counts.hazardous / total) * 100),
      non_recyclablePercent: Math.round((counts.non_recyclable / total) * 100)
    };
  };

  const wasteDistribution = calculateWasteDistribution();

  // Group detection history by date
  const groupHistoryByDate = () => {
    const grouped = {};
    detectionHistory.forEach(item => {
      const date = item.date || new Date(item.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  const groupedHistory = groupHistoryByDate();
  const historyDates = Object.keys(groupedHistory).sort().reverse();

  // Display limited or all history
  const visibleHistory = showAllHistory 
    ? detectionHistory 
    : detectionHistory.slice(0, 10);

  // Calculate statistics
  const totalDetections = detectionHistory.length;
  const averageConfidence = detectionHistory.length > 0 
    ? Math.round(detectionHistory.reduce((sum, item) => sum + item.confidence, 0) / detectionHistory.length)
    : 0;
  
  const uniqueCategories = new Set(detectionHistory.map(item => item.category)).size;

  // Calculate category distribution in history
  const calculateHistoryDistribution = () => {
    const distribution = {
      biodegradable: 0,
      recyclable: 0,
      hazardous: 0,
      non_recyclable: 0
    };
    
    detectionHistory.forEach(item => {
      const category = item.category?.toLowerCase();
      if (distribution.hasOwnProperty(category)) {
        distribution[category]++;
      }
    });
    
    return distribution;
  };

  const historyDistribution = calculateHistoryDistribution();

  return (
    <div className="space-y-6">
      {/* Backend Status */}
      <div className={`text-white px-4 py-3 rounded-lg ${status.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg mr-2">{status.icon}</span>
            <span className="font-medium">{status.text}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm opacity-90">
              Port: 5001 • Bins: 4 • Object Detection: {backendStatus === 'connected' ? 'Ready' : 'Offline'}
            </span>
            <button 
              onClick={checkBackendHealth}
              className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          {backendStatus === 'disconnected' && (
            <div className="mt-2 text-sm">
              Make sure your backend is running with: <code className="bg-gray-100 px-2 py-1 rounded">python app.py</code>
            </div>
          )}
        </div>
      )}

      {/* Object Detection Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl">AI Object Detection</h3>
            <p className="text-sm opacity-90 mt-1">
              Point camera at waste objects. AI will detect and classify into 4 bins automatically.
            </p>
          </div>
          {detectionExamples.length > 0 && (
            <div className="hidden md:block">
              <div className="text-sm opacity-90 mb-1">Try detecting:</div>
              <div className="flex flex-wrap gap-2">
                {detectionExamples.slice(0, 4).map((example, idx) => (
                  <span key={idx} className="bg-white bg-opacity-20 px-3 py-1 rounded text-xs">
                    {example}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setMode('single')}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            mode === 'single' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📦 Single Object
        </button>
        <button
          onClick={() => setMode('multi')}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            mode === 'multi' 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📦📦 Multiple Objects
        </button>
      </div>

      {/* Camera Container */}
      <div className="relative h-[500px] bg-black rounded-xl overflow-hidden border-2 border-gray-700">
        {isCameraActive ? (
          !image ? (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }}
              className="w-full h-full object-cover"
              onUserMediaError={(err) => setError(`Camera error: ${err.message}`)}
            />
          ) : (
            <img 
              src={image} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-60">📷</div>
              <div className="text-white text-xl font-medium mb-2">Camera is OFF</div>
              {backendStatus !== 'connected' ? (
                <div className="text-white text-sm opacity-75">
                  Connect backend first to enable camera
                </div>
              ) : (
                <div className="text-white text-sm opacity-75">
                  Click "Start Camera" to begin object detection
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="flex flex-wrap gap-4">
        {!isCameraActive ? (
          <button
            onClick={startCamera}
            disabled={backendStatus !== 'connected'}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-3 shadow-lg transition-all"
          >
            <Camera className="h-5 w-5" />
            <span>Start Camera</span>
          </button>
        ) : (
          <>
            {!image ? (
              <button
                onClick={captureImage}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-3 flex-1 min-w-[200px] shadow-lg transition-all"
              >
                <Camera className="h-5 w-5" />
                <span>Capture Image</span>
              </button>
            ) : (
              <>
                <button
                  onClick={retakeImage}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-3 shadow transition-all"
                >
                  <RotateCw className="h-5 w-5" />
                  <span>Retake</span>
                </button>
                <button
                  onClick={detectObjects}
                  disabled={isUploading || backendStatus !== 'connected'}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-3 flex-1 min-w-[200px] shadow-lg transition-all disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Detecting Objects...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>{mode === 'single' ? 'Detect Object' : 'Detect Objects'}</span>
                    </>
                  )}
                </button>
              </>
            )}
            <button
              onClick={stopCamera}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-3 shadow transition-all"
            >
              <X className="h-5 w-5" />
              <span>Stop Camera</span>
            </button>
          </>
        )}
      </div>

      {/* Results Display */}
      {predictionResults.length > 0 && (
        <div className="space-y-6">
          {/* AI Detection Results */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <CheckCircle className="h-7 w-7 text-green-500 mr-3" />
                  Object Detection Results
                </h3>
                <p className="text-gray-600 mt-1">
                  Found {predictionResults.length} object{predictionResults.length > 1 ? 's' : ''} • YOLOv8 AI Model
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  Real-time AI
                </div>
                {wasteDistribution && (
                  <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium">
                    🍃 {wasteDistribution.biodegradable + wasteDistribution.recyclable} Recyclable/Compostable
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              {predictionResults.map((result, index) => (
                <div key={result.id} className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-gray-800">{result.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getWasteColor(result.category)}`}>
                          {getCategoryDisplayName(result.category)}
                        </span>
                        <span className="text-sm text-gray-500">Object #{index + 1}</span>
                      </div>
                      {/* Bin indicator */}
                      <div className="flex items-center mt-2">
                        <div 
                          className="w-4 h-4 rounded mr-2"
                          style={{ backgroundColor: result.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">
                          {result.dustbinName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {Math.round(result.confidence * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">AI Confidence</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Detection Confidence</span>
                      <span>{Math.round(result.confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          result.confidence > 0.7 ? 'bg-green-500' :
                          result.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${result.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {result.description && (
                    <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {result.description}
                    </p>
                  )}
                  
                  {/* Disposal Instructions */}
                  {result.disposalInstructions && result.disposalInstructions.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Disposal Instructions:</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {result.disposalInstructions.slice(0, 3).map((instruction, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Waste Distribution Summary */}
          {wasteDistribution && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Waste Distribution Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600">{wasteDistribution.biodegradable}</div>
                  <div className="text-sm font-medium text-gray-700">Biodegradable</div>
                  <div className="text-xs text-gray-500">{wasteDistribution.biodegradablePercent}% of total</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{wasteDistribution.recyclable}</div>
                  <div className="text-sm font-medium text-gray-700">Recyclable</div>
                  <div className="text-xs text-gray-500">{wasteDistribution.recyclablePercent}% of total</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="text-3xl font-bold text-red-600">{wasteDistribution.hazardous}</div>
                  <div className="text-sm font-medium text-gray-700">Hazardous</div>
                  <div className="text-xs text-gray-500">{wasteDistribution.hazardousPercent}% of total</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-300">
                  <div className="text-3xl font-bold text-gray-600">{wasteDistribution.non_recyclable}</div>
                  <div className="text-sm font-medium text-gray-700">Non-Recyclable</div>
                  <div className="text-xs text-gray-500">{wasteDistribution.non_recyclablePercent}% of total</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>✅ Total items detected: {predictionResults.length}</p>
                <p className="mt-1">
                  🌿 Environmental impact: {wasteDistribution.biodegradable + wasteDistribution.recyclable} items can be recycled/composted
                </p>
              </div>
            </div>
          )}

          {/* Bin Recommendations */}
          {renderBinRecommendations()}
        </div>
      )}

      {/* Data Management Section */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Detection History & Analytics</h3>
            <p className="text-white
            ">Track all your object detection records and analytics</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportToCSV}
              disabled={detectionHistory.length === 0 || isExporting}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-medium py-2.5 px-5 rounded-lg flex items-center space-x-2 shadow transition disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
            
            <button
              onClick={clearData}
              disabled={detectionHistory.length === 0}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-medium py-2.5 px-5 rounded-lg flex items-center space-x-2 shadow transition disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
            <div className="text-4xl font-bold text-gray-800">{totalDetections}</div>
            <div className="text-blue-700 font-medium mt-2">Total Detections</div>
            <div className="text-sm text-gray-600 mt-1">All objects detected by AI</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
            <div className="text-4xl font-bold text-gray-800">
              {averageConfidence}%
            </div>
            <div className="text-green-700 font-medium mt-2">Avg AI Confidence</div>
            <div className="text-sm text-gray-600 mt-1">Average detection accuracy</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
            <div className="text-4xl font-bold text-gray-800">{detectionHistory.length}</div>
            <div className="text-purple-700 font-medium mt-2">Total Records</div>
            <div className="text-sm text-gray-600 mt-1">Historical detection entries</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-6 rounded-2xl border border-amber-200">
            <div className="text-4xl font-bold text-gray-800">
              {uniqueCategories}
            </div>
            <div className="text-amber-700 font-medium mt-2">Waste Categories</div>
            <div className="text-sm text-gray-600 mt-1">Different waste types detected</div>
          </div>
        </div>

        {/* Category Distribution */}
        {detectionHistory.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📈</span>
              Category Distribution (All Time)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">🍃</span>
                  <div>
                    <div className="text-lg font-bold text-gray-800">{historyDistribution.biodegradable}</div>
                    <div className="text-sm text-green-600 font-medium">Biodegradable</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {totalDetections > 0 ? Math.round((historyDistribution.biodegradable / totalDetections) * 100) : 0}% of total
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">♻️</span>
                  <div>
                    <div className="text-lg font-bold text-gray-800">{historyDistribution.recyclable}</div>
                    <div className="text-sm text-blue-600 font-medium">Recyclable</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {totalDetections > 0 ? Math.round((historyDistribution.recyclable / totalDetections) * 100) : 0}% of total
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">⚠️</span>
                  <div>
                    <div className="text-lg font-bold text-gray-800">{historyDistribution.hazardous}</div>
                    <div className="text-sm text-red-600 font-medium">Hazardous</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {totalDetections > 0 ? Math.round((historyDistribution.hazardous / totalDetections) * 100) : 0}% of total
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-300">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">🗑️</span>
                  <div>
                    <div className="text-lg font-bold text-gray-800">{historyDistribution.non_recyclable}</div>
                    <div className="text-sm text-gray-600 font-medium">Non-Recyclable</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {totalDetections > 0 ? Math.round((historyDistribution.non_recyclable / totalDetections) * 100) : 0}% of total
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Detections Table */}
        {detectionHistory.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-800">Recent Detections</h4>
                <p className="text-gray-600">
                  Showing {showAllHistory ? 'all' : '10 latest'} of {detectionHistory.length} records
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                >
                  {showAllHistory ? 'Show Less' : 'Show All'}
                </button>
              </div>
            </div>
            
            {/* Group by Date (if showing all) */}
            {showAllHistory ? (
              <div className="space-y-6">
                {historyDates.map(date => (
                  <div key={date} className="mb-6">
                    <h5 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">
                      📅 {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({groupedHistory[date].length} objects)
                      </span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {groupedHistory[date].map((item, idx) => (
                        <div key={`${date}-${idx}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-semibold text-gray-800">{item.name}</div>
                              <div className="flex items-center mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getWasteColor(item.category)}`}>
                                  {getCategoryDisplayName(item.category)}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-800">{item.confidence}%</div>
                              <div className="text-xs text-gray-500">AI</div>
                            </div>
                          </div>
                          <div className="flex items-center mt-2">
                            <div 
                              className="w-3 h-3 rounded mr-2"
                              style={{ backgroundColor: item.color || '#666666' }}
                            ></div>
                            <span className="text-sm text-gray-700 truncate">{item.dustbinName}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Table view for limited display
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-4 px-6 text-gray-700 font-semibold">Time</th>
                      <th className="text-left py-4 px-6 text-gray-700 font-semibold">Object</th>
                      <th className="text-left py-4 px-6 text-gray-700 font-semibold">Category</th>
                      <th className="text-left py-4 px-6 text-gray-700 font-semibold">Bin</th>
                      <th className="text-left py-4 px-6 text-gray-700 font-semibold">AI Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detectionHistory.slice(0, 10).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="py-4 px-6">
                          <div className="text-gray-700 font-medium text-sm">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{getCategoryIcon(item.category)}</span>
                            <div>
                              <div className="font-semibold text-gray-800">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                            item.category === 'recyclable' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            item.category === 'biodegradable' ? 'bg-green-100 text-green-800 border border-green-200' :
                            item.category === 'hazardous' ? 'bg-red-100 text-red-800 border border-red-200' :
                            'bg-gray-100 text-gray-800 border border-gray-300'
                          }`}>
                            {getCategoryDisplayName(item.category)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded mr-2"
                              style={{ backgroundColor: item.color || '#666666' }}
                            ></div>
                            <span className="text-sm text-gray-700">{item.dustbinName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className={`h-2 rounded-full ${
                                  item.confidence > 70 ? 'bg-green-500' :
                                  item.confidence > 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(item.confidence, 100)}%` }}
                              ></div>
                            </div>
                            <span className={`font-bold text-sm ${
                              item.confidence > 70 ? 'text-green-600' :
                              item.confidence > 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {item.confidence}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {detectionHistory.length > 10 && (
                  <div className="py-4 px-6 text-center border-t border-gray-100">
                    <button
                      onClick={() => setShowAllHistory(true)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all {detectionHistory.length} records →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {detectionHistory.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-5xl mb-4 opacity-30">📊</div>
            <h4 className="text-xl font-medium text-gray-700 mb-2">No Detection History Yet</h4>
            <p className="text-gray-500 max-w-md mx-auto">
              Start using the camera to detect waste objects. Your detection history will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraSection;