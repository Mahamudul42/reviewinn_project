import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EntityCategory } from '../../types';
import type { Entity } from '../../types';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryUtils';
import { normalizeEntityCategoryData } from '../utils/categoryDisplayUtils';
import StarRating from '../atoms/StarRating';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { useToast } from '../components/ToastProvider';
import AuthModal from '../../features/auth/components/AuthModal';

// Extended entity interface that includes all possible fields from both services
export interface EnhancedEntity {
  // Core fields (from both services)
  id: string | number;
  entity_id?: string | number; // For homepage service compatibility
  name: string;
  description?: string;
  // Use hierarchical categories exclusively
  root_category_name?: string;
  final_category_name?: string;
  avatar?: string;
  imageUrl?: string;
  image_url?: string; // Alternative field name
  photo?: string; // Alternative field name
  picture?: string; // Alternative field name
  thumbnail?: string; // Alternative field name
  logo?: string; // Alternative field name
  
  // New hierarchical category fields
  root_category_id?: number;
  final_category_id?: number;
  category_breadcrumb?: any[]; // Category hierarchy path
  category_display?: string; // Human-readable category path
  root_category?: any; // Root category information
  final_category?: any; // Final category information
  
  // Aggregated data fields (from homepage service or enhanced entity service)
  averageRating?: number;
  average_rating?: number; // Alternative field name from homepage service
  reviewCount?: number;
  review_count?: number; // Alternative field name from homepage service
  isVerified?: boolean;
  is_verified?: boolean; // Alternative field name from homepage service
  isClaimed?: boolean;
  is_claimed?: boolean; // Alternative field name from homepage service
  claimedBy?: number;
  claimedAt?: string;
  
  // Additional metadata
  view_count?: number;
  viewCount?: number;
  context?: any;
  location?: string;
  establishedYear?: number;
  website?: string;
  
  // Engagement metrics (from enhanced entity loading)
  totalViews?: number;
  totalReactions?: number;
  totalComments?: number;
  
  // Timestamps
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface UnifiedEntityCardProps {
  entity: EnhancedEntity;
  onClick?: () => void;
  variant?: 'homepage' | 'grid' | 'search' | 'compact';
  showActions?: boolean;
  className?: string;
}

const UnifiedEntityCard: React.FC<UnifiedEntityCardProps> = ({ 
  entity, 
  onClick, 
  variant = 'homepage',
  showActions = true,
  className = ''
}) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { isAuthenticated } = useUnifiedAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Normalize entity data from different services
  const entityId = entity?.id || entity?.entity_id;
  const entityName = entity?.name || 'Unknown Entity';
  // Use hierarchical categories exclusively
  const entityRootCategory = entity?.root_category_name;
  const entityFinalCategory = entity?.final_category_name;
  const entityAvgRating = entity?.averageRating || entity?.average_rating || 0;
  const entityReviewCount = entity?.reviewCount || entity?.review_count || 0;
  
  // Get hierarchical category information using utility
  const { categoryBreadcrumb, categoryDisplay, rootCategory, finalCategory } = normalizeEntityCategoryData(entity);
  
  
  // Check for real images vs generated ones
  const entityAvatar = entity?.avatar || entity?.imageUrl || entity?.image_url || 
                      entity?.photo || entity?.picture || entity?.thumbnail || entity?.logo;
  const hasRealImage = Boolean(entityAvatar && !entityAvatar.includes('ui-avatars.com'));
  const displayAvatar = entityAvatar || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(entityName)}&background=random&color=ffffff&size=200&rounded=true`;
  
  console.log('🖼️ Image info for', entityName, ':', {
    hasRealImage,
    avatar: entityAvatar,
    isGeneratedAvatar: entityAvatar?.includes('ui-avatars.com')
  });
  const entityIsVerified = entity?.isVerified || entity?.is_verified || false;
  const entityIsClaimed = entity?.isClaimed || entity?.is_claimed || false;
  const entitySubcategory = entity?.subcategory;
  const entityDescription = entity?.description;

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

  const handleEntityClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/entity/${entityId}`);
    }
  };

  // Get variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-2.5';
      case 'grid':
        return 'p-3';
      case 'search':
        return 'p-3';
      case 'homepage':
      default:
        return 'p-3';
    }
  };

  const getImageSize = () => {
    switch (variant) {
      case 'compact':
        return { width: '120px', height: '80px' };
      case 'grid':
        return { width: '160px', height: '106px' };
      case 'search':
        return { width: '140px', height: '93px' };
      case 'homepage':
      default:
        return { width: '198px', height: '132px' };
    }
  };

  const imageSize = getImageSize();

  return (
    <>
      <div 
        className={`bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-200 group cursor-pointer ${getVariantClasses()} ${className}`}
        onClick={handleEntityClick}
      >
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
              {entityIsVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}

              {/* Claimed Badge */}
              {entityIsClaimed && (
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
            
            {/* Description */}
            {entityDescription && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                {entityDescription}
              </p>
            )}
            
            {/* Rating and Actions */}
            {(entityAvgRating > 0 || entityReviewCount > 0) && (
              <div className="flex items-center gap-3 mt-2">
                {/* Rating */}
                {entityAvgRating > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-full hover:shadow-md transition-shadow">
                    <StarRating rating={entityAvgRating} size="sm" showValue={false} />
                    <span className="text-sm font-bold text-yellow-800">{entityAvgRating.toFixed(1)}</span>
                  </div>
                )}
                
                {/* Review Count */}
                {entityReviewCount > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <span className="text-xs font-medium text-gray-600">{entityReviewCount.toLocaleString()}</span>
                    <span className="text-xs text-gray-500">review{entityReviewCount !== 1 ? 's' : ''}</span>
                  </div>
                )}

              </div>
            )}


            {/* Action Buttons Section */}
            {(entityAvgRating > 0 || entityReviewCount > 0) && (
              <div className="flex items-center gap-3 mt-2">
                
                {/* Save Button */}
                {showActions && (
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
                )}
              </div>
            )}
          </div>
        </div>
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

export default UnifiedEntityCard;