import React from 'react';
import { EntityCategory } from '../../../types';

interface EntityListFiltersProps {
  selectedCategory: EntityCategory | 'all';
  setSelectedCategory: (category: EntityCategory | 'all') => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (subcategory: string) => void;
  sortBy: 'name' | 'rating' | 'reviewCount' | 'createdAt';
  setSortBy: (sortBy: 'name' | 'rating' | 'reviewCount' | 'createdAt') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showVerified: boolean;
  setShowVerified: (show: boolean) => void;
  showWithReviews: boolean;
  setShowWithReviews: (show: boolean) => void;
}

const EntityListFilters: React.FC<EntityListFiltersProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  searchQuery,
  setSearchQuery,
  showVerified,
  setShowVerified,
  showWithReviews,
  setShowWithReviews,
}) => {
  // Category options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: EntityCategory.PROFESSIONALS, label: 'Professionals' },
    { value: EntityCategory.COMPANIES, label: 'Companies' },
    { value: EntityCategory.PLACES, label: 'Places' },
    { value: EntityCategory.PRODUCTS, label: 'Products' },
  ];

  // Subcategory options based on selected category
  const getSubcategoryOptions = () => {
    const baseOptions = [{ value: 'all', label: 'All Subcategories' }];
    
    switch (selectedCategory) {
      case EntityCategory.PROFESSIONALS:
        return [
          ...baseOptions,
          { value: 'teachers', label: 'Teachers' },
          { value: 'doctors', label: 'Doctors' },
          { value: 'lawyers', label: 'Lawyers' },
          { value: 'consultants', label: 'Consultants' },
          { value: 'contractors', label: 'Contractors' },
        ];
      case EntityCategory.COMPANIES:
        return [
          ...baseOptions,
          { value: 'technology', label: 'Technology' },
          { value: 'healthcare', label: 'Healthcare' },
          { value: 'finance', label: 'Finance' },
          { value: 'retail', label: 'Retail' },
          { value: 'services', label: 'Services' },
        ];
      case EntityCategory.PLACES:
        return [
          ...baseOptions,
          { value: 'restaurants', label: 'Restaurants' },
          { value: 'hotels', label: 'Hotels' },
          { value: 'attractions', label: 'Attractions' },
          { value: 'stores', label: 'Stores' },
          { value: 'venues', label: 'Venues' },
        ];
      case EntityCategory.PRODUCTS:
        return [
          ...baseOptions,
          { value: 'electronics', label: 'Electronics' },
          { value: 'books', label: 'Books' },
          { value: 'clothing', label: 'Clothing' },
          { value: 'home', label: 'Home & Garden' },
          { value: 'sports', label: 'Sports & Outdoors' },
        ];
      default:
        return baseOptions;
    }
  };

  // Sort options
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'rating', label: 'Rating' },
    { value: 'reviewCount', label: 'Review Count' },
    { value: 'createdAt', label: 'Date Added' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search entities by name, description, or category..."
        />
      </div>

      {/* Filter Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value as EntityCategory | 'all');
              setSelectedSubcategory('all'); // Reset subcategory when category changes
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subcategory
          </label>
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {getSubcategoryOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'reviewCount' | 'createdAt')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="asc">
              {sortBy === 'name' ? 'A-Z' : sortBy === 'createdAt' ? 'Oldest First' : 'Lowest First'}
            </option>
            <option value="desc">
              {sortBy === 'name' ? 'Z-A' : sortBy === 'createdAt' ? 'Newest First' : 'Highest First'}
            </option>
          </select>
        </div>
      </div>

      {/* Toggle Filters */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
        {/* Show Verified Only */}
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showVerified}
            onChange={(e) => setShowVerified(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-700">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified only
            </div>
          </span>
        </label>

        {/* Show With Reviews Only */}
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showWithReviews}
            onChange={(e) => setShowWithReviews(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-700">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Has reviews
            </div>
          </span>
        </label>
      </div>

      {/* Active Filters Summary */}
      {(selectedCategory !== 'all' || selectedSubcategory !== 'all' || searchQuery || showVerified || showWithReviews) && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 mr-2">Active filters:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {categoryOptions.find(cat => cat.value === selectedCategory)?.label}
                </span>
              )}
              {selectedSubcategory !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {getSubcategoryOptions().find(sub => sub.value === selectedSubcategory)?.label}
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  "{searchQuery}"
                </span>
              )}
              {showVerified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Verified
                </span>
              )}
              {showWithReviews && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Has Reviews
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubcategory('all');
                setSearchQuery('');
                setShowVerified(false);
                setShowWithReviews(false);
                setSortBy('name');
                setSortOrder('asc');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityListFilters;