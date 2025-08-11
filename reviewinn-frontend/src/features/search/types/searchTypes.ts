import type { Entity, Review, User, EntityCategory } from '../../../types';

export type SearchType = 'all' | 'entities' | 'reviews' | 'users';

export interface SearchFilters {
  // Entity filters
  category?: EntityCategory;
  subcategory?: string;
  location?: string;
  verified?: boolean;
  hasReviews?: boolean;
  
  // Rating filters
  minRating?: number;
  maxRating?: number;
  
  // Review filters
  reviewDateRange?: {
    start: string;
    end: string;
  };
  
  // User filters
  userLevel?: number;
  hasAvatar?: boolean;
  
  // Sorting
  sortBy?: 'relevance' | 'name' | 'rating' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query: string;
  type: SearchType;
  filters: SearchFilters;
  page: number;
  limit: number;
}

export interface UnifiedSearchResult {
  // Entities
  entities: Entity[];
  
  // Reviews  
  reviews?: Array<Review & {
    entityName?: string;
    entityCategory?: EntityCategory;
  }>;
  
  // Users
  users?: Array<User & {
    reviewCount?: number;
    averageRating?: number;
  }>;
  
  // Pagination & metadata
  total: number;
  hasMore: boolean;
  searchType: SearchType;
  query: string;
  
  // Suggestions
  suggestions?: string[];
  didYouMean?: string;
}

export interface SearchResultItem {
  id: string;
  type: 'entity' | 'review' | 'user';
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  metadata?: Record<string, any>;
  url: string;
}

export interface CategoryCount {
  entities: number;
  reviews: number;
  users: number;
  total: number;
}