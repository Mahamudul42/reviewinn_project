import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Calendar, 
  MapPin, 
  User, 
  Filter, 
  RotateCcw,
  Search,
  Sliders,
  Zap,
  Sparkles,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Globe,
  Shield,
  Award,
  Layers
} from 'lucide-react';
import { useModal } from '../../../shared/hooks/useModal';
import { EntityCategory } from '../../../types';
import type { SearchFilters, SearchType } from '../types/searchTypes';

interface SearchFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  searchType: SearchType;
  onFiltersChange: (filters: SearchFilters) => void;
  onApplyFilters: () => void;
}

const SearchFilterModal: React.FC<SearchFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  searchType,
  onFiltersChange,
  onApplyFilters
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    rating: true,
    date: false,
    location: false,
    options: false,
    sort: false,
  });

  const { handleBackdropClick, backdropStyles, getModalContentStyles } = useModal(isOpen, onClose);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: SearchFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  };

  const getCategoryOptions = () => {
    return Object.values(EntityCategory).map(category => ({
      value: category,
      label: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')
    }));
  };

  const getRatingOptions = () => {
    return [
      { value: 4, label: '4+ stars' },
      { value: 3, label: '3+ stars' },
      { value: 2, label: '2+ stars' },
      { value: 1, label: '1+ stars' },
    ];
  };

  const getSortOptions = () => {
    const baseOptions = [
      { value: 'relevance', label: 'Relevance' },
      { value: 'name', label: 'Name' },
      { value: 'rating', label: 'Rating' },
      { value: 'date', label: 'Date' },
      { value: 'popularity', label: 'Popularity' },
    ];

    return baseOptions;
  };

  const renderSection = (
    key: string,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode,
    subtitle?: string
  ) => (
    <div style={{
      background: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '16px',
      marginBottom: '20px',
      border: '1px solid rgba(148, 163, 184, 0.15)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
      backdropFilter: 'blur(10px)',
      overflow: 'hidden',
      transition: 'all 0.2s ease-in-out',
      position: 'relative'
    }}>
      <button
        onClick={() => toggleSection(key)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderRadius: '16px 16px 0 0'
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}>
            {icon}
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              color: '#1e293b',
              margin: 0,
              lineHeight: '1.2'
            }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ 
                fontSize: '14px', 
                color: '#64748b',
                margin: '4px 0 0 0',
                lineHeight: '1.3'
              }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: expandedSections[key] ? 'rgba(99, 102, 241, 0.1)' : 'rgba(148, 163, 184, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          transform: expandedSections[key] ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          <ChevronDown style={{ 
            width: '16px', 
            height: '16px', 
            color: expandedSections[key] ? '#6366f1' : '#64748b'
          }} />
        </div>
      </button>
      {expandedSections[key] && (
        <div style={{ 
          padding: '0 24px 24px 24px',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'rgba(248, 250, 252, 0.5)',
          position: 'relative'
        }}>
          <div style={{ marginTop: '20px', position: 'relative' }}>
            {content}
          </div>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  const contentStyles = getModalContentStyles({
    maxWidth: 800,
    minWidth: 600,
    minHeight: 400,
  });

  return createPortal(
    <div
      style={backdropStyles}
      onClick={handleBackdropClick}
    >
      <div 
        style={{
          ...contentStyles,
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)', 
          padding: '28px 32px 20px 32px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <Sliders style={{ width: '24px', height: '24px', color: '#ffffff' }} />
            </div>
            <div>
              <h2 style={{ 
                fontWeight: 700, 
                fontSize: 24, 
                color: '#ffffff',
                margin: 0,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                Advanced Filters
              </h2>
              <p style={{ 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.9)', 
                margin: '4px 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles style={{ width: '14px', height: '14px' }} />
                Refine your search • {getActiveFilterCount()} active filters
              </p>
            </div>
          </div>
          
          <button
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 20,
              fontWeight: 400,
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              width: 44,
              height: 44,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
            onClick={onClose}
            aria-label="Close"
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '32px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          position: 'relative'
        }}>
          {/* Subtle background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23e2e8f0" fill-opacity="0.3"%3E%3Cpath d="M0 0h80v80H0z" fill="none"/%3E%3Cpath d="M20 20h40v40H20z" fill="none"/%3E%3Cpath d="M40 20v40M20 40h40" stroke="%23e2e8f0" stroke-width="0.5" stroke-opacity="0.3"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.15
          }} />
          {/* Category Filter */}
          {(searchType === 'all' || searchType === 'entities') && renderSection(
            'category',
            'Category',
            <Layers style={{ width: '20px', height: '20px' }} />,
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {getCategoryOptions().map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('category', 
                      localFilters.category === option.value ? undefined : option.value
                    )}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      localFilters.category === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>,
            'Filter by entity type'
          )}

          {/* Rating Filter */}
          {(searchType === 'all' || searchType === 'entities' || searchType === 'reviews') && renderSection(
            'rating',
            'Rating',
            <Star style={{ width: '20px', height: '20px' }} />,
            <div className="space-y-2">
              {getRatingOptions().map(option => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange('minRating', 
                    localFilters.minRating === option.value ? undefined : option.value
                  )}
                  className={`flex items-center gap-2 w-full p-3 rounded-lg border text-left transition-all ${
                    localFilters.minRating === option.value
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < option.value ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>,
            'Filter by minimum rating'
          )}

          {/* Date Range Filter */}
          {(searchType === 'all' || searchType === 'reviews') && renderSection(
            'date',
            'Date Range',
            <Calendar style={{ width: '20px', height: '20px' }} />,
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input
                    type="date"
                    value={localFilters.reviewDateRange?.start || ''}
                    onChange={(e) => handleFilterChange('reviewDateRange', {
                      start: e.target.value,
                      end: localFilters.reviewDateRange?.end || ''
                    })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="date"
                    value={localFilters.reviewDateRange?.end || ''}
                    onChange={(e) => handleFilterChange('reviewDateRange', {
                      start: localFilters.reviewDateRange?.start || '',
                      end: e.target.value
                    })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>,
            'Filter by review date'
          )}

          {/* Location Filter */}
          {(searchType === 'all' || searchType === 'entities') && renderSection(
            'location',
            'Location',
            <Globe style={{ width: '20px', height: '20px' }} />,
            <div>
              <input
                type="text"
                placeholder="Enter location (city, state, country)"
                value={localFilters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>,
            'Filter by location'
          )}

          {/* Additional Options */}
          {renderSection(
            'options',
            'Additional Options',
            <Shield style={{ width: '20px', height: '20px' }} />,
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={localFilters.verified || false}
                  onChange={(e) => handleFilterChange('verified', e.target.checked || undefined)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Verified only</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={localFilters.hasReviews || false}
                  onChange={(e) => handleFilterChange('hasReviews', e.target.checked || undefined)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Has reviews</span>
              </label>
              {searchType === 'users' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum User Level</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Enter minimum level"
                    value={localFilters.userLevel || ''}
                    onChange={(e) => handleFilterChange('userLevel', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>,
            'Additional filtering options'
          )}

          {/* Sort Options */}
          {renderSection(
            'sort',
            'Sort Results',
            <TrendingUp style={{ width: '20px', height: '20px' }} />,
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={localFilters.sortBy || 'relevance'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {getSortOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFilterChange('sortOrder', 'asc')}
                    className={`flex-1 p-2 rounded-lg border transition-all ${
                      localFilters.sortOrder === 'asc'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Ascending
                  </button>
                  <button
                    onClick={() => handleFilterChange('sortOrder', 'desc')}
                    className={`flex-1 p-2 rounded-lg border transition-all ${
                      localFilters.sortOrder === 'desc'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Descending
                  </button>
                </div>
              </div>
            </div>,
            'Sort and order results'
          )}
        </div>

        {/* Premium Footer */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '24px 32px', 
          borderTop: '1px solid rgba(148, 163, 184, 0.2)', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          position: 'relative'
        }}>
          <button
            onClick={handleClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              fontWeight: '500',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
            }}
          >
            <RotateCcw style={{ width: '16px', height: '16px' }} />
            Clear all filters
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                color: '#64748b',
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: '500',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                backdropFilter: 'blur(10px)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
              }}
            >
              <CheckCircle style={{ width: '16px', height: '16px' }} />
              Apply Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SearchFilterModal;