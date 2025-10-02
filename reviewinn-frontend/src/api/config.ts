// API Configuration and Constants
const getBaseURL = (): string => {
  // Get base URL from environment variables with fallback
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  console.log('🔍 DEBUG - VITE_API_BASE_URL from env:', envBaseUrl);
  
  if (envBaseUrl) {
    console.log('✅ Using VITE_API_BASE_URL:', envBaseUrl);
    return envBaseUrl;
  }
  
  // Detect environment based on hostname and port
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    if (hostname === 'reviewinn.com' || hostname === 'www.reviewinn.com') {
      // Use mapped API domain for production (HTTPS required)
      console.log('🌐 Using production API URL');
      return 'https://api.reviewinn.com/api/v1';
    }
    
    if (hostname === 'admin.reviewinn.com') {
      console.log('🌐 Using admin production API URL');
      return 'https://api.reviewinn.com/api/v1';
    }
    
  }
  
  // Development fallback - use relative URL to leverage Vite proxy
  console.log('🔧 Using fallback relative URL: /api/v1');
  return '/api/v1';
};

const getTimeout = (): number => {
  const envTimeout = import.meta.env.VITE_API_TIMEOUT;
  return envTimeout ? parseInt(envTimeout, 10) : 30000;
};

const isProduction = (): boolean => {
  return import.meta.env.VITE_APP_ENV === 'production' || 
         import.meta.env.NODE_ENV === 'production';
};

const baseUrl = getBaseURL();

console.log('🚀 API_CONFIG initialized with BASE_URL:', baseUrl);

