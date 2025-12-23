import React from 'react'

const WasteCategoryCard = ({ category }) => {
  const getColorClasses = (color) => {
    switch(color) {
      case 'green': return {
        bg: 'from-green-50 to-emerald-50',
        border: 'border-green-200',
        text: 'text-green-800',
        iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
        badge: 'bg-green-100 text-green-700'
      }
      case 'blue': return {
        bg: 'from-blue-50 to-indigo-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-500',
        badge: 'bg-blue-100 text-blue-700'
      }
      case 'red': return {
        bg: 'from-red-50 to-rose-50',
        border: 'border-red-200',
        text: 'text-red-800',
        iconBg: 'bg-gradient-to-br from-red-500 to-rose-500',
        badge: 'bg-red-100 text-red-700'
      }
      default: return {
        bg: 'from-gray-50 to-slate-50',
        border: 'border-gray-200',
        text: 'text-gray-800',
        iconBg: 'bg-gradient-to-br from-gray-500 to-slate-500',
        badge: 'bg-gray-100 text-gray-700'
      }
    }
  }

  const colors = getColorClasses(category.color)

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} hover:scale-[1.02] transition-transform duration-300 flex flex-col h-full`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
            <span className="text-xl text-white">{category.icon}</span>
          </div>
          <div className="min-w-0">
            <h3 className={`font-bold text-base ${colors.text} truncate`}>{category.name}</h3>
            <p className="text-xs text-gray-600 truncate">{category.dustbin} Dustbin</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full ${colors.badge} text-xs font-semibold flex-shrink-0`}>
          #{category.id}
        </div>
      </div>

      <div className="space-y-2 flex-1">
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-1">Examples:</h4>
          <div className="flex flex-wrap gap-1">
            {category.examples.slice(0, 3).map((example, idx) => (
              <span key={idx} className="px-1.5 py-0.5 text-xs bg-white/70 rounded text-gray-700 truncate max-w-full">
                {example}
              </span>
            ))}
            {category.examples.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs bg-white/70 rounded text-gray-500">
                +{category.examples.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2">
          <div className="min-w-0">
            <p className="text-gray-600 truncate">Decomposition:</p>
            <p className="font-medium truncate" title={category.decomposition}>{category.decomposition}</p>
          </div>
          <div className="min-w-0">
            <p className="text-gray-600 truncate">Impact:</p>
            <p className="font-medium truncate" title={category.impact}>{category.impact}</p>
          </div>
        </div>
      </div>

      <div className="pt-2 mt-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Proper Disposal:</span>
          <span className={`font-semibold ${colors.text}`}>
            → {category.dustbin} Bin
          </span>
        </div>
      </div>
    </div>
  )
}

export default WasteCategoryCard