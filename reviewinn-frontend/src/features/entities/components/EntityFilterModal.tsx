import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EntityCategory, type UnifiedCategory } from '../../../types';
import EntityFilterModalContent from './EntityFilterModalContent';

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
    console.log('🎯 EntityFilterModal: Applying filters:', filters);
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };


  const getFilterCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== null).length;
  };

  if (!isOpen) return null;

  // Calculate the current viewport center dynamically
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  const modalHeight = Math.min(600, viewportHeight * 0.9);
  const modalWidth = 672; // Exact match to middle panel max-w-2xl (42rem)
  
  const centerTop = scrollTop + (viewportHeight / 2) - (modalHeight / 2);
  const centerLeft = scrollLeft + (viewportWidth / 2) - (modalWidth / 2);

  // JavaScript-calculated positioning
  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: Math.max(document.documentElement.scrollHeight, viewportHeight),
        zIndex: 9999999,
        background: 'rgba(0, 0, 0, 0.5)',
        pointerEvents: 'auto',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          position: 'absolute',
          top: `${centerTop}px`,
          left: `${centerLeft}px`,
          width: `${modalWidth}px`,
          maxHeight: `${modalHeight}px`,
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)', 
          padding: '24px 24px 16px 24px',
          minHeight: '64px'
        }}>
          <div style={{ fontWeight: 600, fontSize: 18, color: '#1f2937', lineHeight: 1.4 }}>
            Filter Entities
          </div>
          <button
            style={{ 
              color: '#6b7280', 
              background: 'none', 
              border: 'none', 
              borderRadius: '6px', 
              width: 32, 
              height: 32, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              fontSize: '20px',
              fontWeight: 400
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px 24px 32px 24px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
        }}>
          <EntityFilterModalContent
            filters={filters}
            setFilters={setFilters}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            onClear={handleClear}
            onApply={handleApply}
            onClose={onClose}
            getFilterCount={getFilterCount}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EntityFilterModal;