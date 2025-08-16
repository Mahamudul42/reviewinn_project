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
  const modalWidth = Math.min(672, viewportWidth * 0.9);
  
  const centerTop = scrollTop + (viewportHeight / 2) - (modalHeight / 2);
  const centerLeft = scrollLeft + (viewportWidth / 2) - (modalWidth / 2);

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: Math.max(document.documentElement.scrollHeight, viewportHeight),
        zIndex: 99999,
        background: 'rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: `${centerTop}px`,
          left: `${centerLeft}px`,
          width: `${modalWidth}px`,
          maxHeight: `${modalHeight}px`,
          overflow: 'hidden',
        }}
      >
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
    </div>,
    document.body
  );
};

export default EntityFilterModal;