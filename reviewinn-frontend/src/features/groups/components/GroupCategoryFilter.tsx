import React from 'react';
import { Check } from 'lucide-react';
import { GroupCategory } from '../types';

interface GroupCategoryFilterProps {
  categories: GroupCategory[];
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

const GroupCategoryFilter: React.FC<GroupCategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
      
      <div className="space-y-2">
        <button
          onClick={() => onCategoryChange(null)}
          className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${
            selectedCategory === null
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'hover:bg-gray-50'
          }`}
        >
          <span className="text-sm font-medium">All Categories</span>
          {selectedCategory === null && <Check className="w-4 h-4" />}
        </button>
        
        {categories.map((category) => (
          <button
            key={category.category_id}
            onClick={() => onCategoryChange(category.category_id)}
            className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${
              selectedCategory === category.category_id
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              {category.icon && (
                <span className="text-lg" style={{ color: category.color_code || '#6B7280' }}>
                  {category.icon}
                </span>
              )}
              <span className="text-sm font-medium">{category.name}</span>
            </div>
            {selectedCategory === category.category_id && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GroupCategoryFilter;