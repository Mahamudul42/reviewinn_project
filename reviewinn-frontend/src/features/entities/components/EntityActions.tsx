import React from 'react';
import { Bookmark, Share2, Edit3, ExternalLink, Heart, Star, Plus } from 'lucide-react';
import type { Entity } from '../../../types';

interface EntityActionsProps {
  entity: Entity;
  onWriteReview?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onExternalLink?: () => void;
  className?: string;
}

const EntityActions: React.FC<EntityActionsProps> = ({
  entity,
  onWriteReview,
  onBookmark,
  onShare,
  onExternalLink,
  className = ''
}) => {
  return (
    <div className={className}>
      <div className="bg-white border-2 border-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Colorful Header */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white drop-shadow-md">Share Your Experience</h3>
              <p className="text-white/90 text-sm">Help others make informed decisions about {entity.name}</p>
            </div>
            <div className="ml-auto">
              <Star className="h-5 w-5 text-yellow-300 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Actions Content */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-orange-50">
          <div className="space-y-4">
            {/* Primary Action - Write Review */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity"></div>
              <button
                onClick={onWriteReview}
                className="relative w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                <Edit3 className="h-5 w-5" />
                Write a Review
                <span className="text-xl">⭐</span>
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => window.location.href = '/add-entity'}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg hover:from-violet-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Add</span>
              </button>
              <button
                onClick={onBookmark}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Bookmark className="h-4 w-4" />
                <span className="text-sm font-medium">Save</span>
              </button>
              <button
                onClick={onShare}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">Share</span>
              </button>
              <button
                onClick={onExternalLink}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm font-medium">Visit</span>
              </button>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-pink-500 to-red-500 rounded-full"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityActions;