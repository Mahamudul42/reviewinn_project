import React from 'react';
import { CheckCircle, Eye, TrendingUp } from 'lucide-react';
import EntityImage from '../../../shared/molecules/EntityImage';
import { getCategoryIcon, formatCategoryLabel } from '../../../shared/utils/categoryUtils';
import type { Entity } from '../../../types';
import StarRating from '../../../shared/atoms/StarRating';

interface EntityHeaderProps {
  entity: Entity;
  className?: string;
}

const EntityHeader: React.FC<EntityHeaderProps> = ({ entity, className = '' }) => {
  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="bg-white border-2 border-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Colorful Header */}
        <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-start gap-6">
            {/* Entity Image with Enhanced Styling */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <EntityImage 
                  entity={entity} 
                  size="large" 
                  className="relative bg-white/90 backdrop-blur-sm border-2 border-white/50 shadow-2xl" 
                />
                {entity.isVerified && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-2 shadow-xl ring-4 ring-white/30">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Entity Info */}
            <div className="flex-1 text-white">
              <h1 className="text-3xl font-bold mb-3 drop-shadow-lg">{entity.name}</h1>
              
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                  {React.createElement(getCategoryIcon(entity.category), { className: "h-4 w-4" })}
                  {formatCategoryLabel(entity.category)}
                </span>
                {entity.subcategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                    {React.createElement(getCategoryIcon(entity.category), { className: "h-4 w-4" })}
                    {formatCategoryLabel(entity.subcategory)}
                  </span>
                )}
                {entity.isVerified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Verified
                  </span>
                )}
              </div>

              {/* Enhanced Rating Summary */}
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2 text-yellow-300 drop-shadow-md">
                      {entity.averageRating?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      <StarRating 
                        rating={entity.averageRating || 0} 
                        size="lg" 
                        showValue={false}
                        style="golden"
                      />
                    </div>
                    <div className="text-white/90 text-sm font-medium">Overall Rating</div>
                  </div>
                  
                  <div className="h-16 w-px bg-white/30"></div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2 text-cyan-300 drop-shadow-md">
                      {entity.reviewCount?.toLocaleString() || 0}
                    </div>
                    <div className="text-white/90 text-sm font-medium">Reviews</div>
                  </div>

                  {entity.view_count && (
                    <>
                      <div className="h-16 w-px bg-white/30"></div>
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-2 text-green-300 drop-shadow-md">
                          {entity.view_count?.toLocaleString()}
                        </div>
                        <div className="text-white/90 text-sm font-medium">Views</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colorful Additional Info */}
        {entity.context && (
          <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Additional Details</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const contextStr = typeof entity.context === 'string' ? entity.context : JSON.stringify(entity.context);
                return contextStr.split(',').slice(0, 4).map((item: string, index: number) => {
                  const cleanItem = item.trim().replace(/[{}\[\]"]/g, '');
                  const colors = [
                    'from-pink-500 to-rose-500',
                    'from-blue-500 to-cyan-500',
                    'from-green-500 to-emerald-500',
                    'from-purple-500 to-indigo-500'
                  ];
                  if (cleanItem.includes(':')) {
                    const [key, value] = cleanItem.split(':');
                    return (
                      <div key={index} className="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors[index % colors.length]}`}></div>
                          <div className="text-sm text-gray-600 font-semibold">{key.trim()}</div>
                        </div>
                        <div className="text-gray-900 font-bold">{value.trim()}</div>
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors[index % colors.length]}`}></div>
                        <div className="text-gray-900 font-bold">{cleanItem}</div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityHeader;