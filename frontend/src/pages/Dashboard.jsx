import React, { useState } from 'react'
import CameraSection from '../components/CameraSection'
import StatsCards from '../components/StatsCards'
import WasteCategoryCard from '../components/WasteCategoryCard'
import AnalyticsChart from '../components/AnalyticsChart'
import '../styles/dashboard.css'

const Dashboard = () => {
  const [detections, setDetections] = useState([])
  const [activeDetection, setActiveDetection] = useState(null)
  const [stats, setStats] = useState({
    totalDetections: 1247,
    accuracy: 94.2,
    recycledToday: '347kg',
    carbonSaved: '245kg',
    categories: {
      biodegradable: 35,
      recyclable: 45,
      hazardous: 12,
      nonRecyclable: 8
    },
    confidence_stats: {
      average: 94.2,
      maximum: 99.5,
      minimum: 75.3
    }
  })

  const handleSingleDetection = (detectionData) => {
    // Format the detection data for the Dashboard
    const newDetection = {
      id: detectionData.id || Date.now(),
      name: detectionData.name || 'Detected Object',
      category: detectionData.category || 'unknown',
      confidence: detectionData.confidence || Math.floor(Math.random() * 20) + 80,
      time: 'Just now',
      timestamp: new Date().toISOString()
    };
    
    console.log('New detection from CameraSection:', newDetection);
    
    setActiveDetection(newDetection);
    // Keep only last 10 detections
    setDetections(prev => [newDetection, ...prev.slice(0, 9)]);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalDetections: prev.totalDetections + 1,
      categories: {
        ...prev.categories,
        [newDetection.category]: (prev.categories[newDetection.category] || 0) + 1
      }
    }));
  }

  const handleMultipleDetections = (detectionsArray) => {
    // Process multiple detections
    if (detectionsArray && detectionsArray.length > 0) {
      const now = Date.now();
      const formattedDetections = detectionsArray.map((det, index) => ({
        id: det.id || `${now}_${index}`,
        name: det.name || `Object ${index + 1}`,
        category: det.category || 'unknown',
        confidence: det.confidence || Math.floor(Math.random() * 20) + 80,
        time: 'Just now', // All get same timestamp since detected together
        timestamp: new Date().toISOString(),
        // Keep original data for display
        originalData: det
      }));
      
      console.log('Multiple detections from CameraSection:', formattedDetections.length, 'objects');
      
      // Set the first detection as active
      setActiveDetection(formattedDetections[0]);
      
      // Add ALL detected objects to recent activity
      // Keep only last 20 detections total
      setDetections(prev => [...formattedDetections, ...prev.slice(0, 20 - formattedDetections.length)]);
      
      // Update stats with ALL detections
      const categoryCounts = formattedDetections.reduce((acc, det) => {
        const category = det.category || 'unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      
      setStats(prev => ({
        ...prev,
        totalDetections: prev.totalDetections + formattedDetections.length,
        categories: {
          ...prev.categories,
          ...Object.keys(categoryCounts).reduce((acc, category) => {
            acc[category] = (prev.categories[category] || 0) + categoryCounts[category];
            return acc;
          }, {})
        }
      }));
    }
  }

  const wasteCategories = [
    {
      id: 1,
      name: 'Biodegradable',
      color: 'green',
      icon: '🌿',
      examples: ['Food waste', 'Paper', 'Yard trimmings', 'Wood'],
      dustbin: 'Green',
      decomposition: '2 weeks - 5 years',
      impact: 'Low (Produces compost)'
    },
    {
      id: 2,
      name: 'Recyclable',
      color: 'blue',
      icon: '♻️',
      examples: ['Plastic bottles', 'Glass', 'Metal cans', 'Cardboard'],
      dustbin: 'Blue',
      decomposition: '50 - 1000 years',
      impact: 'Medium (Saves resources)'
    },
    {
      id: 3,
      name: 'Hazardous',
      color: 'red',
      icon: '⚠️',
      examples: ['Batteries', 'Chemicals', 'Electronics', 'Medicines'],
      dustbin: 'Red',
      decomposition: '100+ years',
      impact: 'High (Toxic to environment)'
    },
    {
      id: 4,
      name: 'Non-Recyclable',
      color: 'gray',
      icon: '🚫',
      examples: ['Plastic bags', 'Ceramics', 'Composite materials', 'Styrofoam'],
      dustbin: 'Black',
      decomposition: '500+ years',
      impact: 'High (Landfill waste)'
    }
  ]

  return (
    <div className="dashboard-layout bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
      {/* Navigation Header */}
      <header className="dashboard-header sticky top-0 z-50 rounded-b-3xl px-4 md:px-8 py-4 mb-6 md:mb-8 bg-gradient-to-r from-gray-100 to-blue-50 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl recycling-symbol float-animation">
                <span className="text-2xl md:text-3xl text-white">♻️</span>
              </div>
              <div className="absolute -inset-3 md:-inset-4 bg-green-500/20 rounded-3xl blur-xl -z-10"></div>
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-green-700 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                EcoVision AI
              </h1>
              <p className="text-sm md:text-base text-gray-900 font-medium">
                Intelligent Waste Management System
              </p>
            </div>
          </div>
          
          {/* Live Detection Status */}
          <div className="relative group">
            <div className="flex items-center space-x-2 px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full shadow-sm">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs md:text-sm font-semibold text-gray-900">Live Detection</span>
            </div>
            <div className="absolute left-0 mt-2 w-56 p-3 bg-white shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border border-gray-200">
              <p className="text-sm text-gray-800 font-medium">AI is actively analyzing camera feed</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 pb-8 md:pb-12">
        {/* First Row: Camera + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Camera Section - Light outer, dark inner */}
          <div className="lg:col-span-8 dashboard-card bg-gradient-to-br from-gray-100 to-gray-50 shadow-xl">
            {/* Header */}
            <div className="card-header bg-green-200 border-b border-green-300">
              <h3 className="flex items-center font-bold text-lg text-gray-300">
                <span className="card-header-icon mr-2">📷</span>
                <span className="text-gray-300">
                  Live Object Detection
                </span>
                <span className="ml-2 md:ml-3 text-xs md:text-sm px-2 py-0.5 md:px-3 md:py-1 bg-red-600 text-white rounded-full animate-pulse">
                  LIVE
                </span>
              </h3>
            </div>
            {/* Body */}
            <div className="card-body h-[300px] md:h-[350px] overflow-auto p-4 bg-gray-800 rounded-b-xl">
              <div className="h-full">
                <CameraSection 
                  onSingleDetection={handleSingleDetection}
                  onObjectsDetected={handleMultipleDetections}
                />
              </div>
            </div>
          </div>

          {/* System Statistics Section - Light outer, dark inner */}
          <div className="lg:col-span-4 dashboard-card bg-gradient-to-br from-gray-100 to-gray-50 shadow-xl">
            <div className="card-header bg-green-200 border-b border-green-300">
              <h3 className="flex items-center text-gray-900 font-bold text-lg">
                <span className="card-header-icon mr-2">📊</span>
                System Statistics
              </h3>
            </div>
            <div className="card-body h-[300px] md:h-[350px] overflow-auto p-4 bg-gray-800 rounded-b-xl">
              {/* System Status */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-white mb-3">System Status</h4>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl border border-gray-600">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span className="font-medium text-green-300">Operational</span>
                  </div>
                  <span className="text-sm text-white">Uptime: 99.7%</span>
                </div>
              </div>

              {/* Stats Cards - Modified for dark background */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-br from-gray-700 to-gray-600 p-4 rounded-xl border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs text-white font-medium uppercase tracking-wider">Total Detections</h3>
                      <p className="text-2xl font-bold text-white mt-1">
                        {stats?.totalDetections?.toLocaleString() || "1,247"}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-lg text-white">📊</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-700 to-gray-600 p-4 rounded-xl border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs text-white font-medium uppercase tracking-wider">Avg Confidence</h3>
                      <p className="text-2xl font-bold text-white mt-1">
                        {stats?.accuracy?.toFixed(1) || "94.2"}%
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-lg text-white">🎯</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="mt-4 pt-3 border-t border-gray-600">
                <h4 className="text-xs font-semibold text-white mb-2">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white">Max Confidence</span>
                    <span className="font-medium text-green-300">{stats.confidence_stats.maximum}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white">Min Confidence</span>
                    <span className="font-medium text-yellow-300">{stats.confidence_stats.minimum}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white">Response Time</span>
                    <span className="font-medium text-blue-300">24ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Analytics Chart Only */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Analytics Chart - Full width */}
          <div className="dashboard-card bg-gradient-to-br from-gray-100 to-gray-50 shadow-xl">
            <div className="card-header bg-green-200 border-b border-green-300">
              <h3 className="text-gray-900 font-bold text-lg">
                <span className="card-header-icon">📈</span>
                Waste Distribution Analytics
              </h3>
            </div>
            <div className="card-body h-[250px] md:h-[300px] overflow-hidden p-4 bg-gray-800 rounded-b-xl">
              <div className="h-full">
                <AnalyticsChart data={stats.categories} />
              </div>
            </div>
          </div>
        </div>

        {/* Third Row: Waste Categories + Recent Detections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Waste Categories */}
          <div className="lg:col-span-2 dashboard-card bg-gradient-to-br from-gray-100 to-gray-50 shadow-xl">
            <div className="card-header bg-green-200 border-b border-green-300">
              <h3 className="text-gray-900 font-bold text-lg">
                <span className="card-header-icon">🗂️</span>
                Waste Classification Guide
              </h3>
            </div>
            <div className="card-body h-[350px] md:h-[400px] overflow-auto p-4 bg-gray-800 rounded-b-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wasteCategories.map(category => (
                  <div key={category.id} className="bg-gradient-to-br from-gray-700 to-gray-600 p-4 rounded-xl border border-gray-600 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                        category.color === 'green' ? 'bg-green-700' :
                        category.color === 'blue' ? 'bg-blue-700' :
                        category.color === 'red' ? 'bg-red-700' :
                        'bg-gray-700'
                      }`}>
                        <span className="text-xl text-white">{category.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white">{category.name}</h4>
                        <p className="text-sm text-white">Dustbin: {category.dustbin}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-white mb-1">Examples:</h5>
                      <p className="text-sm text-white">{category.examples.join(', ')}</p>
                    </div>
                    <div className="text-xs text-white space-y-1">
                      <div>Decomposition: {category.decomposition}</div>
                      <div>Impact: {category.impact}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Detections - FIXED: Shows MULTIPLE objects */}
          <div className="dashboard-card bg-gradient-to-br from-gray-100 to-gray-50 shadow-xl">
            <div className="card-header bg-green-200 border-b border-green-300">
              <h3 className="text-gray-900 font-bold text-lg">
                <span className="card-header-icon">🕒</span>
                Recent Activity ({detections.length})
              </h3>
            </div>
            <div className="card-body h-[350px] md:h-[400px] p-4 bg-gray-800 rounded-b-xl">
              <div className="h-full overflow-y-auto">
                {detections.length > 0 ? (
                  <div className="space-y-3">
                    {detections.map((detection, index) => {
                      // Get color based on category
                      const getColor = (category) => {
                        if (!category) return 'gray';
                        if (category.includes('bio') || category === 'biodegradable') return 'green';
                        if (category.includes('recy') || category === 'recyclable') return 'blue';
                        if (category.includes('haz') || category === 'hazardous') return 'red';
                        if (category.includes('non') || category === 'nonRecyclable') return 'gray';
                        return 'gray';
                      };
                      
                      const color = getColor(detection.category);
                      
                      // Calculate time difference
                      const getTimeDifference = (timestamp) => {
                        if (!timestamp) return 'Just now';
                        const now = new Date();
                        const detectionTime = new Date(timestamp);
                        const diffMs = now - detectionTime;
                        const diffMins = Math.floor(diffMs / (1000 * 60));
                        
                        if (diffMins < 1) return 'Just now';
                        if (diffMins === 1) return '1 min ago';
                        if (diffMins < 60) return `${diffMins} mins ago`;
                        const diffHours = Math.floor(diffMins / 60);
                        if (diffHours === 1) return '1 hour ago';
                        if (diffHours < 24) return `${diffHours} hours ago`;
                        const diffDays = Math.floor(diffHours / 24);
                        if (diffDays === 1) return 'Yesterday';
                        return `${diffDays} days ago`;
                      };
                      
                      const timeAgo = getTimeDifference(detection.timestamp);
                      
                      return (
                        <div 
                          key={detection.id || index}
                          className="flex items-center p-3 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg hover:shadow-md transition-shadow border border-gray-600"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                            color === 'green' ? 'bg-green-700' :
                            color === 'blue' ? 'bg-blue-700' :
                            color === 'red' ? 'bg-red-700' :
                            'bg-gray-700'
                          }`}>
                            <span className="text-lg text-white">
                              {color === 'green' ? '🌿' : 
                               color === 'blue' ? '♻️' : 
                               color === 'red' ? '⚠️' : '🚫'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-base text-white truncate">
                              {detection.name || `Object ${index + 1}`}
                            </div>
                            <div className="flex items-center text-sm space-x-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                                color === 'green' ? 'bg-green-800 text-green-200' :
                                color === 'blue' ? 'bg-blue-800 text-blue-200' :
                                color === 'red' ? 'bg-red-800 text-red-200' :
                                'bg-gray-700 text-white'
                              }`}>
                                {detection.category || 'Unknown'}
                              </span>
                              <span className="text-white whitespace-nowrap font-medium">
                                {detection.confidence ? `${detection.confidence}%` : '--%'}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-white whitespace-nowrap flex-shrink-0 ml-2">
                            {detection.time || timeAgo}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Empty state when no detections
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="text-5xl mb-4 opacity-50">📭</div>
                    <p className="text-gray-400 text-lg font-medium mb-2">No Recent Activity</p>
                    <p className="text-gray-500 text-sm max-w-xs">
                      Objects detected by the AI will appear here automatically
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fourth Row: Environmental Impact + Dustbin Status */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Environmental Impact */}
          <div className="dashboard-card bg-gradient-to-br from-gray-100 to-gray-50 shadow-xl">
            <div className="card-header bg-green-200 border-b border-green-300">
              <h3 className="text-gray-900 font-bold text-lg">
                <span className="card-header-icon">🌍</span>
                Environmental Impact
              </h3>
            </div>
            <div className="card-body h-[180px] md:h-[220px] p-4 bg-gray-800 rounded-b-xl">
              <div className="h-full flex flex-col justify-center">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-green-700 to-green-600 rounded-xl border border-green-600">
                    <div className="text-xl md:text-2xl font-bold text-white">{stats.carbonSaved}</div>
                    <div className="text-xs md:text-sm text-green-200 mt-1 font-medium">Carbon Saved</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-blue-700 to-blue-600 rounded-xl border border-blue-600">
                    <div className="text-xl md:text-2xl font-bold text-white">62%</div>
                    <div className="text-xs md:text-sm text-blue-200 mt-1 font-medium">Landfill Reduced</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-purple-700 to-purple-600 rounded-xl border border-purple-600">
                    <div className="text-xl md:text-2xl font-bold text-white">8.4</div>
                    <div className="text-xs md:text-sm text-purple-200 mt-1 font-medium">Eco Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dustbin Status */}
          <div className="lg:col-span-3 dashboard-card bg-gradient-to-br from-gray-100 to-gray-50 shadow-xl">
            <div className="card-header bg-green-200 border-b border-green-300">
              <h3 className="text-gray-900 font-bold text-lg">
                <span className="card-header-icon">🗑️</span>
                Smart Dustbin Status
              </h3>
            </div>
            <div className="card-body h-[180px] md:h-[220px] overflow-auto p-4 bg-gray-800 rounded-b-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
                {[
                  { color: 'green', name: 'Green Bin', type: 'Biodegradable', fill: 65, icon: '🌿' },
                  { color: 'blue', name: 'Blue Bin', type: 'Recyclable', fill: 82, icon: '♻️' },
                  { color: 'red', name: 'Red Bin', type: 'Hazardous', fill: 28, icon: '⚠️' },
                  { color: 'gray', name: 'Black Bin', type: 'Non-Recyclable', fill: 45, icon: '🚫' }
                ].map((bin, index) => (
                  <div key={index} className="flex flex-col items-center p-4 bg-gradient-to-b from-gray-700 to-gray-600 rounded-xl hover:shadow-lg transition-shadow border border-gray-600">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                      bin.color === 'green' ? 'bg-green-700' :
                      bin.color === 'blue' ? 'bg-blue-700' :
                      bin.color === 'red' ? 'bg-red-700' :
                      'bg-gray-700'
                    }`}>
                      <span className="text-2xl text-white">{bin.icon}</span>
                    </div>
                    <div className="font-semibold text-base text-white text-center mb-1">{bin.name}</div>
                    <div className="text-sm text-white text-center mb-3">{bin.type}</div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full ${
                          bin.color === 'green' ? 'bg-green-500' :
                          bin.color === 'blue' ? 'bg-blue-500' :
                          bin.color === 'red' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${bin.fill}%` }}
                      ></div>
                    </div>
                    <div className="text-sm font-medium text-white">{bin.fill}% Full</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-400 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl p-4 md:p-6 shadow-lg">
          <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-3 md:mb-4">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="text-xs md:text-sm text-black font-bold">AI System Active • Real-time Processing</span>
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-600 rounded-full animate-pulse"></div>
          </div>
          <p className="text-center text-xs md:text-sm text-black mb-2">
            <strong className="text-black">EcoVision AI Waste Management System v2.0</strong> • 
            <span className="text-black"> Powered by TensorFlow, React & Computer Vision</span>
          </p>
          <p className="text-center text-xs text-black">
            📍 Smart Cities Initiative • ♻️ Saving the Planet One Detection at a Time
          </p>
        </footer>
      </main>
    </div>
  )
}

export default Dashboard