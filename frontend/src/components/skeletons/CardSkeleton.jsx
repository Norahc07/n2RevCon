/**
 * Skeleton Loading Component for Cards
 */
const CardSkeleton = ({ count = 1, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}
        >
          <div className="animate-pulse">
            {/* Icon/Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
            
            {/* Title */}
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
            
            {/* Value */}
            <div className="h-8 w-1/2 bg-gray-300 rounded mb-2"></div>
            
            {/* Subtitle/Description */}
            <div className="h-4 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default CardSkeleton;

