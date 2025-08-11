import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  TrendingUp
} from 'lucide-react';
import { EntityCategory } from '../../../types';

interface FilterOptions {
  category?: EntityCategory;
  subcategory?: string;
  sortBy?: 'name' | 'rating' | 'review_count' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  isVerified?: boolean;
  isClaimed?: boolean;
  minRating?: number;
  maxRating?: number;
  hasReviews?: boolean;
}

interface EntityFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

const EntityFilterModal: React.FC<EntityFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    rating: true,
    status: false,
    sort: false,
  });

  // Manage body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'relative';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
      };
    }
  }, [isOpen]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  const getFilterCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== null).length;
  };

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
            background: '#3b82f6',
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

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
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
              onClick={handleClear}
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
              onMouseOver={e => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <RotateCcw style={{ width: '14px', height: '14px' }} />
              Clear
            </button>
            
            <button
              onClick={handleApply}
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
              onMouseOver={e => {
                e.currentTarget.style.background = '#2563eb';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#3b82f6';
              }}
            >
              <CheckCircle style={{ width: '14px', height: '14px' }} />
              Apply {getFilterCount() > 0 && `(${getFilterCount()})`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EntityFilterModal;