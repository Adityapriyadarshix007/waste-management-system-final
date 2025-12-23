// src/components/StatsCards.jsx
import React from 'react';

const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200 shadow-lg transform transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm text-gray-600 font-medium uppercase tracking-wider">Total Detections</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {stats?.totalDetections?.toLocaleString() || "1,247"}
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl text-white">📊</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 font-medium">+{stats?.totalDetections ? Math.floor(stats.totalDetections * 0.12) : 149} today</span>
            <span className="text-xs text-gray-500">Real-time</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200 shadow-lg transform transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm text-gray-600 font-medium uppercase tracking-wider">Avg Confidence</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {stats?.accuracy?.toFixed(1) || "94.2"}%
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl text-white">🎯</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Accuracy Level</span>
            <span className="font-medium">{stats?.accuracy?.toFixed(1) || "94.2"}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${stats?.accuracy || 94.2}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;