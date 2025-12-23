import React from 'react';

const BinVisualization = ({ detections }) => {
  if (!detections || detections.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg mt-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Waste Distribution Analysis
        </h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">👁️</div>
          <p className="text-lg">No objects detected yet</p>
          <p className="text-sm mt-2">Point camera at waste items to see distribution</p>
        </div>
      </div>
    );
  }

  // Count items per bin category - FIXED: using waste_category instead of category
  const binCounts = detections.reduce((acc, detection) => {
    // Use waste_category from the detection object
    const category = detection.waste_category?.toLowerCase() || detection.category?.toLowerCase() || 'non-recyclable';
    
    // Normalize category names to match our bin data
    let normalizedCategory = category;
    
    // Handle variations in category names
    if (category.includes('bio') || category === 'biodegradable') {
      normalizedCategory = 'biodegradable';
    } else if (category.includes('recycl') || category === 'recyclable') {
      normalizedCategory = 'recyclable';
    } else if (category.includes('hazard') || category === 'hazardous') {
      normalizedCategory = 'hazardous';
    } else if (category.includes('non') || category === 'non-recyclable' || category === 'non_recyclable') {
      normalizedCategory = 'non-recyclable';
    }
    
    acc[normalizedCategory] = (acc[normalizedCategory] || 0) + 1;
    return acc;
  }, {});

  // Define bin data with all 4 categories
  const binData = [
    { 
      category: 'biodegradable', 
      name: 'Green Bin', 
      icon: '🍃', 
      count: binCounts.biodegradable || 0, 
      color: '#10b981',
      description: 'Compostable organic waste',
      items: detections.filter(d => {
        const cat = d.waste_category?.toLowerCase() || d.category?.toLowerCase() || '';
        return cat.includes('bio') || cat === 'biodegradable';
      }).map(d => d.object_name || d.name || 'Unknown')
    },
    { 
      category: 'recyclable', 
      name: 'Blue Bin', 
      icon: '♻️', 
      count: binCounts.recyclable || 0, 
      color: '#3b82f6',
      description: 'Recyclable materials',
      items: detections.filter(d => {
        const cat = d.waste_category?.toLowerCase() || d.category?.toLowerCase() || '';
        return cat.includes('recycl') || cat === 'recyclable';
      }).map(d => d.object_name || d.name || 'Unknown')
    },
    { 
      category: 'hazardous', 
      name: 'Red Bin', 
      icon: '⚠️', 
      count: binCounts.hazardous || 0, 
      color: '#ef4444',
      description: 'Hazardous waste',
      items: detections.filter(d => {
        const cat = d.waste_category?.toLowerCase() || d.category?.toLowerCase() || '';
        return cat.includes('hazard') || cat === 'hazardous';
      }).map(d => d.object_name || d.name || 'Unknown')
    },
    { 
      category: 'non-recyclable', 
      name: 'Black Bin', 
      icon: '🗑️', 
      count: binCounts['non-recyclable'] || 0, 
      color: '#374151',
      description: 'General waste',
      items: detections.filter(d => {
        const cat = d.waste_category?.toLowerCase() || d.category?.toLowerCase() || '';
        return cat.includes('non') || cat === 'non-recyclable' || cat === 'non_recyclable' || 
               (!cat.includes('bio') && !cat.includes('recycl') && !cat.includes('hazard'));
      }).map(d => d.object_name || d.name || 'Unknown')
    }
  ];

  const totalItems = detections.length;

  // Calculate percentages
  binData.forEach(bin => {
    bin.percentage = totalItems > 0 ? Math.round((bin.count / totalItems) * 100) : 0;
  });

  // Sort by count (highest first)
  const sortedBinData = [...binData].sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg mt-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="mr-2">📊</span>
        Waste Distribution Analysis
        <span className="ml-auto text-sm font-normal bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
          {totalItems} {totalItems === 1 ? 'item' : 'items'} detected
        </span>
      </h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {sortedBinData.map((bin, index) => (
          <div 
            key={index} 
            className="text-center p-4 rounded-lg border transition-all duration-300 hover:shadow-md"
            style={{ 
              borderColor: bin.color,
              backgroundColor: bin.count > 0 ? `${bin.color}10` : '#f9fafb'
            }}
          >
            <div 
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-2xl mb-3 transition-transform duration-300 hover:scale-110"
              style={{ 
                backgroundColor: bin.color,
                opacity: bin.count > 0 ? 1 : 0.7
              }}
            >
              {bin.icon}
            </div>
            <h4 className="font-bold text-lg mb-1">{bin.name}</h4>
            <div className="text-3xl font-bold mb-1">{bin.count}</div>
            <div className="text-sm text-gray-600">
              {bin.percentage}% of total
            </div>
            {bin.items.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 truncate">
                {bin.items.slice(0, 2).join(', ')}
                {bin.items.length > 2 && '...'}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Progress Bars */}
      <div className="space-y-4 mb-8">
        <h4 className="font-medium text-gray-700 text-lg mb-3">Waste Distribution by Bin</h4>
        {sortedBinData.map((bin, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: bin.color }}
                ></span>
                <span className="font-medium">{bin.name}</span>
                <span className="text-sm text-gray-500 ml-2">({bin.description})</span>
              </div>
              <div className="text-right">
                <span className="font-bold">{bin.count} items</span>
                <span className="text-gray-500 ml-2">({bin.percentage}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${bin.percentage}%`,
                  backgroundColor: bin.color 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Detected Items List */}
      <div className="mb-8">
        <h4 className="font-medium text-gray-700 text-lg mb-3">🔍 Detected Items</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {detections.slice(0, 12).map((detection, index) => {
            const category = detection.waste_category?.toLowerCase() || detection.category?.toLowerCase() || 'non-recyclable';
            const colors = {
              'biodegradable': '#10b981',
              'recyclable': '#3b82f6',
              'hazardous': '#ef4444',
              'non-recyclable': '#374151'
            };
            const color = colors[category] || colors['non-recyclable'];
            
            return (
              <div 
                key={index}
                className="text-xs p-2 rounded border text-center truncate"
                style={{
                  borderColor: color,
                  backgroundColor: `${color}15`
                }}
                title={`${detection.object_name || 'Item'} - ${category} (${Math.round((detection.confidence || 0) * 100)}%)`}
              >
                <div className="font-medium truncate">{detection.object_name || 'Item'}</div>
                <div className="text-gray-600 truncate">{category}</div>
                <div className="text-gray-500 text-xs">
                  {Math.round((detection.confidence || 0) * 100)}% confidence
                </div>
              </div>
            );
          })}
          {detections.length > 12 && (
            <div className="col-span-2 md:col-span-4 text-center text-gray-500 text-sm mt-2">
              + {detections.length - 12} more items detected
            </div>
          )}
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-700 text-lg mb-3">🏆 Environmental Impact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-green-600 mr-2">✅</span>
              <span className="font-medium text-green-800">Positive Impact</span>
            </div>
            <p className="text-sm text-green-700">
              {binCounts.recyclable || 0} items can be recycled and {binCounts.biodegradable || 0} items can be composted.
              This reduces landfill waste by {(binCounts.recyclable || 0) + (binCounts.biodegradable || 0)} items!
            </p>
            {((binCounts.recyclable || 0) + (binCounts.biodegradable || 0)) > 0 && (
              <div className="mt-3 text-xs text-green-600">
                Estimated CO₂ reduction: {((binCounts.recyclable || 0) * 2.5 + (binCounts.biodegradable || 0) * 1.5).toFixed(1)} kg
              </div>
            )}
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-blue-600 mr-2">💡</span>
              <span className="font-medium text-blue-800">Sorting Tips</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure recyclables are clean and dry</li>
              <li>• Separate hazardous waste for special disposal</li>
              <li>• Compost biodegradable items when possible</li>
              <li>• Minimize non-recyclable waste</li>
            </ul>
            {binCounts.hazardous > 0 && (
              <div className="mt-3 text-xs text-red-600 font-medium">
                ⚠️ Handle {binCounts.hazardous} hazardous item(s) with care!
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && detections.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500">Debug Info</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(detections.map(d => ({
                object_name: d.object_name,
                waste_category: d.waste_category,
                category: d.category,
                confidence: d.confidence
              })), null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

// Make sure this is a default export
export default BinVisualization;