import React from 'react'

const ObjectDetails = ({ object }) => {
  if (!object) return null

  // Use the color from the object if available, otherwise fall back to Tailwind
  const getCategoryStyle = (object) => {
    // If object has a color property from the API, use it
    if (object.color) {
      return {
        bg: `bg-[${object.color}20]`, // Light tint (20% opacity)
        border: `border-[${object.color}]`,
        text: `text-[${object.color}]`,
        badge: `bg-[${object.color}20] text-[${object.color}] border border-[${object.color}]`
      }
    }
    
    // Fallback to Tailwind colors if no color from API
    switch(object.category) {
      case 'biodegradable':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          badge: 'bg-green-100 text-green-800'
        }
      case 'recyclable':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-800'
        }
      case 'hazardous':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-800'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const styles = getCategoryStyle(object)

  return (
    <div className={`p-6 rounded-2xl border ${styles.border} ${styles.bg} shadow-lg`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">{object.name}</h3>
          <div className="flex items-center space-x-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles.badge}`}>
              {object.category}
            </span>
            <span className="text-gray-600">{object.confidence}% confidence</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Detected</div>
          <div className="font-medium">{object.timestamp}</div>
        </div>
      </div>

      {/* Disposal Instructions - FIXED TO USE API COLOR */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-gray-100">
        <h4 className="font-bold text-gray-700 mb-2 flex items-center">
          <span className="mr-2">🗑️</span> Disposal Instructions
        </h4>
        <div className="flex items-center justify-between">
          <p className="text-gray-800">{object.description}</p>
          <div 
            className="px-4 py-2 rounded-lg font-bold border-2"
            style={{
              // Use the object.color from API or fallback
              backgroundColor: object.color ? `${object.color}20` : '',
              color: object.color || '#3b82f6', // Default to blue if no color
              borderColor: object.color || '#3b82f6'
            }}
          >
            {object.dustbinColor} BIN
          </div>
        </div>
      </div>

      {/* Properties */}
      {object.properties && (
        <div className="mb-6">
          <h4 className="font-bold text-gray-700 mb-3">Material Properties</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(object.properties).map(([key, value], index) => (
              <div key={index} className="bg-white/70 p-3 rounded-lg">
                <div className="text-sm text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="font-medium text-gray-800">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multiple Objects */}
      {object.objects && (
        <div className="mb-6">
          <h4 className="font-bold text-gray-700 mb-3">Detected Objects</h4>
          <div className="space-y-2">
            {object.objects.map((obj, index) => {
              // For child objects, check if they have color
              const objStyle = obj.color ? {
                badge: `bg-[${obj.color}20] text-[${obj.color}] border border-[${obj.color}]`,
                bg: `bg-[${obj.color}10]`
              } : getCategoryStyle(obj)
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: obj.color ? `${obj.color}20` : '',
                        color: obj.color || '#666'
                      }}
                    >
                      {obj.category === 'biodegradable' ? '🌿' : 
                       obj.category === 'recyclable' ? '♻️' : 
                       obj.category === 'hazardous' ? '⚠️' : '🚫'}
                    </div>
                    <div>
                      <div className="font-medium">{obj.name}</div>
                      <div className="text-sm text-gray-600">{obj.confidence}% confidence</div>
                    </div>
                  </div>
                  <span 
                    className={`px-3 py-1 rounded-full text-sm ${objStyle.badge}`}
                  >
                    {obj.category}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4">
        <button className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow">
          Save Report
        </button>
        <button className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow">
          Export Data
        </button>
        <button className="flex-1 py-3 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow">
          Share
        </button>
      </div>
    </div>
  )
}

export default ObjectDetails