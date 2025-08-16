import { httpClient } from '../httpClient';
import { API_CONFIG } from '../config';
import { searchEntities } from '../api';
import type { 
  SearchParams, 
  UnifiedSearchResult, 
  CategoryCount 
} from '../../features/search/types/searchTypes';

export class SearchService {
  private baseUrl = `${API_CONFIG.BASE_URL}/search`;

  async search(params: SearchParams): Promise<UnifiedSearchResult> {
    // Use fallback search by default since unified API may not be implemented yet
    return this.fallbackSearch(params);
  }

  async searchSuggestions(query: string, limit = 5): Promise<string[]> {
    // Skip API call for now since endpoint doesn't exist, use fallback directly
    return this.generateFallbackSuggestions(query, limit);
  }

  // Lightweight fallback suggestion generator
  private generateFallbackSuggestions(query: string, limit: number): string[] {
    const lowerQuery = query.toLowerCase().trim();
    
    // Common search terms and completions (you can expand this based on your data)
    const commonSuggestions = [
      'restaurant reviews',
      'product reviews',
      'service reviews',
      'company reviews',
      'professional reviews',
      'software reviews',
      'book reviews',
      'movie reviews',
      'hotel reviews',
      'app reviews'
    ];
    
    // Filter suggestions that start with or contain the query
    const matchingSuggestions = commonSuggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(lowerQuery) ||
        lowerQuery.split(' ').some(word => suggestion.toLowerCase().includes(word))
      )
      .slice(0, limit);
    
    // If we have exact matches, prioritize them
    const exactMatches = matchingSuggestions.filter(s => 
      s.toLowerCase().startsWith(lowerQuery)
    );
    
    const partialMatches = matchingSuggestions.filter(s => 
      !s.toLowerCase().startsWith(lowerQuery)
    );
    
