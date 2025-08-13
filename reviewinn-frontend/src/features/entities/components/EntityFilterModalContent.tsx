import React, { useState, useCallback, useEffect } from 'react';
import { 
  Check, 
  Star, 
  Building, 
  Users, 
  MapPin, 
  Package,
  ChevronDown,
  RotateCcw,
  CheckCircle,
  Layers,
  Shield,
  TrendingUp,
  Search,
  X,
  Filter,
  Loader2,
  AlertCircle,
  Tag,
  FolderOpen
} from 'lucide-react';
import { EntityCategory, type UnifiedCategory } from '../../../types';
import { categoryService } from '../../../api/services/categoryService.optimized';

interface FilterOptions {
  category?: EntityCategory;
  subcategory?: string;
  // Category search fields
  selectedRootCategory?: UnifiedCategory;
  selectedFinalCategory?: UnifiedCategory;
  searchQuery?: string;
  sortBy?: 'name' | 'rating' | 'review_count' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  isVerified?: boolean;
  isClaimed?: boolean;
  minRating?: number;
  maxRating?: number;
  hasReviews?: boolean;
}

interface EntityFilterModalContentProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  onClear: () => void;
  onApply: () => void;
  onClose: () => void;
  getFilterCount: () => number;
}

interface UnifiedCategorySearchResult {
  id: number;
  name: string;
  slug: string;
  level: number;
  path_text: string;
  type: 'root_category' | 'subcategory';
  display_name: string;
  category_id: number;
}

