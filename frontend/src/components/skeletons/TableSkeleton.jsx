/**
 * Skeleton Loading Component for Tables
 */
const TableSkeleton = ({ rows = 5, columns = 5, showHeader = true }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {showHeader && (
          <thead>
            <tr className="bg-gray-100">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <th
                  key={colIndex}
                  className="border border-gray-300 px-4 py-3 text-left"
                >
                  <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td
                  key={colIndex}
                  className="border border-gray-300 px-4 py-3"
                >
                  <div className="h-4 bg-gray-200 rounded animate-pulse" style={{
                    width: `${Math.random() * 40 + 60}%`
                  }}></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;