    return [...exactMatches, ...partialMatches].slice(0, limit);
  }

  async getCategoryCounts(query: string): Promise<CategoryCount> {
    try {
      const url = `${this.baseUrl}/counts?q=${encodeURIComponent(query)}`;
      const response = await httpClient.get<CategoryCount>(url, true);
      return response.data || { entities: 0, reviews: 0, users: 0, total: 0 };
    } catch (error) {
      console.error('Category counts error:', error);
      return { entities: 0, reviews: 0, users: 0, total: 0 };
    }
  }

  // Fallback method using existing services
  private async fallbackSearch(params: SearchParams): Promise<UnifiedSearchResult> {
    const result: UnifiedSearchResult = {
      entities: [],
      reviews: [],
      users: [],
      total: 0,
      hasMore: false,
      searchType: params.type,
      query: params.query
    };


    try {
      // Import services dynamically to avoid circular dependencies
      const { entityService } = await import('./entityService');
      const { reviewService } = await import('./reviewService');

      // For "all" search, distribute limit more evenly
      const isAllSearch = params.type === 'all';
      const entityLimit = isAllSearch ? Math.floor(params.limit * 0.4) : params.limit; // 40% for entities
      const reviewLimit = isAllSearch ? Math.floor(params.limit * 0.4) : params.limit; // 40% for reviews
      const userLimit = isAllSearch ? Math.floor(params.limit * 0.2) : params.limit; // 20% for users

      // Search entities using working implementation
      if (params.type === 'all' || params.type === 'entities') {
        try {
          const entityResults = await searchEntities(params.query, {
            category: params.filters.category,
            rating: params.filters.minRating ? { min: params.filters.minRating, max: 5 } : undefined,
            verified: params.filters.verified,
            hasReviews: params.filters.hasReviews,
            sortBy: params.filters.sortBy as any,
            sortOrder: params.filters.sortOrder
          });
          result.entities = (entityResults.entities || []).slice(0, entityLimit);
          result.total += entityResults.total || 0;
          result.hasMore = result.hasMore || entityResults.hasMore || false;
        } catch (error) {
          console.error('Entity search fallback failed:', error);
          
          // Try backend search as last resort
          try {
            const backendUrl = `${API_CONFIG.BASE_URL}/entities/search?q=${encodeURIComponent(params.query)}&limit=${entityLimit}`;
            const backendResponse = await httpClient.get(backendUrl, true);
            
            if (backendResponse.data?.entities) {
              result.entities = backendResponse.data.entities.slice(0, entityLimit);
              result.total += backendResponse.data.total || 0;
              result.hasMore = result.hasMore || backendResponse.data.hasMore || false;
            }
          } catch (backendError) {
            console.error('Backend entity search also failed:', backendError);
          }
        }
      }

      // Search reviews - enhanced to include entity context
      if (params.type === 'all' || params.type === 'reviews') {
        try {
          // First, search reviews normally
          const reviewResults = await reviewService.searchReviews(params.query, {
            page: params.page,
            limit: reviewLimit,
            category: params.filters.category,
            rating: params.filters.minRating,
            dateRange: params.filters.reviewDateRange
          });
          if (reviewResults) {
            result.reviews = reviewResults.reviews || [];
            result.total += reviewResults.total || 0;
            result.hasMore = result.hasMore || reviewResults.hasMore || false;
          }

          // Additionally, search for reviews whose entities match the search query
          // This covers entity descriptions and names not already covered
          if (result.entities.length > 0) {
            const entityReviewPromises = result.entities.slice(0, 5).map(entity => 
              reviewService.getReviewsForEntity(entity.id, { 
                limit: 2,
                sortBy: 'overall_rating',
                sortOrder: 'desc'
              }).catch(() => ({ reviews: [], total: 0, hasMore: false }))
            );

            const entityReviews = await Promise.all(entityReviewPromises);
            const additionalReviews = entityReviews.flatMap(result => result.reviews);
            
            // Merge and deduplicate reviews
            const existingReviewIds = new Set(result.reviews.map(r => r.id));
            const newReviews = additionalReviews.filter(review => !existingReviewIds.has(review.id));
            
            result.reviews = [...result.reviews, ...newReviews].slice(0, reviewLimit);
          }

          // For "all" search, also search for reviews associated with found entities
          if (isAllSearch && result.entities.length > 0) {
            console.log('Searching for reviews associated with found entities...');
            const entityReviewPromises = result.entities.map(entity => 
              reviewService.getReviewsForEntity(entity.id, { 
                limit: 3, // Get a few reviews per entity
                sortBy: 'rating',
                sortOrder: 'desc'
              }).catch(error => {
                console.error(`Failed to get reviews for entity ${entity.id}:`, error);
                return { reviews: [], total: 0, hasMore: false };
              })
            );

            const entityReviews = await Promise.all(entityReviewPromises);
            const additionalReviews = entityReviews.flatMap(result => result.reviews);
            
            // Merge and deduplicate reviews
            const existingReviewIds = new Set(result.reviews.map(r => r.id));
            const newReviews = additionalReviews.filter(review => !existingReviewIds.has(review.id));
            
            result.reviews = [...result.reviews, ...newReviews].slice(0, reviewLimit);
            console.log(`Added ${newReviews.length} reviews from associated entities`);
          }
        } catch (error) {
          console.error('Review search fallback failed:', error);
        }
      }

      // Search users
      if (params.type === 'all' || params.type === 'users') {
        try {
          console.log('Searching users...');
          const { userService } = await import('./userService');
          const userResults = await userService.searchUsers(params.query, {
            page: params.page,
            limit: userLimit,
            hasReviews: params.filters.hasReviews,
            minLevel: params.filters.userLevel
          });
          
          console.log('User search results:', userResults);
          if (userResults) {
            result.users = (userResults.users || []).slice(0, userLimit);
            result.total += userResults.total || 0;
            result.hasMore = result.hasMore || userResults.hasMore || false;
          }
        } catch (error) {
          console.error('User search fallback failed:', error);
        }
      }

    } catch (error) {
      console.error('Fallback search failed:', error);
    }

    return result;
  }
}

export const searchService = new SearchService();