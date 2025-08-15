// Core entity types and interfaces for the review application

// Review Circle Types
export enum TrustLevel {
  REVIEWER = 'REVIEWER',
  TRUSTED_REVIEWER = 'TRUSTED_REVIEWER',
  REVIEW_ALLY = 'REVIEW_ALLY',
  REVIEW_MENTOR = 'REVIEW_MENTOR'
}

export enum CircleInviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

export interface CircleUser {
  id?: number;
  user_id?: number;
  name: string;
  username: string;
  avatar?: string;
}

export interface ReviewCircle {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  max_members: number;
  member_count: number;
  creator_id: number;
  created_at: string;
  updated_at: string;
}

export interface CircleInvite {
  id: number;
  requester?: CircleUser;
  receiver?: CircleUser;
  note?: string;
  taste_match_score: number;
  created_at: string;
  status: CircleInviteStatus;
}

export interface CircleMember {
  connection_id: number;
  user: CircleUser;
  trust_level: TrustLevel;
  taste_match_score: number;
  connected_since: string;
  last_interaction?: string;
  interaction_count: number;
}

export interface CircleSuggestion {
  user: CircleUser;
  taste_match_score: number;
  reasons: string[];
  mutual_connections: number;
}

export interface CircleRequest {
  id: number;
  requester?: CircleUser;
  recipient?: CircleUser;
  message: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  responded_at?: string;
  // Legacy properties for backward compatibility
  user?: CircleUser;
  target_user?: CircleUser;
}

export interface CircleAnalytics {
  total_connections: number;
  trust_level_breakdown: Record<string, number>;
  average_taste_match: number;
  recent_connections: number;
  circle_growth: {
    this_month: number;
    last_month: number;
    this_year: number;
  };
}

export interface CircleListParams {
  page?: number;
  size?: number;
  is_public?: boolean;
  search?: string;
}

export interface CircleMemberListParams {
  page?: number;
  size?: number;
  trust_level?: TrustLevel;
}

export interface CircleSuggestionListParams {
  limit?: number;
  min_taste_match?: number;
}

export interface CircleCreateRequest {
  name: string;
  description?: string;
  is_public?: boolean;
  max_members?: number;
}

export interface CircleInviteRequest {
  receiver_id: number;
  note?: string;
}

export interface CircleInviteResponseRequest {
  action: 'accept' | 'decline';
}

export interface TrustLevelUpdateRequest {
  trust_level: TrustLevel;
}

export enum EntityCategory {
  PROFESSIONALS = 'professionals',
  COMPANIES = 'companies',
  PLACES = 'places',
  PRODUCTS = 'products'
}

// Unified Category System Types
export interface UnifiedCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  path: string;
  level: number;
  icon?: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface CategoryBreadcrumb {
  id: number;
  name: string;
  slug: string;
  level: number;
}

export interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  level?: number;
  icon?: string;
  color?: string;
}

export interface UnifiedCategorySearchResult {
  id: number;
  name: string;
  slug: string;
  level: number;
  path_text: string;
  type: 'root_category' | 'subcategory';
  display_name: string;
  category_id?: number;
}

export interface UnifiedCategoryCreate {
  name: string;
  parent_id?: number;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  metadata?: Record<string, any>;
}

export interface UnifiedCategoryUpdate {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface CategoryHierarchy {
  categories?: UnifiedCategory[];
  category?: UnifiedCategory;
  total_count?: number;
}

export interface CategoryFrontend {
  id: number;
  name: string;
  slug: string;
  label: string; // Same as name, for dropdown compatibility
  value: number; // Same as id, for form compatibility
  category_id?: number; // Parent category ID for subcategories
  level: number;
  path_text: string;
  icon?: string;
  color?: string;
  is_leaf: boolean;
}

// Legacy compatibility types (will be deprecated)
export interface LegacyCategory {
  id: number;
  category_id: number;
  name: string;
}

export interface LegacySubcategory {
  id: number;
  subcategory_id: number;
  name: string;
  category_id: number;
  level: number;
  path_text: string;
}

export interface Entity {
  // Primary identifiers (from core_entities table)
  entity_id: number;
  id: string; // Frontend compatibility (string version of entity_id)
  name: string;
  description?: string;
  
