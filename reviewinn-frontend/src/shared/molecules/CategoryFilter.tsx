import React from 'react';
import { User, Building, MapPin, Package, Star } from 'lucide-react';
import { EntityCategory } from '../../types';

interface CategoryFilterProps {
  selectedCategory?: EntityCategory;
  onCategoryChange: (category?: EntityCategory) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange
}) => {
  const categories = [
    { 
      value: undefined, 
      label: 'All Reviews', 
      icon: Star, 
      color: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      activeColor: 'bg-gray-600 text-white'
    },
    { 
      value: EntityCategory.PROFESSIONALS, 
      label: 'People', 
      icon: User, 
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      activeColor: 'bg-blue-600 text-white'
    },
    { 
      value: EntityCategory.COMPANIES, 
      label: 'Companies', 
      icon: Building, 
      color: 'bg-green-100 text-green-800 hover:bg-green-200',
      activeColor: 'bg-green-600 text-white'
    },
    { 
      value: EntityCategory.PLACES, 
      label: 'Places', 
      icon: MapPin, 
      color: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      activeColor: 'bg-purple-600 text-white'
    },
    { 
      value: EntityCategory.PRODUCTS, 
      label: 'Products', 
      icon: Package, 
      color: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      activeColor: 'bg-orange-600 text-white'
    }
  ];
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = selectedCategory === category.value;
        
        return (
          <button
            key={category.label}
            onClick={() => onCategoryChange(category.value)}
            className={`
              inline-flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-medium 
              transition-all duration-200 transform hover:scale-105
              ${isActive 
                ? category.activeColor + ' shadow-lg' 
                : category.color + ' hover:shadow-md'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span>{category.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
