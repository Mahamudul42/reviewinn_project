import React, { useState, useEffect, useCallback } from 'react';
import { Star, TrendingUp, Crown, MessageCircle } from 'lucide-react';
import { entityService, reviewService, gamificationService } from '../../../api/services';
import type { Entity, Review } from '../../../types';
import LegalInformationCard from '../../components/LegalInformationCard';
import PlatformPoliciesCard from '../../components/PlatformPoliciesCard';
import { EmptyState, EmptyStateIcons } from '../../components/EmptyState';
import { PANEL_LIMITS } from '../config';
import { PANEL_STYLES } from '../styles';
import PanelHeader from '../components/PanelHeader';
import PanelLoadingState from '../components/PanelLoadingState';

interface RightPanelPublicProps {
  className?: string;
}

/**
 * Public version of the right panel
 * Shows community highlights, featured entities, and join prompts for unauthenticated users
 */
const RightPanelPublic: React.FC<RightPanelPublicProps> = ({ 
  className = ""
}) => {
  const [featuredEntities, setFeaturedEntities] = useState<Entity[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPublicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [entitiesResult, reviewsResult, statsResult] = await Promise.all([
        // OPTIMIZED: Use cached engagement metrics for performance
        entityService.getEntities({
          limit: PANEL_LIMITS.PUBLIC_ENTITIES,
          sortBy: 'trending',  // Use trending sort for better engagement
          sortOrder: 'desc',
          hasReviews: true,
          verified: true  // Prioritize verified entities for public display
        }).catch(() => ({ entities: [] })),
        reviewService.getReviews({
          page: 1,
          limit: PANEL_LIMITS.PUBLIC_COMMUNITY_HIGHLIGHTS,
          sortBy: 'created_at',
          sortOrder: 'desc'
        }).catch(() => ({ reviews: [] })),
        // OPTIMIZED: Load platform stats from gamification API
        gamificationService.getDashboard().catch(() => ({ data: { public_stats: null } }))
      ]);

      if (entitiesResult?.entities) {
        setFeaturedEntities(entitiesResult.entities);
      }
      if (reviewsResult?.reviews) {
        setRecentReviews(reviewsResult.reviews);
      }
      if (statsResult?.data?.public_stats) {
        setPlatformStats(statsResult.data.public_stats);
      }
    } catch (error) {
      console.error('Failed to load public panel data:', error);
      setError('Failed to load community data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  if (loading) {
    return (
      <PanelLoadingState
        title="Community Highlights"
        subtitle="Loading community insights..."
        cardCount={6}
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <PanelHeader
        title="Community Highlights"
        subtitle="Discover what's trending in our community"
      />

      {/* Top Rated Entities */}
      <div className={PANEL_STYLES.cardWrapper}>
        <div className={`${PANEL_STYLES.cardBg} p-4`}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            Top Rated Entities
          </h3>
          {!loading && featuredEntities.length === 0 ? (
            <EmptyState
              title="No entities yet"
              description="Be the first to add and review entities in our community!"
              icon={<EmptyStateIcons.Entities />}
              action={
                <button 
                  onClick={() => {
                    const event = new CustomEvent('openAuthModal', { detail: { mode: 'register' } });
                    window.dispatchEvent(event);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  Join Community
                </button>
              }
              className="py-8"
            />
          ) : (
            <div className="space-y-4">
              {featuredEntities.map((entity, index) => (
                <div key={entity.id || entity.entity_id || index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:border-blue-300 overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-1.5 rounded-lg shadow-sm">
                        <img 
                          src={entity.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(entity.name)}&background=10b981&color=ffffff&size=48&rounded=true`}
                          alt={entity.name}
                          className="w-12 h-12 rounded-lg object-cover border border-white shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <h4 className="font-bold text-gray-900 text-sm truncate hover:text-blue-600 transition-colors cursor-pointer pr-2">{entity.name}</h4>
                      
                      <div className="flex items-center gap-1 overflow-hidden">
                        {/* OPTIMIZED: Use hierarchical categories exclusively */}
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm flex-shrink-0 max-w-full">
                          <span className="text-xs mr-1">📁</span>
                          <span className="capitalize truncate">
                            {entity.final_category_name || entity.root_category_name || 'General'}
                          </span>
                        </span>
                      </div>
                      
                      {entity.averageRating && entity.averageRating > 0 && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-2 border border-yellow-200 overflow-hidden">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full shadow-sm flex-shrink-0">
                              <div className="flex items-center">
                                {Array.from({ length: 5 }, (_, starIndex) => {
                                  const starValue = starIndex + 1;
                                  const isFilled = starValue <= entity.averageRating!;
                                  const isHalfFilled = !isFilled && starValue - entity.averageRating! < 1 && starValue - entity.averageRating! > 0;
                                  
                                  return (
                                    <span
                                      key={starValue}
                                      className="text-xs"
                                      style={{
                                        display: 'inline-block',
                                        lineHeight: '1',
                                        filter: isFilled ? 'none' : isHalfFilled ? 'grayscale(50%) opacity(0.7)' : 'grayscale(100%) opacity(0.3)',
                                        transition: 'all 0.2s ease-in-out'
                                      }}
                                    >
                                      ⭐
                                    </span>
                                  );
                                })}
                              </div>
                              <span className="text-xs font-bold text-yellow-900 ml-1 whitespace-nowrap">{entity.averageRating.toFixed(1)}</span>
                            </div>
                            
                            {/* OPTIMIZED: Show comprehensive engagement metrics */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {entity.reviewCount && entity.reviewCount > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm flex-shrink-0">
                                  <MessageCircle className="w-3 h-3 flex-shrink-0" />
                                  <span className="text-xs font-semibold whitespace-nowrap">{entity.reviewCount}</span>
                                </div>
                              )}
                              {(entity as any).reactionCount && (entity as any).reactionCount > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-sm flex-shrink-0">
                                  <span className="text-xs">👍</span>
                                  <span className="text-xs font-semibold whitespace-nowrap">{(entity as any).reactionCount}</span>
                                </div>
                              )}
                              {(entity as any).viewCount && (entity as any).viewCount > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-sm flex-shrink-0">
                                  <span className="text-xs">👁</span>
                                  <span className="text-xs font-semibold whitespace-nowrap">{(entity as any).viewCount}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(!entity.averageRating || entity.averageRating === 0) && (
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 overflow-hidden">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Star className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate">No reviews yet</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Our Community */}
      <div className={PANEL_STYLES.cardWrapper}>
        <div className={`${PANEL_STYLES.cardBg} p-4`}>
          <div className="text-center space-y-3">
          <div className="text-4xl">🎯</div>
          <h3 className="font-semibold text-gray-900">Join Our Community</h3>
          <p className="text-sm text-gray-600">
            Sign up to track your progress, earn badges, and contribute to our growing community of reviewers!
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const event = new CustomEvent('openAuthModal', { detail: { mode: 'register' } });
                window.dispatchEvent(event);
              }}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              Sign Up
            </button>
            <button 
              onClick={() => {
                const event = new CustomEvent('openAuthModal', { detail: { mode: 'login' } });
                window.dispatchEvent(event);
              }}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Community Insights */}
      <div className={PANEL_STYLES.cardWrapper}>
        <div className={`${PANEL_STYLES.cardBg} p-4`}>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Community Insights
        </h3>
        {/* OPTIMIZED: Show dynamic platform stats from gamification API */}
        <div className="space-y-3 text-sm text-gray-600">
          {platformStats ? (
            <>
              <div className="flex items-center justify-between">
                <span>Most active category</span>
                <span className="font-medium text-gray-900">{platformStats.most_active_category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total reviews</span>
                <span className="font-medium text-gray-900">{platformStats.total_reviews.toLocaleString()} 📝</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total reactions</span>
                <span className="font-medium text-gray-900">{platformStats.total_reactions.toLocaleString()} 👍</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Community members</span>
                <span className="font-medium text-gray-900">{platformStats.total_users.toLocaleString()} 👥</span>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <span className="text-gray-400">Loading platform stats...</span>
            </div>
          )}
        </div>
        </div>
      </div>

      <LegalInformationCard cardBg={PANEL_STYLES.cardBg} />
      <PlatformPoliciesCard cardBg={PANEL_STYLES.cardBg} />
    </div>
  );
};

export default RightPanelPublic;