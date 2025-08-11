import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, Loader2, Plus } from 'lucide-react';
import CustomCategoryInput from './CustomCategoryInput';
import type { UnifiedCategory } from '../../types';

interface UnifiedCategorySelectorProps {
  onCategorySelect: (category: UnifiedCategory | null) => void;
  selectedCategoryId?: number | null;
  allowClear?: boolean;
  placeholder?: string;
  showSearch?: boolean;
  maxLevel?: number; // Limit how deep the selection can go
  rootCategoryId?: number; // Start from a specific root category
  allowCustomCategories?: boolean; // Allow users to create custom categories
  userId?: number; // User ID for custom category creation
  className?: string;
}

const UnifiedCategorySelector: React.FC<UnifiedCategorySelectorProps> = ({
  onCategorySelect,
  selectedCategoryId,
  allowClear = true,
  placeholder = "Select a category...",
  showSearch = true,
  maxLevel,
  rootCategoryId,
  allowCustomCategories = true,
  userId,
  className = ""
}) => {
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<UnifiedCategory | null>(null);
  const [showingCustomInput, setShowingCustomInput] = useState<UnifiedCategory | null>(null);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/unified-categories/`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Filter to specific root category if provided
        let filteredCategories = data;
        if (rootCategoryId) {
          filteredCategories = data.filter((cat: UnifiedCategory) => 
            cat.id === rootCategoryId || 
            (cat.ancestors && cat.ancestors.some(ancestor => ancestor.id === rootCategoryId))
          );
        }
        
        setCategories(filteredCategories);
        
        // If a category is pre-selected, find and set it
        if (selectedCategoryId) {
          const findCategoryById = (cats: UnifiedCategory[], id: number): UnifiedCategory | null => {
            for (const cat of cats) {
              if (cat.id === id) return cat;
              if (cat.children) {
                const found = findCategoryById(cat.children, id);
                if (found) return found;
              }
            }
            return null;
          };
          
          const selected = findCategoryById(filteredCategories, selectedCategoryId);
          if (selected) {
            setSelectedCategory(selected);
            // Auto-expand path to selected category
            const ancestorIds = selected.ancestors?.map(a => a.id) || [];
            setExpandedCategories(new Set(ancestorIds));
          }
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [selectedCategoryId, rootCategoryId]);

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    
    const filterCategories = (cats: UnifiedCategory[]): UnifiedCategory[] => {
      return cats.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
        const hasMatchingChildren = cat.children && filterCategories(cat.children).length > 0;
        return matchesSearch || hasMatchingChildren;
      }).map(cat => ({
        ...cat,
        children: cat.children ? filterCategories(cat.children) : undefined
      }));
    };
    
    return filterCategories(categories);
  }, [categories, searchTerm]);

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategorySelect = (category: UnifiedCategory) => {
    // Check if we should allow selection at this level
    if (maxLevel && category.level > maxLevel) {
      return;
    }

    // If this is a "Custom" category and custom categories are allowed, show the input
    if (category.name === 'Custom' && allowCustomCategories) {
      setShowingCustomInput(category);
      return;
    }
    
    setSelectedCategory(category);
    onCategorySelect(category);
  };

  const handleCustomCategoryCreated = (newCategory: UnifiedCategory) => {
    // Refresh categories to include the new custom category
    const updatedCategories = [...categories];
    // Add the new category to the appropriate parent
    const updateCategoriesRecursively = (cats: UnifiedCategory[]): UnifiedCategory[] => {
      return cats.map(cat => {
        if (cat.id === newCategory.parent_id) {
          return {
            ...cat,
            children: [...(cat.children || []), newCategory].sort((a, b) => a.name.localeCompare(b.name))
          };
        }
        if (cat.children) {
          return {
            ...cat,
            children: updateCategoriesRecursively(cat.children)
          };
        }
        return cat;
      });
    };
    
    setCategories(updateCategoriesRecursively(updatedCategories));
    setShowingCustomInput(null);
    setSelectedCategory(newCategory);
    onCategorySelect(newCategory);
  };

  const handleCustomCategoryCancel = () => {
    setShowingCustomInput(null);
  };

  const handleClear = () => {
    setSelectedCategory(null);
    onCategorySelect(null);
    setSearchTerm('');
  };

  const renderCategory = (category: UnifiedCategory, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategory?.id === category.id;
    const hasChildren = category.children && category.children.length > 0;
    const canSelect = !maxLevel || category.level <= maxLevel;
    const isDisabled = maxLevel && category.level > maxLevel;

    return (
      <div key={category.id} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div
          className={`
            flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200
            ${isSelected 
              ? 'bg-blue-50 border border-blue-200 text-blue-900' 
              : 'hover:bg-gray-50 border border-transparent'
            }
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => canSelect && handleCategorySelect(category)}
        >
          <div className="flex items-center space-x-3">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(category.id);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
            
            {!hasChildren && level > 0 && (
              <div className="w-6" /> // Spacer for alignment
            )}
            
            <div>
              <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'} flex items-center`}>
                {category.name}
                {category.name === 'Custom' && allowCustomCategories && (
                  <Plus className="h-4 w-4 ml-2 text-green-600" />
                )}
              </div>
              {category.description && (
                <div className="text-sm text-gray-600 mt-1">
                  {category.description}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Level {category.level} • {
                  category.name === 'Custom' && allowCustomCategories 
                    ? 'Click to add custom category'
                    : category.is_leaf 
                      ? 'Selectable' 
                      : `${category.children?.length || 0} subcategories`
                }
              </div>
            </div>
          </div>
          
          {isSelected && (
            <div className="text-blue-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {hasChildren && isExpanded && category.children && (
          <div className="mt-2">
            {category.children.map(child => 
              <React.Fragment key={`child-${child.id}-${level}`}>
                {renderCategory(child, level + 1)}
              </React.Fragment>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
          <span className="ml-2 text-gray-600">Loading categories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-red-600 text-center">
          <p>Error loading categories: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Select Category</h3>
          {allowClear && selectedCategory && (
            <button
              onClick={handleClear}
              className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
            >
              Clear Selection
            </button>
          )}
        </div>
        
        {selectedCategory && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md">
            <div className="text-sm font-medium text-blue-900">
              Selected: {selectedCategory.name}
            </div>
            {selectedCategory.breadcrumb && (
              <div className="text-xs text-blue-700 mt-1">
                {selectedCategory.breadcrumb.map((crumb, index) => (
                  <span key={crumb.id}>
                    {index > 0 && ' > '}
                    {crumb.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {showingCustomInput ? (
          <CustomCategoryInput
            parentCustomCategory={showingCustomInput}
            onCustomCategoryCreated={handleCustomCategoryCreated}
            onCancel={handleCustomCategoryCancel}
            userId={userId}
            className="mb-4"
          />
        ) : filteredCategories.length > 0 ? (
          <div className="space-y-2">
            {filteredCategories.map(category => 
              <React.Fragment key={`root-${category.id}`}>
                {renderCategory(category)}
              </React.Fragment>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            {searchTerm ? 'No categories match your search.' : 'No categories available.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedCategorySelector;