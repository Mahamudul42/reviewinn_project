/**
 * CategorySearchHeader - Header section with search input and mode toggle
 */

import React from 'react';
import { Search, ArrowLeft, X } from 'lucide-react';

interface CategorySearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  onBackClick?: () => void;
  showBackButton?: boolean;
  title?: string;
}

export const CategorySearchHeader: React.FC<CategorySearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onClose,
  onBackClick,
  showBackButton = false,
  title = "Select Category"
}) => {
  return (
    <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-white">
      <div className="flex items-center flex-1">
        {showBackButton && onBackClick && (
          <button
            onClick={onBackClick}
            className="mr-3 p-1 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
        )}
        
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">
            {title}
          </h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>
      </div>
      
      <button
        onClick={onClose}
        className="ml-4 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
      >
        <X className="w-6 h-6 text-neutral-500" />
      </button>
    </div>
  );
};
