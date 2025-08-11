import React from 'react';
import { Star } from 'lucide-react';
import ClaimedBadge from '../molecules/ClaimedBadge';

interface EntityInfoCardProps {
  name: string;
  description?: string;
  subcategory: string;
  averageRating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  isClaimed?: boolean;
}

const EntityInfoCard: React.FC<EntityInfoCardProps> = ({
  name,
  description,
  subcategory,
  averageRating,
  reviewCount,
  isVerified = false,
  isClaimed = false
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
          {isClaimed && (
            <ClaimedBadge />
          )}
        </div>
        {description && (
          <p className="text-gray-600 mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
          {subcategory}
        </span>
        
        {(averageRating !== undefined || reviewCount !== undefined) && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {averageRating !== undefined && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{averageRating.toFixed(1)}</span>
              </div>
            )}
            {reviewCount !== undefined && (
              <span>({reviewCount} reviews)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityInfoCard; 