const EntityFilterModalContent: React.FC<EntityFilterModalContentProps> = ({
  filters,
  setFilters,
  expandedSections,
  toggleSection,
  onClear,
  onApply,
  onClose,
  getFilterCount,
}) => {
  // Category search state
  const [showCategorySearch, setShowCategorySearch] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryResults, setCategoryResults] = useState<UnifiedCategorySearchResult[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const categories = [
    { 
      value: EntityCategory.PROFESSIONALS, 
      label: 'Professionals', 
      icon: <Users className="h-3 w-3" />,
      color: 'text-blue-600 bg-blue-50'
    },
    { 
      value: EntityCategory.COMPANIES, 
      label: 'Companies', 
      icon: <Building className="h-3 w-3" />,
      color: 'text-green-600 bg-green-50'
    },
    { 
      value: EntityCategory.PLACES, 
      label: 'Places', 
      icon: <MapPin className="h-3 w-3" />,
      color: 'text-purple-600 bg-purple-50'
    },
    { 
      value: EntityCategory.PRODUCTS, 
      label: 'Products', 
      icon: <Package className="h-3 w-3" />,
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'rating', label: 'Rating' },
    { value: 'review_count', label: 'Review Count' },
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Date Updated' }
  ];

  const ratingOptions = [
    { value: 4, label: '4+ Stars' },
    { value: 3, label: '3+ Stars' },
    { value: 2, label: '2+ Stars' },
    { value: 1, label: '1+ Star' }
  ];

  // Category search functionality
  const searchCategories = useCallback(async (query: string) => {
    console.log('🔍 CategorySearch: Searching for:', query);
    if (query.length < 2) {
      setCategoryResults([]);
      return;
    }

    setCategoryLoading(true);
    setCategoryError(null);
    
    try {
      const results = await categoryService.searchCategories(query, 10);
      console.log('🔍 CategorySearch: Found results:', results);
      setCategoryResults(results);
    } catch (error) {
      console.error('🔍 CategorySearch: Search failed:', error);
      setCategoryError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCategories(categorySearchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [categorySearchQuery, searchCategories]);

  const handleCategorySelect = (result: UnifiedCategorySearchResult) => {
    console.log('🎯 CategorySelect: Selected result:', result);
    
    const category: UnifiedCategory = {
      id: result.id,
      name: result.name,
      slug: result.slug,
      level: result.level,
      path: result.path_text,
      icon: result.type === 'root_category' ? '📂' : '📄',
      color: result.type === 'root_category' ? '#8b5cf6' : '#6b7280',
      is_active: true,
      sort_order: 0,
      created_at: new Date().toISOString(),
      description: result.path_text
    };

    console.log('🎯 CategorySelect: Created category object:', category);
    console.log('🎯 CategorySelect: Setting as:', {
      rootCategory: category.level === 1 ? category : undefined,
      finalCategory: category.level > 1 ? category : undefined
    });

    setFilters(prev => {
      const newFilters = {
        ...prev,
        selectedRootCategory: category.level === 1 ? category : undefined,
        selectedFinalCategory: category.level > 1 ? category : undefined
      };
      console.log('🎯 CategorySelect: New filters state:', newFilters);
      return newFilters;
    });

    // Close the search section
    setShowCategorySearch(false);
    setCategorySearchQuery('');
    setCategoryResults([]);
  };

  const clearCategorySelection = () => {
    setFilters(prev => ({
      ...prev,
      selectedRootCategory: undefined,
      selectedFinalCategory: undefined
    }));
  };

  const renderSection = (
    key: string,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode
  ) => (
    <div style={{
      background: '#f8fafc',
      borderRadius: '8px',
      marginBottom: '12px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => toggleSection(key)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseOver={e => {
          e.currentTarget.style.backgroundColor = '#f1f5f9';
        }}
        onMouseOut={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '6px',
            background: key === 'category' ? '#8b5cf6' : '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            {icon}
          </div>
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: '#1e293b',
            margin: 0,
          }}>
            {title}
          </h3>
        </div>
        <ChevronDown 
          style={{ 
            width: '16px', 
            height: '16px', 
            color: '#64748b',
            transition: 'transform 0.2s',
            transform: expandedSections[key] ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </button>
      {expandedSections[key] && (
        <div style={{ 
          padding: '0 16px 16px 16px',
          borderTop: '1px solid #e2e8f0',
          background: 'white',
        }}>
          <div style={{ paddingTop: '12px' }}>
            {content}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      minWidth: 400,
      maxWidth: 500,
      width: '100%',
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 40px)',
      overflow: 'hidden',
      position: 'fixed',
      top: '50vh',
      left: '50vw',
      transform: 'translate(-50%, -50%)',
      zIndex: 100000,
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderBottom: '1px solid #eee', 
        padding: '20px 24px 12px 24px' 
      }}>
        <span style={{ fontWeight: 700, fontSize: 20, color: '#222' }}>
          Filter Entities
        </span>
        <button
          style={{ 
            color: '#888', 
            fontSize: 28, 
            fontWeight: 700, 
            background: 'none', 
            border: 'none', 
            borderRadius: 999, 
            width: 36, 
            height: 36, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ color: '#666', fontSize: 14, margin: '8px 0' }}>
            {getFilterCount()} active filters
          </p>
        </div>

        {/* Category Filter */}
        {renderSection(
          'category',
          'Category',
          <Layers style={{ width: '12px', height: '12px' }} />,
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Search by Category Section - Primary Option */}
            <div style={{
              border: `2px solid ${(filters.selectedRootCategory || filters.selectedFinalCategory) ? '#10b981' : showCategorySearch ? '#7c3aed' : '#8b5cf6'}`,
              borderRadius: '8px',
              background: (filters.selectedRootCategory || filters.selectedFinalCategory) ? '#f0fdf4' : showCategorySearch ? '#ede9fe' : '#f3f4ff',
              transition: 'all 0.2s',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
              }}>
                <button
                  onClick={() => setShowCategorySearch(!showCategorySearch)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: (filters.selectedRootCategory || filters.selectedFinalCategory) ? '#059669' : '#7c3aed',
                    flex: 1,
                    justifyContent: 'center',
                  }}
                >
                  <Search style={{ width: '16px', height: '16px' }} />
                  {(filters.selectedRootCategory || filters.selectedFinalCategory) ? (
                    <span>
                      ✅ {(filters.selectedFinalCategory || filters.selectedRootCategory)?.name}
                    </span>
                  ) : (
                    <span>🎯 Search by Category</span>
                  )}
                </button>
                
                {(filters.selectedRootCategory || filters.selectedFinalCategory) && (
                  <button
                    onClick={clearCategorySelection}
                    style={{
                      padding: '4px',
                      background: 'rgba(0,0,0,0.1)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#6b7280',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
                    }}
                  >
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Inline Category Search Section */}
            {showCategorySearch && (
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#f9fafb',
                padding: '16px',
                marginTop: '8px',
              }}>
                {/* Search Input */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <div style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    pointerEvents: 'none',
                  }}>
                    <Search style={{ width: '16px', height: '16px' }} />
                  </div>
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder="Type to search categories..."
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8b5cf6';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                  {categorySearchQuery && (
                    <button
                      onClick={() => {
                        setCategorySearchQuery('');
                        setCategoryResults([]);
                      }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                      }}
                    >
                      <X style={{ width: '16px', height: '16px' }} />
                    </button>
                  )}
                </div>

                {/* Search Results */}
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {categoryLoading && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '20px',
                      color: '#8b5cf6'
                    }}>
                      <Loader2 style={{ width: '20px', height: '20px', marginRight: '8px' }} className="animate-spin" />
                      <span style={{ fontSize: '14px' }}>Searching...</span>
                    </div>
                  )}

                  {categoryError && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '20px',
                      color: '#ef4444'
                    }}>
                      <AlertCircle style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                      <span style={{ fontSize: '14px' }}>{categoryError}</span>
                    </div>
                  )}

                  {!categoryLoading && !categoryError && categoryResults.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {categoryResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleCategorySelect(result)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px',
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                            width: '100%',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#8b5cf6';
                            e.currentTarget.style.background = '#f3f4ff';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = 'white';
                          }}
                        >
                          {result.type === 'root_category' ? (
                            <FolderOpen style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                          ) : (
                            <Tag style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                              {result.name}
                            </div>
                            {result.path_text && result.path_text !== result.name && (
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                {result.path_text}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!categoryLoading && !categoryError && categorySearchQuery.length >= 2 && categoryResults.length === 0 && (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '20px', 
                      color: '#6b7280' 
                    }}>
                      <Search style={{ width: '32px', height: '32px', margin: '0 auto 8px', color: '#d1d5db' }} />
                      <p style={{ fontSize: '14px', margin: 0 }}>
                        No categories found for "{categorySearchQuery}"
                      </p>
                    </div>
                  )}

                  {categorySearchQuery.length < 2 && categorySearchQuery.length > 0 && (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '20px', 
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      Type at least 2 characters to search...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Or divider */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              margin: '4px 0'
            }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, background: 'white', padding: '0 8px' }}>OR USE QUICK FILTERS</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
            </div>

            {/* Traditional category buttons - Secondary Option */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    category: prev.category === category.value ? undefined : category.value 
                  }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    border: `1px solid ${filters.category === category.value ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    background: filters.category === category.value ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: filters.category === category.value ? '#1e40af' : '#374151',
                  }}
                >
                  <div style={{
                    padding: '4px',
                    borderRadius: '4px',
                    background: filters.category === category.value ? '#3b82f6' : '#f3f4f6',
                    color: filters.category === category.value ? 'white' : '#6b7280',
                  }}>
                    {category.icon}
                  </div>
                  {category.label}
                  {filters.category === category.value && (
                    <Check style={{ width: '12px', height: '12px', marginLeft: 'auto' }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rating Filter */}
        {renderSection(
          'rating',
          'Rating',
          <Star style={{ width: '12px', height: '12px' }} />,
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ratingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  minRating: prev.minRating === option.value ? undefined : option.value 
                }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  border: `1px solid ${filters.minRating === option.value ? '#f59e0b' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  background: filters.minRating === option.value ? '#fef3c7' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: filters.minRating === option.value ? '#92400e' : '#374151',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      style={{
                        width: '12px',
                        height: '12px',
                        fill: i < option.value ? '#fbbf24' : 'none',
                        color: i < option.value ? '#fbbf24' : '#d1d5db',
                      }}
                    />
                  ))}
                </div>
                {option.label}
                {filters.minRating === option.value && (
                  <Check style={{ width: '12px', height: '12px', marginLeft: 'auto' }} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Status Filter */}
        {renderSection(
          'status',
          'Status Options',
          <Shield style={{ width: '12px', height: '12px' }} />,
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.isVerified || false}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  isVerified: e.target.checked ? true : undefined 
                }))}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Verified entities only</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.isClaimed || false}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  isClaimed: e.target.checked ? true : undefined 
                }))}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Claimed entities only</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.hasReviews || false}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  hasReviews: e.target.checked ? true : undefined 
                }))}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>With reviews only</span>
            </label>
          </div>
        )}

        {/* Sort Options */}
        {renderSection(
          'sort',
          'Sort Results',
          <TrendingUp style={{ width: '12px', height: '12px' }} />,
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                Sort by
              </label>
              <select
                value={filters.sortBy || 'rating'}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  sortBy: e.target.value as any 
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white',
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                Order
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    sortOrder: 'asc' 
                  }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: `1px solid ${filters.sortOrder === 'asc' ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    background: filters.sortOrder === 'asc' ? '#eff6ff' : 'white',
                    color: filters.sortOrder === 'asc' ? '#1e40af' : '#374151',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  Ascending
                </button>
                <button
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    sortOrder: 'desc' 
                  }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: `1px solid ${filters.sortOrder === 'desc' ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    background: filters.sortOrder === 'desc' ? '#eff6ff' : 'white',
                    color: filters.sortOrder === 'desc' ? '#1e40af' : '#374151',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  Descending
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <button
            onClick={onClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'none',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            <RotateCcw style={{ width: '14px', height: '14px' }} />
            Clear
          </button>
          
          <button
            onClick={onApply}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <CheckCircle style={{ width: '14px', height: '14px' }} />
            Apply {getFilterCount() > 0 && `(${getFilterCount()})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntityFilterModalContent;