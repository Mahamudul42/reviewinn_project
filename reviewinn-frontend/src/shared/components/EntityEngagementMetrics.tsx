import React from 'react';
import type { Entity } from '../../types';

interface EntityEngagementMetricsProps {
  entity: Entity & {
    totalViews?: number;
    totalReactions?: number;
    totalComments?: number;
  };
}

const EntityEngagementMetrics: React.FC<EntityEngagementMetricsProps> = ({ entity }) => {
  // Get metrics from enhanced backend data
  const totalViews = entity.totalViews || (entity as any).total_review_views || entity.view_count || 0;
  const totalReactions = entity.totalReactions || (entity as any).total_reactions || 0;
  const totalComments = entity.totalComments || (entity as any).total_comments || 0;

  console.log('🎯 EntityEngagementMetrics for:', entity.name, {
    totalViews,
    totalReactions, 
    totalComments,
    rawEntity: entity,
    entityKeys: Object.keys(entity)
  });

  // Always render the metrics, even if they're 0
  // if (totalViews === 0 && totalReactions === 0 && totalComments === 0) {
  //   return null;
  // }

  return (
    <div className="mt-2">
      {/* Homepage-style Button Engagement Metrics */}
      <div className="flex flex-row items-center w-full px-0 py-0 bg-white rounded-lg border border-gray-100 shadow-sm gap-2">
        
        {/* Reactions Button - Homepage Style */}
        <button className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-md border border-red-200 bg-red-50 text-red-700 font-semibold text-base shadow-sm hover:bg-red-100 hover:text-red-800 hover:border-red-300 hover:shadow-md focus:ring-2 focus:ring-red-300 transition-all duration-200 transform hover:scale-[1.02] group/reactions">
          <svg className="w-5 h-5 group-hover/reactions:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
          </svg>
          <span>{totalReactions.toLocaleString()}</span>
          <span className="hidden sm:inline">Reactions</span>
          <svg className="w-4 h-4 opacity-0 group-hover/reactions:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>

        {/* Comments Button - Homepage Style */}
        <button className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-md border border-blue-200 bg-blue-50 text-blue-700 font-semibold text-base shadow-sm hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 hover:shadow-md focus:ring-2 focus:ring-blue-300 transition-all duration-200 transform hover:scale-[1.02] group/comments">
          <svg className="w-5 h-5 group-hover/comments:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <span>{totalComments.toLocaleString()}</span>
          <span className="hidden sm:inline">Comments</span>
          <svg className="w-4 h-4 opacity-0 group-hover/comments:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>

        {/* Views Button - Homepage Style */}
        <button className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-md border border-green-200 bg-green-50 text-green-700 font-semibold text-base shadow-sm hover:bg-green-100 hover:text-green-800 hover:border-green-300 hover:shadow-md focus:ring-2 focus:ring-green-300 transition-all duration-200 transform hover:scale-[1.02] group/views">
          <svg className="w-5 h-5 group-hover/views:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          <span>{totalViews.toLocaleString()}</span>
          <span className="hidden sm:inline">Views</span>
          <svg className="w-4 h-4 opacity-0 group-hover/views:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>

      </div>
    </div>
  );
};

export default EntityEngagementMetrics;