export const API_CONFIG = {
  // Base URL for most API endpoints - dynamically determined
  BASE_URL: baseUrl,
  AUTH_BASE_URL: baseUrl,
  
  // API Version
  VERSION: 'v1',
  
  // Environment-aware timeouts
  TIMEOUT: getTimeout(),
  RETRY_ATTEMPTS: isProduction() ? 2 : 3,
  RETRY_DELAY: isProduction() ? 2000 : 1000,
  
  // Environment-aware rate limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: isProduction() ? 100 : 300,
    BURST_LIMIT: isProduction() ? 20 : 50
  },
  
  // Environment-aware cache settings
  CACHE: {
    TTL: parseInt(import.meta.env.VITE_API_CACHE_TTL || '300000', 10),
    MAX_SIZE: parseInt(import.meta.env.VITE_API_CACHE_MAX_SIZE || '100', 10)
  },
  
  // Environment info
  IS_PRODUCTION: isProduction(),
  IS_DEVELOPMENT: !isProduction(),
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  ADMIN_URL: import.meta.env.VITE_ADMIN_URL || 'http://localhost:3001'
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication - Production Auth System Endpoints
  AUTH: {
    LOGIN: '/auth-production/login',
    REGISTER: '/auth-production/register',
    LOGOUT: '/auth-production/logout',
    REFRESH: '/auth-production/refresh',
    VERIFY: '/auth-production/verify',
    VERIFY_EMAIL: '/auth-production/verify-email',
    RESEND_VERIFICATION: '/auth-production/resend-verification',
    FORGOT_PASSWORD: '/auth-production/forgot-password',
    RESET_PASSWORD: '/auth-production/reset-password',
    CHANGE_PASSWORD: '/auth-production/change-password',
    PROFILE: '/auth-production/profile',
    UPDATE_PROFILE: '/auth-production/profile/update'
  },
  
  // Entities - Unified endpoints using the consolidated entity service
  ENTITIES: {
    LIST: '/entities',
    CREATE: '/entities/',
    GET_BY_ID: (id: string) => `/entities/${id}`,
    UPDATE: (id: string) => `/entities/${id}`,
    DELETE: (id: string) => `/entities/${id}`,
    SEARCH: '/entities/search',
    TRENDING: '/entities/trending/list',
    SIMILAR: (id: string) => `/entities/${id}/similar`,
    STATS: (id: string) => `/entities/${id}/stats`,
    COMPARE: '/entities/compare',
    BULK_OPERATIONS: '/entities/bulk',
    TRACK_VIEW: (id: string) => `/entities/${id}/view`,
    CLAIM: (id: string) => `/entities/${id}/claim`,
    UNCLAIM: (id: string) => `/entities/${id}/unclaim`,
    BY_USER: (userId: string) => `/entities/user/${userId}/entities`
  },
  
  // Reviews
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews/create',
    GET_BY_ID: (id: string) => `/reviews/${id}`,
    UPDATE: (id: string) => `/reviews/${id}`,
    DELETE: (id: string) => `/reviews/${id}`,
    BY_ENTITY: (entityId: string) => `/entities/${entityId}/reviews`,
    BY_USER: (userId: string) => `/users/${userId}/reviews`,
    RECENT: '/reviews/recent',
    TRENDING: '/reviews/trending',
    VOTE: (id: string) => `/reviews/${id}/vote`,
    REPORT: (id: string) => `/reviews/${id}/report`,
    TEMPLATES: '/reviews/templates',
    CREATE_TEMPLATE: '/reviews/templates',
    // Comment endpoints
    COMMENTS: (reviewId: string) => `/reviews/${reviewId}/comments`,
    COMMENT_COUNT: (reviewId: string) => `/reviews/${reviewId}/comments/count`,
    COMMENT_DETAIL: (reviewId: string, commentId: string) => `/reviews/${reviewId}/comments/${commentId}`,
    COMMENT_REACTIONS: (commentId: string) => `/reviews/comments/${commentId}/react`,
    // Reaction endpoints
    REACTIONS: (id: string) => `/reviews/${id}/reactions`,
    ADD_REACTION: (id: string) => `/reviews/${id}/react`,
    REMOVE_REACTION: (id: string) => `/reviews/${id}/react`,
    // View tracking endpoints
    TRACK_VIEW: (id: string) => `/reviews/${id}/view`,
    ANALYTICS: (id: string) => `/reviews/${id}/analytics`
  },
  
  // Users
  USERS: {
    LIST: '/users',
    ME: '/users/me',
    ME_INTERACTIONS: '/users/me/interactions',
    GET_BY_ID: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    PROFILE: (id: string) => `/users/${id}/profile`,
    STATS: (id: string) => `/users/${id}/stats`,
    BADGES: (id: string) => `/users/${id}/badges`,
    FOLLOW: (id: string) => `/users/${id}/follow`,
    UNFOLLOW: (id: string) => `/users/${id}/unfollow`,
    FOLLOWERS: (id: string) => `/users/${id}/followers`,
    FOLLOWING: (id: string) => `/users/${id}/following`,
    ACTIVITY: (id: string) => `/users/${id}/activity`
  },
  
  // Search
  SEARCH: {
    GLOBAL: '/search',
    ENTITIES: '/search/entities',
    REVIEWS: '/search/reviews',
    USERS: '/search/users',
    SUGGESTIONS: '/search/suggestions',
    AUTocomplete: '/search/autocomplete'
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    ENTITY_STATS: (id: string) => `/analytics/entities/${id}`,
    USER_STATS: (id: string) => `/analytics/users/${id}`,
    PLATFORM_STATS: '/analytics/platform',
    TRENDS: '/analytics/trends',
    REPORTS: '/analytics/reports'
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
    SETTINGS: '/notifications/settings',
    SUBSCRIBE: '/notifications/subscribe',
    UNSUBSCRIBE: '/notifications/unsubscribe'
  },

  // Messenger
  MESSENGER: {
    CONVERSATIONS: '/messenger/conversations',
    DIRECT_CONVERSATION: '/messenger/conversations/direct',
    MESSAGES: (conversationId: string) => `/messenger/conversations/${conversationId}/messages`,
    SEND_MESSAGE: (conversationId: string) => `/messenger/conversations/${conversationId}/messages`,
    UPLOAD_FILE: (conversationId: string) => `/messenger/conversations/${conversationId}/messages/file`,
    MARK_READ: (conversationId: string) => `/messenger/conversations/${conversationId}/read`,
    ADD_REACTION: (messageId: string) => `/messenger/messages/${messageId}/reactions`,
    REMOVE_REACTION: (messageId: string) => `/messenger/messages/${messageId}/reactions`,
    SEARCH_MESSAGES: '/messenger/search',
    SEARCH_USERS: '/messenger/users/search'
  },
  
  // View Tracking
  VIEW_TRACKING: {
    TRACK_REVIEW: (id: string) => `/reviews/${id}/view`,
    TRACK_ENTITY: (id: string) => `/entities/${id}/view`,
    REVIEW_ANALYTICS: (id: string) => `/reviews/${id}/analytics`,
    ENTITY_ANALYTICS: (id: string) => `/entities/${id}/analytics`,
    HEALTH: '/view-tracking/health'
  },

  // Gamification
  GAMIFICATION: {
    DAILY_TASKS: '/gamification/daily-tasks',
    BADGES: '/gamification/badges',
    LEADERBOARD: '/gamification/leaderboard',
    POINTS: '/gamification/points',
    ACHIEVEMENTS: '/gamification/achievements'
  },
  
  // Media
  MEDIA: {
    UPLOAD: '/media/upload',
    DELETE: (id: string) => `/media/${id}`,
    GET: (id: string) => `/media/${id}`,
    BULK_UPLOAD: '/media/bulk-upload'
  },
  
  // Categories - Updated to use unified-categories API
  CATEGORIES: {
    LIST: '/unified-categories',
    ROOTS: '/unified-categories/roots',
    CHILDREN: (id: string) => `/unified-categories/${id}/children`,
    GET_BY_ID: (id: string) => `/unified-categories/${id}`,
    SEARCH: '/unified-categories/search',
    CREATE: '/unified-categories',
    HIERARCHY: '/unified-categories/hierarchy',
    LEAF: '/unified-categories/leaf',
    FRONTEND: '/unified-categories/frontend',
    CUSTOM: '/unified-categories/custom',
    // Legacy endpoints for backward compatibility
    SUBCATEGORIES: (id: string) => `/unified-categories/${id}/children`,
    CRITERIA: (id: string) => `/unified-categories/${id}/criteria`
  },

  // Homepage
  HOMEPAGE: {
    DATA: '/homepage/home_middle_panel',
    REVIEWS: '/homepage/reviews',
    ENTITIES: '/homepage/entities',
    STATS: '/homepage/stats'
  },

  // Review Circles
  CIRCLES: {
    LIST: '/circles',
    CREATE: '/circles',
    GET_BY_ID: (id: string) => `/circles/${id}`,
    UPDATE: (id: string) => `/circles/${id}`,
    DELETE: (id: string) => `/circles/${id}`,
    MY_MEMBERS: '/circles/my-members',
    SUGGESTIONS: '/circles/suggestions',
    SEARCH_USERS: '/circles/search-users',
    SEND_REQUEST: '/circles/send-request',
    PENDING_REQUESTS: '/circles/pending-requests',
    SENT_REQUESTS: '/circles/sent-requests',
    RESPOND_REQUEST: '/circles/respond-request',
    CANCEL_REQUEST: (requestId: string) => `/circles/cancel-request/${requestId}`,
    REMOVE_MEMBER: (connectionId: string) => `/circles/member/${connectionId}`,
    BLOCK_USER: '/circles/block-user',
    UNBLOCK_USER: (userId: string) => `/circles/unblock-user/${userId}`,
    BLOCKED_USERS: '/circles/blocked-users',
    FOLLOWERS: '/circles/followers',
    FOLLOWING: '/circles/following',
    DEMOTE_TO_FOLLOWER: '/circles/demote-to-follower',
    PROMOTE_TO_CIRCLE_MATE: '/circles/promote-to-circle-mate'
  }
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

// API Error Types
export const API_ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// Request Headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-API-Version': API_CONFIG.VERSION
} as const;

// Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error Response Interface
export interface ApiError {
  type: keyof typeof API_ERROR_TYPES;
  message: string;
  code?: string;
  details?: unknown;
  timestamp: string;
} 