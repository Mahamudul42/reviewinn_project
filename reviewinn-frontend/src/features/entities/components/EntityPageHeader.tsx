import React from 'react';
import { Building2, Search, TrendingUp } from 'lucide-react';

interface EntityPageHeaderProps {
  totalEntities: number;
  isLoading: boolean;
}

const EntityPageHeader: React.FC<EntityPageHeaderProps> = ({ totalEntities, isLoading }) => {
  return (
    <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Entities</h1>
            <p className="text-gray-600 mt-1">
              Discover and explore entities across various categories
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="flex items-center space-x-2 text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Total Entities</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                totalEntities.toLocaleString()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityPageHeader;