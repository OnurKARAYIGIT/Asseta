import React from "react";

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
      </td>
    ))}
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </td>
  </tr>
);

const AssignmentsPageSkeleton = () => {
  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6 animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 animate-pulse">
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full sm:w-1/2"></div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto bg-card-background rounded-lg shadow border border-border">
        <table className="min-w-full divide-y divide-border">
          <tbody className="divide-y divide-border">
            {[...Array(10)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignmentsPageSkeleton;
