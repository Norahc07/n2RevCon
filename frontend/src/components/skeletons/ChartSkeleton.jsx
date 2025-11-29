/**
 * Skeleton Loading Component for Charts
 */
const ChartSkeleton = ({ type = 'bar', height = '300px' }) => {
  if (type === 'pie') {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="animate-pulse">
          <div className="relative w-64 h-64">
            {/* Pie chart skeleton - circular */}
            <div className="w-64 h-64 rounded-full bg-gray-200 border-4 border-gray-300"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="h-8 w-20 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className="w-full" style={{ height }}>
        <div className="animate-pulse space-y-4 p-4">
          {/* Y-axis labels */}
          <div className="flex justify-between mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 w-8 bg-gray-200 rounded"></div>
            ))}
          </div>
          
          {/* Chart area with line path */}
          <div className="relative h-full bg-gray-50 rounded border border-gray-200 p-4">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-px bg-gray-200"></div>
              ))}
            </div>
            
            {/* Line path skeleton */}
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <path
                d="M 20 180 Q 100 120, 180 100 T 360 60"
                stroke="#e5e7eb"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5,5"
              />
            </svg>
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3 w-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Bar chart (default)
  return (
    <div className="w-full" style={{ height }}>
      <div className="animate-pulse space-y-4 p-4">
        {/* Y-axis labels */}
        <div className="flex justify-between mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-8 bg-gray-200 rounded"></div>
          ))}
        </div>
        
        {/* Chart area with bars */}
        <div className="relative h-full bg-gray-50 rounded border border-gray-200 p-4">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-px bg-gray-200"></div>
            ))}
          </div>
          
          {/* Bars */}
          <div className="flex items-end justify-between h-full gap-2 px-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-300 rounded-t"
                style={{
                  width: '12%',
                  height: `${Math.random() * 60 + 20}%`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartSkeleton;

