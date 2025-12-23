import React, { useState, useEffect } from 'react'
import EnhancedCamera from './CameraSection'
import ObjectDetails from './ObjectDetails'
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

const AdminDashboard = () => {
  const [detectedObject, setDetectedObject] = useState(null)
  const [detectedObjects, setDetectedObjects] = useState([])
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, historyRes] = await Promise.all([
        wasteAPI.getDashboardStats(),
        wasteAPI.getHistory()
      ])
      setStats(statsRes.data)
      setHistory(historyRes.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSingleDetection = (object) => {
    setDetectedObject(object)
    fetchDashboardData() // Refresh data
  }

  const handleMultipleDetection = (objects) => {
    setDetectedObjects(objects)
    fetchDashboardData() // Refresh data
  }

  const deleteDetection = async (id) => {
    if (window.confirm('Are you sure you want to delete this detection?')) {
      try {
        await wasteAPI.deleteDetection(id)
        fetchDashboardData()
      } catch (error) {
        console.error('Error deleting detection:', error)
      }
    }
  }

  // Chart data configurations
  const categoryChartData = stats ? {
    labels: Object.keys(stats.category_distribution),
    datasets: [{
      label: 'Detections by Category',
      data: Object.values(stats.category_distribution),
      backgroundColor: [
        '#4CAF50', // Green for biodegradable
        '#2196F3', // Blue for recyclable
        '#F44336', // Red for hazardous
        '#9E9E9E'  // Gray for non-recyclable
      ]
    }]
  } : null

  const dailyChartData = stats ? {
    labels: stats.daily_stats.map(stat => stat.date),
    datasets: [{
      label: 'Daily Detections',
      data: stats.daily_stats.map(stat => stat.count),
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      tension: 0.4
    }]
  } : null

  return (
    <div className="admin-dashboard p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Waste Management Admin Dashboard</h1>
        <p className="text-gray-600">AI-powered waste classification and management system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Camera */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Live Object Detection</h2>
            <EnhancedCamera
              onSingleDetection={handleSingleDetection}
              onObjectsDetected={handleMultipleDetection}
            />
          </div>

          {/* Object Details */}
          {detectedObject && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Last Detected Object</h2>
              <ObjectDetails object={detectedObject} />
            </div>
          )}
        </div>

        {/* Right Column - Statistics */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">Total Detections</h3>
              <p className="text-2xl font-bold">
                {stats ? stats.total_detections : '0'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">Avg Confidence</h3>
              <p className="text-2xl font-bold">
                {stats ? `${stats.confidence_stats.average}%` : '0%'}
              </p>
            </div>
          </div>

          {/* Charts */}
          {stats && (
            <>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-3">Category Distribution</h3>
                <div className="h-64">
                  <Pie data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-3">Daily Activity</h3>
                <div className="h-64">
                  <Line data={dailyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </>
          )}

          {/* Recent Detections */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Recent Detections</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="p-3 border rounded hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.object_name}</p>
                      <p className="text-sm text-gray-500">
                        {item.waste_category} • {item.confidence}%
                      </p>
                    </div>
                    <button
                      onClick={() => deleteDetection(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Waste Categories Guide */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Waste Categories Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-bold text-green-700">Green Bin</h3>
            <p className="text-sm">Biodegradable Waste</p>
            <p className="text-xs text-gray-600">Food scraps, paper, garden waste</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-bold text-blue-700">Blue Bin</h3>
            <p className="text-sm">Recyclable Waste</p>
            <p className="text-xs text-gray-600">Plastic, glass, metal, cardboard</p>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-bold text-red-700">Red Bin</h3>
            <p className="text-sm">Hazardous Waste</p>
            <p className="text-xs text-gray-600">Batteries, chemicals, electronics</p>
          </div>
          <div className="border-l-4 border-gray-500 pl-4">
            <h3 className="font-bold text-gray-700">Black Bin</h3>
            <p className="text-sm">Non-Recyclable Waste</p>
            <p className="text-xs text-gray-600">Plastic bags, ceramics, composite materials</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard