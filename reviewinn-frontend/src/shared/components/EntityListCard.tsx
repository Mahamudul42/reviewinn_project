/**
 * EntityListCard - Unified entity card component for consistent display across all pages
 * This component maintains the distinctive styling from the entity list page
 * and can be reused in homepage, entity details, user profiles, etc.
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EntityEngagementMetrics from './EntityEngagementMetrics';
import StarRating from '../atoms/StarRating';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryUtils'; 
import { normalizeEntityCategoryData } from '../utils/categoryDisplayUtils';
import { getEntityImage, hasRealEntityImage } from '../utils/imageUtils';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { useToast } from '../components/ToastProvider';
import AuthModal from '../../features/auth/components/AuthModal';
import EntityManagementActions from '../../features/entities/components/EntityManagementActions';
import { EntityCategory } from '../../types';
import type { Entity } from '../../types';

interface EntityListCardProps {
  entity: Entity;
  onClick?: () => void;
  showEngagementMetrics?: boolean;
  showActions?: boolean;
  showCategories?: boolean;
  className?: string;
  variant?: 'default' | 'compact';
  showTopRightButtons?: boolean;
  onCrossClick?: (entity: Entity) => void;
  onThreeDotClick?: (entity: Entity, buttonRef: React.RefObject<HTMLButtonElement>) => void;
}

/**
 * EntityListCard component that provides consistent entity display
 * with the distinctive styling from the entity list page
 */