  // Media and contact info
  avatar?: string;
  website?: string;
  images?: string[];
  
  // JSONB category fields for enterprise scalability
  root_category?: CategoryInfo; // Root category JSONB object
  final_category?: CategoryInfo; // Final category JSONB object
  category_breadcrumb?: CategoryBreadcrumb[]; // Computed category hierarchy
  category_display?: string; // Human-readable category path
  
  // Status fields
  is_verified?: boolean;
  is_active?: boolean;
  is_claimed?: boolean;
  claimed_by?: number;
  claimed_at?: string;
  
  // Cached engagement metrics for 10M+ user performance
  average_rating?: number;
  review_count?: number;
  reaction_count?: number;
  comment_count?: number;
  view_count?: number;
  
  // JSONB data fields for enterprise flexibility
  metadata?: Record<string, any>;
  roles?: Array<Record<string, any>>;
  related_entities?: Array<Record<string, any>>;
  business_info?: Record<string, any>;
  claim_data?: Record<string, any>;
  view_analytics?: Record<string, any>;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  createdAt?: string; // Frontend compatibility
  updatedAt?: string; // Frontend compatibility
  
  // Legacy compatibility fields (deprecated but kept for migration)
  isVerified?: boolean;
  isClaimed?: boolean;
  claimedBy?: number;
  claimedAt?: string;
  averageRating?: number;
  reviewCount?: number;
  reactionCount?: number;
  commentCount?: number;
  viewCount?: number;
  imageUrl?: string;
  context?: EntityContext;
  relatedEntityIds?: string[];
  fields?: Record<string, any>;
  customFields?: Record<string, any>;
}

export interface EntityContext {
  role: string;
  organization: string;
  department?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  isCurrent?: boolean;
}

export interface Review {
  id: string;
  review_id?: number; // Database primary key
  entityId: string;
  entity_id?: number; // Database foreign key
  user_id?: number; // Database foreign key
  role_id?: number; // Database foreign key
  reviewerId: string;
  reviewerName: string;
  reviewerUsername?: string;
  reviewerAvatar?: string;
  userId?: string;
  // Use hierarchical categories exclusively
  root_category?: string;
  final_category?: string;
  title?: string;
  content: string;
  overallRating: number;
  overall_rating?: number; // Database field name
  ratings: Record<string, number>;
  criteria: Record<string, any>;
  pros: string[];
  cons: string[];
  images?: string[];
  isAnonymous: boolean;
  is_anonymous?: boolean; // Database field name
  isVerified: boolean;
  is_verified?: boolean; // Database field name
  is_verified_purchase?: boolean;
  view_count?: number;
  comment_count?: number;
  reaction_count?: number; // Database field name
  reactions?: Record<string, number>;
  user_reaction?: string;
  top_reactions?: string[];
  total_reactions?: number;
  helpfulCount?: number;
  createdAt: string;
  created_at?: string; // Database field name
  updatedAt?: string;
  updated_at?: string; // Database field name
  comments?: Comment[];
  entity?: Entity; // Complete entity object like user reviews
  entity_summary?: any; // Database JSONB field
  user_summary?: any; // Database JSONB field
  reports_summary?: any; // Database JSONB field
}

export interface Comment {
  id: string;
  reviewId: string;
  userId: string;
  userName: string;
  content: string;
  authorName: string;
  createdAt: Date;
  reactions: Record<string, number>;
  user_reaction?: string; // Changed to match Review interface naming
  userReaction?: string; // Keep for backward compatibility
}

export interface ReviewFormData {
  entityId?: string;              // Required by backend
  title: string;                  // Mandatory title (max 200 characters)
  comment: string;               // Maps to backend 'content' (mandatory, max 10000 characters)
  overallRating?: number;        // Calculated overall rating
  ratings: Record<string, number>; // Category-specific ratings (1-5 stars)
  isAnonymous: boolean;          // Anonymous review option
  pros?: string[];               // Max 5 points, each max 100 characters
  cons?: string[];               // Max 5 points, each max 100 characters
  images?: string[];             // Up to 5 image URLs
}

export interface EntityFormData {
  name: string;
  description?: string;
  avatar?: string;
  website?: string;
  images?: string[];
  // JSONB category fields for enterprise scalability
  root_category?: Record<string, any>; // Root category JSONB object
  final_category?: Record<string, any>; // Final category JSONB object
  metadata?: Record<string, any>;
  roles?: Array<Record<string, any>>;
  related_entities?: Array<Record<string, any>>;
  business_info?: Record<string, any>;
  claim_data?: Record<string, any>;
  view_analytics?: Record<string, any>;
  // Legacy compatibility
  context?: EntityContext;
  additionalContexts?: EntityContext[];
  fields?: Record<string, any>;
  customFields?: Record<string, any>;
}

export interface SubcategoryConfig {
  id: string;
  label: string;
  parentCategory: EntityCategory;
  criteria: CriteriaConfig[];
  fields: FieldConfig[];
}

export interface CriteriaConfig {
  id: string;
  name: string;
  description: string;
  maxRating: number;
  isRequired: boolean;
}

export interface FieldConfig {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  section?: string;
  conditional?: {
    field: string;
    value: any;
    operator?: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
  helpText?: string;
}

export interface SearchResult {
  entities: Entity[];
  total: number;
  hasMore: boolean;
  page?: number;
  limit?: number;
  hasPrev?: boolean;
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatar?: string;
  level: number;
  points: number;
  badges: Badge[];
  createdAt: string;
  bio?: string;
  username?: string;
  isVerified?: boolean;
  location?: string;
  website?: string;
  preferences?: UserPreferences;
  stats?: UserStats;
  following?: string[];
  followers?: string[];
}

export interface UserProfile extends User {
  preferences: UserPreferences;
  stats: UserStats;
  following: string[];
  followers: string[];
  badges: Badge[];
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    reviewReplies: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showContexts: boolean;
  };
}

export interface UserStats {
  totalReviews: number;
  averageRatingGiven: number;
  entitiesReviewed: number;
  streakDays: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  type: 'review' | 'vote' | 'comment' | 'follow';
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Advanced search and filtering
export interface SearchFilters {
  category?: EntityCategory;
  subcategory?: string;
  location?: string;
  rating?: {
    min: number;
    max: number;
  };
  verified?: boolean;
  hasReviews?: boolean;
  sortBy?: 'name' | 'rating' | 'reviewCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  // New JSONB category filters
  selectedRootCategory?: UnifiedCategory;
  selectedFinalCategory?: UnifiedCategory;
  minRating?: number;
}

// Review voting and moderation
export interface ReviewVote {
  id: string;
  reviewId: string;
  userId: string;
  type: 'helpful' | 'not_helpful' | 'spam' | 'inappropriate';
  createdAt: Date;
}

export interface ModerationReport {
  id: string;
  reviewId: string;
  reporterId: string;
  reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
}

// Analytics and insights
export interface EntityAnalytics {
  entityId: string;
  views: number;
  reviewTrends: ReviewTrend[];
  ratingDistribution: Record<string, number>;
  topKeywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  lastUpdated: Date;
}

export interface ReviewTrend {
  period: string;
  count: number;
  averageRating: number;
}

// Comparison features
export interface EntityComparison {
  entities: Entity[];
  criteria: string[];
  matrix: ComparisonMatrix;
}

export interface ComparisonMatrix {
  [entityId: string]: {
    [criterion: string]: number | string;
  };
}

// Templates and quick actions
export interface ReviewTemplate {
  id: string;
  name: string;
  // Use hierarchical categories exclusively
  root_category_name?: string;
  final_category_name?: string;
  template: Partial<ReviewFormData>;
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  context: 'entity' | 'review' | 'search';
}
