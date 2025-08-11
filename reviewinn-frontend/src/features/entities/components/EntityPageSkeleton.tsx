import React from 'react';

const EntityPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Entity Header Skeleton */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Header Background */}
          <div className="bg-gradient-to-br from-gray-300 to-gray-400 p-6 relative">
            <div className="flex items-start gap-6">
              {/* Entity Image Skeleton */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gray-300 rounded-2xl"></div>
              </div>
              
              {/* Entity Info Skeleton */}
              <div className="flex-1">
                <div className="h-8 bg-gray-300 rounded mb-3 w-3/4"></div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-gray-300 rounded-full w-20"></div>
                  <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 bg-gray-300 rounded w-24"></div>
                  <div className="h-10 bg-gray-300 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="p-6 bg-gray-50">
            <div className="h-6 bg-gray-300 rounded mb-2 w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>

      {/* Description Skeleton */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-4/5"></div>
          </div>
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6">
          <div className="flex gap-4 justify-center">
            <div className="h-12 bg-gray-300 rounded-xl w-32"></div>
            <div className="h-12 bg-gray-300 rounded-xl w-24"></div>
            <div className="h-12 bg-gray-300 rounded-xl w-20"></div>
            <div className="h-12 bg-gray-300 rounded-xl w-28"></div>
          </div>
        </div>
      </div>

      {/* Rating Breakdown Skeleton */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 bg-gray-300 rounded w-8"></div>
                  <div className="flex-1 h-3 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-6"></div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <div className="h-16 bg-gray-300 rounded-full w-16 mx-auto mb-2"></div>
              <div className="h-6 bg-gray-300 rounded w-20 mx-auto mb-1"></div>
              <div className="h-4 bg-gray-300 rounded w-16 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls Skeleton */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-300 rounded w-12"></div>
              ))}
            </div>
            <div className="h-8 bg-gray-300 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Reviews List Skeleton */}
      <div className="w-full max-w-2xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-4/5"></div>
              <div className="h-4 bg-gray-300 rounded w-3/5"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 bg-gray-300 rounded w-16"></div>
              <div className="h-8 bg-gray-300 rounded w-20"></div>
              <div className="h-8 bg-gray-300 rounded w-14"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntityPageSkeleton;