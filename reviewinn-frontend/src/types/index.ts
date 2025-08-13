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
  requester: CircleUser;
  message: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined';
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
  id: string;
  entity_id: string;
  name: string;
  description: string;
  // Use hierarchical category system exclusively
  root_category_id?: number; // Root level category (level 1) - for fallback review questions
  final_category_id?: number; // Final selected category (any level) - for specific review questions
  root_category_name?: string; // Root category name for display
  final_category_name?: string; // Final category name for display
  category_breadcrumb?: CategoryBreadcrumb[]; // Category hierarchy path
  category_display?: string; // Human-readable category path (e.g., "Professionals > Doctors > Cardiologists")
  avatar?: string;
  imageUrl?: string;
  // Core entities fields
  is_verified?: boolean;
  is_active?: boolean;
  verification_status?: string;
  verification_date?: string;
  verified_by?: number;
  // Review and engagement stats (from core_entities table)
  review_count?: number;
  average_rating?: number;
  total_views?: number;
  view_count?: number;
  interaction_count?: number;
  // Enhanced category info (JSON fields in core_entities) - overrides CategoryInfo types above
  final_category?: any; // JSON field storing category details
  root_category?: any; // JSON field storing root category details
  category_path?: string; // String representation of category path
  // Legacy compatibility
  isVerified?: boolean;
  isClaimed?: boolean;
  claimedBy?: number;
  claimedAt?: string;
  context?: EntityContext;
  relatedEntityIds?: string[];
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
  created_at?: string; // Database field name
  updated_at?: string; // Database field name
  fields?: Record<string, any>;
  customFields?: Record<string, any>;
  // Additional metadata
  metadata?: Record<string, any>;
  search_vector?: string; // For search optimization
  slug?: string; // URL-friendly identifier
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
  userReaction?: string;
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
  description: string;
  // JSONB-only category approach (source of truth)
  root_category?: UnifiedCategory; // Root level category with full details {id, name, slug, icon, color, level}
  final_category?: UnifiedCategory; // Final selected category with full details {id, name, slug, icon, color, level}
  avatar?: string; // Entity image/avatar URL
  context?: EntityContext;
  additionalContexts?: EntityContext[];
  fields: Record<string, any>;
  customFields: Record<string, any>;
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
