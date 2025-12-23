import React, { useState, useEffect } from 'react'
import CameraSection from '../components/CameraSection'
import ObjectDetails from '../components/ObjectDetails'
import { wasteAPI } from '../services/api'
import { Bar, Pie, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

const AdminPanel = () => {
  const [detectedObjects, setDetectedObjects] = useState([])
  const [selectedObject, setSelectedObject] = useState(null)
  const [stats, setStats] = useState({
    total_detections: 1247,
    confidence_stats: { average: 94.2, maximum: 99.5, minimum: 75.3 },
    category_distribution: {
      biodegradable: 35,
      recyclable: 45,
      hazardous: 12,
      'non-recyclable': 8
    },
    daily_stats: [] // Will be populated with current dates
  })
  const [history, setHistory] = useState([
    { id: 1, object_name: 'Plastic Bottle', waste_category: 'recyclable', confidence: 92.5, timestamp: new Date(Date.now() - 5*60*1000).toISOString() },
    { id: 2, object_name: 'Banana Peel', waste_category: 'biodegradable', confidence: 98.2, timestamp: new Date(Date.now() - 15*60*1000).toISOString() },
    { id: 3, object_name: 'Battery', waste_category: 'hazardous', confidence: 95.7, timestamp: new Date(Date.now() - 30*60*1000).toISOString() },
    { id: 4, object_name: 'Pizza Box', waste_category: 'biodegradable', confidence: 87.3, timestamp: new Date(Date.now() - 45*60*1000).toISOString() },
    { id: 5, object_name: 'Glass Jar', waste_category: 'recyclable', confidence: 96.1, timestamp: new Date(Date.now() - 60*60*1000).toISOString() }
  ])
  const [loading, setLoading] = useState(false)

  // Function to generate last 5 days dates
  const generateLast5Days = () => {
    const dates = []
    for (let i = 4; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 60) + 40 // Random count between 40-100
      })
    }
    return dates
  }

  // Enhanced mock data for multiple objects
  const initialObjects = [
    {
      id: 'obj_001',
      name: 'Plastic Bottle',
      class: 'plastic_bottle',
      category: 'recyclable',
      confidence: 92.5,
      color: 'blue',
      dustbinColor: 'Blue',
      dustbinName: 'Blue Bin (Recycling)',
      icon: '♻️',
      description: '500ml PET plastic bottle detected. Rinse and recycle.',
      properties: { material: 'PET', size: '500ml', condition: 'Empty' },
      disposal_instructions: ['Rinse before recycling', 'Remove cap', 'Flatten if possible'],
      timestamp: new Date().toISOString(),
      bbox: { x: 100, y: 150, width: 80, height: 120 },
      time: '2 min ago'
    },
    {
      id: 'obj_002',
      name: 'Banana Peel',
      class: 'banana_peel',
      category: 'biodegradable',
      confidence: 98.2,
      color: 'green',
      dustbinColor: 'Green',
      dustbinName: 'Green Bin (Compost)',
      icon: '🍃',
      description: 'Banana peel detected. Perfect for composting.',
      properties: { material: 'Organic', decomposition: '2-3 weeks' },
      disposal_instructions: ['Compost bin', 'Will decompose naturally'],
      timestamp: new Date(Date.now() - 5*60*1000).toISOString(),
      bbox: { x: 200, y: 250, width: 60, height: 40 },
      time: '5 min ago'
    },
    {
      id: 'obj_003',
      name: 'AA Battery',
      class: 'battery',
      category: 'hazardous',
      confidence: 95.7,
      color: 'red',
      dustbinColor: 'Red',
      dustbinName: 'Red Bin (Hazardous)',
      icon: '⚠️',
      description: 'AA battery detected. Requires special disposal.',
      properties: { material: 'Lithium-ion', type: 'AA', voltage: '1.5V' },
      disposal_instructions: ['Special collection point', 'Do not mix with regular waste'],
      timestamp: new Date(Date.now() - 10*60*1000).toISOString(),
      bbox: { x: 300, y: 180, width: 40, height: 60 },
      time: '10 min ago'
    }
  ]

  useEffect(() => {
    // Initialize with mock data
    setDetectedObjects(initialObjects)
    setSelectedObject(initialObjects[0])
    
    // Initialize stats with current dates
    setStats(prev => ({
      ...prev,
      daily_stats: generateLast5Days()
    }))
    
    fetchDashboardData()
  }, [])

  // Mock API calls for demo
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update stats with current date
      const updatedStats = {
        ...stats,
        daily_stats: generateLast5Days(),
        total_detections: 1247 + Math.floor(Math.random() * 50),
        timestamp: new Date().toISOString()
      }
      setStats(updatedStats)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSingleDetection = (object) => {
    const newObject = {
      ...object,
      id: `obj_${Date.now()}`,
      timestamp: new Date().toISOString(),
      time: 'Just now'
    }
    
    setDetectedObjects(prev => [newObject, ...prev])
    setSelectedObject(newObject)
    
    // Update stats locally for demo
    setStats(prev => ({
      ...prev,
      total_detections: prev.total_detections + 1,
      category_distribution: {
        ...prev.category_distribution,
        [object.category]: (prev.category_distribution[object.category] || 0) + 1
      }
    }))
    
    // Add to history
    const newHistoryItem = {
      id: Date.now(),
      object_name: object.name,
      waste_category: object.category,
      confidence: object.confidence,
      timestamp: new Date().toISOString()
    }
    setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)])
  }

  const handleMultipleDetection = (objects) => {
    const newObjects = objects.map(obj => ({
      ...obj,
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      time: 'Just now'
    }))
    
    setDetectedObjects(prev => [...newObjects, ...prev])
    setSelectedObject(newObjects[0])
    
    // Update stats for multiple objects
    objects.forEach(obj => {
      setStats(prev => ({
        ...prev,
        total_detections: prev.total_detections + 1,
        category_distribution: {
          ...prev.category_distribution,
          [obj.category]: (prev.category_distribution[obj.category] || 0) + 1
        }
      }))
    })
  }

  const deleteDetection = async (id) => {
    if (window.confirm('Are you sure you want to delete this detection?')) {
      try {
        // Remove from detected objects
        const updatedObjects = detectedObjects.filter(obj => obj.id !== id)
        setDetectedObjects(updatedObjects)
        
        // If the deleted object was selected, select the next one
        if (selectedObject && selectedObject.id === id) {
          setSelectedObject(updatedObjects.length > 0 ? updatedObjects[0] : null)
        }
        
        // Remove from history
        setHistory(prev => prev.filter(item => item.id !== id))
        
        // In real app, you would call:
        // await wasteAPI.deleteDetection(id)
        
      } catch (error) {
        console.error('Error deleting detection:', error)
      }
    }
  }

  const clearAllDetections = () => {
    if (window.confirm('Are you sure you want to clear all detections?')) {
      setDetectedObjects([])
      setSelectedObject(null)
    }
  }

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const formatDateForChart = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const categoryChartData = {
    labels: Object.keys(stats.category_distribution || {}),
    datasets: [{
      label: 'Detections by Category',
      data: Object.values(stats.category_distribution || {}),
      backgroundColor: [
        '#4CAF50', // Green for biodegradable
        '#2196F3', // Blue for recyclable
        '#F44336', // Red for hazardous
        '#9E9E9E'  // Gray for non-recyclable
      ],
      borderColor: [
        '#388E3C',
        '#1976D2',
        '#D32F2F',
        '#616161'
      ],
      borderWidth: 1
    }]
  }

  const dailyChartData = {
    labels: (stats.daily_stats || []).map(stat => formatDateForChart(stat.date)),
    datasets: [{
      label: 'Daily Detections',
      data: (stats.daily_stats || []).map(stat => stat.count),
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      borderWidth: 3,
      tension: 0.4,
      fill: true
    }]
  }

  // Enhanced: Get system status
  const getSystemStatus = () => {
    const now = new Date()
    const hour = now.getHours()
    if (hour >= 9 && hour <= 17) {
      return { status: 'operational', label: 'Normal Operation', color: 'green' }
    } else if (hour >= 18 && hour <= 20) {
      return { status: 'maintenance', label: 'Evening Maintenance', color: 'yellow' }
    } else {
      return { status: 'reduced', label: 'Reduced Activity', color: 'orange' }
    }
  }

  const systemStatus = getSystemStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      {/* Enhanced Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <span className="text-white text-2xl">♻️</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                  EcoVision AI
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  Intelligent Waste Management Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl">
                <div className={`w-3 h-3 rounded-full bg-${systemStatus.color}-500 animate-pulse`}></div>
                <div>
                  <span className="text-sm font-medium text-gray-700">{systemStatus.label}</span>
                  <div className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">Admin</div>
                  <div className="text-xs text-gray-500">System Administrator</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Enhanced Main Content */}
      <main className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Real-time monitoring and analysis of waste classification system</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Last Updated:</span> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Today's Date:</span> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200">
                <div className="text-sm text-green-800 font-medium">Detected Objects</div>
                <div className="text-lg font-bold text-green-900">{detectedObjects.length} Items</div>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border border-blue-200">
                <div className="text-sm text-blue-800 font-medium">AI Model</div>
                <div className="text-lg font-bold text-blue-900">V2.5.1</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Camera and Object Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced Camera Section */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 transform transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <div className="mr-4 w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-2xl text-white">📷</span>
                    </div>
                    Live Detection System
                  </h2>
                  <p className="text-gray-600 mt-2 ml-16">Capture and classify waste objects in real-time</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Active Session</span>
                </div>
              </div>
              <CameraSection
                onSingleDetection={handleSingleDetection}
                onObjectsDetected={handleMultipleDetection}
              />
            </div>

            {/* Enhanced Object Analysis Section - Shows Multiple Objects */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                    <span className="text-3xl text-white">🔍</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Object Analysis</h2>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                        {detectedObjects.length} Objects Detected
                      </span>
                      <span className="text-sm text-gray-500">
                        Latest detections from camera system
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {detectedObjects.length > 0 && (
                    <button
                      onClick={clearAllDetections}
                      className="px-4 py-1.5 bg-gradient-to-r from-red-100 to-rose-100 text-red-700 rounded-lg font-medium hover:from-red-200 hover:to-rose-200 transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {detectedObjects.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-xl font-medium text-gray-500">No objects detected yet</p>
                  <p className="text-gray-400 mt-2">Start scanning waste items with the camera above</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Show all detected objects */}
                  {detectedObjects.map((obj, index) => (
                    <div 
                      key={obj.id}
                      onClick={() => setSelectedObject(obj)}
                      className={`cursor-pointer rounded-xl border transition-all duration-300 ${
                        selectedObject?.id === obj.id
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              obj.color === 'green' ? 'bg-green-100 text-green-600' :
                              obj.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                              obj.color === 'red' ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              <span className="text-2xl">{obj.icon}</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">{obj.name}</h3>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                                  obj.category === 'biodegradable' ? 'bg-green-100 text-green-800' :
                                  obj.category === 'recyclable' ? 'bg-blue-100 text-blue-800' :
                                  obj.category === 'hazardous' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {obj.category}
                                </span>
                                <span className="text-sm font-bold text-gray-700">{obj.confidence}%</span>
                                <span className="text-sm text-gray-500">{formatTimeAgo(obj.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">#{index + 1}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteDetection(obj.id)
                              }}
                              className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete detection"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-gray-600 mb-4">{obj.description}</p>
                            <div className="flex items-center space-x-2 mb-4">
                              <span className="text-sm font-medium text-gray-700">Bin:</span>
                              <span className={`px-3 py-1 rounded-lg font-medium ${
                                obj.dustbinColor === 'Green' ? 'bg-green-100 text-green-800' :
                                obj.dustbinColor === 'Blue' ? 'bg-blue-100 text-blue-800' :
                                obj.dustbinColor === 'Red' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {obj.dustbinName}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="mb-3">
                              <span className="text-sm font-medium text-gray-700">Properties:</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(obj.properties).map(([key, value]) => (
                                  <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                Detected: {new Date(obj.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`text-sm font-medium ${
                                obj.confidence >= 90 ? 'text-green-600' :
                                obj.confidence >= 75 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                Confidence: {obj.confidence}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed View for Selected Object */}
            {selectedObject && (
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-3xl text-white">📋</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Detailed Analysis</h2>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                          ID: {selectedObject.id?.slice(-6)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatTimeAgo(selectedObject.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-bold ${
                    selectedObject.category === 'recyclable' ? 'bg-blue-100 text-blue-800' :
                    selectedObject.category === 'biodegradable' ? 'bg-green-100 text-green-800' :
                    selectedObject.category === 'hazardous' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedObject.category.toUpperCase()}
                  </div>
                </div>
                <ObjectDetails object={selectedObject} />
              </div>
            )}
          </div>

          {/* Enhanced Right Column - Statistics */}
          <div className="space-y-8">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200 shadow-lg transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm text-gray-600 font-medium uppercase tracking-wider">Total Detections</h3>
                    <p className="text-4xl font-bold text-gray-800 mt-2">
                      {stats.total_detections.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl text-white">📊</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-600 font-medium">
                      +{detectedObjects.length} today
                    </span>
                    <span className="text-sm text-gray-500">Real-time</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200 shadow-lg transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm text-gray-600 font-medium uppercase tracking-wider">Avg Confidence</h3>
                    <p className="text-4xl font-bold text-gray-800 mt-2">
                      {stats.confidence_stats?.average.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl text-white">🎯</span>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Accuracy Level</span>
                    <span className="font-medium">{stats.confidence_stats?.average.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${stats.confidence_stats?.average || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Category Distribution Chart */}
            <div className="bg-white p-7 rounded-2xl shadow-2xl border border-gray-200 transform transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-3">
                    <span className="text-white">📈</span>
                  </div>
                  Category Distribution
                </h3>
                <div className="text-sm text-gray-500">Current Session</div>
              </div>
              <div className="h-72">
                <Pie 
                  data={categoryChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 25,
                          usePointStyle: true,
                          font: {
                            size: 13,
                            family: "'Inter', sans-serif"
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                          size: 14
                        },
                        bodyFont: {
                          size: 13
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Enhanced Daily Activity Chart with Current Dates */}
            <div className="bg-white p-7 rounded-2xl shadow-2xl border border-gray-200 transform transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mr-3">
                    <span className="text-white">📅</span>
                  </div>
                  Daily Activity Trend
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Last 5 days</span>
                </div>
              </div>
              <div className="h-72">
                <Line 
                  data={dailyChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                          drawBorder: false
                        },
                        ticks: {
                          font: {
                            size: 12
                          }
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          font: {
                            size: 12
                          }
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    interaction: {
                      intersect: false,
                      mode: 'index'
                    }
                  }} 
                />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Today's Activity:</span> {stats.daily_stats[stats.daily_stats.length - 1]?.count || 0} detections
                </div>
              </div>
            </div>

            {/* Enhanced Recent Detections with Actual Timestamps */}
            <div className="bg-white p-7 rounded-2xl shadow-2xl border border-gray-200 transform transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center mr-3">
                    <span className="text-white">🕒</span>
                  </div>
                  Recent Activity
                </h3>
                <span className="text-sm text-gray-500">Latest {history.length} records</span>
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-3 custom-scrollbar">
                {history.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="p-5 rounded-xl border border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 group hover:border-blue-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.waste_category === 'biodegradable' ? 'bg-green-100' :
                          item.waste_category === 'recyclable' ? 'bg-blue-100' :
                          item.waste_category === 'hazardous' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          <span className={`text-lg ${
                            item.waste_category === 'biodegradable' ? 'text-green-600' :
                            item.waste_category === 'recyclable' ? 'text-blue-600' :
                            item.waste_category === 'hazardous' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-lg">{item.object_name}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                              item.waste_category === 'biodegradable' ? 'bg-green-100 text-green-800' :
                              item.waste_category === 'recyclable' ? 'bg-blue-100 text-blue-800' :
                              item.waste_category === 'hazardous' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.waste_category}
                            </span>
                            <div className="flex items-center space-x-1">
                              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                                  style={{ width: `${item.confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold text-gray-700">{item.confidence}%</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">
                              {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteDetection(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg"
                        title="Delete detection"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Waste Categories Guide */}
        <div className="mt-10 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Waste Classification Guide</h2>
              <p className="text-gray-600 mt-2">Understanding proper waste disposal categories</p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border border-indigo-200">
              <div className="text-sm text-indigo-800 font-medium">Compliance</div>
              <div className="text-lg font-bold text-indigo-900">98.7%</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-green-700 text-xl">Green Bin</h3>
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow">
                  <span className="text-2xl text-white">🌱</span>
                </div>
              </div>
              <p className="text-gray-700 mb-4 font-medium">Biodegradable Waste</p>
              <p className="text-sm text-gray-600 mb-6">Food scraps, paper, garden waste, wood, leaves, organic materials</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Compost within 2-6 weeks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Suitable for organic recycling</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 rounded-2xl border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-blue-700 text-xl">Blue Bin</h3>
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow">
                  <span className="text-2xl text-white">♻️</span>
                </div>
              </div>
              <p className="text-gray-700 mb-4 font-medium">Recyclable Waste</p>
              <p className="text-sm text-gray-600 mb-6">Plastic bottles, glass, metal cans, cardboard, paper, aluminum</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Can be processed & reused</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Clean and dry before disposal</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 rounded-2xl border-l-4 border-red-500 bg-gradient-to-br from-red-50 to-rose-50 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-red-700 text-xl">Red Bin</h3>
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow">
                  <span className="text-2xl text-white">⚠️</span>
                </div>
              </div>
              <p className="text-gray-700 mb-4 font-medium">Hazardous Waste</p>
              <p className="text-sm text-gray-600 mb-6">Batteries, chemicals, electronics, medicines, paint, solvents</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Special disposal required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Do not mix with regular waste</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 rounded-2xl border-l-4 border-gray-500 bg-gradient-to-br from-gray-50 to-slate-50 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-700 text-xl">Black Bin</h3>
                <div className="w-12 h-12 rounded-xl bg-gray-500 flex items-center justify-center shadow">
                  <span className="text-2xl text-white">🚫</span>
                </div>
              </div>
              <p className="text-gray-700 mb-4 font-medium">Non-Recyclable</p>
              <p className="text-sm text-gray-600 mb-6">Plastic bags, ceramics, composite materials, styrofoam, sanitary</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Landfill disposal only</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Minimize usage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="text-center lg:text-left mb-6 lg:mb-0">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                  <span className="text-xl">♻️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">EcoVision AI Platform</h3>
                  <p className="text-sm text-gray-300">Version 2.5.1 • Production Ready</p>
                </div>
              </div>
              <p className="text-gray-400 max-w-lg">
                Advanced AI-powered waste management system reducing environmental impact through intelligent classification and analytics.
              </p>
            </div>
            <div className="flex flex-col items-center lg:items-end space-y-4">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-sm text-gray-400">System Status</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Operational</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">API Response</div>
                  <div className="font-medium">24ms</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Uptime</div>
                  <div className="font-medium">99.97%</div>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                © 2024 EcoVision AI • Smart Cities Initiative • 
                <span className="ml-2">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

export default AdminPanel