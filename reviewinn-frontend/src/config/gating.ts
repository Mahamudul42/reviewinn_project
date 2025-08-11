// Configuration for content gating for non-authenticated users
export const GATING_CONFIG = {
  // Content limits
  LIMITS: {
    PUBLIC_REVIEWS: 15,
    PUBLIC_COMMENTS: 3,
    ADAPTIVE_THRESHOLD: 0.7, // Show 70% of content if below limit
    MINIMUM_BEFORE_GATE: 3,  // Always show at least 3 items
  },
  
  // Feature access for non-authenticated users
  FEATURES: {
    CAN_VIEW_REVIEWS: true,
    CAN_VIEW_RATINGS: true,
    CAN_VIEW_COMMENTS: true,
    CAN_VIEW_REACTIONS: true,
    CAN_VIEW_IMAGES: false,
    CAN_VIEW_FULL_DETAILS: false,
    CAN_WRITE_REVIEWS: false,
    CAN_COMMENT: false,
    CAN_REACT: false,
    CAN_FOLLOW: false,
    CAN_BOOKMARK: false,
    CAN_SHARE_DETAILED: false,
  },
  
  // UI messaging
  MESSAGES: {
    REVIEWS_GATE: {
      title: "Discover More Reviews",
      subtitle: "Join thousands sharing honest reviews",
      benefits: [
        "Access unlimited reviews",
        "Write your own reviews", 
        "Comment and interact",
        "Get personalized recommendations"
      ]
    },
    COMMENTS_GATE: {
      title: "Join the Conversation",
      subtitle: "Connect with our review community",
      benefits: [
        "Read all comments",
        "Share your thoughts",
        "Connect with reviewers",
        "Build your reputation"
      ]
    },
    FEATURE_LOCKED: {
      comment: "Sign up to join the conversation",
      react: "Sign up to react to reviews", 
      details: "Sign up to view full details",
      write: "Sign up to write reviews",
      follow: "Sign up to follow users",
      bookmark: "Sign up to save reviews"
    }
  },
  
  // Conversion optimization
  CONVERSION: {
    SHOW_PROGRESS_BAR: true,
    SHOW_REMAINING_COUNT: true,
    AUTO_TRIGGER_SCROLL: true,
    SCROLL_TRIGGER_PERCENTAGE: 70,
    FLOATING_PROMPT_THRESHOLD: 0.8, // Show floating prompt at 80% of content
  },

  // Analytics and tracking (for future use)
  ANALYTICS: {
    TRACK_GATE_VIEWS: true,
    TRACK_CONVERSION_ATTEMPTS: true,
    TRACK_SCROLL_DEPTH: true,
  }
};

// Helper functions
export const getFeatureAccess = (feature: keyof typeof GATING_CONFIG.FEATURES, isAuthenticated: boolean): boolean => {
  if (isAuthenticated) return true;
  return GATING_CONFIG.FEATURES[feature];
};

export const getPublicLimit = (contentType: 'reviews' | 'comments'): number => {
  switch (contentType) {
    case 'reviews':
      return GATING_CONFIG.LIMITS.PUBLIC_REVIEWS;
    case 'comments':
      return GATING_CONFIG.LIMITS.PUBLIC_COMMENTS;
    default:
      return 0;
  }
};

export const getGateMessage = (contentType: 'reviews' | 'comments') => {
  switch (contentType) {
    case 'reviews':
      return GATING_CONFIG.MESSAGES.REVIEWS_GATE;
    case 'comments':
      return GATING_CONFIG.MESSAGES.COMMENTS_GATE;
    default:
      return GATING_CONFIG.MESSAGES.REVIEWS_GATE;
  }
};

export const calculateAdaptiveLimit = (totalItems: number, preferredLimit: number): number => {
  if (totalItems < preferredLimit) {
    return Math.max(
      GATING_CONFIG.LIMITS.MINIMUM_BEFORE_GATE,
      Math.floor(totalItems * GATING_CONFIG.LIMITS.ADAPTIVE_THRESHOLD)
    );
  }
  return preferredLimit;
};

export default GATING_CONFIG;