const EntityListCard: React.FC<EntityListCardProps> = ({
  entity,
  onClick,
  showEngagementMetrics = true,
  showActions = true,
  showCategories = true,
  className = '',
  variant = 'default',
  showTopRightButtons = false,
  onCrossClick,
  onThreeDotClick
}) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { isAuthenticated } = useUnifiedAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const threeDotMenuRef = useRef<HTMLButtonElement>(null);

  const handleEntityClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default navigation to entity detail page
      const entityId = entity.entity_id || entity.id;
      if (entityId) {
        navigate(`/entity/${entityId}`);
      }
    }
  };

  // Debug entity data structure (only in development)
  if (import.meta.env.DEV) {
    console.log('🔍 EntityListCard received entity data:', {
      entityId: entity.entity_id || entity.id,
      name: entity.name,
      hasAvatar: !!entity.avatar,
      hasImageUrl: !!entity.imageUrl,
      isVerified: entity.isVerified || entity.is_verified,
      isClaimed: entity.isClaimed || entity.is_claimed,
      rootCategory: entity.root_category,
      finalCategory: entity.final_category,
      categoryBreadcrumb: entity.category_breadcrumb,
      entityKeys: Object.keys(entity)
    });
  }

  // Extract entity data with proper fallbacks
  const entityName = entity.name || 'Unknown Entity';
  const entityDescription = entity.description || '';
  const entityAvgRating = entity.averageRating || entity.average_rating || entity.avg_rating || 0;
  const entityReviewCount = entity.reviewCount || entity.review_count || entity.reviews_count || 0;
  const entityViewCount = entity.view_count || 0;
  const entityCategory = entity.category || 'professionals';
  const entitySubcategory = entity.subcategory || '';
  
  
  // Entity verification and claim status - support multiple field name formats
  const isVerified = entity.isVerified || entity.is_verified || false;
  const isClaimed = entity.isClaimed || entity.is_claimed || false;
  
  // Get hierarchical category information using utility
  const { categoryBreadcrumb, categoryDisplay, rootCategory, finalCategory } = normalizeEntityCategoryData(entity);
  
  // Debug category data (only in development)
  if (import.meta.env.DEV) {
    console.log('🔍 EntityListCard category data:', {
      rootCategory,
      finalCategory, 
      categoryBreadcrumb,
      categoryDisplay
    });
  }
  
  // Use utility functions for consistent image handling across the app
  const displayAvatar = getEntityImage(entity, entityName);
  const hasRealImage = hasRealEntityImage(entity);
  
  // Debug image data (only in development)
  if (import.meta.env.DEV) {
    console.log('🔍 EntityListCard image data:', {
      avatar: entity.avatar,
      imageUrl: entity.imageUrl,
      displayAvatar,
      hasRealImage
    });
  }
  
  
  const CategoryIcon = getCategoryIcon(entityCategory);

  // Save/bookmark functionality
  const handleSaveEntity = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      // TODO: Implement actual save API call when backend is ready
      setIsSaved(!isSaved);
      
      if (!isSaved) {
        showSuccess(`${entityName} has been added to your interests.`);
      } else {
        showSuccess(`${entityName} has been removed from your interests.`);
      }
    } catch (error) {
      showError('Failed to save entity. Please try again later.');
      console.error('Error saving entity:', error);
    }
  };

  // Apply variant-specific styling for the outer container
  const containerClasses = variant === 'compact' 
    ? `bg-white border border-gray-300 shadow-sm rounded-lg p-3 relative group ${className}`
    : `bg-white border-2 border-gray-800 shadow-lg rounded-xl p-4 cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-gray-900 relative group ${className}`;

  // Get image size based on variant
  const getImageSize = () => {
    switch (variant) {
      case 'compact':
        return { width: '120px', height: '80px' };
      default:
        return { width: '198px', height: '132px' };
    }
  };

  const imageSize = getImageSize();

  return (
    <>
      <div className={containerClasses} onClick={handleEntityClick}>
        {/* Top Right Controls - Three dot and Cross buttons */}
        {showTopRightButtons && (
          <div 
            className="absolute flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            style={{ top: '12px', right: '12px', left: 'auto' }}
          >
            {/* Three-dot Menu Button (first/leftmost) */}
            {onThreeDotClick && (
              <button
                ref={threeDotMenuRef}
                onClick={(e) => {
                  e.stopPropagation();
                  onThreeDotClick(entity, threeDotMenuRef);
                }}
                className="w-7 h-7 text-gray-500 hover:text-gray-700 hover:bg-white flex items-center justify-center transition-all duration-200 border border-transparent hover:border-gray-200 rounded-md"
                title="More options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
            )}
            
            {/* Cross Button (second/rightmost) */}
            {onCrossClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCrossClick(entity);
                }}
                className="w-6 h-6 text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all duration-200 border border-transparent hover:border-red-200 rounded-md"
                title="Hide entity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        <div className="flex items-start gap-3">
          {/* Entity Image */}
          <div className="relative group">
            <img 
              src={displayAvatar} 
              alt={entityName} 
              className={`rounded-lg object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-200 ${!hasRealImage ? 'opacity-80' : ''}`}
              style={imageSize}
            />
            {!hasRealImage && (
              <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-800 text-xs px-1 py-0.5 rounded text-center font-semibold">
                AUTO
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Title and Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEntityClick();
                }}
                className="text-lg font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors duration-200 group-hover:text-blue-800 bg-transparent border-none p-0"
              >
                {entityName}
              </button>
              
              {/* Verification Badge */}
              {isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}

              {/* Claimed Badge */}
              {isClaimed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-800 rounded-full border border-cyan-300 shadow-sm hover:shadow-md transition-shadow" style={{backgroundColor: '#88fffb'}}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-7-4z" clipRule="evenodd"/>
                    <path fillRule="evenodd" d="M8.5 10.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Claimed
                </span>
              )}
            </div>
            
            {/* Category Breadcrumb on Next Line */}
            {showCategories && (
              <div className="flex flex-col gap-1 mb-2">
                {/* Always show category information if available */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {/* Root Category */}
                  {rootCategory && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <span className="text-sm mr-1">{rootCategory.icon || '📁'}</span>
                      {rootCategory.name}
                    </span>
                  )}
                  
                  {/* Separator arrow if both categories exist */}
                  {rootCategory && finalCategory && finalCategory.id !== rootCategory?.id && (
                    <span className="text-gray-400 text-xs">→</span>
                  )}
                  
                  {/* Final Category */}
                  {finalCategory && finalCategory.id !== rootCategory?.id && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <span className="text-sm mr-1">{finalCategory.icon || '🏷️'}</span>
                      {finalCategory.name}
                    </span>
                  )}
                  
                  {/* Show only final category if it's the same as root */}
                  {finalCategory && finalCategory.id === rootCategory?.id && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <span className="text-sm mr-1">{finalCategory.icon || '🏷️'}</span>
                      {finalCategory.name}
                    </span>
                  )}
                </div>
                
                {/* Fallback to legacy category display if no hierarchical data */}
                {!rootCategory && !finalCategory && (
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full shadow-sm hover:shadow-md transition-all duration-200 ${getCategoryColor(entityCategory)}`}>
                      <CategoryIcon className="h-3 w-3 mr-1" />
                      <span className="capitalize">
                        {entityCategory.toString().replace('_', ' ')}
                      </span>
                    </span>
                    
                    {/* Show subcategory for legacy entities */}
                    {entitySubcategory && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                        {entitySubcategory}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Description */}
            {entityDescription && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                {entityDescription}
              </p>
            )}
            
            {/* Rating and Review Count - Always show */}
            <div className="flex items-center gap-3 mt-2">
              {/* Rating */}
              {entityAvgRating > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-800 rounded-full border border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <StarRating rating={entityAvgRating} size="sm" showValue={false} />
                  <span className="text-sm font-medium">{entityAvgRating.toFixed(1)}</span>
                </div>
              )}
              
              {/* Review Count - Show even if 0 or missing */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                <span className="text-sm font-medium">{entityReviewCount.toLocaleString()}</span>
                <span className="text-xs font-medium ml-1">review{entityReviewCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Action Buttons Section */}
            {showActions && (
              <div className="flex items-center gap-3 mt-2">
                {/* Save Button */}
                <div className="flex items-center ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEntity();
                    }}
                    className={`p-1.5 rounded-full transition-all duration-200 ${
                      isSaved 
                        ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                        : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                    }`}
                    title={isSaved ? "Remove from saved entities" : "Save entity to your interests"}
                  >
                    <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Entity Management Actions */}
            {showActions && !showTopRightButtons && (
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <EntityManagementActions
                  entity={entity}
                  onEntityUpdate={(updatedEntity) => {
                    // Update the entity data
                    console.log('Entity updated:', updatedEntity);
                  }}
                  onEntityDelete={() => {
                    // Handle entity deletion - could refresh the list or show a message
                    console.log('Entity deleted');
                  }}
                  className="flex items-center justify-center"
                />
              </div>
            )}
          </div>
        </div>

        {/* Optional Engagement Metrics */}
        {showEngagementMetrics && (
          <EntityEngagementMetrics entity={entity} />
        )}
      </div>
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          handleSaveEntity();
        }}
      />
    </>
  );
};

export default EntityListCard;