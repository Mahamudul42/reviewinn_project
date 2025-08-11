import { EntityCategory } from '../../types';
import { User, Building, MapPin, Package } from 'lucide-react';

/**
 * Shared Category Utilities
 * Centralizes all category-related functions to avoid duplication
 */

// Icon utilities
export const getCategoryIcon = (category: EntityCategory) => {
  switch (category) {
    case EntityCategory.PROFESSIONALS:
      return User;
    case EntityCategory.COMPANIES:
      return Building;
    case EntityCategory.PLACES:
      return MapPin;
    case EntityCategory.PRODUCTS:
      return Package;
    default:
      return Building;
  }
};

// Color utilities for different use cases
export const getCategoryColor = (category: EntityCategory) => {
  switch (category) {
    case EntityCategory.PROFESSIONALS:
      return 'text-blue-600 bg-blue-100';
    case EntityCategory.COMPANIES:
      return 'text-green-600 bg-green-100';
    case EntityCategory.PLACES:
      return 'text-purple-600 bg-purple-100';
    case EntityCategory.PRODUCTS:
      return 'text-orange-600 bg-orange-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Gradient colors for buttons and cards
export const getCategoryGradient = (category: EntityCategory) => {
  switch (category) {
    case EntityCategory.PROFESSIONALS:
      return 'from-purple-500 to-indigo-600';
    case EntityCategory.COMPANIES:
      return 'from-blue-500 to-cyan-600';
    case EntityCategory.PLACES:
      return 'from-red-500 to-pink-600';
    case EntityCategory.PRODUCTS:
      return 'from-amber-500 to-orange-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

// Border and background classes for search components
export const getCategorySearchClasses = (category: EntityCategory) => {
  switch (category) {
    case EntityCategory.PROFESSIONALS:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case EntityCategory.COMPANIES:
      return 'bg-green-50 text-green-700 border-green-200';
    case EntityCategory.PLACES:
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case EntityCategory.PRODUCTS:
      return 'bg-orange-50 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

// Category display utilities
export const formatCategoryLabel = (category: string) => {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getCategoryLabel = (category: EntityCategory): string => {
  switch (category) {
    case EntityCategory.PROFESSIONALS:
      return 'Professionals';
    case EntityCategory.COMPANIES:
      return 'Companies';
    case EntityCategory.PLACES:
      return 'Places';
    case EntityCategory.PRODUCTS:
      return 'Products';
    default:
      return 'Unknown';
  }
};

// Note: For JSX rendering, use getCategoryIcon() in your component:
// const IconComponent = getCategoryIcon(category);
// return <IconComponent className={className} />;