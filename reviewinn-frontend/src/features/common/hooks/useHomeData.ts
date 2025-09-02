import { useState, useEffect, useCallback, useMemo } from 'react';
import { createAuthenticatedRequestInit } from '../../../shared/utils/auth';
import type { Review } from '../../../types';

interface HomepageData {
  reviews: ApiReview[];
  hasMore: boolean;
}

interface ApiReview {
  review_id: number;
  title?: string;
  content: string;
  overall_rating: number;
  view_count?: number;
  comment_count?: number;
  reaction_count?: number;
  is_verified?: boolean;
  is_anonymous?: boolean;
  pros?: string[];
  cons?: string[];
  images?: string[];
  ratings?: Record<string, number>;
  top_reactions?: Record<string, number>;
  user_reaction?: string;
  created_at: string;
  updated_at?: string;
  entity?: {
    entity_id: number;
    name: string;
    description?: string;
    avatar?: string;
    imageUrl?: string;
    is_verified?: boolean;
    is_claimed?: boolean;
    average_rating?: number;
    review_count?: number;
    view_count?: number;
    root_category?: {
      id: number;
      name: string;
      slug: string;
      level: number;
    };
    final_category?: {
      id: number;
      name: string;
      slug: string;
      level: number;
    };
  };
  user?: {
    user_id: number;
    name: string;
    username?: string;
    avatar?: string;
    level?: number;
    is_verified?: boolean;
  };
}

interface UseHomeDataReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  hasMoreReviews: boolean;
  loadingMore: boolean;
  loadInitialData: () => Promise<void>;
  handleLoadMore: () => Promise<void>;
  updateViewCount: (reviewId: string, newCount: number) => void;
}

// Optimized data transformation with memoization
const transformApiReview = (apiReview: ApiReview): Review => {
  return {
    id: apiReview.review_id.toString(),
    entityId: apiReview.entity?.entity_id?.toString() || '',
    reviewerId: apiReview.user?.user_id?.toString() || '',
    reviewerName: apiReview.user?.name || 'Anonymous',
    reviewerUsername: apiReview.user?.username,
    reviewerAvatar: apiReview.user?.avatar,
    userId: apiReview.user?.user_id?.toString(),
    title: apiReview.title || '',
    content: apiReview.content || '',
    overallRating: apiReview.overall_rating || 0,
    ratings: apiReview.ratings || {},
    criteria: apiReview.ratings || {},
    pros: apiReview.pros || [],
    cons: apiReview.cons || [],
    images: apiReview.images || [],
    isAnonymous: apiReview.is_anonymous || false,
    isVerified: apiReview.is_verified || false,
    view_count: apiReview.view_count || 0,
    total_reactions: apiReview.reaction_count || 0,
    comment_count: apiReview.comment_count || 0,
    commentCount: apiReview.comment_count || 0,
    reactions: apiReview.top_reactions || {},
    top_reactions: Object.keys(apiReview.top_reactions || {}),
    user_reaction: apiReview.user_reaction || undefined, // Will be loaded from cache if not in API
    createdAt: apiReview.created_at,
    updatedAt: apiReview.updated_at,
    entity: {
      id: apiReview.entity?.entity_id?.toString() || '',
      name: apiReview.entity?.name || 'Unknown Entity',
      description: apiReview.entity?.description || '',
      avatar: apiReview.entity?.avatar,
      imageUrl: apiReview.entity?.imageUrl || apiReview.entity?.avatar,
      category: apiReview.entity?.root_category?.name,
      averageRating: apiReview.entity?.average_rating || 0,
      reviewCount: apiReview.entity?.review_count || 0,
      view_count: apiReview.entity?.view_count || 0,
      is_verified: apiReview.entity?.is_verified || false,
      is_claimed: apiReview.entity?.is_claimed || false,
      root_category: apiReview.entity?.root_category,
      final_category: apiReview.entity?.final_category,
      root_category_name: apiReview.entity?.root_category?.name,
      final_category_name: apiReview.entity?.final_category?.name,
      root_category_id: apiReview.entity?.root_category?.id,
      final_category_id: apiReview.entity?.final_category?.id,
    }
  };
};

// Optimized API fetch function using the proper reviews endpoint
const fetchHomepageData = async (page: number = 1, limit: number = 15): Promise<HomepageData> => {
  // Use unified auth for authenticated requests
  const response = await fetch(`/api/v1/homepage/reviews?page=${page}&limit=${limit}`, createAuthenticatedRequestInit({
    method: 'GET',
    credentials: 'include',
  }));

  if (!response.ok) {
    throw new Error(`Failed to fetch homepage data: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (result.success) {
    return {
      reviews: result.data || [],
      hasMore: result.pagination?.has_more || false
    };
  } else {
    throw new Error('API returned error');
  }
};

export const useHomeData = (): UseHomeDataReturn => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [localViewCounts, setLocalViewCounts] = useState<Record<string, number>>({});

  // Memoized transformation function
  const transformReviews = useCallback((apiReviews: ApiReview[]): Review[] => {
    return apiReviews.map(transformApiReview);
  }, []);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchHomepageData(1, 15);
      const transformedReviews = transformReviews(data.reviews);
      
      setReviews(transformedReviews);
      setHasMoreReviews(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [transformReviews]);

  // Load more reviews
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreReviews) return;
    
    setLoadingMore(true);
    try {
      const currentPage = Math.floor(reviews.length / 15) + 1;
      const data = await fetchHomepageData(currentPage + 1, 15);
      const transformedReviews = transformReviews(data.reviews);
      
      // Append new reviews to existing ones
      setReviews(prev => [...prev, ...transformedReviews]);
      setHasMoreReviews(data.hasMore);
    } catch (err) {
      console.error('Error loading more reviews:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreReviews, reviews.length, transformReviews]);

  // Function to update view count for a specific review
  const updateViewCount = useCallback((reviewId: string, newCount: number) => {
    console.log(`🔄 Updating view count for review ${reviewId}: ${newCount}`);
    setLocalViewCounts(prev => ({
      ...prev,
      [reviewId]: newCount
    }));
  }, []);

  // Memoized reviews with updated view counts
  const reviewsWithUpdatedCounts = useMemo(() => {
    return reviews.map(review => {
      const updatedViewCount = localViewCounts[review.id];
      if (updatedViewCount !== undefined) {
        return {
          ...review,
          view_count: updatedViewCount
        };
      }
      return review;
    });
  }, [reviews, localViewCounts]);

  // Initial load effect
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    reviews: reviewsWithUpdatedCounts,
    loading,
    error,
    hasMoreReviews,
    loadingMore,
    loadInitialData,
    handleLoadMore,
    updateViewCount,
  };
};