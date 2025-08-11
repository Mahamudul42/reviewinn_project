// Profile Configuration for easy customization
export interface ProfileConfig {
  // Layout Configuration
  layout: {
    maxWidth: string;
    spacing: string;
    headerHeight: string;
  };
  
  // Component Visibility
  components: {
    showHeader: boolean;
    showStats: boolean;
    showEntities: boolean;
    showReviews: boolean;
    showBadges: boolean;
  };
  
  // Header Configuration  
  header: {
    showCoverPhoto: boolean;
    showEditButton: boolean;
    showFollowButton: boolean;
    showMessageButton: boolean;
    showAddToCircleButton: boolean;
    coverGradient: string;
    avatarSize: 'sm' | 'md' | 'lg' | 'xl';
    showVerificationBadge: boolean;
    showLevelBadge: boolean;
    showAchievements: boolean;
    maxAchievements: number;
  };
  
  // Stats Configuration
  stats: {
    layout: 'grid' | 'horizontal' | 'vertical';
    showTitle: boolean;
    customStats?: Array<{
      label: string;
      value: string | number;
      color: string;
      bgColor: string;
      borderColor: string;
    }>;
    columns: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };
  
  // Entities Section Configuration
  entities: {
    showAddButton: boolean;
    showActions: boolean;
    layout: 'grid' | 'list';
    itemsPerPage: number;
    showLoadMore: boolean;
    customTitle?: string;
    customEmptyMessage?: string;
  };
  
  // Reviews Section Configuration
  reviews: {
    showAddButton: boolean;
    showActions: boolean;
    layout: 'grid' | 'list';
    maxColumns: number;
    itemsPerPage: number;
    showLoadMore: boolean;
    customTitle?: string;
    customEmptyMessage?: string;
  };
  
  // Theme Configuration
  theme: {
    primaryColor: string;
    secondaryColor: string;
    borderRadius: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    shadowSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    borderWidth: '1' | '2' | '4';
    borderColor: string;
  };
}

// Default Configuration
export const defaultProfileConfig: ProfileConfig = {
  layout: {
    maxWidth: 'max-w-6xl',
    spacing: 'space-y-6',
    headerHeight: 'h-40'
  },
  
  components: {
    showHeader: true,
    showStats: true,
    showEntities: true,
    showReviews: true,
    showBadges: true
  },
  
  header: {
    showCoverPhoto: true,
    showEditButton: true,
    showFollowButton: true,
    showMessageButton: true,
    showAddToCircleButton: true,
    coverGradient: 'from-indigo-600 via-purple-600 to-blue-700',
    avatarSize: 'lg',
    showVerificationBadge: true,
    showLevelBadge: true,
    showAchievements: true,
    maxAchievements: 6
  },
  
  stats: {
    layout: 'grid',
    showTitle: true,
    columns: {
      mobile: 2,
      tablet: 3,
      desktop: 6
    }
  },
  
  entities: {
    showAddButton: true,
    showActions: true,
    layout: 'list',
    itemsPerPage: 5,
    showLoadMore: true
  },
  
  reviews: {
    showAddButton: true,
    showActions: true,
    layout: 'list',
    maxColumns: 2,
    itemsPerPage: 5,
    showLoadMore: true
  },
  
  theme: {
    primaryColor: 'blue',
    secondaryColor: 'purple',
    borderRadius: '2xl',
    shadowSize: 'xl',
    borderWidth: '2',
    borderColor: 'gray-200'
  }
};

// Configuration Presets
export const profileConfigPresets = {
  // Minimal Profile - Clean and simple
  minimal: {
    ...defaultProfileConfig,
    components: {
      showHeader: true,
      showStats: false,
      showEntities: true,
      showReviews: true,
      showBadges: false
    },
    header: {
      ...defaultProfileConfig.header,
      showCoverPhoto: false,
      showAchievements: false,
      avatarSize: 'md' as const
    },
    theme: {
      ...defaultProfileConfig.theme,
      borderRadius: 'lg' as const,
      shadowSize: 'md' as const,
      borderWidth: '1' as const
    }
  },
  
  // Professional Profile - Business focused
  professional: {
    ...defaultProfileConfig,
    header: {
      ...defaultProfileConfig.header,
      coverGradient: 'from-gray-700 via-gray-800 to-gray-900',
      showAddToCircleButton: false,
      avatarSize: 'xl' as const
    },
    theme: {
      ...defaultProfileConfig.theme,
      primaryColor: 'gray',
      secondaryColor: 'blue'
    }
  },
  
  // Showcase Profile - Display focused
  showcase: {
    ...defaultProfileConfig,
    entities: {
      ...defaultProfileConfig.entities,
      layout: 'grid' as const
    },
    reviews: {
      ...defaultProfileConfig.reviews,
      layout: 'grid' as const,
      maxColumns: 3
    },
    header: {
      ...defaultProfileConfig.header,
      maxAchievements: 10
    }
  },
  
  // Compact Profile - Space efficient
  compact: {
    ...defaultProfileConfig,
    layout: {
      maxWidth: 'max-w-4xl',
      spacing: 'space-y-4',
      headerHeight: 'h-32'
    },
    stats: {
      ...defaultProfileConfig.stats,
      layout: 'horizontal' as const
    },
    entities: {
      ...defaultProfileConfig.entities,
      itemsPerPage: 3
    },
    reviews: {
      ...defaultProfileConfig.reviews,
      itemsPerPage: 3
    }
  }
};

// Utility function to merge configurations
export const mergeProfileConfig = (baseConfig: ProfileConfig, overrides: Partial<ProfileConfig>): ProfileConfig => {
  return {
    ...baseConfig,
    ...overrides,
    layout: { ...baseConfig.layout, ...(overrides.layout || {}) },
    components: { ...baseConfig.components, ...(overrides.components || {}) },
    header: { ...baseConfig.header, ...(overrides.header || {}) },
    stats: { ...baseConfig.stats, ...(overrides.stats || {}) },
    entities: { ...baseConfig.entities, ...(overrides.entities || {}) },
    reviews: { ...baseConfig.reviews, ...(overrides.reviews || {}) },
    theme: { ...baseConfig.theme, ...(overrides.theme || {}) }
  };
};