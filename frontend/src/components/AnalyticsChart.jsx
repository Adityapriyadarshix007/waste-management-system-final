import React from 'react'

const AnalyticsChart = ({ data }) => {
  const categories = [
    { name: 'Biodegradable', value: data.biodegradable, color: 'bg-gradient-to-r from-green-400 to-emerald-500' },
    { name: 'Recyclable', value: data.recyclable, color: 'bg-gradient-to-r from-blue-400 to-indigo-500' },
    { name: 'Hazardous', value: data.hazardous, color: 'bg-gradient-to-r from-red-400 to-rose-500' },
    { name: 'Non-Recyclable', value: data.nonRecyclable, color: 'bg-gradient-to-r from-gray-400 to-slate-500' }
  ]

  const total = Object.values(data).reduce((sum, value) => sum + value, 0)

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
        <span className="mr-3">📊</span> Waste Distribution Analytics
      </h3>
      
      <div className="space-y-6">
        {/* Pie Chart Visualization */}
        <div className="relative h-48 flex items-center justify-center">
          <div className="absolute w-40 h-40 rounded-full border-8 border-gray-100"></div>
          
          {categories.map((category, index) => {
            const percentage = (category.value / total) * 100
            const rotation = categories.slice(0, index).reduce((sum, cat) => sum + (cat.value / total) * 360, 0)
            
            return (
              <div
                key={category.name}
                className="absolute w-40 h-40 rounded-full"
                style={{
                  clipPath: `conic-gradient(${category.color} ${percentage}%, transparent 0%)`,
                  transform: `rotate(${rotation}deg)`
                }}
              ></div>
            )
          })}
          
          <div className="absolute w-28 h-28 rounded-full bg-white shadow-inner"></div>
          <div className="relative text-center">
            <div className="text-2xl font-bold text-gray-800">{total}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {categories.map(category => {
            const percentage = ((category.value / total) * 100).toFixed(1)
            
            return (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                  <span className="font-medium text-white">{category.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${category.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-800 w-12 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">85%</div>
            <div className="text-sm text-white">Properly Sorted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">2.3x</div>
            <div className="text-sm text-white">Recycling Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">12%</div>
            <div className="text-sm text-white">Contamination</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">45%</div>
            <div className="text-sm text-white">Waste Reduction</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsChart
