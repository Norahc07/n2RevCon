/**
 * Skeleton Loading Component for Containers
 */
const ContainerSkeleton = ({ children, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );
};

/**
 * Generic skeleton box
 */
export const SkeletonBox = ({ width = '100%', height = '20px', className = '' }) => {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className}`}
      style={{ width, height }}
    ></div>
  );
};

/**
 * Skeleton for filter sections
 */
export const FilterSkeleton = () => {
  return (
    <div className="card p-4 shadow-md">
      <div className="animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for page header
 */
export const PageHeaderSkeleton = () => {
  return (
    <div className="animate-pulse mb-6">
      <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-96 bg-gray-200 rounded"></div>
    </div>
  );
};

export default ContainerSkeleton;

